import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/useFeed";
import type { FeedComment } from "@/hooks/useFeed";
import { Loader2, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { AlertConfirmDialog } from "@/components/ui/AlertConfirmDialog";

interface CommentsSectionProps {
  postId: string;
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  isVerified?: boolean;
  autoFocus?: boolean;
}

const CommentItem = ({
  comment,
  currentUserId,
  postId,
}: {
  comment: FeedComment;
  currentUserId: string;
  postId: string;
}) => {
  const { mutate: deleteComment, isPending } = useDeleteComment();
  const isOwner = comment.author_id === currentUserId;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex gap-3 group animate-in fade-in duration-200">
      <Link to={`/profile/${comment.author_id}`} className="shrink-0">
        <UserAvatar
          name={comment.author_name}
          url={comment.author_avatar_url}
          className="h-8 w-8"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
          <Link
            to={`/profile/${comment.author_id}`}
            className="text-xs font-semibold hover:underline text-foreground"
          >
            {comment.author_name}
          </Link>
          {comment.author_field && (
            <span className="text-[10px] text-muted-foreground ml-1.5">
              · {comment.author_field}
            </span>
          )}
          <p className="text-sm mt-0.5 text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-1">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {isOwner && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={isPending}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
            >
              {isPending ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Trash2 className="h-2.5 w-2.5" />
              )}
              Delete
            </button>
          )}
        </div>
      </div>
      <AlertConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this comment?"
        description="This action cannot be undone."
        confirmText="Delete"
        destructive
        loading={isPending}
        onConfirm={() => deleteComment({ id: comment.id, post_id: postId }, { onSuccess: () => setConfirmDelete(false) })}
      />
    </div>
  );
};

export const CommentsSection = ({
  postId,
  userId,
  userName,
  avatarUrl,
  isVerified = true,
  autoFocus = false,
}: CommentsSectionProps) => {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { data: comments, isLoading } = useComments(postId, true);
  const { mutate: createComment, isPending: submitting } = useCreateComment();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    createComment(
      { post_id: postId, author_id: userId, content: trimmed },
      { onSuccess: () => setText("") }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="pt-3 border-t border-border/60 animate-in fade-in duration-200">
      {/* Comments list */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && comments && comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={userId}
              postId={postId}
            />
          ))}
        </div>
      )}

      {!isLoading && comments?.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3 mb-3">
          No comments yet — be the first!
        </p>
      )}

      {/* New comment input */}
      <div className="flex gap-2.5 items-start">
        <UserAvatar name={userName} url={avatarUrl} className="h-8 w-8 shrink-0 mt-0.5" />
        <div className="flex-1 relative">
          <Textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={!isVerified ? "Verify your account to comment." : "Write a comment… (Enter to send)"}
            rows={1}
            disabled={submitting || !isVerified}
            className="text-sm resize-none rounded-2xl pr-10 min-h-[40px] py-2 border-border/60 focus:border-primary/50 bg-muted/40"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!text.trim() || submitting || !isVerified}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-primary disabled:text-muted-foreground"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
