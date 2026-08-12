import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  type: 'person' | 'post' | 'community' | 'event';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  url: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface SearchProvider {
  name: string;
  search: (query: string, limit?: number) => Promise<SearchResult[]>;
}

/** Escape user input for PostgREST `.or()` ilike filters. */
export function escapeIlike(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export const profileSearchOr = (term: string) => {
  if (!term) return "";
  const t = escapeIlike(term);
  return `name.ilike.%${t}%,bio.ilike.%${t}%,college.ilike.%${t}%,field.ilike.%${t}%`;
};

export const PeopleSearchProvider: SearchProvider = {
  name: 'People',
  search: async (query: string, limit = 10) => {
    const t = escapeIlike(query.trim());
    if (!t) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, field, avatar_url, created_at')
      .or(`name.ilike.%${t}%,bio.ilike.%${t}%,skills.cs.{${query}}`)
      .limit(limit);

    if (error) {
      console.error('People search error:', error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      type: 'person',
      title: item.name,
      subtitle: item.field,
      imageUrl: item.avatar_url || undefined,
      url: `/profile/${item.id}`,
      createdAt: item.created_at,
    }));
  },
};

export const PostsSearchProvider: SearchProvider = {
  name: 'Posts',
  search: async (query: string, limit = 10) => {
    const t = escapeIlike(query.trim());
    if (!t) return [];
    
    const { data, error } = await supabase
      .from('feed_posts')
      .select('id, content, type, created_at, profiles!inner(name, avatar_url)')
      .ilike('content', `%${t}%`)
      .limit(limit);

    if (error) {
      console.error('Posts search error:', error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      type: 'post',
      title: `${item.profiles.name}'s Post`,
      subtitle: item.content.substring(0, 100), // Preview
      imageUrl: item.profiles.avatar_url || undefined,
      url: `/posts/${item.id}`,
      createdAt: item.created_at,
      metadata: { postType: item.type },
    }));
  },
};

export const CommunitiesSearchProvider: SearchProvider = {
  name: 'Communities',
  search: async (query: string, limit = 10) => {
    const t = escapeIlike(query.trim());
    if (!t) return [];
    
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, description, avatar_url, created_at')
      .or(`name.ilike.%${t}%,description.ilike.%${t}%`)
      .limit(limit);

    if (error) {
      console.error('Communities search error:', error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      type: 'community',
      title: item.name,
      subtitle: item.description,
      imageUrl: item.avatar_url || undefined,
      url: `/communities/${item.id}`,
      createdAt: item.created_at,
    }));
  },
};

export const EventsSearchProvider: SearchProvider = {
  name: 'Events',
  search: async (query: string, limit = 10) => {
    const t = escapeIlike(query.trim());
    if (!t) return [];
    
    const { data, error } = await supabase
      .from('events')
      .select('id, title, type, date, created_at')
      .or(`title.ilike.%${t}%,description.ilike.%${t}%`)
      .limit(limit);

    if (error) {
      console.error('Events search error:', error);
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      type: 'event',
      title: item.title,
      subtitle: new Date(item.date).toLocaleDateString(),
      url: `/events/${item.id}`,
      createdAt: item.created_at,
      metadata: { eventType: item.type },
    }));
  },
};



export const AdvancedSearch = async (query: string, limitPerProvider = 5): Promise<SearchResult[]> => {
  const providers = [
    PeopleSearchProvider,
    PostsSearchProvider,
    CommunitiesSearchProvider,
    EventsSearchProvider
  ];

  const results = await Promise.all(providers.map(p => p.search(query, limitPerProvider)));
  return results.flat();
};
