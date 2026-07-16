import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdatePost } from "@/hooks/useFeed";
import type { FeedPost } from "@/hooks/useFeed";
import { Loader2 } from "lucide-react";

type PostType = FeedPost["type"];

const POST_TYPES: { type: PostType; label: string; emoji: string }[] = [
  { type: "general", label: "General", emoji: "💬" },
  { type: "achievement", label: "Achievement", emoji: "🏆" },
  { type: "project_update", label: "Project Update", emoji: "🚀" },
  { type: "opportunity", label: "Opportunity", emoji: "💼" },
  { type: "question", label: "Question", emoji: "❓" },
];

interface EditPostDialogProps {
  post: FeedPost;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPostDialog = ({ post, open, onOpenChange }: EditPostDialogProps) => {
  const [content, setContent] = useState(post.content);
  const [type, setType] = useState<PostType>(post.type);
  const [mediaUrl, setMediaUrl] = useState(post.media_url ?? "");
  const { mutate: updatePost, isPending } = useUpdatePost();

  const maxChars = 3000;
  const charCount = content.length;
  const isOverLimit = charCount > maxChars;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isPending;

  const handleSave = () => {
    if (!canSubmit) return;
    updatePost(
      {
        id: post.id,
        content: content.trim(),
        type,
        media_url: mediaUrl.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Post type */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">Post Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {POST_TYPES.map(({ type: t, label, emoji }) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                    type === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-1.5 relative">
            <Label htmlFor="edit-content" className="text-xs text-muted-foreground font-medium">
              Content
            </Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[140px] resize-none text-sm leading-relaxed pr-16 border-border/60"
              disabled={isPending}
            />
            <span
              className={`absolute bottom-2.5 right-3 text-xs tabular-nums ${
                isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground"
              }`}
            >
              {charCount}/{maxChars}
            </span>
          </div>

          {/* Media URL */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-media" className="text-xs text-muted-foreground font-medium">
              Image URL <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="edit-media"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="text-sm border-border/60"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSubmit} className="min-w-[80px]">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
