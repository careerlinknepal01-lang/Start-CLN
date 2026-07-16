import { Badge } from "@/components/ui/badge";
import type { FeedPost } from "@/hooks/useFeed";

const CONFIG: Record<
  FeedPost["type"],
  { label: string; className: string }
> = {
  achievement: {
    label: "🏆 Achievement",
    className: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  },
  project_update: {
    label: "🚀 Project Update",
    className: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  },
  opportunity: {
    label: "💼 Opportunity",
    className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  },
  general: {
    label: "💬 General",
    className: "bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400",
  },
  question: {
    label: "❓ Question",
    className: "bg-rose-500/15 text-rose-600 border-rose-500/30 dark:text-rose-400",
  },
};

interface PostTypeBadgeProps {
  type: FeedPost["type"];
}

export const PostTypeBadge = ({ type }: PostTypeBadgeProps) => {
  const cfg = CONFIG[type];
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium px-2 py-0.5 ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
};
