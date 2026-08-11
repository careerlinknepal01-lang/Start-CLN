import { Flame, ChevronRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { usePersonalizedTrendingTopics, useTrendingTopics } from "@/hooks/useFeed";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingTopicsWidgetProps {
  userId?: string;
  userField?: string;
}

export function TrendingTopicsWidget({ userId, userField }: TrendingTopicsWidgetProps) {
  const { data: aiTopics, isLoading: aiLoading } = usePersonalizedTrendingTopics(userId, 5);
  const { data: hashtagTopics, isLoading: hashtagLoading } = useTrendingTopics(5);

  // Use AI topics if available, otherwise fall back to internal hashtag topics
  const hasAITopics = aiTopics && aiTopics.length > 0;
  const isLoading = aiLoading || (!hasAITopics && hashtagLoading);

  // Determine the heading
  const heading = hasAITopics && userField
    ? `Trending in ${userField}`
    : "Trending Topics";

  if (isLoading) {
    return (
      <div className="rounded-[6px] border border-border bg-card text-card-foreground p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-[2px]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── AI-powered trending topics ────────────────────────────────
  if (hasAITopics) {
    return (
      <div className="rounded-[6px] border border-border bg-card text-card-foreground p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[15px] text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {heading}
          </h3>
          <Link to="/explore" className="text-sm font-medium text-primary hover:underline flex items-center">
            See all
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {aiTopics.map((topic) => (
            <Link
              to={`/topics/${topic.slug}`}
              key={topic.id}
              className="flex items-start gap-3 group"
            >
              <Flame className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[13px] text-foreground group-hover:text-primary transition-colors leading-tight">
                  {topic.topic_name}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {topic.article_count > 1
                    ? `${topic.article_count} related stories`
                    : "Trending globally"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ── Fallback: internal hashtag-based topics ───────────────────
  if (!hashtagTopics || hashtagTopics.length === 0) {
    return (
      <div className="rounded-[6px] border border-border bg-card text-card-foreground p-5">
        <h3 className="font-bold text-[15px] text-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          Trending Topics
        </h3>
        <p className="text-sm text-muted-foreground">
          No trending topics available right now. Check back soon.
        </p>
      </div>
    );
  }

  // Internal hashtag fallback rendering
  const colors = [
    "text-primary",
    "text-success",
    "text-warning",
    "text-muted-foreground",
    "text-destructive",
  ];

  return (
    <div className="rounded-[6px] border border-border bg-card text-card-foreground p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-[15px] text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Trending Topics
        </h3>
        <Link to="/explore" className="text-sm font-medium text-primary hover:underline">
          See all
        </Link>
      </div>

      <div className="space-y-4">
        {hashtagTopics.map((topic, index) => {
          const colorClass = colors[index % colors.length];
          return (
            <Link
              to={`/search?q=${encodeURIComponent('#' + topic.tag)}`}
              key={topic.tag}
              className="flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Flame className={`h-4 w-4 shrink-0 ${colorClass}`} />
                <p className="font-semibold text-[13px] text-foreground truncate group-hover:text-primary transition-colors">
                  {topic.tag}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                {topic.count} {topic.count === 1 ? 'post' : 'posts'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
