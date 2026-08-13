import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdminAuth() {
  const { user, loading: authLoading } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["admin-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, role")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return { ...data, email: user!.email };
    },
    enabled: !!user,
    
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });

  return {
    isAdmin: profile?.role === "admin",
    isLoading: authLoading || (!!user && profileLoading),
    profile,
    user,
  };
}
