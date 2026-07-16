import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FeedPost, FeedComment } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type { FeedPost, FeedComment };

// ─────────────────────────────────────────────
// Fetch feed posts (paginated, ranked)
// ─────────────────────────────────────────────
const PAGE_SIZE = 10;

export const useFeedPosts = (filter: "recent" | "trending", userId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ["feed_posts", filter, userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc("get_feed_posts", {
        p_user_id: userId,
        p_filter: filter,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });
      if (error) throw error;
      return (data ?? []) as FeedPost[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: !!userId,
  });
};

// ─────────────────────────────────────────────
// Create post
// ─────────────────────────────────────────────
export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      author_id,
      type,
      content,
      media_url,
      community_id,
    }: {
      author_id: string;
      type: FeedPost["type"];
      content: string;
      media_url?: string | null;
      community_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("feed_posts")
        .insert({ author_id, type, content, media_url: media_url || null, community_id: community_id || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed_posts"] });
      toast.success("Post created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─────────────────────────────────────────────
// Update post
// ─────────────────────────────────────────────
export const useUpdatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      content,
      type,
      media_url,
    }: {
      id: string;
      content: string;
      type: FeedPost["type"];
      media_url?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("feed_posts")
        .update({ content, type, media_url: media_url || null, edited: true, edited_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed_posts"] });
      toast.success("Post updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─────────────────────────────────────────────
// Delete post
// ─────────────────────────────────────────────
export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed_posts"] });
      toast.success("Post deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─────────────────────────────────────────────
// Like / Unlike post (optimistic)
// ─────────────────────────────────────────────
export const useLikePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, liked }: { postId: string; userId: string; liked: boolean }) => {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from("feed_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("feed_post_likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, liked }) => {
      await qc.cancelQueries({ queryKey: ["feed_posts"] });
      const previous = qc.getQueriesData({ queryKey: ["feed_posts"] });
      // Optimistically update all matching query caches
      qc.setQueriesData({ queryKey: ["feed_posts"] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const data = old as { pages: FeedPost[][] };
        return {
          ...data,
          pages: data.pages.map((page) =>
            page.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    user_liked: !liked,
                    like_count: liked ? post.like_count - 1 : post.like_count + 1,
                  }
                : post
            )
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        ctx.previous.forEach(([queryKey, data]) => qc.setQueryData(queryKey, data));
      }
      toast.error("Failed to update like.");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["feed_posts"] }),
  });
};

// ─────────────────────────────────────────────
// Bookmark / Unbookmark post (optimistic)
// ─────────────────────────────────────────────
export const useBookmarkPost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      userId,
      bookmarked,
    }: {
      postId: string;
      userId: string;
      bookmarked: boolean;
    }) => {
      if (bookmarked) {
        const { error } = await supabase
          .from("feed_post_bookmarks")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("feed_post_bookmarks")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, bookmarked }) => {
      await qc.cancelQueries({ queryKey: ["feed_posts"] });
      const previous = qc.getQueriesData({ queryKey: ["feed_posts"] });
      qc.setQueriesData({ queryKey: ["feed_posts"] }, (old: unknown) => {
        if (!old || typeof old !== "object") return old;
        const data = old as { pages: FeedPost[][] };
        return {
          ...data,
          pages: data.pages.map((page) =>
            page.map((post) =>
              post.id === postId ? { ...post, user_bookmarked: !bookmarked } : post
            )
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        ctx.previous.forEach(([queryKey, data]) => qc.setQueryData(queryKey, data));
      }
      toast.error("Failed to update bookmark.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["feed_posts"] });
      qc.invalidateQueries({ queryKey: ["feed_bookmarks"] });
    },
  });
};

// ─────────────────────────────────────────────
// Fetch comments for a post
// ─────────────────────────────────────────────
export const useComments = (postId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ["feed_comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_post_comments")
        .select(
          `id, post_id, author_id, parent_id, content, created_at, updated_at,
           author:profiles!feed_post_comments_author_id_fkey(name, avatar_url, field)`
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      // Flatten joined author fields
      return ((data ?? []) as unknown[]).map((c: unknown) => {
        const comment = c as {
          id: string; post_id: string; author_id: string; parent_id: string | null;
          content: string; created_at: string; updated_at: string;
          author: { name: string; avatar_url: string | null; field: string } | null;
        };
        return {
          id: comment.id,
          post_id: comment.post_id,
          author_id: comment.author_id,
          parent_id: comment.parent_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          author_name: comment.author?.name ?? "Unknown",
          author_avatar_url: comment.author?.avatar_url ?? null,
          author_field: comment.author?.field ?? "",
        } satisfies FeedComment;
      });
    },
    enabled,
  });
};

// ─────────────────────────────────────────────
// Create comment
// ─────────────────────────────────────────────
export const useCreateComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      post_id,
      author_id,
      content,
      parent_id,
    }: {
      post_id: string;
      author_id: string;
      content: string;
      parent_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("feed_post_comments")
        .insert({ post_id, author_id, content, parent_id: parent_id ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["feed_comments", vars.post_id] });
      qc.invalidateQueries({ queryKey: ["feed_posts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─────────────────────────────────────────────
// Delete comment
// ─────────────────────────────────────────────
export const useDeleteComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, post_id }: { id: string; post_id: string }) => {
      const { error } = await supabase.from("feed_post_comments").delete().eq("id", id);
      if (error) throw error;
      return post_id;
    },
    onSuccess: (post_id) => {
      qc.invalidateQueries({ queryKey: ["feed_comments", post_id] });
      qc.invalidateQueries({ queryKey: ["feed_posts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

// ─────────────────────────────────────────────
// Report post
// ─────────────────────────────────────────────
export const useReportPost = () => {
  return useMutation({
    mutationFn: async ({
      post_id,
      user_id,
      reason,
    }: {
      post_id: string;
      user_id: string;
      reason: string;
    }) => {
      const { error } = await supabase
        .from("feed_post_reports")
        .insert({ post_id, user_id, reason });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Report submitted. Thank you."),
    onError: (err: Error) => {
      if (err.message.includes("unique")) {
        toast.info("You've already reported this post.");
      } else {
        toast.error(err.message);
      }
    },
  });
};
