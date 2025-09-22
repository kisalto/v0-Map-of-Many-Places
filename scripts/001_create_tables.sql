-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'master')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create adventures table
CREATE TABLE IF NOT EXISTS public.adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create timeline entries table
CREATE TABLE IF NOT EXISTS public.timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create NPCs table
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'alive' CHECK (status IN ('alive', 'dead', 'unknown')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create players table (for adventure participants)
CREATE TABLE IF NOT EXISTS public.adventure_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES public.adventures(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'dead')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(adventure_id, profile_id)
);

-- Create NPC appearances table (tracks when NPCs appear in timeline entries)
CREATE TABLE IF NOT EXISTS public.npc_appearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  timeline_entry_id UUID NOT NULL REFERENCES public.timeline_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(npc_id, timeline_entry_id)
);

-- Create character mentions table (for linking characters in timeline entries)
CREATE TABLE IF NOT EXISTS public.character_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_entry_id UUID NOT NULL REFERENCES public.timeline_entries(id) ON DELETE CASCADE,
  character_type TEXT NOT NULL CHECK (character_type IN ('npc', 'player')),
  character_id UUID NOT NULL, -- References either npcs.id or adventure_players.id
  mention_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventure_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npc_appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- RLS Policies for adventures
CREATE POLICY "adventures_select_own" ON public.adventures FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "adventures_insert_own" ON public.adventures FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "adventures_update_own" ON public.adventures FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "adventures_delete_own" ON public.adventures FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for timeline_entries
CREATE POLICY "timeline_entries_select_own" ON public.timeline_entries FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = timeline_entries.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "timeline_entries_insert_own" ON public.timeline_entries FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = timeline_entries.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "timeline_entries_update_own" ON public.timeline_entries FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = timeline_entries.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "timeline_entries_delete_own" ON public.timeline_entries FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = timeline_entries.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for npcs
CREATE POLICY "npcs_select_own" ON public.npcs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = npcs.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "npcs_insert_own" ON public.npcs FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = npcs.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "npcs_update_own" ON public.npcs FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = npcs.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "npcs_delete_own" ON public.npcs FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = npcs.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for adventure_players
CREATE POLICY "adventure_players_select_own" ON public.adventure_players FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = adventure_players.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "adventure_players_insert_own" ON public.adventure_players FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = adventure_players.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "adventure_players_update_own" ON public.adventure_players FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = adventure_players.adventure_id AND adventures.creator_id = auth.uid()));
CREATE POLICY "adventure_players_delete_own" ON public.adventure_players FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.adventures WHERE adventures.id = adventure_players.adventure_id AND adventures.creator_id = auth.uid()));

-- RLS Policies for npc_appearances
CREATE POLICY "npc_appearances_select_own" ON public.npc_appearances FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.npcs 
    JOIN public.adventures ON adventures.id = npcs.adventure_id 
    WHERE npcs.id = npc_appearances.npc_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "npc_appearances_insert_own" ON public.npc_appearances FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.npcs 
    JOIN public.adventures ON adventures.id = npcs.adventure_id 
    WHERE npcs.id = npc_appearances.npc_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "npc_appearances_update_own" ON public.npc_appearances FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.npcs 
    JOIN public.adventures ON adventures.id = npcs.adventure_id 
    WHERE npcs.id = npc_appearances.npc_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "npc_appearances_delete_own" ON public.npc_appearances FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.npcs 
    JOIN public.adventures ON adventures.id = npcs.adventure_id 
    WHERE npcs.id = npc_appearances.npc_id AND adventures.creator_id = auth.uid()
  ));

-- RLS Policies for character_mentions
CREATE POLICY "character_mentions_select_own" ON public.character_mentions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.timeline_entries 
    JOIN public.adventures ON adventures.id = timeline_entries.adventure_id 
    WHERE timeline_entries.id = character_mentions.timeline_entry_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "character_mentions_insert_own" ON public.character_mentions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.timeline_entries 
    JOIN public.adventures ON adventures.id = timeline_entries.adventure_id 
    WHERE timeline_entries.id = character_mentions.timeline_entry_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "character_mentions_update_own" ON public.character_mentions FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.timeline_entries 
    JOIN public.adventures ON adventures.id = timeline_entries.adventure_id 
    WHERE timeline_entries.id = character_mentions.timeline_entry_id AND adventures.creator_id = auth.uid()
  ));
CREATE POLICY "character_mentions_delete_own" ON public.character_mentions FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.timeline_entries 
    JOIN public.adventures ON adventures.id = timeline_entries.adventure_id 
    WHERE timeline_entries.id = character_mentions.timeline_entry_id AND adventures.creator_id = auth.uid()
  ));
