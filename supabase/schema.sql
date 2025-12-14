-- IdeaBreeder Supabase Schema
-- Run this in the Supabase SQL Editor

-- Genes table: stores concept fragments with fitness scores
CREATE TABLE genes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL UNIQUE,
  fitness DECIMAL(4,2) DEFAULT 5.0 CHECK (fitness >= 0 AND fitness <= 10),
  offspring_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fitness-weighted selection
CREATE INDEX idx_genes_fitness ON genes(fitness DESC);

-- Ideas table: stores generated startup ideas
CREATE TABLE ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  hook TEXT NOT NULL,
  virus_score DECIMAL(4,1) DEFAULT 0 CHECK (virus_score >= 0 AND virus_score <= 50),
  scores JSONB NOT NULL DEFAULT '{}',
  genes_used TEXT[] NOT NULL DEFAULT '{}',
  genes_extracted TEXT[] NOT NULL DEFAULT '{}',
  reasoning TEXT,
  generation INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for leaderboard queries
CREATE INDEX idx_ideas_virus_score ON ideas(virus_score DESC);
CREATE INDEX idx_ideas_generation ON ideas(generation DESC);

-- Evolution state table: tracks the current state of evolution (singleton)
CREATE TABLE evolution_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one row
  is_running BOOLEAN DEFAULT FALSE,
  current_generation INTEGER DEFAULT 1,
  status TEXT DEFAULT 'idle',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial evolution state
INSERT INTO evolution_state (id, is_running, current_generation, status)
VALUES (1, FALSE, 1, 'idle')
ON CONFLICT (id) DO NOTHING;

-- Seed genes: diverse starting concepts
INSERT INTO genes (text, fitness) VALUES
  -- Viral mechanics
  ('screenshot-ready output', 5.0),
  ('public accountability', 5.0),
  ('one-click sharing', 5.0),
  ('badge embed for virality', 5.0),
  ('fear of missing out', 5.0),
  ('social proof display', 5.0),
  ('leaderboard competition', 5.0),

  -- User psychology
  ('instant gratification', 5.0),
  ('status signaling', 5.0),
  ('community validation', 5.0),
  ('professional anxiety', 5.0),
  ('curiosity gap', 5.0),
  ('nostalgia trigger', 5.0),

  -- Business models
  ('freemium with premium unlock', 5.0),
  ('pay-per-result pricing', 5.0),
  ('subscription fatigue antidote', 5.0),
  ('micropayments', 5.0),
  ('creator economy', 5.0),

  -- Target audiences (DIVERSE - not just B2B)
  ('solo founders', 5.0),
  ('gen-z consumers', 5.0),
  ('retired professionals', 5.0),
  ('parents with toddlers', 5.0),
  ('hobbyist artists', 5.0),
  ('fitness beginners', 5.0),
  ('home cooks', 5.0),
  ('pet owners', 5.0),
  ('travelers on budget', 5.0),
  ('college students', 5.0),

  -- Verticals (DIVERSE)
  ('health and wellness', 5.0),
  ('personal finance', 5.0),
  ('dating and relationships', 5.0),
  ('local services', 5.0),
  ('education and learning', 5.0),
  ('entertainment and media', 5.0),
  ('food and dining', 5.0),
  ('real estate', 5.0),
  ('automotive', 5.0),
  ('fashion and beauty', 5.0),

  -- Tech enablers
  ('AI-powered analysis', 5.0),
  ('voice-first interface', 5.0),
  ('camera-based input', 5.0),
  ('location awareness', 5.0),
  ('real-time collaboration', 5.0),
  ('offline-first', 5.0),

  -- Timing/rituals
  ('weekly ritual', 5.0),
  ('morning routine', 5.0),
  ('end-of-day reflection', 5.0),
  ('seasonal event', 5.0),

  -- Gamification
  ('gamification mechanics', 5.0),
  ('streak rewards', 5.0),
  ('mystery box mechanic', 5.0),
  ('unlockable achievements', 5.0)
ON CONFLICT (text) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE genes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_state ENABLE ROW LEVEL SECURITY;

-- Allow public read access (the app uses anon key)
CREATE POLICY "Allow public read on genes" ON genes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on genes" ON genes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on genes" ON genes FOR UPDATE USING (true);

CREATE POLICY "Allow public read on ideas" ON ideas FOR SELECT USING (true);
CREATE POLICY "Allow public insert on ideas" ON ideas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on evolution_state" ON evolution_state FOR SELECT USING (true);
CREATE POLICY "Allow public update on evolution_state" ON evolution_state FOR UPDATE USING (true);

-- Function to update evolution_state.updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evolution_state_updated_at
  BEFORE UPDATE ON evolution_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
