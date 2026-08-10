import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
  destructive?: boolean;
}

export function ConfirmDeleteDialog({ open, onOpenChange, title, description, confirmLabel, pending, onConfirm, destructive = true }: ConfirmDeleteDialogProps) {
  return <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !pending) onOpenChange(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel><AlertDialogAction className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined} disabled={pending} onClick={(event) => { event.preventDefault(); onConfirm(); }}>{pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{confirmLabel}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
