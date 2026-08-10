import { Badge } from "@/components/ui/badge";
import type { FeedPost } from "@/hooks/useFeed";

const CONFIG: Record<
  FeedPost["type"],
  { label: string; className: string }
> = {
  achievement: {
    label: "Achievement",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  },
  project_update: {
    label: "Project Update",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  },
  opportunity: {
    label: "Opportunity",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  general: {
    label: "General",
    className: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  },
  question: {
    label: "Question",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
  },
};

interface PostTypeBadgeProps {
  type: FeedPost["type"];
}

export const PostTypeBadge = ({ type }: PostTypeBadgeProps) => {
  const cfg = CONFIG[type];
  return (
    <Badge
      variant="secondary"
      className={`text-[11px] font-semibold px-3 py-1 rounded-full border-none shadow-none ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
};
