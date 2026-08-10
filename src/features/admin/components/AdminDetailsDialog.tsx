import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AdminDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  metadata?: ReactNode;
  children: ReactNode;
}

export function AdminDetailsDialog({ open, onOpenChange, title, metadata, children }: AdminDetailsDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><div className="space-y-4 text-sm">{metadata && <div className="grid grid-cols-2 gap-3 text-muted-foreground">{metadata}</div>}<div className="whitespace-pre-wrap">{children}</div></div></DialogContent></Dialog>;
}
