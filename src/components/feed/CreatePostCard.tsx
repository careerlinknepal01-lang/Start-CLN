import { useEffect, useRef, useState } from "react";
import { Image, Loader2, X, Calendar, Trophy, Briefcase, Send } from "lucide-react";

import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/hooks/useFeed";
import type { FeedPost } from "@/hooks/useFeed";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(defaultOpen);
  const [content, setContent] = useState("");
  const [type, setType] = useState<FeedPost["type"]>("general");
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

  const handleExpand = (selectedType: FeedPost["type"] = "general") => {
    setType(selectedType);
    setExpanded(true);
    window.setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleEventClick = () => {
    // Map "Event" to an opportunity post prefilled with #Event.
    setContent("#Event ");
    handleExpand("opportunity");
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    createPost(
      {
        author_id: userId,
        type: type,
        content: content.trim(),
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
    <Card className="border-border bg-card text-card-foreground overflow-hidden rounded-[6px]">
      <CardContent className="p-0">
        <div className="p-4 flex items-start gap-3">
          <UserAvatar name={userName} url={avatarUrl} className="h-10 w-10 shrink-0" />

          <div className="flex-1 flex flex-col">
            {!expanded ? (
              <div
                className="w-full flex items-center h-12 px-4 rounded-[4px] bg-secondary/50 text-muted-foreground text-[15px] cursor-text transition-colors border-none"
                onClick={() => handleExpand("general")}
              >
                What's on your mind, {userName.split(' ')[0]}?
              </div>
            ) : (
              <div className="relative w-full">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={`What's on your mind, ${userName.split(' ')[0]}?`}
                  className="min-h-[100px] resize-none border-none bg-transparent shadow-none focus-visible:ring-0 px-0 py-2 text-[15px] text-foreground placeholder:text-muted-foreground"
                  disabled={isPending}
                />

                {showMedia && (
                  <div className="mt-2 mb-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={mediaUrl}
                        onChange={(event) => setMediaUrl(event.target.value)}
                        placeholder="Paste image URL (https://...)"
                        className="h-9 text-sm bg-muted/50"
                        disabled={isPending}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowMedia(false);
                          setMediaUrl("");
                        }}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {mediaUrl && (
                      <div className="aspect-video overflow-hidden rounded-[4px] border bg-muted/30">
                        <img
                          src={mediaUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!expanded) handleExpand("general");
                setShowMedia(true);
              }}
              className="h-10 px-3.5 rounded-[4px] border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium"
              disabled={isPending}
            >
              <Image className="mr-1.5 h-4 w-4 text-primary" />
              Image
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleEventClick}
              className="h-10 px-3.5 rounded-[4px] border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium"
              disabled={isPending}
            >
              <Calendar className="mr-1.5 h-4 w-4 text-warning" />
              Event
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExpand("achievement")}
              className="h-10 px-3.5 rounded-[4px] border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium"
              disabled={isPending}
            >
              <Trophy className="mr-1.5 h-4 w-4 text-success" />
              Achievement
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExpand("project_update")}
              className="h-10 px-3.5 rounded-[4px] border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium"
              disabled={isPending}
            >
              <Briefcase className="mr-1.5 h-4 w-4 text-muted-foreground" />
              Project
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {expanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="h-9 text-xs font-medium"
                disabled={isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit && expanded}
              className={`h-10 px-6 rounded-[4px] bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-all ${
                expanded ? "" : "opacity-0 pointer-events-none w-0 px-0 overflow-hidden"
              }`}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <Send className="mr-1.5 h-4 w-4" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
