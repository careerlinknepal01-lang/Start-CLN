-- Fix connection request acceptance for multiple pending requests.
--
-- Root causes addressed:
-- 1. Notification trigger inserts can fail RLS and roll back the connection UPDATE.
-- 2. No server-side guard ensuring only the addressee accepts a specific pending row.
-- 3. Direct client UPDATE has no atomic validation.

-- ─── Harden notification trigger (never roll back connection changes) ─────────

CREATE OR REPLACE FUNCTION public.handle_connection_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name TEXT;
  addressee_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    BEGIN
      SELECT name INTO requester_name FROM public.profiles WHERE id = NEW.requester_id;
      INSERT INTO public.notifications (user_id, type, content, related_id)
      VALUES (
        NEW.addressee_id,
        'connection_request',
        COALESCE(requester_name, 'Someone') || ' sent you a connection request',
        NEW.id
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'connection_request notification failed: %', SQLERRM;
    END;
  ELSIF TG_OP = 'UPDATE'
    AND NEW.status = 'accepted'
    AND OLD.status IS DISTINCT FROM 'accepted' THEN
    BEGIN
      SELECT name INTO addressee_name FROM public.profiles WHERE id = NEW.addressee_id;
      INSERT INTO public.notifications (user_id, type, content, related_id)
      VALUES (
        NEW.requester_id,
        'connection_accepted',
        COALESCE(addressee_name, 'Someone') || ' accepted your connection request',
        NEW.id
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'connection_accepted notification failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── Tighten connection UPDATE policy (addressee accepts / either party rejects) ─

DROP POLICY IF EXISTS "Addressee can update status" ON public.connections;
DROP POLICY IF EXISTS "Update connections" ON public.connections;

CREATE POLICY "Addressee accepts pending requests"
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = addressee_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = addressee_id
    AND status IN ('accepted', 'rejected')
  );

CREATE POLICY "Either party can reject pending requests"
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND (auth.uid() = requester_id OR auth.uid() = addressee_id)
  )
  WITH CHECK (
    status = 'rejected'
    AND (auth.uid() = requester_id OR auth.uid() = addressee_id)
  );

-- ─── RPC: accept a single pending connection request ──────────────────────────

CREATE OR REPLACE FUNCTION public.accept_connection_request(p_connection_id uuid)
RETURNS public.connections
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.connections;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.connections
  SET status = 'accepted', updated_at = now()
  WHERE id = p_connection_id
    AND addressee_id = v_user
    AND status = 'pending'
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Connection request not found, already handled, or you are not the recipient';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_connection_request(uuid) TO authenticated;

-- ─── RPC: reject (delete) a single pending connection request ─────────────────

CREATE OR REPLACE FUNCTION public.reject_connection_request(p_connection_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_deleted int;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.connections
  WHERE id = p_connection_id
    AND status = 'pending'
    AND (addressee_id = v_user OR requester_id = v_user);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  IF v_deleted = 0 THEN
    RAISE EXCEPTION 'Connection request not found or already handled';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_connection_request(uuid) TO authenticated;
