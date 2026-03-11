-- Whoop Integration: Token Storage + Daily Recovery Data
-- Run this in the Supabase SQL editor

-- 1. Store OAuth tokens per user
CREATE TABLE IF NOT EXISTS whoop_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  whoop_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE whoop_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whoop tokens"
  ON whoop_tokens FOR ALL
  USING (auth.uid() = user_id);

-- 2. Store daily Whoop recovery / sleep data
CREATE TABLE IF NOT EXISTS whoop_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  recovery_score INTEGER,          -- 0-100
  hrv REAL,                        -- ms
  resting_heart_rate REAL,         -- bpm
  spo2 REAL,                       -- %
  skin_temp REAL,                  -- °C
  sleep_performance INTEGER,       -- 0-100
  sleep_duration_minutes INTEGER,
  strain REAL,                     -- 0-21 scale
  calories_burned REAL,
  raw_data JSONB,                  -- full API response for debugging
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE whoop_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whoop daily data"
  ON whoop_daily FOR ALL
  USING (auth.uid() = user_id);

-- 3. Add source + external_id to existing workouts table for Whoop dedup
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS external_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workouts_external_id
  ON workouts (external_id)
  WHERE external_id IS NOT NULL;

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_whoop_daily_user_date
  ON whoop_daily (user_id, date DESC);
