-- 1. Charities (created first because users reference it)
CREATE TABLE IF NOT EXISTS charities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  events JSONB DEFAULT '[]',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (custom auth — not Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  charity_percentage INTEGER DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'lapsed')),
  amount DECIMAL(10,2) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Scores (Stableford 1-45)
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Draws
CREATE TABLE IF NOT EXISTS draws (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numbers INTEGER[] NOT NULL,
  draw_type TEXT NOT NULL CHECK (draw_type IN ('random', 'algorithm')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'simulated', 'published')),
  prize_pool DECIMAL(10,2) DEFAULT 0,
  jackpot_amount DECIMAL(10,2) DEFAULT 0,
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 6. Winners
CREATE TABLE IF NOT EXISTS winners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  match_type INTEGER NOT NULL CHECK (match_type IN (3, 4, 5)),
  prize_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'paid')),
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Disable Row Level Security for backend service role access ───────────────
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE charities DISABLE ROW LEVEL SECURITY;
ALTER TABLE draws DISABLE ROW LEVEL SECURITY;
ALTER TABLE winners DISABLE ROW LEVEL SECURITY;

-- ─── Seed: Create default admin user (password: Admin@1234) ──────────────────
-- password_hash below is bcrypt of 'Admin@1234' with 12 rounds
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Admin',
  'admin@golfcharity.com',
  '$2b$12$Ei24IxazeUUyg4GM5StZPerrxrhYxD32IRC4huYhAOR/QKbUO.0Bi',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- ─── Seed: Sample charities ───────────────────────────────────────────────────
INSERT INTO charities (name, description, featured) VALUES
  ('Hearts United', 'Supporting heart disease research and patient care across the UK.', TRUE),
  ('Green Youth Foundation', 'Empowering young people through sport and outdoor activities.', FALSE),
  ('The Food Bridge', 'Connecting surplus food to families in need — zero waste, maximum impact.', FALSE)
ON CONFLICT DO NOTHING;
