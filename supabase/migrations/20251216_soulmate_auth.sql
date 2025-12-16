-- Soulmate Chat: User Accounts + Persistence
-- This migration adds tables for storing soulmate interview sessions and messages

-- Soulmate interview sessions
CREATE TABLE soulmate_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  message_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Chat messages
CREATE TABLE soulmate_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES soulmate_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  message_index int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Personality profiles (extracted after interview completion)
CREATE TABLE soulmate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES soulmate_sessions(id),
  attachment_style text,
  personality_traits jsonb DEFAULT '{}',
  core_values text[] DEFAULT '{}',
  relationship_needs jsonb DEFAULT '{}',
  lifestyle_preferences jsonb DEFAULT '{}',
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE soulmate_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE soulmate_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE soulmate_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own sessions" ON soulmate_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON soulmate_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON soulmate_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON soulmate_messages
  FOR SELECT USING (session_id IN (SELECT id FROM soulmate_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own messages" ON soulmate_messages
  FOR INSERT WITH CHECK (session_id IN (SELECT id FROM soulmate_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own profile" ON soulmate_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile" ON soulmate_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON soulmate_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_soulmate_messages_session ON soulmate_messages(session_id);
CREATE INDEX idx_soulmate_messages_order ON soulmate_messages(session_id, message_index);
CREATE INDEX idx_soulmate_sessions_user ON soulmate_sessions(user_id);
CREATE INDEX idx_soulmate_sessions_status ON soulmate_sessions(user_id, status);
