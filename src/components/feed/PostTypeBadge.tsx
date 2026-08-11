import { Badge } from "@/components/ui/badge";
import type { FeedPost } from "@/hooks/useFeed";

const CONFIG: Record<
  FeedPost["type"],
  { label: string; className: string }
> = {
  achievement: {
    label: "Achievement",
    className: "bg-warning/10 text-warning",
  },
  project_update: {
    label: "Project Update",
    className: "bg-primary/10 text-primary",
  },
  opportunity: {
    label: "Opportunity",
    className: "bg-success/10 text-success",
  },
  general: {
    label: "General",
    className: "bg-secondary text-secondary-foreground",
  },
  question: {
    label: "Question",
    className: "bg-destructive/10 text-destructive",
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
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border-none shadow-none ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
};
