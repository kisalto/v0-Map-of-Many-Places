-- Create function to automatically add creator as member when adventure is created
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

-- Create trigger to automatically add creator as member
DROP TRIGGER IF EXISTS on_adventure_created ON public.adventures;

CREATE TRIGGER on_adventure_created
  AFTER INSERT ON public.adventures
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_adventure();
