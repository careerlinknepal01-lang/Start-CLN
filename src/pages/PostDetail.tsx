import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PostCard } from "@/components/feed/PostCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedPost } from "@/hooks/useFeed";
import { AppLayout } from "@/components/AppLayout";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    
    let isMounted = true;

    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_feed_posts", {
        p_user_id: user.id,
        p_filter: "recent",
        p_limit: 1,
        p_offset: 0,
      });

      // get_feed_posts doesn't easily support querying by post_id via RPC directly without a wrapper
      // Let's do a direct query for the single post for now
      // Actually we'd need to compute user_liked etc.
      // Easiest is to use get_feed_posts but it doesn't filter by id.
      // So we'll fetch from db and manually structure. Or get all recent and find it.
      // For simplicity, we just fetch from feed and find it, or write a custom query.
      
      const { data: rawPost, error: rawError } = await supabase
        .from("posts")
        .select(`
          *,
          profiles:author_id(id, name, avatar_url, field, college),
          likes(user_id)
        `)
        .eq("id", id)
        .single();

      if (rawError || !rawPost) {
        if (isMounted) {
          setLoading(false);
          setPost(null);
        }
        return;
      }

      const postLikes = rawPost.likes || [];
      const userLiked = postLikes.some((like: any) => like.user_id === user.id);

      // We need comment count
      const { count: commentCount } = await supabase
        .from("comments")
        .select("id", { count: "exact" })
        .eq("post_id", id);

      if (isMounted) {
        document.title = `${(rawPost.profiles as any)?.name}'s Post - CareerLink Nepal`;
        setPost({
          ...rawPost,
          author_name: (rawPost.profiles as any)?.name || "Unknown",
          author_avatar_url: (rawPost.profiles as any)?.avatar_url || null,
          user_liked: userLiked,
          comment_count: commentCount || 0,
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
          ) : post ? (
            <PostCard
              post={post}
              currentUserId={user?.id || ""}
              currentUserName={user?.user_metadata?.name || "Unknown"}
              currentAvatarUrl={user?.user_metadata?.avatar_url}
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
