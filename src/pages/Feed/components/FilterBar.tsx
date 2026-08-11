import type { FeedPost } from "@/hooks/useFeed";
import { Award, Briefcase, Code, HelpCircle, LayoutGrid, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  categoryFilter: FeedPost["type"] | null;
  setCategoryFilter: (filter: FeedPost["type"] | null) => void;
  filter: "recent" | "trending";
  setFilter: (f: "recent" | "trending") => void;
}

export function FilterBar({
  categoryFilter,
  setCategoryFilter,
  filter,
  setFilter
}: FilterBarProps) {

  const filters = [
    { id: null, label: "All Posts", icon: <LayoutGrid className="h-4 w-4" /> },
    { id: "achievement", label: "Achievements", icon: <Award className="h-4 w-4 text-success" /> },
    { id: "project_update", label: "Project Updates", icon: <Code className="h-4 w-4 text-primary" /> },
    { id: "opportunity", label: "Opportunities", icon: <Briefcase className="h-4 w-4 text-destructive" /> },
    { id: "question", label: "Questions", icon: <HelpCircle className="h-4 w-4 text-warning" /> },
  ] as const;

  const chip = (active: boolean) =>
    cn(
      "flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-[13px] font-semibold whitespace-nowrap border transition-colors",
      active
        ? "bg-primary text-primary-foreground border-transparent"
        : "bg-card text-card-foreground text-muted-foreground border-border hover:bg-secondary"
    );

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 pt-2">
      {filters.map((cat) => (
        <button
          key={cat.label}
          onClick={() => {
            setCategoryFilter(cat.id);
            setFilter("recent");
          }}
          className={chip(categoryFilter === cat.id && filter === "recent")}
        >
          {cat.icon}
          {cat.label}
        </button>
      ))}
      <button
        onClick={() => { setCategoryFilter(null); setFilter("trending"); }}
        className={chip(filter === "trending")}
      >
        <TrendingUp className="h-4 w-4 text-primary" />
        Trending
      </button>
    </div>
  );
}
