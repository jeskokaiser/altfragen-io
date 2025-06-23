
-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update AI commentary settings for faster processing
UPDATE ai_commentary_settings 
SET 
  processing_delay_minutes = 3,
  batch_size = 40
WHERE id = (SELECT id FROM ai_commentary_settings LIMIT 1);

-- Create a cron job to run AI commentary processing every 5 minutes
SELECT cron.schedule(
  'process-ai-commentary-5min',
  '*/5 * * * *', -- every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://ynzxzhpivcmkpipanltd.supabase.co/functions/v1/process-ai-commentary',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inluenh6aHBpdmNta3BpcGFubHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4MTY4NTksImV4cCI6MjA1MzM5Mjg1OX0.KfoqDXjRZ8v5OuhRpPq-1wx3TdN9HABujMfbnfXcsec"}'::jsonb,
        body:=concat('{"scheduled": true, "time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Add a table to track cron job execution for monitoring
CREATE TABLE IF NOT EXISTS public.ai_commentary_cron_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  questions_processed INTEGER DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.ai_commentary_cron_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view cron logs
CREATE POLICY "Admins can view cron logs" 
  ON public.ai_commentary_cron_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
