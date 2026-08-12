import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PostCard } from "@/components/feed/PostCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryError } from "@/components/QueryStatus";
import type { FeedPost } from "@/hooks/useFeed";
import type { Tables } from "@/integrations/supabase/types";
import { AppLayout } from "@/components/AppLayout";

type PostDetailRow = Tables<"feed_posts"> & {
  is_pinned?: boolean | null;
  profiles: {
    name: string | null;
    avatar_url: string | null;
    field: string | null;
    college: string | null;
    is_verified: boolean | null;
  } | null;
  feed_post_likes: Array<{ user_id: string }>;
  feed_post_bookmarks: Array<{ user_id: string }>;
};

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoFocusComments = searchParams.get("action") === "comment";
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    
    let isMounted = true;

    const fetchPost = async () => {
      setLoading(true);
      setLoadError(null);
      
      const { data: rawPost, error: rawError } = await supabase
        .from("feed_posts")
        .select(`
          *,
          profiles:author_id(id, name, avatar_url, field, college, is_verified),
          feed_post_likes(user_id),
          feed_post_bookmarks(user_id)
        `)
        .eq("id", id)
        .maybeSingle();

      if (rawError || !rawPost) {
        if (isMounted) {
          setLoading(false);
          setPost(null);
          if (rawError && rawError.code !== "PGRST116") setLoadError(rawError.message);
        }
        return;
      }

      const detailPost = rawPost as PostDetailRow;
      const postLikes = detailPost.feed_post_likes ?? [];
      const userLiked = postLikes.some((like) => like.user_id === user.id);
      const userBookmarked = (detailPost.feed_post_bookmarks ?? []).some(
        (bookmark) => bookmark.user_id === user.id
      );

      // We need comment count
      const { count: commentCount } = await supabase
        .from("feed_post_comments")
        .select("id", { count: "exact" })
        .eq("post_id", id);

      if (isMounted) {
        document.title = `${detailPost.profiles?.name ?? "Student"}'s Post - CareerLink Nepal`;
        setPost({
          ...detailPost,
          author_name: detailPost.profiles?.name || "Unknown",
          author_avatar_url: detailPost.profiles?.avatar_url || null,
          author_field: detailPost.profiles?.field || "",
          author_college: detailPost.profiles?.college || "",
          author_is_verified: detailPost.profiles?.is_verified ?? false,
          is_pinned: detailPost.is_pinned ?? false,
          like_count: postLikes.length,
          user_liked: userLiked,
          user_bookmarked: userBookmarked,
          comment_count: commentCount || 0,
          feed_score: 0,
        } as FeedPost);
        setLoading(false);
      }
    };

    fetchPost();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl pb-24 pt-4 sm:pt-8 animate-fade-in">
          <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          {loading ? (
            <FeedSkeleton />
          ) : loadError ? (
            <QueryError message={loadError} onRetry={() => navigate(0)} />
          ) : post ? (
            <PostCard
              post={post}
              currentUserId={user?.id || ""}
              currentUserName={user?.user_metadata?.name || "Unknown"}
              currentAvatarUrl={user?.user_metadata?.avatar_url}
              autoFocusComments={autoFocusComments}
            />
          ) : (
            <div className="py-12 text-center border rounded-xl border-dashed">
              <h3 className="text-lg font-medium text-foreground mb-2">Post not found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This post may have been deleted or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate("/feed")}>Return to feed</Button>
            </div>
          )}
      </div>
    </AppLayout>
  );
};

export default PostDetail;
