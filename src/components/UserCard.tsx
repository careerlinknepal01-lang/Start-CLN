import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "./UserAvatar";
import { Link } from "react-router-dom";
import { Check, MessageSquare, UserPlus, Clock, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { respondToConnectionRequest } from "@/lib/connections";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

export type ConnState = "none" | "pending_out" | "pending_in" | "accepted" | "rejected";

export interface UserCardProfile {
  id: string;
  name: string;
  college: string;
  field: string;
  avatar_url?: string | null;
  bio?: string | null;
}

interface Props {
  profile: UserCardProfile;
  state: ConnState;
  connectionId?: string;
  onChange?: () => void;
}

export const UserCard = ({ profile, state, connectionId, onChange }: Props) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const sendRequest = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("connections")
      .insert({ requester_id: user.id, addressee_id: profile.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Request sent to ${profile.name}`);
    onChange?.();
  };

  const respond = async (status: "accepted" | "rejected") => {
    if (!connectionId || !user || busy) return;

    setBusy(true);
    try {
      await respondToConnectionRequest(connectionId, user.id, status);
      toast.success(status === "accepted" ? "Connection accepted" : "Request declined");
      onChange?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update connection request";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-soft hover:border-primary/30 group">
      <CardContent className="p-4 flex items-start gap-4">
        <Link to={`/profile/${profile.id}`} className="shrink-0">
          <UserAvatar name={profile.name} url={profile.avatar_url} className="h-14 w-14 border-2 border-transparent group-hover:border-primary/20 transition-all" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${profile.id}`}>
            <div className="font-semibold truncate text-base group-hover:text-primary transition-colors">
              {profile.name || "Unnamed Student"}
            </div>
          </Link>
          <div className="text-sm text-muted-foreground truncate font-medium">
            {profile.field}{profile.field && profile.college && " • "}{profile.college}
          </div>
          {profile.bio && (
            <p className="text-sm text-muted-foreground/80 mt-1.5 line-clamp-2 leading-snug">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {state === "none" && (
              <Button size="sm" onClick={sendRequest} disabled={busy} className="rounded-full shadow-none h-8 text-xs font-semibold">
                {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />} 
                Connect
              </Button>
            )}
            {state === "pending_out" && (
              <Button size="sm" variant="secondary" disabled className="rounded-full h-8 text-xs font-semibold bg-muted">
                <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> Pending
              </Button>
            )}
            {state === "pending_in" && (
              <>
                <Button size="sm" onClick={() => respond("accepted")} disabled={busy} className="rounded-full h-8 text-xs font-semibold shadow-none">
                  {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />} 
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => respond("rejected")} disabled={busy} className="rounded-full h-8 text-xs font-semibold shadow-none">
                  <X className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> Decline
                </Button>
              </>
            )}
            {state === "accepted" && (
              <Button size="sm" asChild variant="secondary" className="rounded-full h-8 text-xs font-semibold">
                <Link to={`/messages?u=${profile.id}`}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Message
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
