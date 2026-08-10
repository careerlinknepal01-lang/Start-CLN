import { Calendar, ChevronRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useUpcomingEvents } from "@/hooks/usePlatform";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingEventsWidget() {
  const { data: events, isLoading } = useUpcomingEvents(3);

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
    return null; // Or show empty state
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

      <div className="space-y-5">
        {events.map((event) => {
          const eventDate = new Date(event.date);
          const month = format(eventDate, "MMM");
          const day = format(eventDate, "dd");

          return (
            <div key={event.id} className="flex gap-4 group cursor-pointer">
              {/* Date Box */}
              <div className="flex flex-col items-center bg-card text-card-foreground rounded-lg min-w-[50px] overflow-hidden border border-border shrink-0">
                <div className="w-full bg-[#1e3a8a] text-white text-center text-[10px] font-bold py-1 uppercase">{month}</div>
                <div className="w-full text-center text-lg font-bold text-foreground py-1.5">{day}</div>
              </div>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-semibold text-[13px] text-foreground truncate hover:text-blue-600 transition-colors">
                  {event.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-muted-foreground truncate">
                    {event.type === 'online' ? 'Online Event' : event.location || 'TBA'}
                  </span>
                  {event.attendee_count > 0 && (
                    <div className="flex items-center text-[11px] text-muted-foreground ml-auto">
                      <Users className="h-3 w-3 mr-1" />
                      {event.attendee_count}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
