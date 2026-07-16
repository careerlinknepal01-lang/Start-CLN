import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UserCard } from "@/components/UserCard";
import { fetchMyConnections, stateFor, type ConnRow } from "@/lib/connections";
import { profileSearchOr } from "@/lib/search";
import { Search, Users, Compass } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";

interface Profile {
  id: string;
  name: string;
  college: string;
  field: string;
  avatar_url?: string | null;
  bio?: string | null;
}



const Explore = () => {
  const { user } = useAuth();
  const [q, setQ] = useState("");

  // People
  const [people, setPeople] = useState<Profile[]>([]);
  const [conns, setConns] = useState<ConnRow[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);

  const loadPeople = async (term: string) => {
    if (!user) return;
    setPeopleLoading(true);
    setPeopleError(null);
    try {
      let query = supabase.from("profiles").select("*").neq("id", user.id).limit(50);
      const filter = profileSearchOr(term);
      if (filter) query = query.or(filter);
      const [{ data, error: profileError }, c] = await Promise.all([
        query,
        fetchMyConnections(user.id),
      ]);
      if (profileError) throw profileError;
      setPeople((data as Profile[]) || []);
      setConns(c);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load people";
      setPeopleError(msg);
      toast.error(msg);
    } finally {
      setPeopleLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search requests to prevent API spam and improve performance
    const id = setTimeout(() => {
      loadPeople(q);
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, user?.id]);

  const postTypeEmoji: Record<string, string> = {
    achievement: "🏆",
    project_update: "🚀",
    opportunity: "💼",
    question: "❓",
    general: "💬",
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div>
          <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight tracking-tight flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-accent/10" style={{ borderRadius: "2px" }}>
              <Compass className="h-5 w-5 text-accent" />
            </span>
            Explore
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl">
            Discover people, posts, communities, and events across Nepal's student network.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search across the platform…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-11"
            style={{ borderRadius: "2px" }}
            aria-label="Search"
          />
        </div>

        {/* Results */}
        <div>
          {peopleLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse bg-muted" style={{ borderRadius: "2px" }} />
              ))}
            </div>
          ) : peopleError ? (
            <div className="border border-destructive/30 bg-destructive/5 p-6 text-center" style={{ borderRadius: "2px" }}>
              <p className="text-sm text-destructive font-medium">{peopleError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => loadPeople(q)} style={{ borderRadius: "2px" }}>
                Retry
              </Button>
            </div>
          ) : people.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center" style={{ borderRadius: "2px" }}>
              <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">No people found</h3>
              <p className="mt-1 text-xs text-muted-foreground">Try a different search query to find students.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {people.map((p) => {
                if (!user) return null;
                const s = stateFor(user.id, p.id, conns);
                return (
                  <UserCard
                    key={p.id}
                    profile={p}
                    state={s.state}
                    connectionId={s.connectionId}
                    onChange={() => loadPeople(q)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Explore;
