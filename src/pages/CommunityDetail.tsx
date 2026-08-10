import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToggleCommunityMembership } from "@/hooks/usePlatform";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { PostCard } from "@/components/feed/PostCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import type { FeedPost } from "@/hooks/useFeed";
import {
  ArrowLeft,
  Loader2,
  Users,
  ShieldCheck,
  Globe,
  Lock,
  Search,
  Calendar,
  Info,
  Settings,
  MoreVertical,
  Crown
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pluralize } from "@/lib/pluralize";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";

interface CommunityMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string | null;
  profile?: { name: string; avatar_url: string | null; field: string | null; college: string | null };
}

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar_url: string | null;
  creator_id: string;
  is_private: boolean | null;
  created_at: string;
  creator?: { name: string; avatar_url: string | null } | null;
  community_members?: CommunityMember[];
}

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toggleMembership = useToggleCommunityMembership();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [me, setMe] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);

  const loadCommunity = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("communities")
        .select(`
          *,
          creator:profiles!communities_creator_id_fkey(name, avatar_url),
          community_members(id, user_id, role, joined_at)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setCommunity(data as Community);

      // Load member profiles
      const memberIds = (data.community_members ?? []).map((m: CommunityMember) => m.user_id);
      if (memberIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, field, college")
          .in("id", memberIds);
        const profileMap = new Map((profData ?? []).map((p: { id: string; name: string; avatar_url: string | null; field: string | null; college: string | null }) => [p.id, p]));
        setMembers(
          (data.community_members ?? []).map((m: CommunityMember) => ({
            ...m,
            profile: profileMap.get(m.user_id) as CommunityMember["profile"],
          }))
        );
      } else {
        setMembers([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load community");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadPosts = useCallback(async () => {
    if (!id || !user) return;
    setPostsLoading(true);
    try {
      const { data } = await supabase.rpc("get_feed_posts", {
        p_user_id: user.id,
        p_filter: "recent",
        p_limit: 30,
        p_offset: 0,
      });
      const all = (data ?? []) as FeedPost[];
      setPosts(all.filter((p) => p.community_id === id));
    } catch {
      // silent
    } finally {
      setPostsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadCommunity();
    loadPosts();
  }, [loadCommunity, loadPosts]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("id, name, avatar_url").eq("id", user.id).single().then(({ data }) => {
      if (data) setMe({ id: data.id, name: data.name, avatar_url: data.avatar_url });
    });
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
      <div className="mx-auto max-w-4xl space-y-4 pb-8 animate-fade-in">
        {/* Back button skeleton */}
        <div className="h-8 w-28 rounded-lg bg-muted skeleton-shimmer" />

        {/* Header card skeleton */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="h-32 bg-muted skeleton-shimmer" />
          <div className="px-6 pb-6 pt-0">
            <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 rounded-2xl bg-muted border-4 border-card skeleton-shimmer" />
                <div className="pb-1 space-y-2">
                  <div className="h-7 w-40 rounded-lg bg-muted skeleton-shimmer" />
                  <div className="h-5 w-20 rounded-full bg-muted skeleton-shimmer" />
                  <div className="h-4 w-32 rounded bg-muted skeleton-shimmer" />
                </div>
              </div>
              <div className="h-10 w-36 rounded-lg bg-muted skeleton-shimmer" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full rounded bg-muted skeleton-shimmer" />
              <div className="h-4 w-3/4 rounded bg-muted skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* Tabs skeleton */}
        <div className="h-11 rounded-xl border border-border bg-card skeleton-shimmer" />

        {/* Post card skeletons */}
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-muted skeleton-shimmer" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-32 rounded bg-muted skeleton-shimmer" />
                <div className="h-3 w-48 rounded bg-muted skeleton-shimmer" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-muted skeleton-shimmer" />
              <div className="h-4 w-5/6 rounded bg-muted skeleton-shimmer" />
            </div>
            <div className="flex gap-4 pt-2 border-t border-border/40">
              <div className="h-8 w-16 rounded-lg bg-muted skeleton-shimmer" />
              <div className="h-8 w-16 rounded-lg bg-muted skeleton-shimmer" />
              <div className="h-8 w-16 rounded-lg bg-muted skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
      </AppLayout>
    );
  }

  if (!community) {
    return (
      <AppLayout>
      <div className="text-center py-20 text-muted-foreground">Community not found.</div>
      </AppLayout>
    );
  }

  const myMember = community.community_members?.find((m) => m.user_id === user?.id);
  const isMember = !!myMember;
  const isAdmin = myMember?.role === "admin" || myMember?.role === "creator" || community.creator_id === user?.id;
  const memberCount = members.length;

  return (
    <AppLayout>
    <div className="mx-auto max-w-4xl space-y-4 pb-8">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/communities")} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Communities
      </Button>

      {/* Community Header Card */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-blue-500/10" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="rounded-2xl border-4 border-card overflow-hidden shadow-sm">
                <UserAvatar name={community.name} url={community.avatar_url} className="h-20 w-20 rounded-xl" />
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{community.name}</h1>
                  {isAdmin && <ShieldCheck className="h-5 w-5 text-blue-500" />}
                  {community.is_private ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Badge variant="secondary" className="mt-1">{community.category}</Badge>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{memberCount} {pluralize(memberCount, "member")}</span>
                  {community.creator && (
                    <span className="ml-2">• Created by {community.creator.name}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Button
                variant={isMember ? "outline" : "default"}
                className={!isMember ? "bg-blue-600 hover:bg-blue-700" : ""}
                disabled={!user || toggleMembership.isPending}
                onClick={() => {
                  if (!user) return;
                  toggleMembership.mutate(
                    { communityId: community.id, userId: user.id, isMember, memberId: myMember?.id },
                    { onSuccess: () => loadCommunity() }
                  );
                }}
              >
                {toggleMembership.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isMember ? "Leave Community" : "Join Community"}
              </Button>

              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info("Coming soon")}>Edit Community</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Coming soon")}>Manage Members</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {community.description && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{community.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="feed">
        <TabsList className="w-full h-11 bg-card border border-border rounded-xl flex overflow-x-auto scrollbar-none">
          <TabsTrigger value="feed" className="flex-1 whitespace-nowrap"><Globe className="h-4 w-4 mr-2" /> Posts</TabsTrigger>
          <TabsTrigger value="about" className="flex-1 whitespace-nowrap"><Info className="h-4 w-4 mr-2" /> About</TabsTrigger>
          <TabsTrigger value="members" className="flex-1 whitespace-nowrap">
            <Users className="h-4 w-4 mr-2" /> Members <Badge variant="secondary" className="ml-2 text-[10px]">{memberCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1 whitespace-nowrap"><Calendar className="h-4 w-4 mr-2" /> Events</TabsTrigger>
        </TabsList>

        {/* Feed Tab */}
        <TabsContent value="feed" className="mt-4 space-y-4">
          {isMember && user && me && (
            <CreatePostCard
              userId={user.id}
              userName={me.name}
              avatarUrl={me.avatar_url}
              communityId={community.id}
              onPostCreated={() => loadPosts()}
            />
          )}
          {!isMember && (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Join this community to create posts and participate in discussions.
              </CardContent>
            </Card>
          )}
          {postsLoading ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                No posts yet. {isMember ? "Be the first to share something!" : "Join to see and create posts."}
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id ?? ""}
                currentUserName={me?.name ?? ""}
                currentAvatarUrl={me?.avatar_url ?? null}
                isCommunityAdmin={isAdmin}
              />
            ))
          )}
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About this community</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Description</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{community.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <h3 className="font-medium text-xs text-muted-foreground mb-1">Category</h3>
                  <Badge variant="secondary">{community.category}</Badge>
                </div>
                <div>
                  <h3 className="font-medium text-xs text-muted-foreground mb-1">Created</h3>
                  <p className="text-sm">{new Date(community.created_at).toLocaleDateString()}</p>
                </div>
                {community.creator && (
                  <div className="col-span-2 pt-2">
                    <h3 className="font-medium text-xs text-muted-foreground mb-2">Community Creator</h3>
                    <Link to={`/profile/${community.creator_id}`} className="flex items-center gap-3">
                      <UserAvatar name={community.creator.name} url={community.creator.avatar_url} className="h-8 w-8" />
                      <span className="text-sm font-medium hover:underline">{community.creator.name}</span>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {members
              .filter(m => m.profile?.name?.toLowerCase().includes(memberSearch.toLowerCase()))
              .map((m) => (
              <Link
                key={m.id}
                to={`/profile/${m.user_id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all relative overflow-hidden group"
              >
                <UserAvatar
                  name={m.profile?.name ?? "Member"}
                  url={m.profile?.avatar_url ?? null}
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm truncate">{m.profile?.name ?? "Member"}</span>
                  </div>
                  {m.profile?.field && (
                    <span className="text-xs text-muted-foreground truncate block">{m.profile.field}</span>
                  )}
                </div>
                {m.role === "creator" || m.user_id === community.creator_id ? (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[9px] bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-200 border-none gap-1 px-1.5 py-0">
                    <Crown className="h-2.5 w-2.5" /> Owner
                  </Badge>
                ) : m.role === "admin" ? (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[9px] bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 border-none gap-1 px-1.5 py-0">
                    <ShieldCheck className="h-2.5 w-2.5" /> Admin
                  </Badge>
                ) : null}
              </Link>
            ))}
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-4">
          <Card className="border-dashed">
            <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Community Events</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Events for this community will appear here. Admins can schedule events for members to attend.
              </p>
              {isAdmin && (
                <Button className="mt-2" onClick={() => navigate("/events?create=true&community=" + community.id)}>
                  Schedule Event
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </AppLayout>
  );
}
