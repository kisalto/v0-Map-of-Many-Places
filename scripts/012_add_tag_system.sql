-- Add tag display information to characters, regions, and subregions
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS tag_color VARCHAR(7) DEFAULT '#10b981';
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS tag_label TEXT;

ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS tag_color VARCHAR(7) DEFAULT '#a855f7';
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS tag_label TEXT;

ALTER TABLE public.subregions ADD COLUMN IF NOT EXISTS tag_color VARCHAR(7) DEFAULT '#ec4899';
ALTER TABLE public.subregions ADD COLUMN IF NOT EXISTS tag_label TEXT;

-- Update existing characters to have default tag colors based on character_type
UPDATE public.characters 
SET tag_color = CASE 
  WHEN character_type = 'player' THEN '#10b981'  -- green
  WHEN character_type = 'ally' THEN '#3b82f6'    -- blue
  WHEN character_type = 'enemy' THEN '#ef4444'   -- red
  WHEN character_type = 'neutral' THEN '#6b7280' -- gray
  ELSE '#10b981'
END
WHERE tag_color IS NULL OR tag_color = '#10b981';

-- Create function to auto-generate tag labels
CREATE OR REPLACE FUNCTION generate_tag_label()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tag_label IS NULL OR NEW.tag_label = '' THEN
    NEW.tag_label := NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-generating tag labels
DROP TRIGGER IF EXISTS characters_tag_label_trigger ON public.characters;
CREATE TRIGGER characters_tag_label_trigger
BEFORE INSERT OR UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION generate_tag_label();

DROP TRIGGER IF EXISTS regions_tag_label_trigger ON public.regions;
CREATE TRIGGER regions_tag_label_trigger
BEFORE INSERT OR UPDATE ON public.regions
FOR EACH ROW
EXECUTE FUNCTION generate_tag_label();

DROP TRIGGER IF EXISTS subregions_tag_label_trigger ON public.subregions;
CREATE TRIGGER subregions_tag_label_trigger
BEFORE INSERT OR UPDATE ON public.subregions
FOR EACH ROW
EXECUTE FUNCTION generate_tag_label();
