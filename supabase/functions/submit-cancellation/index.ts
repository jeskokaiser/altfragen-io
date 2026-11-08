/**
 * Submit Cancellation -- the "jetzt kündigen" button of § 312k BGB.
 *
 * Public on purpose: the law wants the cancellation page reachable without a
 * login, so the function trusts no caller and validates everything. It stores
 * the cancellation, mails the confirmation § 312k Abs. 4 requires to the
 * customer and a copy to premium@altfragen.io, who carries it out in Stripe by
 * hand. It never touches Stripe itself: anyone can type any e-mail address.
 *
 * Needs the BREVO_API_KEY secret (transactional e-mail, sender hallo@altfragen.io).
 * Writes public.contract_cancellations with the service role.
 */

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getSecretKey } from '../_shared/supabaseKeys.ts';
import {
  berlinToday,
  type Cancellation,
  confirmationLines,
  CONTRACTS,
  parseCancellationRequest,
} from '../_shared/cancellation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Caps against someone using the form to flood a stranger's inbox.
const MAX_PER_EMAIL_PER_DAY = 3;
const MAX_PER_DAY = 200;

const SENDER = { name: 'Altfragen.io', email: 'hallo@altfragen.io' };
const OPERATOR = 'premium@altfragen.io';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const sendMail = async (
  apiKey: string,
  mail: { to: string; subject: string; text: string; replyTo?: string },
): Promise<boolean> => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: mail.to }],
      ...(mail.replyTo ? { replyTo: { email: mail.replyTo } } : {}),
      subject: mail.subject,
      textContent: mail.text,
    }),
  });
  return response.ok;
};

const customerText = (c: Cancellation, receivedAt: Date) =>
  [
    'Hallo,',
    '',
    'deine Kündigung über die Schaltfläche „jetzt kündigen“ auf altfragen.io ist bei uns eingegangen:',
    '',
    ...confirmationLines(c, receivedAt),
    '',
    'Wir setzen sie um und melden uns, falls etwas unklar ist. Hast du diese Kündigung nicht abgeschickt, antworte bitte auf diese E-Mail.',
    '',
    'Viele Grüße',
    'Altfragen.io (KSR Labs, Jesko Kaiser)',
  ].join('\n');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Nur POST ist erlaubt.' });

  const body = await req.json().catch(() => null);
  const now = new Date();
  const parsed = parseCancellationRequest(body, berlinToday(now));
  if (!parsed.ok) return json(400, { error: parsed.error });
  const c = parsed.value;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const secretKey = getSecretKey();
  if (!supabaseUrl || !secretKey) return json(500, { error: 'Serverkonfiguration fehlt.' });
  const db = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } });

  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const [perEmail, total] = await Promise.all([
    db
      .from('contract_cancellations')
      .select('id', { count: 'exact', head: true })
      .eq('email', c.email)
      .gte('received_at', since),
    db
      .from('contract_cancellations')
      .select('id', { count: 'exact', head: true })
      .gte('received_at', since),
  ]);
  if (perEmail.error || total.error) {
    return json(500, { error: 'Die Kündigung konnte nicht gespeichert werden.' });
  }
  if ((perEmail.count ?? 0) >= MAX_PER_EMAIL_PER_DAY || (total.count ?? 0) >= MAX_PER_DAY) {
    return json(429, {
      error: `Gerade gehen zu viele Kündigungen ein. Bitte kündige per E-Mail an ${OPERATOR}.`,
    });
  }

  const { data: row, error: insertError } = await db
    .from('contract_cancellations')
    .insert({
      email: c.email,
      name: c.name,
      contract: c.contract,
      kind: c.kind,
      reason: c.reason,
      end_on: c.endOn,
    })
    .select('id, received_at')
    .single();
  if (insertError || !row) {
    return json(500, { error: 'Die Kündigung konnte nicht gespeichert werden.' });
  }

  const receivedAt = new Date(row.received_at);
  const apiKey = Deno.env.get('BREVO_API_KEY');
  let confirmationSent = false;
  if (apiKey) {
    // A failed mail must not undo a cancellation that is already stored.
    confirmationSent = await sendMail(apiKey, {
      to: c.email,
      subject: `Bestätigung deiner Kündigung: ${CONTRACTS[c.contract]}`,
      text: customerText(c, receivedAt),
    }).catch(() => false);
    await sendMail(apiKey, {
      to: OPERATOR,
      replyTo: c.email,
      subject: `Kündigung eingegangen: ${CONTRACTS[c.contract]} (${c.email})`,
      text: [
        `Bestätigung an den Kunden verschickt: ${confirmationSent ? 'ja' : 'nein'}`,
        '',
        ...confirmationLines(c, receivedAt),
        '',
        `ID: ${row.id}`,
      ].join('\n'),
    }).catch(() => false);
  }
  if (confirmationSent) {
    await db
      .from('contract_cancellations')
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq('id', row.id);
  }

  return json(200, { id: row.id, receivedAt: row.received_at, confirmationSent });
});
