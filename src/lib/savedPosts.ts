import { supabase } from '@/integrations/supabase/client';
import type { FeedPost } from '@/hooks/useFeed';

/**
 * getSavedPosts
 *
 * Two-step approach to avoid PostgREST's inability to chain
 * 3-level deep joins (feed_post_bookmarks → feed_posts → profiles):
 *
 *  1. Fetch bookmark rows for this user from feed_post_bookmarks
 *  2. Fetch the actual feed_posts (with profiles join) using `.in('id', postIds)`
 *
 * The profiles join uses `profiles:author_id(...)` — the same syntax that
 * already works in PostDetail.tsx and AdminPosts.tsx.
 */
export const getSavedPosts = async (
  userId: string
): Promise<Array<{ bookmark_id: string; bookmark_created_at: string; post: FeedPost }>> => {
  // ── Step 1: get bookmark rows ───────────────────────────────────────────────
  const { data: bookmarks, error: bookmarkError } = await supabase
    .from('feed_post_bookmarks')
    .select('id, post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (bookmarkError) throw bookmarkError;
  if (!bookmarks || bookmarks.length === 0) return [];

  const postIds = bookmarks.map((b) => b.post_id);

  // ── Step 2: fetch posts + profiles (2-level join — PostgREST handles this) ──
  const { data: posts, error: postsError } = await supabase
    .from('feed_posts')
    .select(
      'id, author_id, type, content, media_url, community_id, edited, edited_at, created_at, updated_at, profiles:author_id(name, avatar_url, field, college, is_verified)'
    )
    .in('id', postIds);

  if (postsError) throw postsError;

  // ── Step 3: get like/comment counts for these posts ─────────────────────────
  const { data: likeCounts } = await supabase
    .from('feed_post_likes')
    .select('post_id')
    .in('post_id', postIds);

  const { data: commentCounts } = await supabase
    .from('feed_post_comments')
    .select('post_id')
    .in('post_id', postIds);

  // ── Step 4: check which posts the user has also liked ───────────────────────
  const { data: userLikes } = await supabase
    .from('feed_post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .in('post_id', postIds);

  const userLikedSet = new Set((userLikes ?? []).map((l) => l.post_id));

  const likeMap = new Map<string, number>();
  for (const l of likeCounts ?? []) {
    likeMap.set(l.post_id, (likeMap.get(l.post_id) ?? 0) + 1);
  }
  const commentMap = new Map<string, number>();
  for (const c of commentCounts ?? []) {
    commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1);
  }

  // ── Step 5: merge and preserve bookmark order ────────────────────────────────
  const postMap = new Map(
    (posts ?? []).map((p) => {
      const pr = p.profiles as {
        name: string | null;
        avatar_url: string | null;
        field: string | null;
        college: string | null;
        is_verified: boolean | null;
      } | null;

      const feedPost: FeedPost = {
        id: p.id,
        author_id: p.author_id,
        type: (p.type ?? 'general') as FeedPost['type'],
        content: p.content,
        media_url: p.media_url ?? null,
        community_id: p.community_id ?? null,
        edited: p.edited ?? false,
        edited_at: p.edited_at ?? null,
        created_at: p.created_at,
        updated_at: p.updated_at,
        is_pinned: false,
        tags: null,
        author_name: pr?.name || 'Unknown',
        author_avatar_url: pr?.avatar_url ?? null,
        author_field: pr?.field || '',
        author_college: pr?.college || '',
        author_is_verified: pr?.is_verified ?? false,
        like_count: likeMap.get(p.id) ?? 0,
        comment_count: commentMap.get(p.id) ?? 0,
        user_liked: userLikedSet.has(p.id),
        user_bookmarked: true,
        feed_score: 0,
      };
      return [p.id, feedPost];
    })
  );

  return bookmarks
    .filter((b) => postMap.has(b.post_id))
    .map((b) => ({
      bookmark_id: b.id,
      bookmark_created_at: b.created_at,
      post: postMap.get(b.post_id)!,
    }));
};

export const checkIfSaved = async (userId: string, postId: string) => {
  const { count, error } = await supabase
    .from('feed_post_bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) throw error;
  return count ? count > 0 : false;
};
