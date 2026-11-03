-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS TABLE (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  department TEXT DEFAULT 'General',
  year INT DEFAULT 1,
  avatar_url TEXT,
  coins_balance INTEGER DEFAULT 0,
  total_coins_earned INTEGER DEFAULT 0,
  total_items_deposited INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(4), 'hex'),
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MACHINES TABLE
CREATE TABLE public.machines (
  id TEXT PRIMARY KEY, -- e.g. 'MACH_001'
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  campus TEXT NOT NULL,
  ble_mac TEXT,
  status TEXT DEFAULT 'active', -- active, maintenance, offline
  last_sync TIMESTAMPTZ,
  total_items_processed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TRANSACTIONS TABLE
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  machine_id TEXT REFERENCES public.machines(id),
  item_type TEXT NOT NULL, -- plastic_bottle, book, pen, cardboard, e-waste, paper
  item_condition TEXT NOT NULL, -- excellent, good, fair, poor, contaminated
  base_coins INTEGER NOT NULL,
  condition_multiplier NUMERIC(4,2) NOT NULL,
  recyclability_factor NUMERIC(4,2) NOT NULL,
  coins_earned INTEGER NOT NULL,
  ai_model_used TEXT DEFAULT 'yolov8-nano', -- yolov8-nano, gemini-1.5-flash
  ai_confidence NUMERIC(5,2),
  image_url TEXT,
  co2_saved_kg NUMERIC(6,3),
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REWARDS TABLE
CREATE TABLE public.rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  partner_name TEXT NOT NULL, -- Gazebo, North Square, Hunger, Gymkhana, AB3 Canteen, Library
  description TEXT NOT NULL,
  coin_cost INTEGER NOT NULL,
  category TEXT,
  terms TEXT,
  valid_days INTEGER DEFAULT 30, -- voucher validity after redemption
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- REDEMPTIONS TABLE
CREATE TABLE public.redemptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  reward_id UUID REFERENCES public.rewards(id) NOT NULL,
  coins_spent INTEGER NOT NULL,
  voucher_code TEXT UNIQUE NOT NULL DEFAULT upper(encode(gen_random_bytes(6), 'hex')),
  status TEXT DEFAULT 'active', -- active, used, expired
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ACHIEVEMENTS TABLE
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  badge_type TEXT NOT NULL, -- first_deposit, plastic_champion, bookworm, e_warrior, week_streak, top10, carbon_saver
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

-- FORUM POSTS TABLE
CREATE TABLE public.forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  topic TEXT DEFAULT 'General', -- Eco Tips, Campus News, Challenges, General
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FORUM COMMENTS TABLE
CREATE TABLE public.forum_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FORUM LIKES TABLE
CREATE TABLE public.forum_likes (
  user_id UUID REFERENCES public.profiles(id),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

-- CHALLENGES TABLE
CREATE TABLE public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_count INTEGER NOT NULL,
  target_item_type TEXT, -- null = any item
  bonus_coins INTEGER DEFAULT 100,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  active BOOLEAN DEFAULT true
);

-- CHALLENGE PROGRESS TABLE
CREATE TABLE public.challenge_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  challenge_id UUID REFERENCES public.challenges(id),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

-- Row Level Security policies (users can only see their own data, machines table is public read)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Machines are viewable by everyone" ON public.machines FOR SELECT USING (true);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rewards are viewable by everyone" ON public.rewards FOR SELECT USING (true);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own redemptions" ON public.redemptions FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Forum posts viewable by everyone" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Users can insert own posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Forum comments viewable by everyone" ON public.forum_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.forum_comments FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Forum likes viewable by everyone" ON public.forum_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.forum_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.forum_likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are viewable by everyone" ON public.challenges FOR SELECT USING (true);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own challenge progress" ON public.challenge_progress FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_redemptions_user_id ON public.redemptions(user_id);
CREATE INDEX idx_forum_posts_created_at ON public.forum_posts(created_at);

-- Leaderboard VIEWS
CREATE OR REPLACE VIEW public.leaderboard_all_time AS
SELECT 
  p.id,
  p.full_name,
  p.department,
  p.total_coins_earned,
  p.total_items_deposited,
  RANK() OVER (ORDER BY p.total_coins_earned DESC) as rank
FROM public.profiles p
ORDER BY p.total_coins_earned DESC;

CREATE OR REPLACE VIEW public.leaderboard_weekly AS
SELECT 
  t.user_id,
  p.full_name,
  p.department,
  SUM(t.coins_earned) as weekly_coins,
  COUNT(t.id) as weekly_items,
  RANK() OVER (ORDER BY SUM(t.coins_earned) DESC) as rank
FROM public.transactions t
JOIN public.profiles p ON p.id = t.user_id
WHERE t.created_at >= date_trunc('week', now())
GROUP BY t.user_id, p.full_name, p.department
ORDER BY weekly_coins DESC;

-- Seed data for Machines and Rewards
INSERT INTO public.machines (id, name, location, campus, ble_mac, status) VALUES
('MACH_001', 'EcoDrop #001', 'Main Block Entrance', 'Main Campus', 'AA:BB:CC:DD:EE:01', 'active'),
('MACH_002', 'EcoDrop #002', 'Library Block', 'Main Campus', 'AA:BB:CC:DD:EE:02', 'active'),
('MACH_003', 'EcoDrop #003', 'AB3 Block Corridor', 'Academic Block 3', 'AA:BB:CC:DD:EE:03', 'maintenance'),
('MACH_004', 'EcoDrop #004', 'Gymkhana Entry', 'Sports Complex', 'AA:BB:CC:DD:EE:04', 'active'),
('MACH_005', 'EcoDrop #005', 'Hostel Block A', 'Residential Campus', 'AA:BB:CC:DD:EE:05', 'active');

INSERT INTO public.rewards (partner_name, description, coin_cost, category, valid_days) VALUES
('Gazebo', '₹20 Off Any Order', 50, 'food', 30),
('Gazebo', '₹50 Off Any Order', 120, 'food', 30),
('Gazebo', '₹100 Off Any Order', 220, 'food', 30),
('North Square', '₹20 Off Any Order', 50, 'food', 30),
('North Square', '₹50 Off Any Order', 120, 'food', 30),
('North Square', '₹100 Off Any Order', 220, 'food', 30),
('Hunger', '₹20 Off Any Order', 50, 'food', 30),
('Hunger', '₹50 Off Any Order', 120, 'food', 30),
('Gymkhana', '1-Day Gym Pass', 150, 'sports', 7),
('Gymkhana', '3-Day Gym Pass', 400, 'sports', 14),
('AB3 Canteen', '₹20 Off Any Order', 50, 'food', 30),
('AB3 Canteen', '₹50 Off Any Order', 120, 'food', 30),
('Library', 'Fine Waiver (up to ₹50)', 100, 'academic', 90),
('Campus Store', '₹50 Off Stationery', 100, 'shopping', 60),
('Campus Store', '₹100 Off Stationery', 200, 'shopping', 60);

-- Database triggers for auto-updating balances

-- After insert on transactions: update profile coins_balance and stats
CREATE OR REPLACE FUNCTION update_profile_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    coins_balance = coins_balance + NEW.coins_earned,
    total_coins_earned = total_coins_earned + NEW.coins_earned,
    total_items_deposited = total_items_deposited + 1,
    last_activity_date = CURRENT_DATE
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_transaction_insert
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_profile_on_transaction();

-- After insert on redemptions: deduct coins
CREATE OR REPLACE FUNCTION deduct_coins_on_redemption()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET coins_balance = coins_balance - NEW.coins_spent
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_redemption_insert
  AFTER INSERT ON public.redemptions
  FOR EACH ROW EXECUTE FUNCTION deduct_coins_on_redemption();
