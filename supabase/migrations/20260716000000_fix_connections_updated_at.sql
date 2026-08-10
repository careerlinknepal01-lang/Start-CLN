-- Fix the missing updated_at column on connections table
-- This resolves the 'record "new" has no field "updated_at"' error during connection acceptance

ALTER TABLE public.connections
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Ensure the trigger exists and is correct
DROP TRIGGER IF EXISTS connections_updated ON public.connections;
CREATE TRIGGER connections_updated
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
