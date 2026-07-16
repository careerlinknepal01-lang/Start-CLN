import { Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyFeedProps {
  onCreatePost?: () => void;
  filter: "recent" | "trending";
}

export const EmptyFeed = ({ onCreatePost, filter }: EmptyFeedProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="relative mb-6">
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
      <div className="relative grid h-20 w-20 place-items-center rounded-full bg-primary/10 border border-primary/20">
        <Newspaper className="h-9 w-9 text-primary" />
      </div>
    </div>
    <h3 className="text-xl font-semibold mb-2">
      {filter === "trending" ? "No trending posts yet" : "Your feed is empty"}
    </h3>
    <p className="text-muted-foreground max-w-xs mb-6 text-sm leading-relaxed">
      {filter === "trending"
        ? "Be the first to spark engagement — create a post and get the conversation going."
        : "Share your achievements, project updates, or ask the community a question to get started."}
    </p>
    {onCreatePost && (
      <Button onClick={onCreatePost} className="gap-2">
        <Newspaper className="h-4 w-4" />
        Create your first post
      </Button>
    )}
  </div>
);
