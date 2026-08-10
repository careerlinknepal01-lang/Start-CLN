import { useLikePost, useBookmarkPost } from "@/hooks/useFeed";
import { useFeedLogic } from "./Feed/useFeedLogic";
import { FeedLayout } from "./Feed/components/FeedLayout";
import { FilterBar } from "./Feed/components/FilterBar";
import { PostItem } from "./Feed/components/PostItem";
import { SuggestedConnections } from "./Feed/components/SuggestedConnections";
import { CreatePostCard } from "@/components/feed/CreatePostCard";
import { UpcomingEventsWidget } from "@/components/feed/UpcomingEventsWidget";
import { TrendingTopicsWidget } from "@/components/feed/TrendingTopicsWidget";
import { useNavigate, Link } from "react-router-dom";

/**
 * Feed Page Component
 * Acts as the main coordinator for the feed section. It connects the business logic (data fetching, state)
 * with the visual layout components (sidebar, filters, posts).
 * 
 * @returns {JSX.Element} The rendered Feed page.
 */
export default function Feed() {
  // We rename several destructured properties from useFeedLogic to ensure the variable names are instantly readable
  const {
    user: authenticatedUser,
    me: currentUserProfile,
    filter: feedFilterType,
    setFilter: setFeedFilterType,
    categoryFilter: postCategoryFilter,
    setCategoryFilter: setPostCategoryFilter,
    suggestions: connectionSuggestions,
    handleRemoveSuggestion,
    displayedPosts: visiblePosts,
    isLoading: isFeedLoading,
    isFetchingNextPage: isFetchingMorePosts,
    hasNextPage: hasMorePosts,
    error: feedError,
    loaderRef: infiniteScrollLoaderRef,
    postRefs,
    highlightPostId
  } = useFeedLogic();

  const navigate = useNavigate();
  const { mutate: executeLikePost } = useLikePost();
  const { mutate: executeBookmarkPost } = useBookmarkPost();

  /**
   * Toggles the like status of a specific post.
   * 
   * @param {string} postId - The unique identifier of the post.
   * @param {boolean} isCurrentlyLiked - Whether the user has already liked the post.
   */
  const handleLikeToggle = (postId: string, isCurrentlyLiked: boolean) => {
    // We cannot execute a like action if the user session is unavailable
    if (!authenticatedUser) return;
    executeLikePost({ postId, userId: authenticatedUser.id, liked: isCurrentlyLiked });
  };

  /**
   * Toggles the bookmark status of a specific post for the current user.
   * 
   * @param {string} postId - The unique identifier of the post.
   * @param {boolean} isCurrentlyBookmarked - Whether the user has already bookmarked the post.
   */
  const handleBookmarkToggle = (postId: string, isCurrentlyBookmarked: boolean) => {
    // We cannot execute a bookmark action if the user session is unavailable
    if (!authenticatedUser) return;
    executeBookmarkPost({ postId, userId: authenticatedUser.id, bookmarked: isCurrentlyBookmarked });
  };

  /**
   * Navigates the user to the detailed view of a post when they click the comment button.
   * 
   * @param {string} postId - The unique identifier of the post.
   */
  const navigateToPostDetails = (postId: string) => {
    navigate(`/post/${postId}`);
  };

  // We abstract the right sidebar content into a variable to keep the main JSX return clean and readable
  const rightSidebarContent = (
    <div className="space-y-6">
      <UpcomingEventsWidget userId={authenticatedUser?.id} />
      <TrendingTopicsWidget userId={authenticatedUser?.id} userField={currentUserProfile?.field} />
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-2 text-xs text-slate-400 font-medium">
        <Link to="/about" className="hover:underline">About</Link>
        <Link to="/privacy" className="hover:underline">Privacy</Link>
        <Link to="/terms" className="hover:underline">Terms</Link>
        <Link to="/help" className="hover:underline">Help</Link>
        <span className="w-full mt-2">© 2026 CareerLink Nepal</span>
      </div>
    </div>
  );

  return (
    <FeedLayout
      createPostCard={
        // Only render the post creation card if both the auth session and the user profile are fully loaded
        authenticatedUser && currentUserProfile ? (
          <CreatePostCard
            userId={authenticatedUser.id}
            userName={currentUserProfile.name ?? ""}
            avatarUrl={currentUserProfile.avatar_url}
          />
        ) : null
      }
      suggestedConnections={
        <SuggestedConnections 
          suggestions={connectionSuggestions} 
          currentUserId={authenticatedUser?.id}
          onRemove={handleRemoveSuggestion}
        />
      }
      filterBar={
        <FilterBar
          categoryFilter={postCategoryFilter}
          setCategoryFilter={setPostCategoryFilter}
          filter={feedFilterType}
          setFilter={setFeedFilterType}
        />
      }
      sidebar={rightSidebarContent}
      isLoading={isFeedLoading}
      isFetchingNextPage={isFetchingMorePosts}
      hasNextPage={hasMorePosts}
      error={feedError as Error | null}
      loaderRef={infiniteScrollLoaderRef}
      isEmpty={visiblePosts.length === 0}
    >
      {/* We iterate over visiblePosts instead of all raw posts so that our category/search filters are respected */}
      {visiblePosts.map((post) => (
        <div 
          key={post.id} 
          // We assign a ref callback here so that the useFeedLogic hook can auto-scroll to this specific post if a URL parameter requests it
          ref={(el) => { postRefs.current[post.id] = el; }}
          className={highlightPostId === post.id ? "ring-2 ring-blue-500 rounded-3xl" : ""}
        >
          <PostItem
            post={post}
            currentUserId={authenticatedUser?.id || ""}
            onLike={handleLikeToggle}
            onBookmark={handleBookmarkToggle}
            onCommentClick={navigateToPostDetails}
          />
        </div>
      ))}
    </FeedLayout>
  );
}