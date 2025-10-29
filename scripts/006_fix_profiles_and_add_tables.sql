-- Fix profiles table and add missing tables

-- Add username column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create adventure_members table for role-based access
CREATE TABLE IF NOT EXISTS adventure_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid REFERENCES adventures(id) ON DELETE CASCADE NOT NULL,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('creator', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(adventure_id, profile_id)
);

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid REFERENCES adventures(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  history text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create region_mentions table
CREATE TABLE IF NOT EXISTS region_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_entry_id uuid REFERENCES timeline_entries(id) ON DELETE CASCADE NOT NULL,
  region_id uuid REFERENCES regions(id) ON DELETE CASCADE NOT NULL,
  mention_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create points of interest for regions
CREATE TABLE IF NOT EXISTS region_points_of_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES regions(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid REFERENCES adventures(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  completed boolean DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chapters table for organizing timeline
CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id uuid REFERENCES adventures(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add chapter_id to timeline_entries
ALTER TABLE timeline_entries ADD COLUMN IF NOT EXISTS chapter_id uuid REFERENCES chapters(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE adventure_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_points_of_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adventure_members
CREATE POLICY "Users can view members of their adventures"
  ON adventure_members FOR SELECT
  USING (
    profile_id = auth.uid() OR
    adventure_id IN (
      SELECT adventure_id FROM adventure_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Creators can manage members"
  ON adventure_members FOR ALL
  USING (
    adventure_id IN (
      SELECT adventure_id FROM adventure_members 
      WHERE profile_id = auth.uid() AND role = 'creator'
    )
  );

-- RLS Policies for regions
CREATE POLICY "Users can view regions of their adventures"
  ON regions FOR SELECT
  USING (
    adventure_id IN (
      SELECT adventure_id FROM adventure_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Creators and editors can manage regions"
  ON regions FOR ALL
  USING (
    adventure_id IN (
      SELECT adventure_id FROM adventure_members 
      WHERE profile_id = auth.uid() AND role IN ('creator', 'editor')
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks of their adventures"
  ON tasks FOR SELECT
  USING (
    adventure_id IN (
      SELECT adventure_id FROM adventure_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Creators and editors can manage tasks"
  ON tasks FOR ALL
  USING (
    adventure_id IN (
      SELECT adventure_id FROM adventure_members 
      WHERE profile_id = auth.uid() AND role IN ('creator', 'editor')
    )
  );

-- RLS Policies for chapters
CREATE POLICY "Users can view chapters of their adventures"
  ON chapters FOR SELECT
  USING (
    adventure_id IN (
      SELECT adventure_id FROM adventure_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Creators and editors can manage chapters"
  ON chapters FOR ALL
  USING (
    adventure_id IN (
      SELECT adventure_id FROM adventure_members 
      WHERE profile_id = auth.uid() AND role IN ('creator', 'editor')
    )
  );

-- Update profile creation trigger to use username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create trigger to add creator as member when adventure is created
CREATE OR REPLACE FUNCTION handle_new_adventure()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.adventure_members (adventure_id, profile_id, role)
  VALUES (NEW.id, NEW.creator_id, 'creator');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_adventure_created ON adventures;
CREATE TRIGGER on_adventure_created
  AFTER INSERT ON adventures
  FOR EACH ROW EXECUTE FUNCTION handle_new_adventure();
