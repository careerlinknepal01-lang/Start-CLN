import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCreateEvent, useToggleEventRsvp } from "@/hooks/usePlatform";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";

type EventAttendee = {
  id: string;
  user_id: string;
  status: string | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  location: string | null;
  date: string;
  community_id: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
  community?: {
    name: string;
    avatar_url: string | null;
  } | null;
  event_attendees?: EventAttendee[];
};

const EVENT_FILTERS = ["Upcoming", "Workshops", "Hackathons", "Seminars", "My RSVP"];

export default function Events() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("Upcoming");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "",
    location: "",
    date: "",
    description: "",
  });

  const createEvent = useCreateEvent();
  const toggleRsvp = useToggleEventRsvp();

  const {
    data: events = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          community:communities(name, avatar_url),
          event_attendees(id, user_id, status)
        `
        )
        .order("date", { ascending: true })
        .gte("date", new Date().toISOString());

      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const filtered = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const going = event.event_attendees?.some(
        (attendee) => attendee.user_id === user?.id && attendee.status === "going"
      );
      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        event.description.toLowerCase().includes(term) ||
        event.type.toLowerCase().includes(term);
      const matchesFilter =
        filter === "Upcoming" ||
        (filter === "My RSVP" && going) ||
        event.type.toLowerCase().includes(filter.replace(/s$/, "").toLowerCase());

      return matchesSearch && matchesFilter;
    });
  }, [events, filter, searchQuery, user?.id]);

  const submitEvent = () => {
    if (!user) return;
    if (!form.title.trim() || !form.type.trim() || !form.description.trim() || !form.date) return;

    createEvent.mutate(
      {
        title: form.title.trim(),
        type: form.type.trim(),
        description: form.description.trim(),
        location: form.location.trim() || null,
        date: new Date(form.date).toISOString(),
        creator_id: user.id,
      },
      {
        onSuccess: () => {
          setForm({ title: "", type: "", location: "", date: "", description: "" });
          setCreateOpen(false);
        },
      }
    );
  };

  return (
    <AppLayout>
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight tracking-tight">
            Events
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Discover and register for upcoming college workshops, hackathons, and seminars.
          </p>
        </div>
        <Button style={{ borderRadius: "2px" }} className="shrink-0 h-11" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Host Event
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events and workshops"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-h-11 pl-9 text-sm"
            style={{ borderRadius: "2px" }}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:pb-0">
          {EVENT_FILTERS.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`shrink-0 whitespace-nowrap px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                filter === item
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
              style={{ borderRadius: "2px" }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="border border-destructive/30 bg-destructive/5 p-6 text-center" style={{ borderRadius: "2px" }}>
          <Calendar className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">Could not load events</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Please check your connection."}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} style={{ borderRadius: "2px" }}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-36 animate-pulse bg-muted" style={{ borderRadius: "2px" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border p-12 text-center" style={{ borderRadius: "2px" }}>
          <Calendar className="mb-4 h-10 w-10 text-muted-foreground/30" />
          <h3 className="text-sm font-semibold text-foreground">No upcoming events found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Check back later or host the first event for your community.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filtered.map((event) => {
            const eventDate = new Date(event.date);
            const myRsvp = event.event_attendees?.find(
              (attendee) => attendee.user_id === user?.id
            );
            const isGoing = myRsvp?.status === "going";
            const goingCount =
              event.event_attendees?.filter((attendee) => attendee.status === "going").length ?? 0;

            return (
              <article
                key={event.id}
                className="group flex flex-col gap-4 border border-border bg-card p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:flex-row"
                style={{ borderRadius: "0" }}
              >
                <div className="flex h-18 w-14 shrink-0 flex-col items-center justify-center bg-primary text-primary-foreground" style={{ borderRadius: "2px" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {eventDate.toLocaleString("default", { month: "short" })}
                  </span>
                  <span className="text-xl font-black leading-none">
                    {eventDate.getDate()}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-block text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/60 bg-muted px-2 py-0.5" style={{ borderRadius: "2px" }}>
                      {event.type}
                    </span>
                    {event.community ? (
                      <span className="truncate text-xs font-medium text-muted-foreground">
                        by {event.community.name}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mb-2 line-clamp-1 text-base font-bold group-hover:text-primary">
                    {event.title}
                  </h3>

                  <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>

                  <div className="mb-3 flex flex-col gap-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span>
                        {eventDate.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">{event.location || "TBA"}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {goingCount} attending
                    </div>
                    <Button
                      size="sm"
                      variant={isGoing ? "secondary" : "default"}
                      style={{ borderRadius: "2px" }}
                      className="min-h-9 text-xs"
                      disabled={!user || toggleRsvp.isPending}
                      onClick={() =>
                        user &&
                        toggleRsvp.mutate({
                          eventId: event.id,
                          userId: user.id,
                          isGoing,
                          attendeeId: myRsvp?.id,
                        })
                      }
                    >
                      {toggleRsvp.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isGoing ? (
                        "Going"
                      ) : (
                        <>
                          RSVP <ChevronRight className="ml-1 h-3 w-3" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>

    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Host event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Title *</Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="min-h-12 text-base"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-type">Type *</Label>
              <Input
                id="event-type"
                value={form.type}
                placeholder="workshop"
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                className="min-h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-date">Date and time *</Label>
              <Input
                id="event-date"
                type="datetime-local"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                className="min-h-12 text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              value={form.location}
              placeholder="Kathmandu or online"
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              className="min-h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-description">Description *</Label>
            <Textarea
              id="event-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              className="min-h-28 text-base"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submitEvent}
            disabled={
              createEvent.isPending ||
              !form.title.trim() ||
              !form.type.trim() ||
              !form.description.trim() ||
              !form.date
            }
          >
            {createEvent.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </AppLayout>
  );
}
