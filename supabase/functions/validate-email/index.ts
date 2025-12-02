/**
 * Validate Email - Disposable Email Blocking Edge Function
 * 
 * This Edge Function validates email addresses against a list of disposable email domains
 * to prevent users from registering with temporary email addresses.
 * 
 * Usage:
 * - Pre-signup validation: Call this function before allowing user registration
 * - Auth webhook: Can be integrated with Supabase Auth webhooks for server-side validation
 * 
 * The function fetches the blocklist from:
 * https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/blob/main/disposable_email_blocklist.conf
 * 
 * The blocklist is cached in the database (disposable_email_blocklist table) for 24 hours
 * to reduce GitHub API calls. Since Edge Functions are stateless, database storage is required.
 * 
 * Database Schema:
 * - Table: disposable_email_blocklist
 * - Columns: id (TEXT, PRIMARY KEY), domains (JSONB), fetched_at (TIMESTAMPTZ)
 * 
 * Run the migration SQL file in supabase/migrations/ to create the required table.
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Blocklist cache configuration
const BLOCKLIST_URL = "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf";
const CACHE_TTL_HOURS = 24; // Cache for 24 hours
const BLOCKLIST_ID = "main"; // Singleton ID for the blocklist row

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-EMAIL] ${step}${detailsStr}`);
};

/**
 * Fetches the disposable email domain blocklist from GitHub
 */
async function fetchBlocklist(): Promise<Set<string>> {
  try {
    logStep("Fetching blocklist from GitHub");
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(BLOCKLIST_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/plain',
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blocklist: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    const domains = new Set<string>();
    
    // Parse the blocklist file (one domain per line)
    const lines = text.split('\n');
    for (const line of lines) {
      const domain = line.trim().toLowerCase();
      // Skip empty lines and comments
      if (domain && !domain.startsWith('#')) {
        domains.add(domain);
      }
    }
    
    logStep("Blocklist fetched successfully", { domainCount: domains.size });
    return domains;
  } catch (error) {
    logStep("Error fetching blocklist", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Gets the cached blocklist from database or fetches a new one if cache is expired
 */
async function getBlocklist(supabaseClient: any): Promise<Set<string>> {
  const now = new Date();
  
  try {
    // Check database for cached blocklist
    const { data: cachedData, error: fetchError } = await supabaseClient
      .from("disposable_email_blocklist")
      .select("domains, fetched_at")
      .eq("id", BLOCKLIST_ID)
      .single();
    
    if (!fetchError && cachedData && cachedData.domains) {
      const fetchedAt = new Date(cachedData.fetched_at);
      const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);
      
      // Check if cache is still valid
      if (hoursSinceFetch < CACHE_TTL_HOURS) {
        const domains = new Set<string>(cachedData.domains || []);
        logStep("Using cached blocklist from database", { 
          domainCount: domains.size,
          age: Math.round(hoursSinceFetch * 60) + ' minutes'
        });
        return domains;
      } else {
        logStep("Cache expired, will fetch new blocklist", { 
          age: Math.round(hoursSinceFetch * 60) + ' minutes'
        });
      }
    } else if (fetchError) {
      // Log error if it's not a "not found" error (which is fine for first run)
      const isNotFound = fetchError.code === 'PGRST116' || fetchError.message?.includes('No rows');
      if (!isNotFound) {
        logStep("Error fetching cached blocklist", { error: fetchError.message });
      } else {
        logStep("No cached blocklist found, will fetch from GitHub");
      }
    }
    
    // Cache expired or missing - fetch new blocklist
    const domains = await fetchBlocklist();
    
    // Store in database
    const domainsArray = Array.from(domains);
    const { error: upsertError } = await supabaseClient
      .from("disposable_email_blocklist")
      .upsert({
        id: BLOCKLIST_ID,
        domains: domainsArray,
        fetched_at: now.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: 'id'
      });
    
    if (upsertError) {
      logStep("Warning: Failed to save blocklist to database", { error: upsertError.message });
      // Continue anyway - we have the blocklist in memory for this request
    } else {
      logStep("Blocklist saved to database", { domainCount: domains.size });
    }
    
    return domains;
  } catch (error) {
    // If we have cached data (even if expired), try to use it as fallback
    try {
      const { data: cachedData } = await supabaseClient
        .from("disposable_email_blocklist")
        .select("domains, fetched_at")
        .eq("id", BLOCKLIST_ID)
        .single();
      
      if (cachedData && cachedData.domains) {
        const domains = new Set<string>(cachedData.domains || []);
        logStep("Using expired cache from database due to fetch failure", { 
          domainCount: domains.size,
          error: error instanceof Error ? error.message : String(error)
        });
        return domains;
      }
    } catch (fallbackError) {
      logStep("Fallback cache also failed", { error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) });
    }
    
    // No cache available, re-throw error
    throw error;
  }
}

/**
 * Extracts the domain from an email address
 */
function extractDomain(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  
  if (atIndex === -1 || atIndex === 0 || atIndex === trimmed.length - 1) {
    return null; // Invalid email format
  }
  
  return trimmed.substring(atIndex + 1);
}

/**
 * Validates if an email domain is disposable
 */
async function validateEmailDomain(email: string, supabaseClient: any): Promise<{ valid: boolean; domain: string | null; reason?: string }> {
  const domain = extractDomain(email);
  
  if (!domain) {
    return {
      valid: false,
      domain: null,
      reason: "Invalid email format",
    };
  }
  
  try {
    const blocklist = await getBlocklist(supabaseClient);
    const isDisposable = blocklist.has(domain);
    
    logStep("Domain validation check", {
      domain,
      isDisposable,
      blocklistSize: blocklist.size,
      domainInBlocklist: blocklist.has(domain),
    });
    
    return {
      valid: !isDisposable,
      domain,
      reason: isDisposable ? "Disposable email domain not allowed" : undefined,
    };
  } catch (error) {
    // Fail open: if we can't validate, allow the email (log warning)
    logStep("WARNING: Blocklist unavailable, allowing email", {
      domain,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      valid: true, // Fail open
      domain,
      reason: "Validation service unavailable, email allowed",
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    logStep("Function started", { method: req.method });
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      logStep("Missing environment variables", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      });
      throw new Error("Missing required environment variables");
    }
    
    // Create Supabase client with service role key for database operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
    
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Parse request body
    let body: { email?: string };
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Validate email is provided
    if (!body.email || typeof body.email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'email' field in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Validate email domain
    const result = await validateEmailDomain(body.email, supabaseClient);
    
    logStep("Validation complete", { 
      email: body.email, 
      domain: result.domain, 
      valid: result.valid 
    });
    
    // Always return 200 with validation result in body
    // This allows the client to check the 'valid' property without treating it as an HTTP error
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-email", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

