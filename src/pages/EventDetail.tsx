import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToggleEventRsvp } from "@/hooks/usePlatform";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MapPin,
  Users,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";

interface EventAttendee {
  id: string;
  user_id: string;
  status: string;
  profile?: { name: string; avatar_url: string | null };
}

interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  location: string | null;
  creator_id: string;
  image_url: string | null;
  creator?: { name: string; avatar_url: string | null } | null;
  community?: { id: string; name: string } | null;
  event_attendees?: EventAttendee[];
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const rsvp = useToggleEventRsvp();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const loadEvent = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          creator:profiles!events_creator_id_fkey(name, avatar_url),
          community:communities(id, name),
          event_attendees(id, user_id, status)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setEvent(data as Event);
      setImageFailed(false);

      // Removed formal apply check
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  // Removed handleApply function

  if (loading) {
    return (
      <AppLayout>
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      </AppLayout>
    );
  }

  if (!event) {
    return (
      <AppLayout>
      <div className="text-center py-20 text-muted-foreground">Event not found.</div>
      </AppLayout>
    );
  }

  const eventDate = new Date(event.date);
  const month = eventDate.toLocaleString("default", { month: "long" });
  const day = eventDate.getDate();
  const year = eventDate.getFullYear();
  const time = eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const going = event.event_attendees?.filter((a) => a.status === "going") ?? [];
  const myRsvp = user ? event.event_attendees?.find((a) => a.user_id === user.id) : undefined;
  const isGoing = myRsvp?.status === "going";
  const isInterested = myRsvp?.status === "interested";
  const isPast = eventDate < new Date();

  return (
    <AppLayout>
    <div className="mx-auto max-w-3xl space-y-4 pb-8">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/events")} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Events
        </Button>

        {/* Event Image Banner */}
        {event.image_url && !imageFailed ? (
          <div className="w-full h-56 rounded-2xl overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className="w-full h-40 rounded-[6px] bg-gradient-to-br from-primary/15 via-warning/10 to-primary/5 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-primary/40" />
          </div>
        )}

        {/* Main Card */}
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Type + Community */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="uppercase text-xs font-bold">{event.type}</Badge>
              {event.community && (
                <Link to={`/communities/${event.community.id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                  {event.community.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {isPast && <Badge variant="outline" className="text-muted-foreground">Past event</Badge>}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>

            {/* Date / Time / Location */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 rounded-[6px] bg-muted/50">
                <div className="flex flex-col items-center justify-center h-10 w-10 rounded-[4px] bg-primary/10 text-primary shrink-0">
                  <span className="text-[9px] font-bold uppercase">{eventDate.toLocaleString("default", { month: "short" })}</span>
                  <span className="text-base font-black leading-none">{day}</span>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div className="text-sm font-medium">{month} {day}, {year}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-[6px] bg-muted/50">
                <Clock className="h-10 w-10 text-primary p-2 rounded-[4px] bg-primary/10 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Time</div>
                  <div className="text-sm font-medium">{time}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-[6px] bg-muted/50">
                <MapPin className="h-10 w-10 text-success p-2 rounded-[4px] bg-success/10 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="text-sm font-medium">{event.location || "TBA"}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About this event</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Organizer */}
            {event.creator && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
                <Link to={`/profile/${event.creator_id}`}>
                  <UserAvatar name={event.creator.name} url={event.creator.avatar_url} className="h-10 w-10" />
                </Link>
                <div>
                  <div className="text-xs text-muted-foreground">Organized by</div>
                  <Link to={`/profile/${event.creator_id}`} className="text-sm font-semibold hover:underline">
                    {event.creator.name}
                  </Link>
                </div>
              </div>
            )}

            {/* Attendees count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span><strong className="text-foreground">{going.length}</strong> people attending</span>
            </div>

            {/* Action buttons */}
            {!isPast && user && (
              <div className="flex gap-3 pt-2 border-t border-border">
                {/* RSVP - Going */}
                <Button
                  variant={isGoing ? "outline" : "default"}
                  className="flex-1"
                  disabled={rsvp.isPending}
                  onClick={() => {
                    if (!user) return;
                    rsvp.mutate(
                      { 
                        eventId: event.id, 
                        userId: user.id, 
                        status: isGoing ? "none" : "going", 
                        attendeeId: myRsvp?.id 
                      },
                      { onSuccess: () => loadEvent() }
                    );
                  }}
                >
                  {rsvp.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : isGoing ? (
                    <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  {isGoing ? "You're Going ✓" : "RSVP — Going"}
                </Button>

                {/* RSVP - Interested */}
                <Button
                  variant={isInterested ? "outline" : "secondary"}
                  className="flex-1"
                  disabled={rsvp.isPending}
                  onClick={() => {
                    if (!user) return;
                    rsvp.mutate(
                      { 
                        eventId: event.id, 
                        userId: user.id, 
                        status: isInterested ? "none" : "interested", 
                        attendeeId: myRsvp?.id 
                      },
                      { onSuccess: () => loadEvent() }
                    );
                  }}
                >
                  {isInterested ? (
                    <CheckCircle2 className="h-4 w-4 mr-2 text-warning" />
                  ) : null}
                  {isInterested ? "Interested ✓" : "Interested"}
                </Button>
              </div>
            )}

            {isPast && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                <Calendar className="h-4 w-4" />
                This event has already taken place.
              </div>
            )}
          </CardContent>
        </Card>
    </div>
    </AppLayout>
  );
}
