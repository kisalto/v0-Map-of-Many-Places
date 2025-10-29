-- ============================================
-- FIX SUPABASE PERFORMANCE AND SECURITY ISSUES
-- ============================================
-- This script fixes:
-- 1. Auth RLS Initialization Plan warnings (use (select auth.uid()))
-- 2. Multiple Permissive Policies warnings
-- 3. Function Search Path Mutable warnings
-- 4. Schema issues (username field)
-- ============================================

-- STEP 1: Fix profiles table schema
-- Add username field if it doesn't exist and remove old role field
DO $$ 
BEGIN
  -- Add username column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'username'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN username TEXT;
  END IF;

  -- Drop role column if it exists (old schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN role;
  END IF;
END $$;

-- Make username NOT NULL with a default value for existing rows
UPDATE public.profiles SET username = LOWER(SPLIT_PART(email, '@', 1)) WHERE username IS NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

-- STEP 2: Drop all existing RLS policies to recreate them optimized
-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;

-- Adventures policies
DROP POLICY IF EXISTS "adventures_select_own" ON public.adventures;
DROP POLICY IF EXISTS "adventures_insert_own" ON public.adventures;
DROP POLICY IF EXISTS "adventures_update_own" ON public.adventures;
DROP POLICY IF EXISTS "adventures_delete_own" ON public.adventures;
DROP POLICY IF EXISTS "Users can view their adventures" ON public.adventures;

-- Timeline entries policies
DROP POLICY IF EXISTS "timeline_entries_select_own" ON public.timeline_entries;
DROP POLICY IF EXISTS "timeline_entries_insert_own" ON public.timeline_entries;
DROP POLICY IF EXISTS "timeline_entries_update_own" ON public.timeline_entries;
DROP POLICY IF EXISTS "timeline_entries_delete_own" ON public.timeline_entries;
DROP POLICY IF EXISTS "Users can view timeline entries for their adventures" ON public.timeline_entries;
DROP POLICY IF EXISTS "Users can insert timeline entries for their adventures" ON public.timeline_entries;
DROP POLICY IF EXISTS "Users can update timeline entries for their adventures" ON public.timeline_entries;
DROP POLICY IF EXISTS "Users can delete timeline entries for their adventures" ON public.timeline_entries;

-- NPCs policies
DROP POLICY IF EXISTS "npcs_select_own" ON public.npcs;
DROP POLICY IF EXISTS "npcs_insert_own" ON public.npcs;
DROP POLICY IF EXISTS "npcs_update_own" ON public.npcs;
DROP POLICY IF EXISTS "npcs_delete_own" ON public.npcs;

-- Adventure players policies
DROP POLICY IF EXISTS "adventure_players_select_own" ON public.adventure_players;
DROP POLICY IF EXISTS "adventure_players_insert_own" ON public.adventure_players;
DROP POLICY IF EXISTS "adventure_players_update_own" ON public.adventure_players;
DROP POLICY IF EXISTS "adventure_players_delete_own" ON public.adventure_players;

-- NPC appearances policies
DROP POLICY IF EXISTS "npc_appearances_select_own" ON public.npc_appearances;
DROP POLICY IF EXISTS "npc_appearances_insert_own" ON public.npc_appearances;
DROP POLICY IF EXISTS "npc_appearances_update_own" ON public.npc_appearances;
DROP POLICY IF EXISTS "npc_appearances_delete_own" ON public.npc_appearances;

-- Character mentions policies
DROP POLICY IF EXISTS "character_mentions_select_own" ON public.character_mentions;
DROP POLICY IF EXISTS "character_mentions_insert_own" ON public.character_mentions;
DROP POLICY IF EXISTS "character_mentions_update_own" ON public.character_mentions;
DROP POLICY IF EXISTS "character_mentions_delete_own" ON public.character_mentions;

-- Adventure members policies (if they exist)
DROP POLICY IF EXISTS "Users can view members of their adventures" ON public.adventure_members;
DROP POLICY IF EXISTS "Creators can manage members" ON public.adventure_members;

-- Regions policies (if they exist)
DROP POLICY IF EXISTS "Users can view regions of their adventures" ON public.regions;
DROP POLICY IF EXISTS "Creators and editors can manage regions" ON public.regions;

-- Tasks policies (if they exist)
DROP POLICY IF EXISTS "Users can view tasks of their adventures" ON public.tasks;
DROP POLICY IF EXISTS "Creators and editors can manage tasks" ON public.tasks;

-- Chapters policies (if they exist)
DROP POLICY IF EXISTS "Users can view chapters of their adventures" ON public.chapters;
DROP POLICY IF EXISTS "Creators and editors can manage chapters" ON public.chapters;

-- STEP 3: Create optimized RLS policies using (select auth.uid())
-- This prevents re-evaluation for each row and improves performance

-- Profiles policies - users can only access their own profile
CREATE POLICY "profiles_access_own" ON public.profiles
  FOR ALL
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Adventures policies - users can access adventures they are members of
CREATE POLICY "adventures_access_members" ON public.adventures
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.adventure_members
      WHERE adventure_members.adventure_id = adventures.id
      AND adventure_members.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    -- Only allow insert if user will be added as creator by trigger
    (select auth.uid()) = creator_id
  );

-- Timeline entries policies - users can access entries from their adventures
CREATE POLICY "timeline_entries_access_members" ON public.timeline_entries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.adventure_members
      WHERE adventure_members.adventure_id = timeline_entries.adventure_id
      AND adventure_members.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.adventure_members
      WHERE adventure_members.adventure_id = timeline_entries.adventure_id
      AND adventure_members.profile_id = (select auth.uid())
      AND adventure_members.role IN ('creator', 'editor')
    )
  );

-- NPCs policies - users can access NPCs from their adventures
CREATE POLICY "npcs_access_members" ON public.npcs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.adventure_members
      WHERE adventure_members.adventure_id = npcs.adventure_id
      AND adventure_members.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.adventure_members
      WHERE adventure_members.adventure_id = npcs.adventure_id
      AND adventure_members.profile_id = (select auth.uid())
      AND adventure_members.role IN ('creator', 'editor')
    )
  );

-- Adventure players policies
CREATE POLICY "adventure_players_access_members" ON public.adventure_players
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.adventure_members
      WHERE adventure_members.adventure_id = adventure_players.adventure_id
      AND adventure_members.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.adventure_members
      WHERE adventure_members.adventure_id = adventure_players.adventure_id
      AND adventure_members.profile_id = (select auth.uid())
      AND adventure_members.role IN ('creator', 'editor')
    )
  );

-- NPC appearances policies
CREATE POLICY "npc_appearances_access_members" ON public.npc_appearances
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.npcs
      JOIN public.adventure_members ON adventure_members.adventure_id = npcs.adventure_id
      WHERE npcs.id = npc_appearances.npc_id
      AND adventure_members.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.npcs
      JOIN public.adventure_members ON adventure_members.adventure_id = npcs.adventure_id
      WHERE npcs.id = npc_appearances.npc_id
      AND adventure_members.profile_id = (select auth.uid())
      AND adventure_members.role IN ('creator', 'editor')
    )
  );

-- Character mentions policies
CREATE POLICY "character_mentions_access_members" ON public.character_mentions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.timeline_entries
      JOIN public.adventure_members ON adventure_members.adventure_id = timeline_entries.adventure_id
      WHERE timeline_entries.id = character_mentions.timeline_entry_id
      AND adventure_members.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.timeline_entries
      JOIN public.adventure_members ON adventure_members.adventure_id = timeline_entries.adventure_id
      WHERE timeline_entries.id = character_mentions.timeline_entry_id
      AND adventure_members.profile_id = (select auth.uid())
      AND adventure_members.role IN ('creator', 'editor')
    )
  );

-- Adventure members policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'adventure_members') THEN
    EXECUTE 'CREATE POLICY "adventure_members_access_own" ON public.adventure_members
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.adventure_members am
          WHERE am.adventure_id = adventure_members.adventure_id
          AND am.profile_id = (select auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.adventure_members am
          WHERE am.adventure_id = adventure_members.adventure_id
          AND am.profile_id = (select auth.uid())
          AND am.role = ''creator''
        )
      )';
  END IF;
END $$;

-- Regions policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'regions') THEN
    EXECUTE 'CREATE POLICY "regions_access_members" ON public.regions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.adventure_members
          WHERE adventure_members.adventure_id = regions.adventure_id
          AND adventure_members.profile_id = (select auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.adventure_members
          WHERE adventure_members.adventure_id = regions.adventure_id
          AND adventure_members.profile_id = (select auth.uid())
          AND adventure_members.role IN (''creator'', ''editor'')
        )
      )';
  END IF;
END $$;

-- Tasks policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
    EXECUTE 'CREATE POLICY "tasks_access_members" ON public.tasks
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.adventure_members
          WHERE adventure_members.adventure_id = tasks.adventure_id
          AND adventure_members.profile_id = (select auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.adventure_members
          WHERE adventure_members.adventure_id = tasks.adventure_id
          AND adventure_members.profile_id = (select auth.uid())
          AND adventure_members.role IN (''creator'', ''editor'')
        )
      )';
  END IF;
END $$;

-- Chapters policies (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chapters') THEN
    EXECUTE 'CREATE POLICY "chapters_access_members" ON public.chapters
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.adventure_members
          WHERE adventure_members.adventure_id = chapters.adventure_id
          AND adventure_members.profile_id = (select auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.adventure_members
          WHERE adventure_members.adventure_id = chapters.adventure_id
          AND adventure_members.profile_id = (select auth.uid())
          AND adventure_members.role IN (''creator'', ''editor'')
        )
      )';
  END IF;
END $$;

-- STEP 4: Verify functions have correct search_path (they should already from previous scripts)
-- Recreate them to be sure

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'username', LOWER(SPLIT_PART(NEW.email, '@', 1)))
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_adventure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add the creator as a member with 'creator' role
  INSERT INTO public.adventure_members (adventure_id, profile_id, role)
  VALUES (NEW.id, NEW.creator_id, 'creator')
  ON CONFLICT (adventure_id, profile_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- STEP 5: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_adventure_members_profile_id ON public.adventure_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_adventure_members_adventure_id ON public.adventure_members(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventures_creator_id ON public.adventures(creator_id);
CREATE INDEX IF NOT EXISTS idx_timeline_entries_adventure_id ON public.timeline_entries(adventure_id);
CREATE INDEX IF NOT EXISTS idx_npcs_adventure_id ON public.npcs(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_players_adventure_id ON public.adventure_players(adventure_id);

-- Done! All Supabase warnings should be resolved now.
