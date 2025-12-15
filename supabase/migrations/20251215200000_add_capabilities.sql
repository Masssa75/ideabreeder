-- Add capabilities field to apis table
ALTER TABLE apis ADD COLUMN IF NOT EXISTS capabilities text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN apis.capabilities IS 'Detailed list of what you can do with this API - endpoints, data types, actions';
