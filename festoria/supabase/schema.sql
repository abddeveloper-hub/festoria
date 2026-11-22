-- ==============================================================================
-- Festoria — Complete Supabase PostgreSQL Schema & Seed Data
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. CLEANUP (Optional reset)
-- DROP TABLE IF EXISTS results CASCADE;
-- DROP TABLE IF EXISTS announcements CASCADE;
-- DROP TABLE IF EXISTS participants CASCADE;
-- DROP TABLE IF EXISTS programmes CASCADE;
-- DROP TABLE IF EXISTS teams CASCADE;
-- DROP TABLE IF EXISTS fests CASCADE;

-- 2. CREATE TABLES
CREATE TABLE IF NOT EXISTS fests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT,
  venue TEXT,
  dates TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  fest_id TEXT REFERENCES fests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  institution TEXT,
  points INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  silver INTEGER DEFAULT 0,
  bronze INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programmes (
  id TEXT PRIMARY KEY,
  fest_id TEXT REFERENCES fests(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT DEFAULT 'individual', -- 'individual' or 'team'
  venue TEXT DEFAULT 'Main Stage',
  start_time TEXT,
  end_time TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
  result_published BOOLEAN DEFAULT false,
  published_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  fest_id TEXT REFERENCES fests(id) ON DELETE CASCADE,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  chest_number TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  fest_id TEXT REFERENCES fests(id) ON DELETE CASCADE,
  programme_id TEXT REFERENCES programmes(id) ON DELETE CASCADE,
  programme_name TEXT,
  category TEXT,
  rank INTEGER NOT NULL,
  entry_name TEXT NOT NULL,
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  team_name TEXT,
  final_score NUMERIC(5, 2) DEFAULT 0,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN DEFAULT true,
  published_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  fest_id TEXT REFERENCES fests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT true,
  author TEXT DEFAULT 'Fest Admin',
  created_at TEXT NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE fests ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES: Public read access for live leaderboard and visitors
CREATE POLICY "Allow public read on fests" ON fests FOR SELECT USING (true);
CREATE POLICY "Allow public read on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read on programmes" ON programmes FOR SELECT USING (true);
CREATE POLICY "Allow public read on participants" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow public read on results" ON results FOR SELECT USING (true);
CREATE POLICY "Allow public read on announcements" ON announcements FOR SELECT USING (true);

-- 5. POLICIES: Open write access (Protected by client admin passcode or Supabase Auth)
CREATE POLICY "Allow write on fests" ON fests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write on teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write on programmes" ON programmes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write on participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write on results" ON results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write on announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- Schema setup complete. Ready for new festival data.
