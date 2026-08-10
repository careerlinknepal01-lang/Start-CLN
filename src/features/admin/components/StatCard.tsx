import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | undefined;
  icon: LucideIcon;
  iconClassName?: string;
  isLoading?: boolean;
}

export function StatCard({ label, value, icon: Icon, iconClassName, isLoading }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
            iconClassName ?? "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-20" />
          ) : (
            <p className="text-2xl font-bold tracking-tight animate-fade-in">
              {value?.toLocaleString() ?? 0}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
