-- Create apis table for DataGold
CREATE TABLE IF NOT EXISTS apis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  hook text NOT NULL,
  description text,
  bullets text[] DEFAULT '{}',
  what_it_contains text[] DEFAULT '{}',
  who_uses_this text[] DEFAULT '{}',
  technical jsonb DEFAULT '{}',
  free boolean DEFAULT true,
  url text,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_apis_category ON apis(category);

-- Create index for free filtering
CREATE INDEX IF NOT EXISTS idx_apis_free ON apis(free);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_apis_search ON apis USING gin(to_tsvector('english', title || ' ' || hook || ' ' || COALESCE(description, '')));

-- Add unique constraint on title to avoid duplicates
ALTER TABLE apis ADD CONSTRAINT apis_title_unique UNIQUE (title);
