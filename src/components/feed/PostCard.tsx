import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertConfirmDialog } from "@/components/ui/AlertConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/UserAvatar";
import { PostTypeBadge } from "./PostTypeBadge";
import { CommentsSection } from "./CommentsSection";
import { EditPostDialog } from "./EditPostDialog";
import { useLikePost, useBookmarkPost, useDeletePost, useReportPost } from "@/hooks/useFeed";
import type { FeedPost } from "@/hooks/useFeed";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Flag,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface PostCardProps {
  post: FeedPost;
  currentUserId: string;
  currentUserName: string;
  currentAvatarUrl?: string | null;
}

const REPORT_REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Harassment or hate speech",
  "Copyright violation",
  "Other",
];

export const PostCard = ({
  post,
  currentUserId,
  currentUserName,
  currentAvatarUrl,
}: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [contentExpanded, setContentExpanded] = useState(false);

  const { mutate: likePost, isPending: liking } = useLikePost();
  const { mutate: bookmarkPost, isPending: bookmarking } = useBookmarkPost();
  const { mutate: deletePost, isPending: deleting } = useDeletePost();
  const { mutate: reportPost, isPending: reporting } = useReportPost();

  const isOwner = post.author_id === currentUserId;
  const CONTENT_LIMIT = 300;
  const longContent = post.content.length > CONTENT_LIMIT;
  const displayContent =
    longContent && !contentExpanded
      ? post.content.slice(0, CONTENT_LIMIT) + "…"
      : post.content;

  const handleLike = () => {
    likePost({ postId: post.id, userId: currentUserId, liked: post.user_liked });
  };

  const handleBookmark = () => {
    bookmarkPost({ postId: post.id, userId: currentUserId, bookmarked: post.user_bookmarked });
  };

  const handleDelete = () => {
    deletePost(post.id, { onSuccess: () => setShowDeleteDialog(false) });
  };

  const handleReport = () => {
    if (!reportReason) return;
    reportPost(
      { post_id: post.id, user_id: currentUserId, reason: reportReason },
      { onSuccess: () => { setShowReportDialog(false); setReportReason(""); } }
    );
  };

  return (
    <>
      <Card className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200 group">
        <CardContent className="p-5">
          {/* ── Author row ─────────────────────────────── */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link to={`/profile/${post.author_id}`} className="shrink-0">
                <UserAvatar
                  name={post.author_name}
                  url={post.author_avatar_url}
                  className="h-11 w-11 ring-2 ring-border/40 hover:ring-primary/40 transition-all"
                />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/profile/${post.author_id}`}
                    className="font-semibold text-sm hover:underline text-foreground truncate"
                  >
                    {post.author_name}
                  </Link>
                  {post.author_is_verified && (
                    <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {post.author_field}
                  {post.author_field && post.author_college && " · "}
                  {post.author_college}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  {post.edited && (
                    <span className="ml-1 opacity-60">(edited)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <PostTypeBadge type={post.type} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {isOwner ? (
                    <>
                      <DropdownMenuItem onClick={() => setShowEditDialog(true)} className="gap-2">
                        <Pencil className="h-3.5 w-3.5" />
                        Edit post
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete post
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => setShowReportDialog(true)}
                        className="gap-2 text-muted-foreground"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        Report post
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowBlockDialog(true)}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Block user
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Content ────────────────────────────────── */}
          <div className="mb-3">
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap break-words">
              {displayContent}
            </p>
            {longContent && (
              <button
                onClick={() => setContentExpanded(!contentExpanded)}
                className="text-xs text-primary hover:text-primary/80 font-medium mt-1 transition-colors"
              >
                {contentExpanded ? "See less" : "See more"}
              </button>
            )}
          </div>

          {/* ── Media image ─────────────────────────────── */}
          {post.media_url && (
            <div className="mb-3 rounded-xl overflow-hidden border border-border/40">
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full max-h-96 object-cover"
                loading="lazy"
                onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = "none")}
              />
            </div>
          )}

          {/* ── Action bar ──────────────────────────────── */}
          <div className="flex items-center justify-start gap-6 mt-3 pt-3 border-t border-border/40">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={liking}
              className={`group flex items-center gap-2 text-sm font-medium transition-colors ${
                post.user_liked
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <div className={`p-1.5 rounded-full transition-colors ${post.user_liked ? "bg-primary/10" : "group-hover:bg-primary/10"}`}>
                {liking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Heart
                    className={`h-4 w-4 transition-transform ${post.user_liked ? "fill-current scale-110" : "group-hover:scale-110"}`}
                  />
                )}
              </div>
              {post.like_count > 0 && <span>{post.like_count}</span>}
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`group flex items-center gap-2 text-sm font-medium transition-colors ${
                showComments
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <div className={`p-1.5 rounded-full transition-colors ${showComments ? "bg-primary/10" : "group-hover:bg-primary/10"}`}>
                <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              </div>
              {post.comment_count > 0 && <span>{post.comment_count}</span>}
            </button>

            {/* Share */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
                toast.success("Link copied to clipboard");
              }}
              className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors ml-auto"
              title="Share post"
            >
              <div className="p-1.5 rounded-full transition-colors group-hover:bg-primary/10">
                <Share2 className="h-4 w-4 transition-transform group-hover:scale-110" />
              </div>
            </button>
          </div>

          {/* ── Comments section ────────────────────────── */}
          {showComments && (
            <CommentsSection
              postId={post.id}
              userId={currentUserId}
              userName={currentUserName}
              avatarUrl={currentAvatarUrl}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ─────────────────────────────────── */}

      {/* Edit dialog */}
      {isOwner && (
        <EditPostDialog
          post={post}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {/* Delete confirmation */}
      <AlertConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete this post?"
        description="This action cannot be undone. The post and all its comments will be permanently removed."
        confirmText="Delete"
        onConfirm={handleDelete}
        loading={deleting}
        destructive={true}
      />

      {/* Block confirmation */}
      <AlertConfirmDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        title={`Block ${post.author_name}?`}
        description="They won't be able to see your posts, message you, or interact with you. This action can be reversed in settings."
        confirmText="Block user"
        onConfirm={() => {
          toast.success("User blocked.");
          setShowBlockDialog(false);
        }}
        destructive={true}
      />

      {/* Report dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-sm text-muted-foreground">Why are you reporting this?</Label>
            <div className="space-y-1.5">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-all ${
                    reportReason === reason
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReport}
              disabled={!reportReason || reporting}
              className="min-w-[80px]"
            >
              {reporting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
