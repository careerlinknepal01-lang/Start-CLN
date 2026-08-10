import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { mapAuthError } from "@/features/auth/utils/authErrorMapper";
import { PENDING_VERIFICATION_EMAIL_KEY } from "@/features/auth/types/auth.types";

/**
 * Interface defining the shape of the authentication context.
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Default state while waiting for the initial auth check to complete
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

/**
 * Provider component that wraps the application and exposes authentication state.
 * 
 * @param {object} props - The component props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The AuthContext provider wrapping its children.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // mounted flag prevents state updates on unmounted components if the auth check takes too long
    let isMounted = true;

    /**
     * Helper to centralize setting the session and user state safely.
     * @param {Session | null} nextSession - The new session object from Supabase.
     */
    const updateSessionState = (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    };

    // We subscribe to auth state changes (login, logout, token refresh) to keep the app synchronized
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      updateSessionState(nextSession);

      // Clean up sensitive/temporary storage keys when the user explicitly signs out
      if (event === "SIGNED_OUT") {
        sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
      }
    });

    // We fetch the initial session manually because onAuthStateChange might not fire immediately on page load
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        mapAuthError(error, "general");
      }
      updateSessionState(initialSession);
    });

    return () => {
      isMounted = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  /**
   * securely logs out the current user and clears local auth state.
   * 
   * @returns {Promise<void>}
   */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      mapAuthError(error, "general");
    }
    // We clear pending verifications to prevent leaked state between accounts
    sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading: isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to easily consume the authentication context across the application.
 * 
 * @returns {AuthContextType} The current user, session, and loading state.
 */
export const useAuth = () => useContext(AuthContext);
