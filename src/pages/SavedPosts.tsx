import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Search, SortDesc, SortAsc, ExternalLink, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getSavedPosts } from "@/lib/savedPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/feed/PostCard";
import type { FeedPost } from "@/hooks/useFeed";

export default function SavedPosts() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const {
    data: savedItems,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["savedPosts", session?.user?.id],
    queryFn: () => getSavedPosts(session!.user!.id),
    enabled: !!session?.user?.id,
    retry: 1,
  });

  const filteredAndSortedPosts = useMemo(() => {
    if (!savedItems) return [];

    let posts = savedItems.map((item) => ({
      ...item.post,
      _saved_at: item.bookmark_created_at,
      _saved_id: item.bookmark_id,
    })) as (FeedPost & { _saved_at: string; _saved_id: string })[];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.content.toLowerCase().includes(lower) ||
          p.author_name.toLowerCase().includes(lower)
      );
    }

    posts.sort((a, b) => {
      const dateA = new Date(a._saved_at).getTime();
      const dateB = new Date(b._saved_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return posts;
  }, [savedItems, searchTerm, sortOrder]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Bookmark className="h-8 w-8 text-primary" />
              Saved Posts
            </h1>
            <p className="text-muted-foreground mt-1">
              Your personal collection of bookmarked content.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search in saved posts..."
              className="pl-10 h-12 bg-background border-border/50 focus-visible:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="h-12 w-full sm:w-auto shrink-0"
            onClick={() =>
              setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
            }
          >
            {sortOrder === "newest" ? (
              <SortDesc className="h-4 w-4 mr-2" />
            ) : (
              <SortAsc className="h-4 w-4 mr-2" />
            )}
            {sortOrder === "newest" ? "Newest Saved" : "Oldest Saved"}
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border bg-card text-card-foreground shadow space-y-4 p-6"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-24 w-full" />
                </div>
              ))
          ) : error ? (
            <div className="text-center py-12 rounded-xl border border-destructive/20 bg-destructive/5">
              <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-3" />
              <p className="font-medium text-destructive mb-1">Could not load saved posts</p>
              <p className="text-sm text-muted-foreground mb-4">
                {(error as Error)?.message ?? "An unexpected error occurred."}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : filteredAndSortedPosts.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-border/50">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No saved posts</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                {searchTerm
                  ? "No saved posts match your search criteria."
                  : "You haven't saved any posts yet. Click the bookmark icon on any post in your feed to save it here."}
              </p>
            </div>
          ) : (
            filteredAndSortedPosts.map((post) => (
              <div key={post._saved_id} className="relative group/saved">
                {/* "Open" link on hover */}
                <Link
                  to={`/posts/${post.id}`}
                  className="absolute top-4 right-16 z-10 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover/saved:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-2.5 py-1 hover:text-primary hover:border-primary/40"
                  title="Open post"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </Link>
                <PostCard
                  post={post}
                  currentUserId={session?.user?.id || ""}
                  currentUserName={session?.user?.user_metadata?.name || ""}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
