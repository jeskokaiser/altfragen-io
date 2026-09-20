import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://ynzxzhpivcmkpipanltd.supabase.co';

// Publishable key, the replacement for the legacy anon key. It is meant to be
// public: it carries the same low privileges, so Row Level Security is what
// actually protects the data. Rotate it in Settings > API Keys.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_sBcTFu5no9hYn6qamFrLxQ_6a-629u6';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
