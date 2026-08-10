import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

interface TableSkeletonRowsProps {
  rows?: number;
  columns: number;
}

export function TableSkeletonRows({ rows = 10, columns }: TableSkeletonRowsProps) {
  return Array.from({ length: rows }).map((_, row) => (
    <TableRow key={row}>
      {Array.from({ length: columns }).map((__, column) => (
        <TableCell key={column}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  ));
}
