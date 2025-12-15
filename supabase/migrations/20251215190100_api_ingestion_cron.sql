-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to trigger the edge function
CREATE OR REPLACE FUNCTION trigger_api_ingestion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_count int;
BEGIN
  -- Check if there are pending APIs
  SELECT COUNT(*) INTO pending_count
  FROM api_ingestion_queue
  WHERE status = 'pending';

  IF pending_count = 0 THEN
    RAISE NOTICE 'No pending APIs to process';
    RETURN;
  END IF;

  -- Call the edge function
  PERFORM net.http_post(
    url := 'https://yvzinotrjggncbwflxok.supabase.co/functions/v1/ingest-api',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2emlub3RyamdnbmNid2ZseG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyMjIyNTksImV4cCI6MjA0OTc5ODI1OX0.aK7LwnFddreLZe6t-0bv5OsD6i61CvUG0pqMRVdlbg4"}'::jsonb,
    body := '{"fromQueue": true}'::jsonb
  );

  RAISE NOTICE 'Triggered API ingestion for % pending APIs', pending_count;
END;
$$;

-- Schedule the cron job to run every 5 minutes
SELECT cron.schedule(
  'ingest-apis-every-5-min',
  '*/5 * * * *',
  'SELECT trigger_api_ingestion()'
);

-- Also create an unschedule function for easy management
CREATE OR REPLACE FUNCTION stop_api_ingestion_cron()
RETURNS void
LANGUAGE sql
AS $$
  SELECT cron.unschedule('ingest-apis-every-5-min');
$$;
