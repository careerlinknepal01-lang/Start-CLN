import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type StudyPartner = Database['public']['Tables']['study_partners']['Row'];

export const createOrUpdateStudyPartner = async (
  userId: string,
  data: { subjects?: string[]; availability?: string[]; status?: string; bio?: string }
) => {
  const { data: existing } = await supabase
    .from('study_partners')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { data: updated, error } = await supabase
      .from('study_partners')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  } else {
    const { data: inserted, error } = await supabase
      .from('study_partners')
      .insert({
        user_id: userId,
        subjects: data.subjects || [],
        availability: data.availability || [],
        status: data.status || 'active',
        bio: data.bio || null,
      })
      .select()
      .single();

    if (error) throw error;
    return inserted;
  }
};

export const getStudyPartnerProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('study_partners')
    .select(`
      *,
      profiles (name, avatar_url, field, college)
    `)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const searchStudyPartners = async (query: string) => {
  const { data, error } = await supabase
    .from('study_partners')
    .select(`
      *,
      profiles!inner (name, avatar_url, field, college)
    `)
    .eq('status', 'active')
    // A simplified ILIKE search, but with GIN indexes you might use raw SQL or textSearch
    .or(`subjects.cs.{${query}},bio.ilike.%${query}%`);

  if (error) throw error;
  return data;
};
