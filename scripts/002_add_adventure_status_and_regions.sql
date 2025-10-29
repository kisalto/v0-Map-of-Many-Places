-- Add is_active column to adventures table
ALTER TABLE public.adventures ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  history TEXT,
  image_url TEXT,
  parent_region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points of interest table (for regions)
CREATE TABLE IF NOT EXISTS public.points_of_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table (for annotations/entries)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create character mentions table (for @ mentions in tasks)
CREATE TABLE IF NOT EXISTS public.character_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create region mentions table (for # mentions in tasks)
CREATE TABLE IF NOT EXISTS public.region_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_of_interest ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regions
CREATE POLICY "regions_select_own" ON public.regions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = regions.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "regions_insert_own" ON public.regions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = regions.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "regions_update_own" ON public.regions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = regions.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "regions_delete_own" ON public.regions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = regions.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for points_of_interest
CREATE POLICY "points_of_interest_select_own" ON public.points_of_interest FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventures ON adventures.id = regions.adventure_id 
    WHERE regions.id = points_of_interest.region_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "points_of_interest_insert_own" ON public.points_of_interest FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventures ON adventures.id = regions.adventure_id 
    WHERE regions.id = points_of_interest.region_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "points_of_interest_update_own" ON public.points_of_interest FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventures ON adventures.id = regions.adventure_id 
    WHERE regions.id = points_of_interest.region_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "points_of_interest_delete_own" ON public.points_of_interest FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventures ON adventures.id = regions.adventure_id 
    WHERE regions.id = points_of_interest.region_id AND adventures.creator_id = auth.uid()
  ));

-- RLS Policies for tasks
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = tasks.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "tasks_insert_own" ON public.tasks FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = tasks.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = tasks.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "tasks_delete_own" ON public.tasks FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = tasks.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for character_mentions
CREATE POLICY "character_mentions_select_own" ON public.character_mentions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    JOIN public.adventures ON adventures.id = tasks.adventure_id 
    WHERE tasks.id = character_mentions.task_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "character_mentions_insert_own" ON public.character_mentions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks 
    JOIN public.adventures ON adventures.id = tasks.adventure_id 
    WHERE tasks.id = character_mentions.task_id AND adventures.creator_id = auth.uid()
  ));

-- RLS Policies for region_mentions
CREATE POLICY "region_mentions_select_own" ON public.region_mentions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    JOIN public.adventures ON adventures.id = tasks.adventure_id 
    WHERE tasks.id = region_mentions.task_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "region_mentions_insert_own" ON public.region_mentions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks 
    JOIN public.adventures ON adventures.id = tasks.adventure_id 
    WHERE tasks.id = region_mentions.task_id AND adventures.creator_id = auth.uid()
  ));
