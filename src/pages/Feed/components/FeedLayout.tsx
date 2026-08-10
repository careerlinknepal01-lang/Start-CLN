import { ReactNode } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";

interface FeedLayoutProps {
  filterBar: ReactNode;
  children: ReactNode; // This will be the Post List
  sidebar: ReactNode; // Right Sidebar
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  error: Error | null;
  loaderRef: React.RefObject<HTMLDivElement>;
  isEmpty: boolean;
  createPostCard: ReactNode;
  suggestedConnections?: ReactNode;
}

export function FeedLayout({
  filterBar,
  children,
  sidebar,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  error,
  loaderRef,
  isEmpty,
  createPostCard,
  suggestedConnections
}: FeedLayoutProps) {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* Main Feed Column */}
          <div className="space-y-6 max-w-2xl w-full mx-auto lg:mx-0">
            {createPostCard}
            
            {suggestedConnections}

            {filterBar}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-600">
                <p className="font-semibold">Could not load feed.</p>
                <p className="text-sm mt-1">Please refresh the page and try again.</p>
              </div>
            )}

            {!error && (
              <div className="space-y-6">
                {isLoading ? (
                  // Skeleton List
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card text-card-foreground border border-border rounded-3xl p-6 h-48 animate-pulse">
                        <div className="flex gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                          <div className="flex-1">
                            <div className="h-4 w-1/3 bg-slate-200 rounded mb-2"></div>
                            <div className="h-3 w-1/4 bg-slate-200 rounded"></div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 w-full bg-slate-200 rounded"></div>
                          <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : isEmpty ? (
                  <div className="bg-card text-card-foreground border border-dashed border-border rounded-3xl p-16 text-center text-muted-foreground">
                    <p className="text-lg font-semibold text-foreground/90">No posts found</p>
                    <p className="mt-2 text-sm">Try adjusting your filters.</p>
                  </div>
                ) : (
                  // List of Posts
                  <div className="space-y-6">
                    {children}
                  </div>
                )}
              </div>
            )}

            {/* Infinite Scroll Loader */}
            <div ref={loaderRef} className="h-8 flex items-center justify-center">
              {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-blue-500" />}
            </div>
            
            {!hasNextPage && !isLoading && !isEmpty && !error && (
              <div className="text-center text-sm font-medium text-muted-foreground/70">
                You've caught up! No more posts to show.
              </div>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="hidden lg:block space-y-6">
            {sidebar}
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
