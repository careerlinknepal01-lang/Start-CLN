import type { FeedPost } from "@/hooks/useFeed";
import { Award, Briefcase, Code, HelpCircle, LayoutGrid, TrendingUp } from "lucide-react";

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
    { id: "achievement", label: "Achievements", icon: <Award className="h-4 w-4 text-green-500" /> },
    { id: "project_update", label: "Project Updates", icon: <Code className="h-4 w-4 text-pink-500" /> },
    { id: "opportunity", label: "Opportunities", icon: <Briefcase className="h-4 w-4 text-red-800" /> },
    { id: "question", label: "Questions", icon: <HelpCircle className="h-4 w-4 text-red-500" /> },
  ] as const;

  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-2">
      {filters.map((cat) => (
        <button
          key={cat.label}
          onClick={() => {
            setCategoryFilter(cat.id as any);
            setFilter("recent");
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors ${
            categoryFilter === cat.id && filter === "recent"
              ? "bg-[#1e3a8a] text-white border border-transparent shadow-sm"
              : "bg-card text-card-foreground text-muted-foreground border border-border hover:bg-secondary"
          }`}
        >
          {cat.icon}
          {cat.label}
        </button>
      ))}
      <button
        onClick={() => { setCategoryFilter(null); setFilter("trending"); }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors ${
          filter === "trending"
            ? "bg-[#1e3a8a] text-white border border-transparent shadow-sm"
            : "bg-card text-card-foreground text-muted-foreground border border-border hover:bg-secondary"
        }`}
      >
        <TrendingUp className="h-4 w-4 text-orange-500" />
        Trending
      </button>
    </div>
  );
}
