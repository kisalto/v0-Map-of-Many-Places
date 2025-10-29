-- =====================================================
-- RESET COMPLETO DA DATABASE
-- =====================================================
-- Este script dropa e recria todas as tabelas do zero
-- Execute este script para ter um schema limpo e otimizado

-- Dropar triggers antes de dropar funções
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Dropar funções com CASCADE para remover dependências automaticamente
DROP FUNCTION IF EXISTS get_email_by_username(TEXT) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Dropar todas as tabelas existentes (CASCADE remove dependências)
DROP TABLE IF EXISTS character_mentions CASCADE;
DROP TABLE IF EXISTS region_mentions CASCADE;
DROP TABLE IF EXISTS timeline_entries CASCADE;
DROP TABLE IF EXISTS sub_regions CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS adventures CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- TABELA: profiles
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- FUNÇÃO: get_email_by_username
-- =====================================================
CREATE OR REPLACE FUNCTION get_email_by_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM profiles
  WHERE username = username_input;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNÇÃO: handle_new_user (trigger para criar profile automaticamente)
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar profile automaticamente quando usuário se registra
-- <MOVED> Trigger drop is now above function drops

-- =====================================================
-- TABELA: adventures
-- =====================================================
CREATE TABLE adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para adventures
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "adventures_select_own" ON adventures;
DROP POLICY IF EXISTS "adventures_insert_own" ON adventures;
DROP POLICY IF EXISTS "adventures_update_own" ON adventures;
DROP POLICY IF EXISTS "adventures_delete_own" ON adventures;

CREATE POLICY "adventures_select_own" ON adventures
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "adventures_insert_own" ON adventures
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "adventures_update_own" ON adventures
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "adventures_delete_own" ON adventures
  FOR DELETE USING (auth.uid() = creator_id);

-- =====================================================
-- TABELA: chapters
-- =====================================================
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para chapters
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chapters_select_own" ON chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = chapters.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "chapters_insert_own" ON chapters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = chapters.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "chapters_update_own" ON chapters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = chapters.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "chapters_delete_own" ON chapters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = chapters.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

-- =====================================================
-- TABELA: tasks (anotações)
-- =====================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = tasks.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert_own" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = tasks.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "tasks_update_own" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = tasks.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "tasks_delete_own" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = tasks.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

-- =====================================================
-- TABELA: characters
-- =====================================================
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  character_type TEXT DEFAULT 'npc' CHECK (character_type IN ('player', 'npc')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para characters
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "characters_select_own" ON characters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = characters.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "characters_insert_own" ON characters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = characters.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "characters_update_own" ON characters
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = characters.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "characters_delete_own" ON characters
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = characters.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

-- =====================================================
-- TABELA: regions
-- =====================================================
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para regions
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regions_select_own" ON regions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = regions.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "regions_insert_own" ON regions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = regions.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "regions_update_own" ON regions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = regions.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "regions_delete_own" ON regions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = regions.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

-- =====================================================
-- TABELA: sub_regions
-- =====================================================
CREATE TABLE sub_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para sub_regions
ALTER TABLE sub_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_regions_select_own" ON sub_regions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM regions 
      JOIN adventures ON adventures.id = regions.adventure_id
      WHERE regions.id = sub_regions.region_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "sub_regions_insert_own" ON sub_regions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM regions 
      JOIN adventures ON adventures.id = regions.adventure_id
      WHERE regions.id = sub_regions.region_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "sub_regions_update_own" ON sub_regions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM regions 
      JOIN adventures ON adventures.id = regions.adventure_id
      WHERE regions.id = sub_regions.region_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "sub_regions_delete_own" ON sub_regions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM regions 
      JOIN adventures ON adventures.id = regions.adventure_id
      WHERE regions.id = sub_regions.region_id 
      AND adventures.creator_id = auth.uid()
    )
  );

-- =====================================================
-- TABELA: timeline_entries
-- =====================================================
CREATE TABLE timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  is_task BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  position_x DOUBLE PRECISION DEFAULT 0,
  position_y DOUBLE PRECISION DEFAULT 0,
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para timeline_entries
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_entries_select_own" ON timeline_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = timeline_entries.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "timeline_entries_insert_own" ON timeline_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = timeline_entries.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "timeline_entries_update_own" ON timeline_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = timeline_entries.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "timeline_entries_delete_own" ON timeline_entries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM adventures 
      WHERE adventures.id = timeline_entries.adventure_id 
      AND adventures.creator_id = auth.uid()
    )
  );

-- =====================================================
-- TABELA: character_mentions
-- =====================================================
CREATE TABLE character_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_entry_id UUID NOT NULL REFERENCES timeline_entries(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  mention_text TEXT NOT NULL,
  character_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para character_mentions
ALTER TABLE character_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "character_mentions_select_own" ON character_mentions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timeline_entries
      JOIN adventures ON adventures.id = timeline_entries.adventure_id
      WHERE timeline_entries.id = character_mentions.timeline_entry_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "character_mentions_insert_own" ON character_mentions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_entries
      JOIN adventures ON adventures.id = timeline_entries.adventure_id
      WHERE timeline_entries.id = character_mentions.timeline_entry_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "character_mentions_delete_own" ON character_mentions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM timeline_entries
      JOIN adventures ON adventures.id = timeline_entries.adventure_id
      WHERE timeline_entries.id = character_mentions.timeline_entry_id 
      AND adventures.creator_id = auth.uid()
    )
  );

-- =====================================================
-- TABELA: region_mentions
-- =====================================================
CREATE TABLE region_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_entry_id UUID NOT NULL REFERENCES timeline_entries(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  mention_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para region_mentions
ALTER TABLE region_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "region_mentions_select_own" ON region_mentions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timeline_entries
      JOIN adventures ON adventures.id = timeline_entries.adventure_id
      WHERE timeline_entries.id = region_mentions.timeline_entry_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "region_mentions_insert_own" ON region_mentions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_entries
      JOIN adventures ON adventures.id = timeline_entries.adventure_id
      WHERE timeline_entries.id = region_mentions.timeline_entry_id 
      AND adventures.creator_id = auth.uid()
    )
  );

CREATE POLICY "region_mentions_delete_own" ON region_mentions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM timeline_entries
      JOIN adventures ON adventures.id = timeline_entries.adventure_id
      WHERE timeline_entries.id = region_mentions.timeline_entry_id 
      AND adventures.creator_id = auth.uid()
    )
  );

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para adventures
CREATE INDEX idx_adventures_creator ON adventures(creator_id);
CREATE INDEX idx_adventures_status ON adventures(status);

-- Índices para chapters
CREATE INDEX idx_chapters_adventure ON chapters(adventure_id);
CREATE INDEX idx_chapters_order ON chapters(order_index);

-- Índices para tasks
CREATE INDEX idx_tasks_adventure ON tasks(adventure_id);
CREATE INDEX idx_tasks_chapter ON tasks(chapter_id);
CREATE INDEX idx_tasks_order ON tasks(order_index);

-- Índices para characters
CREATE INDEX idx_characters_adventure ON characters(adventure_id);
CREATE INDEX idx_characters_type ON characters(character_type);

-- Índices para regions
CREATE INDEX idx_regions_adventure ON regions(adventure_id);

-- Índices para sub_regions
CREATE INDEX idx_sub_regions_region ON sub_regions(region_id);

-- Índices para timeline_entries
CREATE INDEX idx_timeline_entries_adventure ON timeline_entries(adventure_id);
CREATE INDEX idx_timeline_entries_chapter ON timeline_entries(chapter_id);
CREATE INDEX idx_timeline_entries_creator ON timeline_entries(creator_id);
CREATE INDEX idx_timeline_entries_order ON timeline_entries(order_index);

-- Índices para character_mentions
CREATE INDEX idx_character_mentions_timeline ON character_mentions(timeline_entry_id);
CREATE INDEX idx_character_mentions_character ON character_mentions(character_id);
CREATE INDEX idx_character_mentions_task ON character_mentions(task_id);

-- Índices para region_mentions
CREATE INDEX idx_region_mentions_timeline ON region_mentions(timeline_entry_id);
CREATE INDEX idx_region_mentions_region ON region_mentions(region_id);
CREATE INDEX idx_region_mentions_task ON region_mentions(task_id);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Function definition moved above
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Trigger definitions moved above
-- CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_adventures_updated_at BEFORE UPDATE ON adventures
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_sub_regions_updated_at BEFORE UPDATE ON sub_regions
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_timeline_entries_updated_at BEFORE UPDATE ON timeline_entries
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
