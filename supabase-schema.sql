-- ==========================================
-- HABIT TRACKER SUPABASE DATABASE SCHEMA
-- ==========================================
-- របៀបប្រើ៖ យកកូដខាងក្រោមនេះទៅ Paste ក្នុង Supabase -> SQL Editor រួចចុច "Run"

-- 1. Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create habit_logs table (for daily checkboxes)
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  UNIQUE(habit_id, date)
);

-- 3. Create wellness_logs table (for mood and sleep tracking)
CREATE TABLE IF NOT EXISTS wellness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood INT CHECK (mood >= 1 AND mood <= 5),
  sleep_hours NUMERIC(3, 1),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security (RLS) so each user only sees their own data
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habits" 
  ON habits FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own habit logs" 
  ON habit_logs FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wellness logs" 
  ON wellness_logs FOR ALL 
  USING (auth.uid() = user_id);
