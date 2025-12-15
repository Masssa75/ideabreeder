-- Add source column to track where API suggestions came from
ALTER TABLE api_ingestion_queue ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Add comment for documentation
COMMENT ON COLUMN api_ingestion_queue.source IS 'Where this API came from: manual, discovery:<topic>, curated, etc.';
