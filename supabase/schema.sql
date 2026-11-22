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

-- 6. SEED FESTIVAL DATA
INSERT INTO fests (id, name, tagline, venue, dates, status)
VALUES ('FEST-04', 'Prathibothsava 2026', 'Celebrating Excellence, Talent, & Unity', 'Central Ground & Auditorium', '2026-11-22', 'active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, tagline = EXCLUDED.tagline;

-- 7. SEED HOUSES / TEAMS
INSERT INTO teams (id, fest_id, name, code, institution, points, gold, silver, bronze) VALUES
('TM-9639', 'FEST-04', 'GUTHAKAADU', '0003', 'MADRASA GUTHAKAADU', 265, 14, 10, 11),
('TM-2403', 'FEST-04', 'MUKKA', '0001', 'MADRASA MUKKA', 237, 10, 15, 7),
('TM-8835', 'FEST-04', 'SAAG', '0005', 'MADRASA SAAG', 116, 6, 4, 7),
('TM-8193', 'FEST-04', 'PAKSHIKERE', '0004', 'MADRASA PAKSHIKERE', 113, 5, 8, 4),
('TM-8075', 'FEST-04', 'KINNIGOLI', '0006', 'MADRASA KINNIGOLI', 63, 2, 4, 5),
('TM-6658', 'FEST-04', 'GOLIJARA', '0008', 'MADRASA GOLIJARA', 58, 2, 3, 4),
('TM-9547', 'FEST-04', 'SASHIHITHLU', '0009', 'MADRASA SASHIHITHLU', 35, 1, 2, 3),
('TM-1259', 'FEST-04', 'MUKKA URDU', '0002', 'MADRASA MUKKA URDU', 34, 1, 2, 2),
('TM-5939', 'FEST-04', 'THOKUR', '0007', 'MADRASA THOKUR', 26, 1, 1, 2),
('TM-0940', 'FEST-04', 'S KODI', '0010', 'MADRASA S KODI', 10, 0, 1, 1)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  points = EXCLUDED.points,
  gold = EXCLUDED.gold,
  silver = EXCLUDED.silver,
  bronze = EXCLUDED.bronze;

-- 8. INITIAL ANNOUNCEMENT
INSERT INTO announcements (id, fest_id, title, content, category, is_public, author, created_at) VALUES
('ANN-001', 'FEST-04', 'Welcome to Prathibothsava 2026', 'Official competition results are verified and published live here.', 'results', true, 'Festival Committee', '2026-11-22 09:00')
ON CONFLICT (id) DO NOTHING;
