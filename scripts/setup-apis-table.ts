/**
 * Setup script to create the apis table in Supabase
 *
 * Usage: npx tsx scripts/setup-apis-table.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CREATE_TABLE_SQL = `
-- DataGold APIs table
CREATE TABLE IF NOT EXISTS apis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  hook TEXT NOT NULL,
  description TEXT,
  bullets TEXT[] DEFAULT '{}',
  what_it_contains TEXT[] DEFAULT '{}',
  who_uses_this TEXT[] DEFAULT '{}',
  technical JSONB DEFAULT '{}',
  free BOOLEAN DEFAULT true,
  url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_apis_category ON apis(category);
CREATE INDEX IF NOT EXISTS idx_apis_free ON apis(free);
`;

const CREATE_POLICIES_SQL = `
-- RLS policies
ALTER TABLE apis ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'apis' AND policyname = 'Allow public read on apis') THEN
    CREATE POLICY "Allow public read on apis" ON apis FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'apis' AND policyname = 'Allow public insert on apis') THEN
    CREATE POLICY "Allow public insert on apis" ON apis FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'apis' AND policyname = 'Allow public update on apis') THEN
    CREATE POLICY "Allow public update on apis" ON apis FOR UPDATE USING (true);
  END IF;
END $$;
`;

async function setup() {
  console.log('🚀 Setting up apis table...\n');

  // Try to query the table first
  const { error: checkError } = await supabase
    .from('apis')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('✅ Table "apis" already exists!');

    // Count existing records
    const { count } = await supabase
      .from('apis')
      .select('*', { count: 'exact', head: true });

    console.log(`   Records: ${count || 0}`);
    return;
  }

  if (checkError.code !== '42P01') {
    console.error('Unexpected error:', checkError);
    return;
  }

  console.log('📋 Table does not exist. Creating...\n');
  console.log('Unfortunately, the Supabase JS client cannot run raw DDL SQL.');
  console.log('Please run this SQL in the Supabase SQL Editor:\n');
  console.log('URL: https://supabase.com/dashboard/project/yvzinotrjggncbwflxok/sql/new\n');
  console.log('--- COPY BELOW ---\n');
  console.log(CREATE_TABLE_SQL);
  console.log(CREATE_POLICIES_SQL);
  console.log('\n--- END ---\n');
}

setup();
