CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS children (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female')),
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL,
  calories NUMERIC,
  protein NUMERIC,
  fat NUMERIC,
  carbs NUMERIC,
  calcium NUMERIC,
  iron NUMERIC,
  vitamin_c NUMERIC,
  image_url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS growth_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL,
  height NUMERIC,
  weight NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_restrictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  restriction_type TEXT CHECK (restriction_type IN ('allergy', 'dislike')),
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  overcome_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON users FOR ALL USING (true);
CREATE POLICY "service_role_all" ON children FOR ALL USING (true);
CREATE POLICY "service_role_all" ON meal_records FOR ALL USING (true);
CREATE POLICY "service_role_all" ON growth_records FOR ALL USING (true);
CREATE POLICY "service_role_all" ON food_restrictions FOR ALL USING (true);
