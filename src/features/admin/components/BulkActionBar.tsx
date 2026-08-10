import { Button } from "@/components/ui/button";

interface BulkAction {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

interface BulkActionBarProps {
  count: number;
  actions: BulkAction[];
}

export function BulkActionBar({ count, actions }: BulkActionBarProps) {
  if (!count) return null;
  return <div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm text-muted-foreground">{count} selected</p><div className="flex gap-2">{actions.map((action) => <Button key={action.label} variant={action.destructive ? "destructive" : "default"} size="sm" onClick={action.onClick}>{action.label}</Button>)}</div></div>;
}
