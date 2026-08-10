import { Hash, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTrendingTopics } from "@/hooks/useFeed";
import { Skeleton } from "@/components/ui/skeleton";

export function TrendingTopicsWidget() {
  const { data: topics, isLoading } = useTrendingTopics(5);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card text-card-foreground p-6 shadow-sm mt-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card text-card-foreground p-6 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-[15px] text-foreground">
          Trending Topics
        </h3>
        <Link to="/explore" className="text-sm font-medium text-blue-600 hover:underline">
          See all
        </Link>
      </div>

      <div className="space-y-4">
        {topics.map((topic, index) => {
          // Color based on index for variety matching the design
          const colors = [
            "text-blue-500",
            "text-purple-500",
            "text-orange-500",
            "text-emerald-500",
            "text-rose-500",
          ];
          const colorClass = colors[index % colors.length];
          return (
            <Link 
              to={`/search?q=${encodeURIComponent('#' + topic.tag)}`}
              key={topic.tag} 
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Hash className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] text-foreground truncate group-hover:text-blue-600 transition-colors">
                    {topic.tag}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {topic.count} {topic.count === 1 ? 'post' : 'posts'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
