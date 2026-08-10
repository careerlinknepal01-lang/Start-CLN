import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Trash2, ChevronLeft, ChevronRight, UsersRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export default function AdminCommunities() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-communities", page],
    queryFn: async () => {
      const { data: communities, count, error } = await supabase
        .from("communities")
        .select(
          "id, name, category, created_at, creator_id, profiles:creator_id(name)",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      const communityIds = (communities ?? []).map((c) => c.id);
      const { data: members } = await supabase
        .from("community_members")
        .select("community_id")
        .in("community_id", communityIds);

      const memberCounts: Record<string, number> = {};
      (members ?? []).forEach((m) => {
        memberCounts[m.community_id] = (memberCounts[m.community_id] ?? 0) + 1;
      });

      return {
        communities: (communities ?? []).map((c) => ({
          ...c,
          membersCount: memberCounts[c.id] ?? 0,
        })),
        total: count ?? 0,
      };
    },
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // .select().single() turns a silent RLS no-op (0 rows deleted) into
      // a thrown error instead of a false "success" toast.
      const { error } = await supabase.from("communities").delete().eq("id", id).select().single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count", "communities"] });
      toast.success("Community deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete community"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.allSettled(ids.map(async (id) => {
      const { error } = await supabase.from("communities").delete().eq("id", id).select().single();
      if (error) throw error;
    })),
    onSuccess: (results) => {
      const deleted = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - deleted;
      queryClient.invalidateQueries({ queryKey: ["admin-communities"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count", "communities"] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      if (failed) toast.error(`${deleted} of ${results.length} deleted — ${failed} failed`);
      else toast.success(`${deleted} communities deleted`);
    },
    onError: () => toast.error("Failed to delete selected communities"),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Communities</h1>
        <p className="text-muted-foreground">Manage all communities on the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Communities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {selectedIds.length > 0 && <div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm text-muted-foreground">{selectedIds.length} selected</p><Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete Selected</Button></div>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox checked={!!data?.communities.length && data.communities.every((community) => selectedIds.includes(community.id))} onCheckedChange={(checked) => setSelectedIds(checked ? (data?.communities.map((community) => community.id) ?? []) : [])} aria-label="Select all communities" /></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Owner</TableHead>
                  <TableHead className="text-center">
                    <UsersRound className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.communities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No communities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.communities.map((c) => {
                    const owner = c.profiles as unknown as { name: string } | null;
                    return (
                      <TableRow key={c.id}>
                        <TableCell><Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...new Set([...ids, c.id])] : ids.filter((id) => id !== c.id))} aria-label={`Select community ${c.id}`} /></TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.category}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {owner?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-center text-sm">{c.membersCount}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(c.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(`/communities/${c.id}`, "_blank")}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Community
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(c.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Community
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} of{" "}
                {data?.total ?? 0}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => {
        if (!open && !deleteMutation.isPending) setDeleteId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The community, its members, and all related data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (deleteId) deleteMutation.mutate(deleteId);
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!open && !bulkDeleteMutation.isPending) setBulkDeleteOpen(false); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.length} communities?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={bulkDeleteMutation.isPending} onClick={(event) => { event.preventDefault(); bulkDeleteMutation.mutate(selectedIds); }}>{bulkDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
