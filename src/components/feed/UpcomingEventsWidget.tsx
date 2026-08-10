import { Calendar, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useRecommendedEvents } from "@/hooks/usePlatform";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface UpcomingEventsWidgetProps {
  userId?: string;
}

export function UpcomingEventsWidget({ userId }: UpcomingEventsWidgetProps) {
  const { data: events, isLoading } = useRecommendedEvents(userId, 3);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card text-card-foreground p-6 shadow-sm mb-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card text-card-foreground p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[15px] text-foreground">Upcoming Events</h3>
        </div>
        <div className="text-center py-6">
          <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No upcoming events</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            There are no scheduled events at the moment.
          </p>
          <Link to="/events">
            <button className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors">
              Explore Events
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card text-card-foreground p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-[15px] text-foreground">Upcoming Events</h3>
        <Link to="/events" className="text-sm font-medium text-blue-600 hover:underline">
          See all
          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </Link>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => {
          const eventDate = new Date(event.date);
          const month = format(eventDate, "MMM");
          const day = format(eventDate, "dd");

          // Pick background color based on index to match the screenshot vibe
          const bgColor = index === 0 ? "bg-[#3b82f6]" : index === 1 ? "bg-[#f97316]" : "bg-[#8b5cf6]";

          return (
            <div key={event.id} className="flex gap-4 group">
              {/* Date Box */}
              <div className="flex flex-col items-center bg-card text-card-foreground rounded-lg min-w-[50px] overflow-hidden border border-border shrink-0 h-fit shadow-sm">
                <div className={`w-full text-white text-center text-[10px] font-bold py-1 uppercase ${bgColor}`}>
                  {month}
                </div>
                <div className="w-full text-center text-[17px] font-bold text-foreground py-1.5">{day}</div>
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-start">
                <Link to={`/events/${event.id}`} className="font-semibold text-[14px] text-foreground truncate hover:text-blue-600 transition-colors block leading-tight">
                  {event.title}
                </Link>
                <p className="text-[12px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                  {event.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {format(eventDate, "MMM d · h:mm a")}
                  </span>
                  {event.attendee_count >= 0 && (
                    <div className="flex items-center text-[11px] text-muted-foreground ml-auto shrink-0 font-medium">
                      <Users className="h-3 w-3 mr-1" />
                      {event.attendee_count}
                    </div>
                  )}
                </div>
                {/* Event Status Badges */}
                {event.user_status && (
                  <div className="mt-2 flex">
                    {event.user_status === 'going' ? (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        Joined
                      </span>
                    ) : event.user_status === 'interested' ? (
                      <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                        Interested
                      </span>
                    ) : event.match_score > 0 ? (
                      <span className="text-[10px] font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded tracking-wider">
                        Suggested for You
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
