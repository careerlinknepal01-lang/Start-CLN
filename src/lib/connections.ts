import { supabase } from "@/integrations/supabase/client";
import type { ConnState } from "@/components/UserCard";

export interface ConnRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
}

export type PendingIncomingRequest = {
  id: string;
  requester_id: string;
  requester: {
    name: string;
    avatar_url: string | null;
    field: string | null;
    college: string | null;
  };
};

export const stateFor = (
  myId: string,
  otherId: string,
  rows: ConnRow[]
): { state: ConnState; connectionId?: string } => {
  const r = rows.find(
    (c) =>
      (c.requester_id === myId && c.addressee_id === otherId) ||
      (c.requester_id === otherId && c.addressee_id === myId)
  );
  if (!r) return { state: "none" };
  if (r.status === "accepted") return { state: "accepted", connectionId: r.id };
  if (r.status === "rejected") return { state: "rejected", connectionId: r.id };
  if (r.requester_id === myId) return { state: "pending_out", connectionId: r.id };
  return { state: "pending_in", connectionId: r.id };
};

export const fetchMyConnections = async (myId: string): Promise<ConnRow[]> => {
  const { data, error } = await supabase
    .from("connections")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`);

  if (error) throw error;
  return (data || []) as ConnRow[];
};

export const fetchPendingIncomingRequests = async (
  userId: string
): Promise<PendingIncomingRequest[]> => {
  const { data: rows, error } = await supabase
    .from("connections")
    .select("id, requester_id")
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows?.length) return [];

  const requesterIds = [...new Set(rows.map((r) => r.requester_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, avatar_url, field, college")
    .in("id", requesterIds);

  if (profileError) throw profileError;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return rows.map((row) => {
    const profile = profileById.get(row.requester_id);
    return {
      id: row.id,
      requester_id: row.requester_id,
      requester: {
        name: profile?.name ?? "Unknown student",
        avatar_url: profile?.avatar_url ?? null,
        field: profile?.field ?? null,
        college: profile?.college ?? null,
      },
    };
  });
};

export const acceptConnectionRequest = async (
  connectionId: string,
  addresseeId: string
): Promise<ConnRow> => {
  const { data, error } = await supabase.rpc("accept_connection_request", {
    p_connection_id: connectionId,
  });

  if (error) {
    const fallback = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId)
      .eq("addressee_id", addresseeId)
      .eq("status", "pending")
      .select("id, requester_id, addressee_id, status")
      .maybeSingle();

    if (fallback.error || !fallback.data) {
      throw error;
    }

    return fallback.data as ConnRow;
  }

  return data as ConnRow;
};

export const rejectConnectionRequest = async (
  connectionId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase.rpc("reject_connection_request", {
    p_connection_id: connectionId,
  });

  if (error) {
    const fallback = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId)
      .eq("status", "pending")
      .or(`addressee_id.eq.${userId},requester_id.eq.${userId}`)
      .select("id")
      .maybeSingle();

    if (fallback.error || !fallback.data) {
      throw error;
    }
  }
};

export const respondToConnectionRequest = async (
  connectionId: string,
  addresseeId: string,
  status: "accepted" | "rejected"
): Promise<ConnRow | null> => {
  if (status === "accepted") {
    return acceptConnectionRequest(connectionId, addresseeId);
  }

  await rejectConnectionRequest(connectionId, addresseeId);
  return null;
};
