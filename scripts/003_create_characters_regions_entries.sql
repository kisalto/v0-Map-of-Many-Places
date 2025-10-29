-- Create chapters table (for organizing timeline entries)
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks/entries table (annotations in chapters)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create characters table (NPCs and important characters)
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_description TEXT,
  history TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regions table
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_description TEXT,
  history TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subregions table (places within regions)
CREATE TABLE IF NOT EXISTS public.subregions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create character_mentions table (track where characters are mentioned)
CREATE TABLE IF NOT EXISTS public.character_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create region_mentions table (track where regions are mentioned)
CREATE TABLE IF NOT EXISTS public.region_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  region_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_active column to adventures if it doesn't exist
ALTER TABLE public.adventures ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Enable Row Level Security
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subregions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chapters
CREATE POLICY "chapters_select_own" ON public.chapters FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = chapters.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "chapters_insert_own" ON public.chapters FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = chapters.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "chapters_update_own" ON public.chapters FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = chapters.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "chapters_delete_own" ON public.chapters FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = chapters.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = tasks.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "tasks_insert_own" ON public.tasks FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = tasks.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "tasks_update_own" ON public.tasks FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = tasks.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "tasks_delete_own" ON public.tasks FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = tasks.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for characters
CREATE POLICY "characters_select_own" ON public.characters FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = characters.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "characters_insert_own" ON public.characters FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = characters.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "characters_update_own" ON public.characters FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = characters.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "characters_delete_own" ON public.characters FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = characters.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for regions
CREATE POLICY "regions_select_own" ON public.regions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = regions.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "regions_insert_own" ON public.regions FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = regions.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "regions_update_own" ON public.regions FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = regions.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "regions_delete_own" ON public.regions FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = regions.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for subregions
CREATE POLICY "subregions_select_own" ON public.subregions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventures ON adventures.id = regions.adventure_id 
    WHERE regions.id = subregions.region_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "subregions_insert_own" ON public.subregions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventures ON adventures.id = regions.adventure_id 
    WHERE regions.id = subregions.region_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "subregions_update_own" ON public.subregions FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventures ON adventures.id = regions.adventure_id 
    WHERE regions.id = subregions.region_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "subregions_delete_own" ON public.subregions FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.regions 
    JOIN public.adventures ON adventures.id = regions.adventure_id 
    WHERE regions.id = subregions.region_id AND adventures.creator_id = auth.uid()
  ));

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
CREATE POLICY "character_mentions_delete_own" ON public.character_mentions FOR DELETE 
  USING (EXISTS (
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
CREATE POLICY "region_mentions_delete_own" ON public.region_mentions FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    JOIN public.adventures ON adventures.id = tasks.adventure_id 
    WHERE tasks.id = region_mentions.task_id AND adventures.creator_id = auth.uid()
  ));
