import { TableCell, TableRow } from "@/components/ui/table";

interface EmptyStateRowProps {
  colSpan: number;
  message: string;
}

export function EmptyStateRow({ colSpan, message }: EmptyStateRowProps) {
  return <TableRow><TableCell colSpan={colSpan} className="py-12 text-center text-muted-foreground">{message}</TableCell></TableRow>;
}
