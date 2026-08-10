import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { BadgeCheck, Heart, MessageSquare, Bookmark, Share2, MoreHorizontal } from "lucide-react";
import type { FeedPost } from "@/hooks/useFeed";
import { UserAvatar } from "@/components/UserAvatar";

interface PostItemProps {
  post: FeedPost;
  currentUserId: string;
  onLike: (postId: string, liked: boolean) => void;
  onBookmark: (postId: string, bookmarked: boolean) => void;
  onCommentClick: (postId: string) => void;
}

export function PostItem({ post, currentUserId, onLike, onBookmark, onCommentClick }: PostItemProps) {
  const isAuthor = post.author_id === currentUserId;

  return (
    <div className="bg-card text-card-foreground border border-border rounded-3xl p-6 transition-all hover:shadow-soft">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author_id}`}>
            <UserAvatar name={post.author_name} url={post.author_avatar_url} className="h-12 w-12" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link to={`/profile/${post.author_id}`} className="font-bold text-[15px] text-foreground hover:underline">
                {post.author_name}
              </Link>
              {post.author_is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </div>
            <div className="text-[12px] text-muted-foreground font-medium">
              {post.author_field} • {post.author_college}
            </div>
            <div className="text-[10px] text-muted-foreground/70 mt-0.5">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-secondary">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        
        {post.media_url && (
          <div className="mt-4 rounded-2xl overflow-hidden border border-border/50 bg-secondary/50">
            <img 
              src={post.media_url} 
              alt="Post attachment" 
              className="w-full h-auto object-cover max-h-[400px]"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Tags / Categories */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[11px] font-bold capitalize">
          {post.type.replace('_', ' ')}
        </span>
        {post.tags?.map((tag, i) => (
          <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground border border-border/50 rounded-lg text-[11px] font-medium">
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onLike(post.id, post.user_liked)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
              post.user_liked 
                ? "bg-primary/10 text-primary hover:bg-primary/20" 
                : "bg-transparent text-muted-foreground border border-border hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Heart className={`h-4 w-4 ${post.user_liked ? "fill-current" : ""}`} />
            {post.like_count > 0 && post.like_count}
          </button>
          
          <button 
            onClick={() => onCommentClick(post.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-transparent text-muted-foreground border border-border hover:bg-secondary hover:text-foreground transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            {post.comment_count > 0 && post.comment_count}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => onBookmark(post.id, post.user_bookmarked)}
            className={`p-2 rounded-xl transition-all ${
              post.user_bookmarked 
                ? "bg-primary/10 text-primary hover:bg-primary/20" 
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${post.user_bookmarked ? "fill-current" : ""}`} />
          </button>
          <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
