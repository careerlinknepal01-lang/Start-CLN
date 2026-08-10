import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, ArrowRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import type { Profile } from "../useFeedLogic";

interface ConnectButtonProps {
  userId: string;
  profileId: string;
  onSuccess: () => void;
}

const ConnectButton = ({ userId, profileId, onSuccess }: ConnectButtonProps) => {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const handleConnect = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("connections")
      .insert({ requester_id: userId, addressee_id: profileId });
    setBusy(false);
    
    if (error) { 
      toast.error(error.message); 
      return; 
    }
    
    setDone(true);
    onSuccess();
  };

  if (done) {
    return (
      <button disabled className="w-full h-9 rounded-xl border border-border text-muted-foreground/70 text-[12px] font-semibold">
        Pending
      </button>
    );
  }

  return (
    <button
      disabled={busy}
      onClick={handleConnect}
      className="w-full h-9 rounded-xl border border-border text-foreground/90 hover:bg-secondary text-[12px] font-semibold flex items-center justify-center transition-colors"
    >
      <UserPlus className="mr-1.5 h-3.5 w-3.5" />
      Connect
    </button>
  );
};

interface SuggestedConnectionsProps {
  suggestions: Profile[];
  currentUserId?: string;
  onRemove: (id: string) => void;
}

export function SuggestedConnections({ suggestions, currentUserId, onRemove }: SuggestedConnectionsProps) {
  if (!suggestions || suggestions.length === 0 || !currentUserId) {
    return null;
  }

  return (
    <div className="bg-card text-card-foreground border border-border rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-foreground font-bold">
          <Users className="h-5 w-5 text-orange-500" />
          Suggested Connections
        </div>
        <Link to="/explore" className="text-[13px] font-semibold text-blue-600 hover:underline flex items-center">
          See all
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
        {suggestions.map((s) => (
          <div key={s.id} className="flex flex-col items-center min-w-[160px] snap-start border border-border/50 bg-card text-card-foreground p-5 text-center rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <Link to={`/profile/${s.id}`} aria-label={`View ${s.name}'s profile`}>
              <UserAvatar name={s.name} url={s.avatar_url} className="h-14 w-14 mx-auto mb-3 text-lg" />
            </Link>
            <div className="w-full mb-4">
              <Link
                to={`/profile/${s.id}`}
                className="font-bold text-[14px] leading-tight text-foreground hover:underline truncate block"
              >
                {s.name}
              </Link>
              <p className="text-[11px] text-muted-foreground truncate w-full mt-1">
                {s.field}
                {s.college && <span className="block mt-0.5">• {s.college}</span>}
              </p>
            </div>
            <div className="mt-auto w-full">
              <ConnectButton
                userId={currentUserId}
                profileId={s.id}
                onSuccess={() => onRemove(s.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
