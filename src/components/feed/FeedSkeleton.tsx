import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const FeedSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="overflow-hidden">
        <CardContent className="p-5">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>

          {/* Content */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          {/* Counts row */}
          <div className="flex items-center gap-4 mb-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>

          {/* Action bar */}
          <div className="flex gap-2 pt-2 border-t border-border">
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-9 flex-1 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
