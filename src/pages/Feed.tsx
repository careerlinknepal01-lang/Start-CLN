import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFeedPosts } from "@/hooks/useFeed";
import { useBookmarkedPosts } from "@/hooks/usePlatform";
import type { FeedPost } from "@/hooks/useFeed";
import { supabase } from "@/integrations/supabase/client";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { PostCard } from "@/components/feed/PostCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  Clock,
  Loader2,
  Newspaper,
  Users,
  BadgeCheck,
  Bookmark,
  Trophy,
  UserPlus,
} from "lucide-react";
import { fetchMyConnections, stateFor, type ConnRow } from "@/lib/connections";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";

interface Profile {
  id: string;
  name: string;
  college: string;
  field: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_verified?: boolean | null;
  level?: number | null;
}

// Compact connect button for sidebar suggestions
const ConnectButton = ({
  userId,
  profileId,
  onSuccess,
}: {
  userId: string;
  profileId: string;
  onSuccess: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("connections")
      .insert({ requester_id: userId, addressee_id: profileId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setDone(true);
    onSuccess();
  };

  if (done) {
    return (
      <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 text-muted-foreground">
        Pending
      </Badge>
    );
  }

  return (
    <Button
      size="icon"
      variant="outline"
      disabled={busy}
      onClick={handleConnect}
      className="h-6 w-6 rounded-full border-primary/40 text-primary hover:bg-primary/10"
    >
      <UserPlus className="h-3 w-3" />
    </Button>
  );
};


const FEED_STATS = [
  { icon: Newspaper, label: "Share updates & achievements" },
  { icon: Users, label: "See what your network is doing" },
  { icon: Trophy, label: "Discover trending opportunities" },
  { icon: Bookmark, label: "Bookmark posts to read later" },
];

const Feed = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<"recent" | "trending">("recent");
  const [categoryFilter, setCategoryFilter] = useState<FeedPost["type"] | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [conns, setConns] = useState<ConnRow[]>([]);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { data: bookmarks } = useBookmarkedPosts(user?.id);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useFeedPosts(filter, user?.id);

  const allPosts = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);
  const displayedPosts = useMemo(
    () =>
      categoryFilter ? allPosts.filter((p) => p.type === categoryFilter) : allPosts,
    [allPosts, categoryFilter]
  );

  const postParam = searchParams.get("post");
  useEffect(() => {
    if (!postParam || allPosts.length === 0) return;
    const exists = allPosts.some((p) => p.id === postParam);
    if (!exists) return;
    setHighlightPostId(postParam);
    const el = postRefs.current[postParam];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = window.setTimeout(() => setHighlightPostId(null), 4000);
    return () => window.clearTimeout(t);
  }, [postParam, allPosts]);

  // Load profile & suggestions
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: profile }, connRows, { data: allProfiles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        fetchMyConnections(user.id),
        supabase.from("profiles").select("*").neq("id", user.id).limit(50),
      ]);
      setMe(profile as Profile | null);
      setConns(connRows);
      const accepted = connRows.filter((c) => c.status === "accepted").length;
      setAcceptedCount(accepted);

      // Suggestions: same field or college, not already connected
      const involvedIds = new Set(
        connRows.map((c) => (c.requester_id === user.id ? c.addressee_id : c.requester_id))
      );
      const list = (allProfiles as Profile[] | null) ?? [];
      const ranked = list
        .filter((p) => !involvedIds.has(p.id))
        .sort((a, b) => {
          const score = (p: Profile) =>
            ((profile as Profile)?.field && p.field === (profile as Profile).field ? 2 : 0) +
            ((profile as Profile)?.college && p.college === (profile as Profile).college ? 1 : 0);
          return score(b) - score(a);
        })
        .slice(0, 5);
      setSuggestions(ranked);
    };
    load();
  }, [user]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-4">


          {/* Create post card */}
          {user && me && (
            <CreatePostCard
              key={createOpen ? "open" : "closed"}
              userId={user.id}
              userName={me.name ?? ""}
              avatarUrl={me.avatar_url}
              defaultOpen={createOpen}
            />
          )}

          {/* People You May Know (Horizontal) */}
          {suggestions.length > 0 && (
            <div className="border border-border/50 bg-card shadow-sm" style={{ borderRadius: "0" }}>
              <div className="px-4 py-3 border-b border-border/30">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 tracking-wide uppercase">
                  <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  Suggested Connections
                </p>
              </div>
              <div className="p-4">
                <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-none snap-x">
                  {suggestions.map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-2 min-w-[120px] snap-start border border-border/50 bg-muted/20 p-3 text-center" style={{ borderRadius: "2px" }}>
                      <Link to={`/profile/${s.id}`} aria-label={`View ${s.name}'s profile`}>
                        <UserAvatar name={s.name} url={s.avatar_url} className="h-12 w-12 mx-auto" />
                      </Link>
                      <div className="w-full">
                        <Link
                          to={`/profile/${s.id}`}
                          className="font-medium text-xs leading-tight hover:underline truncate block"
                        >
                          {s.name}
                        </Link>
                        <p className="text-[10px] text-muted-foreground truncate w-full mt-0.5">
                          {s.field}
                        </p>
                      </div>
                      {user && (
                        <ConnectButton
                          userId={user.id}
                          profileId={s.id}
                          onSuccess={() => setSuggestions((prev) => prev.filter((p) => p.id !== s.id))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Feed Categories — bar */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                categoryFilter === null
                  ? "bg-foreground text-background shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              style={{ borderRadius: "2px" }}
            >
              All Posts
            </button>
            {(
              [
                { type: "achievement" as const, emoji: "🏆", label: "Achievements" },
                { type: "project_update" as const, emoji: "🚀", label: "Project Updates" },
                { type: "opportunity" as const, emoji: "💼", label: "Opportunities" },
                { type: "question" as const, emoji: "❓", label: "Questions" },
                { type: "general" as const, emoji: "💬", label: "General" },
              ] as const
            ).map(({ type, emoji, label }) => (
              <button
                key={label}
                onClick={() => setCategoryFilter((current) => (current === type ? null : type))}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide transition-all ${
                  categoryFilter === type
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
                style={{ borderRadius: "2px" }}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>

          {/* Feed filter tabs */}
          <div className="flex border border-border/50 bg-card shadow-sm" style={{ borderRadius: "0" }}>
            <button
              onClick={() => setFilter("recent")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold tracking-wide uppercase transition-all ${
                filter === "recent"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
              style={{ borderRadius: "0" }}
            >
              <Clock className="h-3.5 w-3.5" />
              Recent
            </button>
            <div className="w-px bg-border/50" />
            <button
              onClick={() => setFilter("trending")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold tracking-wide uppercase transition-all ${
                filter === "trending"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground bg-transparent"
              }`}
              style={{ borderRadius: "0" }}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Trending
            </button>
          </div>

          {/* Error state */}
          {error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-5 text-center">
                <p className="text-sm text-destructive font-medium">
                  Could not load feed. Please try again.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Loading skeleton */}
          {isLoading && !error && <FeedSkeleton />}

          {/* Posts */}
          {!isLoading && !error && allPosts.length === 0 && (
            <EmptyFeed filter={filter} onCreatePost={() => setCreateOpen(true)} />
          )}

          {!isLoading && !error && allPosts.length > 0 && displayedPosts.length === 0 && (
            <Card className="border-border/60">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No posts in this category yet.{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setCategoryFilter(null)}
                >
                  Show all
                </button>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && displayedPosts.length > 0 && (
            <div className="space-y-4">
              {displayedPosts.map((post) => (
                <div
                  key={post.id}
                  ref={(el) => {
                    postRefs.current[post.id] = el;
                  }}
                  className={
                    highlightPostId === post.id
                      ? "ring-2 ring-primary/50 rounded-xl transition-shadow"
                      : ""
                  }
                >
                  <PostCard
                    post={post}
                    currentUserId={user!.id}
                    currentUserName={me?.name ?? ""}
                    currentAvatarUrl={me?.avatar_url}
                  />
                </div>
              ))}
            </div>
          )}

        {/* Infinite scroll loader */}
        <div ref={loaderRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!hasNextPage && allPosts.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            You've seen all posts ✓
          </p>
        )}
      </div>
    </AppLayout>
  );
};

export default Feed;
