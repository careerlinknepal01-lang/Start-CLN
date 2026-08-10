import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFeedPosts } from "@/hooks/useFeed";
import type { FeedPost } from "@/hooks/useFeed";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyConnections, type ConnRow } from "@/lib/connections";

export interface Profile {
  id: string;
  name: string;
  college: string;
  field: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_verified?: boolean | null;
  level?: number | null;
}

export function useFeedLogic() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filter, setFilter] = useState<"recent" | "trending">("recent");
  const [categoryFilter, setCategoryFilter] = useState<FeedPost["type"] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [me, setMe] = useState<Profile | null>(null);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [conns, setConns] = useState<ConnRow[]>([]);
  const [acceptedCount, setAcceptedCount] = useState(0);
  
  const [createOpen, setCreateOpen] = useState(false);
  const [highlightPostId, setHighlightPostId] = useState<string | null>(null);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useFeedPosts(filter, user?.id);

  const allPosts = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);
  
  const displayedPosts = useMemo(() => {
    let filtered = categoryFilter ? allPosts.filter((p) => p.type === categoryFilter) : allPosts;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.content.toLowerCase().includes(q) || 
        p.author_name.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [allPosts, categoryFilter, searchQuery]);

  const postParam = searchParams.get("post");
  
  useEffect(() => {
    if (!postParam || allPosts.length === 0) return;
    const exists = allPosts.some((p) => p.id === postParam);
    if (!exists) return;
    setHighlightPostId(postParam);
    const el = postRefs.current[postParam];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const t = window.setTimeout(() => setHighlightPostId(null), 4000);
    return () => window.clearTimeout(t);
  }, [postParam, allPosts]);

  // Load profile & suggestions
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: profile }, connRows, { data: allProfiles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        fetchMyConnections(user.id),
        supabase.from("profiles").select("*").neq("id", user.id).limit(50),
      ]);
      
      setMe(profile as Profile | null);
      setConns(connRows);
      const accepted = connRows.filter((c) => c.status === "accepted").length;
      setAcceptedCount(accepted);

      // Suggestions: same field or college, not already connected
      const involvedIds = new Set(
        connRows.map((c) => (c.requester_id === user.id ? c.addressee_id : c.requester_id))
      );
      const list = (allProfiles as Profile[] | null) ?? [];
      const ranked = list
        .filter((p) => !involvedIds.has(p.id))
        .sort((a, b) => {
          const score = (p: Profile) =>
            ((profile as Profile)?.field && p.field === (profile as Profile).field ? 2 : 0) +
            ((profile as Profile)?.college && p.college === (profile as Profile).college ? 1 : 0);
          return score(b) - score(a);
        })
        .slice(0, 5);
      setSuggestions(ranked);
    };
    load();
  }, [user]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Actions
  const handleRemoveSuggestion = useCallback((id: string) => {
    setSuggestions(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    user,
    me,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    suggestions,
    handleRemoveSuggestion,
    conns,
    acceptedCount,
    createOpen,
    setCreateOpen,
    highlightPostId,
    loaderRef,
    postRefs,
    allPosts,
    displayedPosts,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    error
  };
}
