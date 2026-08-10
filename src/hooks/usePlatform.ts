import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

// ─── Events ───────────────────────────────────────────────────

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Omit<TablesInsert<"events">, "creator_id"> & { creator_id: string }
    ) => {
      const { data, error } = await supabase.from("events").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useToggleEventRsvp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
      status = "going",
      attendeeId,
    }: {
      eventId: string;
      userId: string;
      status?: "going" | "interested" | "none";
      attendeeId?: string;
    }) => {
      if (status === "none" && attendeeId) {
        const { error } = await supabase.from("event_attendees").delete().eq("id", attendeeId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("event_attendees").upsert(
        { event_id: eventId, user_id: userId, status },
        { onConflict: "event_id,user_id" }
      );
      if (error) throw error; 
    },
    onMutate: async ({ eventId, userId, status }) => {
      await qc.cancelQueries({ queryKey: ["events"] });
      const prev = qc.getQueryData<unknown[]>(["events"]);
      qc.setQueryData(["events"], (old: typeof prev) => {
        if (!Array.isArray(old)) return old;
        return old.map((ev: Record<string, unknown>) => {
          if (ev.id !== eventId) return ev;
          const attendees = (ev.event_attendees as Array<Record<string, unknown>>) ?? [];
          if (status === "none") {
            return {
              ...ev,
              event_attendees: attendees.filter((a) => a.user_id !== userId),
            };
          }
          const filtered = attendees.filter((a) => a.user_id !== userId);
          return {
            ...ev,
            event_attendees: [...filtered, { id: "opt", user_id: userId, status }],
          };
        });
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["events"], ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["recommended_events"] });
    }
  });
};

export const useUpcomingEvents = (limit: number = 3) => {
  return useQuery({
    queryKey: ["upcoming_events", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_upcoming_events", {
        p_limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useRecommendedEvents = (userId: string | undefined, limit: number = 3) => {
  return useQuery({
    queryKey: ["recommended_events", userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.rpc("get_recommended_events", {
        p_user_id: userId,
        p_limit: limit,
      });
      if (error) {
        console.warn("Failed to get recommended events, falling back to upcoming events:", error);
        const { data: fallbackData, error: fallbackError } = await supabase.rpc("get_upcoming_events", {
          p_limit: limit,
        });
        if (fallbackError) {
          console.warn("Failed to get upcoming events RPC, falling back to standard select:", fallbackError);
          const { data: standardData, error: standardError } = await supabase
            .from("events")
            .select("*")
            .gte("date", new Date().toISOString())
            .order("date", { ascending: true })
            .limit(limit);
            
          if (standardError) {
            console.error("Ultimate fallback query failed:", standardError);
            return []; // Return empty instead of throwing to prevent breaking the UI
          }
          return standardData ?? [];
        }
        return fallbackData ?? [];
      }
      return data ?? [];
    },
    enabled: !!userId,
  });
};

// ─── Communities ────────────────────────────────────────────────

export const useCreateCommunity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"communities">) => {
      const { data, error } = await supabase.from("communities").insert(payload).select().single();
      if (error) throw error;
      const { error: memberError } = await supabase.from("community_members").insert({
        community_id: data.id,
        user_id: payload.creator_id,
        role: "admin",
      });
      if (memberError) throw memberError;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Community created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useToggleCommunityMembership = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      communityId,
      userId,
      isMember,
      memberId,
    }: {
      communityId: string;
      userId: string;
      isMember: boolean;
      memberId?: string;
    }) => {
      if (isMember && memberId) {
        const { error } = await supabase.from("community_members").delete().eq("id", memberId);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("community_members").insert({
        community_id: communityId,
        user_id: userId,
        role: "member",
      });
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["communities"] }),
    onError: (e: Error) => toast.error(e.message),
    onSuccess: (_d, vars) => {
      toast.success(vars.isMember ? "Left community" : "Joined community");
    },
  });
};



// ─── Feed bookmarks ─────────────────────────────────────────────

export const useBookmarkedPosts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["feed_bookmarks", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("feed_post_bookmarks")
        .select(
          `
          created_at,
          feed_posts (
            id,
            content,
            type,
            created_at,
            author:profiles (name, avatar_url)
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
};
