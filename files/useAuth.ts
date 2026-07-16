// ─── useAuth Hook ─────────────────────────────────────────────────────────────
// Provides reactive authentication state to any component that needs it.
//
// Design decisions:
//  • Uses Supabase's onAuthStateChange listener so state is always in sync
//    with the actual session (handles tab focus, token refresh, etc.).
//  • Exposes `isLoading` to prevent flash-of-wrong-content on initial load.
//  • `session` is null when unauthenticated; typed as Session | null.
//  • Cleans up the listener on unmount to prevent memory leaks.
//  • Does NOT manage form state — this hook is session-state only.

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UseAuthReturn = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

export function useAuth(): UseAuthReturn {
  const [session, setSession]   = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // ── 1. Initialise from existing session ──
    // getSession() resolves immediately from localStorage/memory cache;
    // the refresh happens in the background if the token is near expiry.
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session ?? null);
        setIsLoading(false);
      }
    });

    // ── 2. Subscribe to live auth state changes ──
    // Fires on: sign in, sign out, token refresh, password change, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    isLoading,
    isAuthenticated: session !== null,
  };
}
