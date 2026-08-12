import { useEffect, useRef, useState } from "react";
import { Image, Loader2, X, Calendar, Trophy, Briefcase, Send, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: createPost, isPending } = useCreatePost();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("feed-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("feed-images")
        .getPublicUrl(filePath);

      setMediaUrl(data.publicUrl);
    } catch (error: any) {
      toast.error("Error uploading image: " + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
    // Instead of posting, redirecting to Events to create one is often a better UX,
    // but the prompt says "Where represented by the design, support... Events". 
    // We'll map "Event" to an opportunity post with #Event tag, or navigate.
    // Let's create an opportunity post prefilled with #Event.
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
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isPending && !isUploading;

  return (
    <Card className="border-border bg-card text-card-foreground shadow-soft overflow-hidden mb-6 rounded-2xl">
      <CardContent className="p-0">
        <div className="p-4 flex items-start gap-3">
          <UserAvatar name={userName} url={avatarUrl} className="h-10 w-10 shrink-0" />
          
          <div className="flex-1 flex flex-col">
            {!expanded ? (
              <div 
                className="w-full flex items-center h-12 px-4 rounded-xl bg-secondary/50 text-muted-foreground text-[15px] cursor-text transition-colors border-none"
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
                        placeholder="Paste image URL or click Upload"
                        className="h-9 text-sm bg-muted/50"
                        disabled={isPending || isUploading}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || isPending}
                        className="h-9 whitespace-nowrap"
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                        Upload
                      </Button>
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
                      <div className="aspect-video overflow-hidden rounded-lg border bg-muted/20 flex items-center justify-center">
                        <img
                          src={mediaUrl}
                          alt="Preview"
                          className="h-full w-full object-contain"
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
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!expanded) handleExpand("general");
                setShowMedia(true);
              }}
              className="h-10 px-4 rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium shadow-none"
              disabled={isPending}
            >
              <Image className="mr-2 h-4 w-4 text-orange-500" />
              Image
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleEventClick}
              className="h-10 px-4 rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium shadow-none"
              disabled={isPending}
            >
              <Calendar className="mr-2 h-4 w-4 text-purple-500" />
              Event
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExpand("achievement")}
              className="h-10 px-4 rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium shadow-none"
              disabled={isPending}
            >
              <Trophy className="mr-2 h-4 w-4 text-green-500" />
              Achievement
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExpand("project_update")}
              className="h-10 px-4 rounded-xl border-border text-muted-foreground hover:text-foreground hover:bg-secondary text-sm font-medium shadow-none"
              disabled={isPending}
            >
              <Briefcase className="mr-2 h-4 w-4 text-blue-500" />
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
              className={`h-10 px-6 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-none transition-all ${
                expanded ? "" : "opacity-0 pointer-events-none w-0 px-0 overflow-hidden"
              }`}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <Send className="mr-2 h-4 w-4" />
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
