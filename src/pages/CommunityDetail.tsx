import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToggleCommunityMembership } from "@/hooks/usePlatform";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

            <div className="shrink-0">
              {community.creator_id === user?.id ? (
                <Button variant="outline" disabled>You are the admin</Button>
              ) : (
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
        <TabsList className="w-full h-11 bg-card border border-border rounded-xl">
          <TabsTrigger value="feed" className="flex-1">Community Feed</TabsTrigger>
          <TabsTrigger value="members" className="flex-1">
            Members <Badge variant="secondary" className="ml-2 text-[10px]">{memberCount}</Badge>
          </TabsTrigger>
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
              />
            ))
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {members.map((m) => (
              <Link
                key={m.id}
                to={`/profile/${m.user_id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
              >
                <UserAvatar
                  name={m.profile?.name ?? "Member"}
                  url={m.profile?.avatar_url ?? null}
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm truncate">{m.profile?.name ?? "Member"}</span>
                    {(m.role === "admin" || m.user_id === community.creator_id) && (
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    )}
                  </div>
                  {m.profile?.field && (
                    <span className="text-xs text-muted-foreground truncate block">{m.profile.field}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </AppLayout>
  );
}
