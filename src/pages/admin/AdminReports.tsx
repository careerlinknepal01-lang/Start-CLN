import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AdminInlineError } from "@/features/admin/components/AdminInlineError";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { BulkActionBar } from "@/features/admin/components/BulkActionBar";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { EmptyStateRow } from "@/features/admin/components/EmptyStateRow";
import { TableSkeletonRows } from "@/features/admin/components/TableSkeletonRows";

const PAGE_SIZE = 10;
type StatusFilter = "all" | "pending" | "resolved";

export default function AdminReports() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkResolveOpen, setBulkResolveOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-reports", statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("feed_post_reports")
        .select(
          `id, reason, created_at, status,
           post_id,
           reporter:user_id(name, email),
           post:post_id(id, content, author_id)`,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { reports: data ?? [], total: count ?? 0 };
    },
    staleTime: 30_000,
  });

  const resolveMutation = useMutation({
    mutationFn: async (reportId: string) => {
      // .select().single() turns a silent RLS no-op (0 rows updated) into
      // a thrown error instead of a false "success" toast.
      const { error } = await supabase
        .from("feed_post_reports")
        .update({ status: "resolved" })
        .eq("id", reportId)
        .select()
        .single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report marked as resolved");
    },
    onError: () => toast.error("Failed to resolve report"),
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      // .select().single() turns a silent RLS no-op (0 rows deleted) into
      // a thrown error instead of a false "success" toast.
      const { error } = await supabase.from("feed_posts").delete().eq("id", postId).select().single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count"] });
      toast.success("Reported post deleted");
      setDeletePostId(null);
    },
    onError: () => toast.error("Failed to delete post"),
  });

  const bulkResolveMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.allSettled(ids.map(async (id) => {
      const { error } = await supabase.from("feed_post_reports").update({ status: "resolved" }).eq("id", id).select().single();
      if (error) throw error;
    })),
    onSuccess: (results) => {
      const resolved = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - resolved;
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setSelectedIds([]); setBulkResolveOpen(false);
      if (failed) toast.error(`${resolved} of ${results.length} resolved — ${failed} failed`); else toast.success(`${resolved} reports resolved`);
    }, onError: () => toast.error("Failed to resolve selected reports"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (postIds: string[]) => Promise.allSettled(postIds.map(async (id) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", id).select().single();
      if (error) throw error;
    })),
    onSuccess: (results) => {
      const deleted = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - deleted;
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] }); queryClient.invalidateQueries({ queryKey: ["admin-posts"] }); queryClient.invalidateQueries({ queryKey: ["admin-count", "feed_posts"] });
      setSelectedIds([]); setBulkDeleteOpen(false);
      if (failed) toast.error(`${deleted} of ${results.length} deleted — ${failed} failed`); else toast.success(`${deleted} posts deleted`);
    }, onError: () => toast.error("Failed to delete selected posts"),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reports" subtitle="Review and moderate reported content." />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-lg">All Reports</CardTitle>
          <Tabs
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as StatusFilter);
              setPage(0);
            }}
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <BulkActionBar count={selectedIds.length} actions={[{ label: "Resolve Selected", onClick: () => setBulkResolveOpen(true) }, { label: "Delete Selected", destructive: true, onClick: () => setBulkDeleteOpen(true) }]} />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox checked={!!data?.reports.length && data.reports.every((report) => selectedIds.includes(report.id))} onCheckedChange={(checked) => setSelectedIds(checked ? (data?.reports.map((report) => report.id) ?? []) : [])} aria-label="Select all reports" /></TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported Content</TableHead>
                  <TableHead className="hidden sm:table-cell">Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isError ? (
                  <TableRow><TableCell colSpan={7}><AdminInlineError /></TableCell></TableRow>
                ) : isLoading ? (
                  <TableSkeletonRows columns={7} />
                ) : data?.reports.length === 0 ? (
                  <EmptyStateRow colSpan={7} message="No reports found." />
                ) : (
                  data?.reports.map((r) => {
                    const reporter = r.reporter as unknown as { name: string; email: string } | null;
                    const post = r.post as unknown as { id: string; content: string; author_id: string } | null;
                    const status = (r as Record<string, unknown>).status as string | undefined;
                    return (
                      <TableRow key={r.id}>
                        <TableCell><Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...new Set([...ids, r.id])] : ids.filter((id) => id !== r.id))} aria-label={`Select report ${r.id}`} /></TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{reporter?.name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground truncate">{reporter?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[200px]">{post?.content || "Post deleted"}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {r.reason}
                        </TableCell>
                        <TableCell>
                          {status === "resolved" ? (
                            <Badge variant="success" className="border-none">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="border-none">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(r.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {status !== "resolved" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-success hover:text-success/80"
                                onClick={() => resolveMutation.mutate(r.id)}
                                title="Mark Resolved"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {post && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeletePostId(post.id)}
                                title="Delete Post"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <AdminPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)} title="Delete Reported Post" description="This action cannot be undone. The post and all related data will be permanently removed." confirmLabel="Delete" pending={deletePostMutation.isPending} onConfirm={() => { if (deletePostId) deletePostMutation.mutate(deletePostId); }} />

      <AlertDialog open={bulkResolveOpen} onOpenChange={(open) => { if (!open && !bulkResolveMutation.isPending) setBulkResolveOpen(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Resolve {selectedIds.length} reports?</AlertDialogTitle><AlertDialogDescription>Selected reports will be marked as resolved.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={bulkResolveMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction disabled={bulkResolveMutation.isPending} onClick={(event) => { event.preventDefault(); bulkResolveMutation.mutate(selectedIds); }}>{bulkResolveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Resolve</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!open && !bulkDeleteMutation.isPending) setBulkDeleteOpen(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete selected reported posts?</AlertDialogTitle><AlertDialogDescription>Posts attached to the selected reports will be permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={bulkDeleteMutation.isPending} onClick={(event) => { event.preventDefault(); const postIds = Array.from(new Set((data?.reports ?? []).filter((report) => selectedIds.includes(report.id)).map((report) => report.post_id))); bulkDeleteMutation.mutate(postIds); }}>{bulkDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

