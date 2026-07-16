import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Image, Loader2, X } from "lucide-react";

import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/useFeed";
import type { FeedPost } from "@/hooks/useFeed";

type UiPostType = FeedPost["type"] | "teammates" | "collab";

const POST_TYPES: { type: UiPostType; label: string; tone: string }[] = [
  {
    type: "general",
    label: "General",
    tone: "hover:bg-purple-500/10 data-[active=true]:bg-purple-500/15 data-[active=true]:text-purple-700 data-[active=true]:border-purple-500/40",
  },
  {
    type: "teammates",
    label: "Looking for teammates",
    tone: "hover:bg-emerald-500/10 data-[active=true]:bg-emerald-500/15 data-[active=true]:text-emerald-700 data-[active=true]:border-emerald-500/40",
  },
  {
    type: "collab",
    label: "Project collab request",
    tone: "hover:bg-blue-500/10 data-[active=true]:bg-blue-500/15 data-[active=true]:text-blue-700 data-[active=true]:border-blue-500/40",
  },
  {
    type: "achievement",
    label: "Achievement",
    tone: "hover:bg-amber-500/10 data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-700 data-[active=true]:border-amber-500/40",
  },
  {
    type: "opportunity",
    label: "Opportunity",
    tone: "hover:bg-indigo-500/10 data-[active=true]:bg-indigo-500/15 data-[active=true]:text-indigo-700 data-[active=true]:border-indigo-500/40",
  },
  {
    type: "question",
    label: "Question",
    tone: "hover:bg-rose-500/10 data-[active=true]:bg-rose-500/15 data-[active=true]:text-rose-700 data-[active=true]:border-rose-500/40",
  },
];

const PLACEHOLDERS: Record<UiPostType, string> = {
  general: "What's on your mind?",
  teammates: "What kind of teammates are you looking for?",
  collab: "Describe the project you want to collaborate on.",
  achievement: "Share a recent achievement - big or small, they all count.",
  project_update: "What's new with your project? Share your progress.",
  opportunity: "Know of an opportunity? Share it with the community.",
  question: "Got a question? The community is here to help.",
};

interface CreatePostCardProps {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  defaultOpen?: boolean;
  communityId?: string | null;
  onPostCreated?: () => void;
}

export const CreatePostCard = ({
  userId,
  userName,
  avatarUrl,
  defaultOpen = false,
  communityId = null,
  onPostCreated,
}: CreatePostCardProps) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [content, setContent] = useState("");
  const [type, setType] = useState<UiPostType>("general");
  const [mediaUrl, setMediaUrl] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: createPost, isPending } = useCreatePost();

  useEffect(() => {
    if (defaultOpen) setExpanded(true);
  }, [defaultOpen]);

  const reset = () => {
    setContent("");
    setMediaUrl("");
    setShowMedia(false);
    setExpanded(false);
    setType("general");
  };

  const handleExpand = () => {
    setExpanded(true);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    let dbType: FeedPost["type"] = "general";
    let actualContent = content.trim();

    if (type === "teammates") {
      dbType = "opportunity";
      actualContent = `#LookingForTeammates\n\n${actualContent}`;
    } else if (type === "collab") {
      dbType = "project_update";
      actualContent = `#CollabRequest\n\n${actualContent}`;
    } else {
      dbType = type as FeedPost["type"];
    }

    createPost(
      {
        author_id: userId,
        type: dbType,
        content: actualContent,
        media_url: mediaUrl.trim() || null,
        community_id: communityId,
      },
      {
        onSuccess: () => {
          reset();
          onPostCreated?.();
        },
      }
    );
  };

  const charCount = content.length;
  const maxChars = 3000;
  const isOverLimit = charCount > maxChars;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isPending;

  return (
    <Card className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={userName} url={avatarUrl} className="h-10 w-10 shrink-0" />
          {!expanded ? (
            <button
              type="button"
              onClick={handleExpand}
              className="min-h-12 flex-1 rounded-full border border-border bg-muted/50 px-4 py-2.5 text-left text-base text-muted-foreground transition hover:border-primary/30 hover:bg-muted"
            >
              Share an update, ask a question...
            </button>
          ) : (
            <div className="flex-1 text-sm font-medium text-foreground">
              Creating a post
            </div>
          )}
        </div>

        {expanded ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {POST_TYPES.map(({ type: postType, label, tone }) => (
                <button
                  key={postType}
                  type="button"
                  data-active={type === postType}
                  onClick={() => setType(postType)}
                  className={`min-h-10 rounded-full border border-transparent px-3 py-1 text-xs font-medium transition ${tone}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={PLACEHOLDERS[type]}
                className="min-h-[120px] resize-none border-border/60 pr-16 text-base leading-relaxed focus:border-primary/50"
                disabled={isPending}
                aria-label="Post content"
              />
              <span
                className={`absolute bottom-2.5 right-3 text-xs tabular-nums ${
                  isOverLimit
                    ? "font-semibold text-destructive"
                    : charCount > maxChars * 0.85
                      ? "text-amber-600"
                      : "text-muted-foreground"
                }`}
              >
                {charCount}/{maxChars}
              </span>
            </div>

            {showMedia ? (
              <div className="flex items-center gap-2">
                <Input
                  value={mediaUrl}
                  onChange={(event) => setMediaUrl(event.target.value)}
                  placeholder="Paste image URL (https://...)"
                  className="min-h-11 border-border/60 text-base"
                  disabled={isPending}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowMedia(false);
                    setMediaUrl("");
                  }}
                  className="h-11 w-11 shrink-0"
                  aria-label="Remove media URL"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : null}

            {mediaUrl ? (
              <div className="aspect-video overflow-hidden rounded-lg border border-border/60 bg-muted">
                <img
                  src={mediaUrl}
                  alt="Post media preview"
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMedia(!showMedia)}
                className="min-h-10 gap-1.5 text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                <Image className="h-4 w-4" />
                {showMedia ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Photo
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  disabled={isPending}
                  className="min-h-10"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="min-h-10 min-w-24"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
