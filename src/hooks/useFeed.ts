import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FeedPost as BaseFeedPost, FeedComment } from "@/integrations/supabase/types";
import { toast } from "sonner";

/**
 * Extended FeedPost interface to include joined fields (author details, stats, user interaction flags).
 * These fields are populated by the `get_feed_posts` RPC function on the database.
 */
export interface FeedPost extends Omit<BaseFeedPost, 'type'> {
  type: 'achievement' | 'project_update' | 'opportunity' | 'general' | 'question';
  author_name: string;
  author_avatar_url: string | null;
  author_field: string;
  author_college: string;
  author_is_verified: boolean;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
  user_bookmarked: boolean;
  tags?: string[] | null;
  is_pinned?: boolean;
}

export type { FeedComment };

const PAGE_SIZE = 10;

/**
 * Custom hook to fetch a paginated list of feed posts using React Query's Infinite Queries.
 * 
 * @param {"recent" | "trending"} filterType - The sorting strategy to use.
 * @param {string | undefined} currentUserId - The ID of the authenticated user to check for liked/bookmarked status.
 * @returns {object} The infinite query result containing pages of posts.
 */
export const useFeedPosts = (filterType: "recent" | "trending", currentUserId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ["feed_posts", filterType, currentUserId],
    queryFn: async ({ pageParam = 0 }) => {
      // Prevent fetching if no user is authenticated, as the RPC requires a user ID to calculate `user_liked` flags
      if (!currentUserId) return [];
      
      const { data, error } = await supabase.rpc("get_feed_posts", {
        p_user_id: currentUserId,
        p_filter: filterType,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
      });
      
      if (error) throw error;
      return (data ?? []) as FeedPost[];
    },
    initialPageParam: 0,
    // Calculate the next offset based on whether the current page returned a full batch of items
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: !!currentUserId,
  });
};

/**
 * Hook to fetch the top trending tags/topics from recent feed posts.
 * 
 * @param {number} fetchLimit - The maximum number of topics to retrieve (defaults to 5).
 * @returns {object} The query result containing an array of trending topics and their frequencies.
 */
export const useTrendingTopics = (fetchLimit: number = 5) => {
  return useQuery({
    queryKey: ["trending_topics", fetchLimit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_trending_topics", {
        p_limit: fetchLimit,
      });
      if (error) throw error;
      return (data ?? []) as { tag: string; count: number }[];
    },
  });
};

/**
 * Hook to author a new post on the feed.
 * 
 * @returns {object} A mutation object containing the `mutate` function to trigger creation.
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
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
      // Invalidate the feed query to trigger a refetch and display the new post immediately
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
      toast.success("Post created!");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

/**
 * Hook to update an existing feed post.
 * 
 * @returns {object} A mutation object.
 */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
      toast.success("Post updated!");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

/**
 * Hook to delete a feed post by its ID.
 * 
 * @returns {object} A mutation object.
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
      toast.success("Post deleted.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

/**
 * Hook to pin or unpin a post (typically for community feeds or profile highlights).
 * 
 * @returns {object} A mutation object.
 */
export const usePinPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { data, error } = await supabase
        .from("feed_posts")
        .update({ is_pinned })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
      toast.success("Post pin status updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

/**
 * Hook to toggle a 'like' on a feed post.
 * Utilizes optimistic updates to ensure the UI feels instantly responsive.
 * 
 * @returns {object} A mutation object.
 */
export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, userId, liked }: { postId: string; userId: string; liked: boolean }) => {
      if (liked) {
        const { error } = await supabase
          .from("feed_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("feed_post_likes")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
    },
    onMutate: async ({ postId, liked }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["feed_posts"] });
      
      // Snapshot the previous state to allow rollback on error
      const previousState = queryClient.getQueriesData({ queryKey: ["feed_posts"] });
      
      // Optimistically update the cache to show the like instantly without waiting for network
      queryClient.setQueriesData({ queryKey: ["feed_posts"] }, (oldCache: unknown) => {
        if (!oldCache || typeof oldCache !== "object") return oldCache;
        const cacheData = oldCache as { pages: FeedPost[][] };
        return {
          ...cacheData,
          pages: cacheData.pages.map((page) =>
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
      return { previousState };
    },
    onError: (_error, _mutationVariables, context) => {
      // Roll back to the previous cache snapshot if the mutation fails
      if (context?.previousState) {
        context.previousState.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      }
      toast.error("Failed to update like.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["feed_posts"] }),
  });
};

/**
 * Hook to toggle a bookmark on a feed post.
 * Utilizes optimistic updates to ensure the UI feels instantly responsive.
 * 
 * @returns {object} A mutation object.
 */
export const useBookmarkPost = () => {
  const queryClient = useQueryClient();
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
      await queryClient.cancelQueries({ queryKey: ["feed_posts"] });
      const previousState = queryClient.getQueriesData({ queryKey: ["feed_posts"] });
      
      // Optimistically update the bookmark icon state
      queryClient.setQueriesData({ queryKey: ["feed_posts"] }, (oldCache: unknown) => {
        if (!oldCache || typeof oldCache !== "object") return oldCache;
        const cacheData = oldCache as { pages: FeedPost[][] };
        return {
          ...cacheData,
          pages: cacheData.pages.map((page) =>
            page.map((post) =>
              post.id === postId ? { ...post, user_bookmarked: !bookmarked } : post
            )
          ),
        };
      });
      return { previousState };
    },
    onError: (_error, _mutationVariables, context) => {
      if (context?.previousState) {
        context.previousState.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data));
      }
      toast.error("Failed to update bookmark.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed_bookmarks"] }); // Re-fetch the saved posts page
    },
  });
};

/**
 * Hook to fetch comments attached to a specific post.
 * 
 * @param {string} postId - The post to load comments for.
 * @param {boolean} isEnabled - Controls whether the query should run (useful to prevent fetching on unmounted/hidden components).
 * @returns {object} The query result containing an array of comments.
 */
export const useComments = (postId: string, isEnabled: boolean) => {
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
      
      // Flatten the nested foreign key object (`author`) into top-level fields to match the expected FeedComment interface
      return ((data ?? []) as unknown[]).map((rawComment: unknown) => {
        const comment = rawComment as {
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
    enabled: isEnabled,
  });
};

/**
 * Hook to add a new comment (or nested reply) to a post.
 * 
 * @returns {object} A mutation object.
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();
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
    onSuccess: (_mutationResult, mutationVariables) => {
      queryClient.invalidateQueries({ queryKey: ["feed_comments", mutationVariables.post_id] });
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] }); // Invalidate posts to update comment counts
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

/**
 * Hook to delete an authored comment.
 * 
 * @returns {object} A mutation object.
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, post_id }: { id: string; post_id: string }) => {
      const { error } = await supabase.from("feed_post_comments").delete().eq("id", id);
      if (error) throw error;
      return post_id;
    },
    onSuccess: (post_id) => {
      queryClient.invalidateQueries({ queryKey: ["feed_comments", post_id] });
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

/**
 * Hook to report an inappropriate post to the admins.
 * 
 * @returns {object} A mutation object.
 */
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
    onError: (error: Error) => {
      // Prevent duplicate reports silently handling unique constraint violations
      if (error.message.includes("unique")) {
        toast.info("You've already reported this post.");
      } else {
        toast.error(error.message);
      }
    },
  });
};
