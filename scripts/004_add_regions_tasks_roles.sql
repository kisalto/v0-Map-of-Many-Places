-- Add username field to profiles and update role system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Create regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  history TEXT,
  points_of_interest TEXT[], -- Array of points of interest
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create region appearances table
CREATE TABLE IF NOT EXISTS public.region_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  timeline_entry_id UUID NOT NULL REFERENCES public.timeline_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region_id, timeline_entry_id)
);

-- Create tasks table (A fazeres)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create adventure members table (for collaboration with roles)
CREATE TABLE IF NOT EXISTS public.adventure_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(adventure_id, profile_id)
);

-- Add creator_id to timeline_entries if not exists
ALTER TABLE public.timeline_entries ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.profiles(id);

-- Enable RLS for new tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventure_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regions
CREATE POLICY "regions_select" ON public.regions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = regions.adventure_id 
    AND adventure_members.profile_id = auth.uid()
  ));
CREATE POLICY "regions_insert" ON public.regions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = regions.adventure_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role IN ('creator', 'editor')
  ));
CREATE POLICY "regions_update" ON public.regions FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = regions.adventure_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role IN ('creator', 'editor')
  ));
CREATE POLICY "regions_delete" ON public.regions FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = regions.adventure_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role = 'creator'
  ));

-- RLS Policies for region_appearances
CREATE POLICY "region_appearances_select" ON public.region_appearances FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventure_members ON adventure_members.adventure_id = regions.adventure_id 
    WHERE regions.id = region_appearances.region_id 
    AND adventure_members.profile_id = auth.uid()
  ));
CREATE POLICY "region_appearances_insert" ON public.region_appearances FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventure_members ON adventure_members.adventure_id = regions.adventure_id 
    WHERE regions.id = region_appearances.region_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role IN ('creator', 'editor')
  ));
CREATE POLICY "region_appearances_delete" ON public.region_appearances FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventure_members ON adventure_members.adventure_id = regions.adventure_id 
    WHERE regions.id = region_appearances.region_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role IN ('creator', 'editor')
  ));

-- RLS Policies for tasks
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = tasks.adventure_id 
    AND adventure_members.profile_id = auth.uid()
  ));
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = tasks.adventure_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role IN ('creator', 'editor')
  ));
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = tasks.adventure_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role IN ('creator', 'editor')
  ));
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = tasks.adventure_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role IN ('creator', 'editor')
  ));

-- RLS Policies for adventure_members
CREATE POLICY "adventure_members_select" ON public.adventure_members FOR SELECT 
  USING (profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.adventure_members am 
    WHERE am.adventure_id = adventure_members.adventure_id 
    AND am.profile_id = auth.uid()
  ));
CREATE POLICY "adventure_members_insert" ON public.adventure_members FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = adventure_members.adventure_id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role = 'creator'
  ));
CREATE POLICY "adventure_members_update" ON public.adventure_members FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members am 
    WHERE am.adventure_id = adventure_members.adventure_id 
    AND am.profile_id = auth.uid()
    AND am.role = 'creator'
  ));
CREATE POLICY "adventure_members_delete" ON public.adventure_members FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members am 
    WHERE am.adventure_id = adventure_members.adventure_id 
    AND am.profile_id = auth.uid()
    AND am.role = 'creator'
  ));

-- Update adventures RLS to work with adventure_members
DROP POLICY IF EXISTS "adventures_select_own" ON public.adventures;
DROP POLICY IF EXISTS "adventures_insert_own" ON public.adventures;
DROP POLICY IF EXISTS "adventures_update_own" ON public.adventures;
DROP POLICY IF EXISTS "adventures_delete_own" ON public.adventures;

CREATE POLICY "adventures_select_member" ON public.adventures FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = adventures.id 
    AND adventure_members.profile_id = auth.uid()
  ));
CREATE POLICY "adventures_insert_creator" ON public.adventures FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "adventures_update_member" ON public.adventures FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = adventures.id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role IN ('creator', 'editor')
  ));
CREATE POLICY "adventures_delete_creator" ON public.adventures FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.adventure_members 
    WHERE adventure_members.adventure_id = adventures.id 
    AND adventure_members.profile_id = auth.uid()
    AND adventure_members.role = 'creator'
  ));
