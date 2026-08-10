import { supabase } from '@/integrations/supabase/client';

export const savePost = async (userId: string, postId: string) => {
  const { data, error } = await supabase
    .from('saved_posts')
    .insert({ user_id: userId, post_id: postId })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique violation
      return null; // Already saved
    }
    throw error;
  }
  return data;
};

export const unsavePost = async (userId: string, postId: string) => {
  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) throw error;
};

export const getSavedPosts = async (userId: string) => {
  const { data, error } = await supabase
    .from('saved_posts')
    .select(`
      id,
      post_id,
      created_at,
      feed_posts (
        *,
        profiles!feed_posts_author_id_fkey (name, avatar_url, field)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const checkIfSaved = async (userId: string, postId: string) => {
  const { count, error } = await supabase
    .from('saved_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) throw error;
  return count ? count > 0 : false;
};
