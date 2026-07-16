import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mapAuthError } from "@/features/auth/utils/authErrorMapper";
import { PENDING_VERIFICATION_EMAIL_KEY } from "@/features/auth/types/auth.types";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("cln_mock_auth")) {
      localStorage.removeItem("cln_mock_auth");
    }

    let mounted = true;

    const applySession = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        applySession(nextSession);
      } else {
        applySession(nextSession);
      }

      if (event === "SIGNED_OUT") {
        sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        mapAuthError(error, "general");
      }
      applySession(initialSession);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      mapAuthError(error, "general");
    }
    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
  }, []);

  return (
    <Ctx.Provider value={{ user, session, loading, signOut }}>{children}</Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
