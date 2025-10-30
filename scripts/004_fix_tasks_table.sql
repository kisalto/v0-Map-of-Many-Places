-- Add missing column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE;

-- Add missing column to tasks table for content
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS content TEXT;

-- Add missing column to tasks table for status
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add missing column to adventures table for is_active
ALTER TABLE adventures ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create characters table if not exists
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_description TEXT,
  history TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subregions table if not exists
CREATE TABLE IF NOT EXISTS subregions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update character_mentions to reference tasks
ALTER TABLE character_mentions ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Update region_mentions to reference tasks
ALTER TABLE region_mentions ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_chapter_id ON tasks(chapter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_adventure_id ON tasks(adventure_id);
CREATE INDEX IF NOT EXISTS idx_characters_adventure_id ON characters(adventure_id);
CREATE INDEX IF NOT EXISTS idx_subregions_region_id ON subregions(region_id);
CREATE INDEX IF NOT EXISTS idx_character_mentions_task_id ON character_mentions(task_id);
CREATE INDEX IF NOT EXISTS idx_region_mentions_task_id ON region_mentions(task_id);
