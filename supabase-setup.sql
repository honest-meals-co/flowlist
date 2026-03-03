-- =============================================
-- FLOWLIST DATABASE SETUP
-- =============================================
-- Run this ENTIRE script in your Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query > Paste > Run)

-- 1. Create the main data table
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  hats JSONB DEFAULT '[]'::jsonb,
  archives JSONB DEFAULT '[]'::jsonb,
  day_state TEXT DEFAULT 'not_started',
  day_start_time TEXT,
  day_date TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (so users can only see their own data)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON user_data FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
  ON user_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON user_data FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Create an index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);

-- Done! Your database is ready.
