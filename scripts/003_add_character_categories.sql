-- Add character category to NPCs
ALTER TABLE public.npcs ADD COLUMN IF NOT EXISTS character_category TEXT DEFAULT 'neutral' CHECK (character_category IN ('ally', 'enemy', 'neutral'));

-- Add character category to players (default to ally since they're player characters)
ALTER TABLE public.adventure_players ADD COLUMN IF NOT EXISTS character_category TEXT DEFAULT 'ally' CHECK (character_category IN ('ally', 'enemy', 'neutral'));

-- Add comment to explain the categories
COMMENT ON COLUMN public.npcs.character_category IS 'Character category: ally (blue), enemy (red), or neutral (gray)';
COMMENT ON COLUMN public.adventure_players.character_category IS 'Character category: usually ally since they are player characters';
