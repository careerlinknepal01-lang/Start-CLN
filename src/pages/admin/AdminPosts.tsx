import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Trash2, ChevronLeft, ChevronRight, Heart, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/UserAvatar";
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
import { AdminInlineError } from "@/features/admin/components/AdminInlineError";
import { AdminPageHeader } from "@/features/admin/components/AdminPageHeader";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { BulkActionBar } from "@/features/admin/components/BulkActionBar";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { EmptyStateRow } from "@/features/admin/components/EmptyStateRow";
import { TableSkeletonRows } from "@/features/admin/components/TableSkeletonRows";

const PAGE_SIZE = 10;

export default function AdminPosts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-posts", page],
    queryFn: async () => {
      const { data: posts, count, error } = await supabase
        .from("feed_posts")
        .select(
          "id, content, type, created_at, author_id, profiles:author_id(name, avatar_url)",
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      const postIds = (posts ?? []).map((p) => p.id);

      const [likesRes, commentsRes] = await Promise.all([
        supabase
          .from("feed_post_likes")
          .select("post_id")
          .in("post_id", postIds),
        supabase
          .from("feed_post_comments")
          .select("post_id")
          .in("post_id", postIds),
      ]);

      const likeCounts: Record<string, number> = {};
      const commentCounts: Record<string, number> = {};

      (likesRes.data ?? []).forEach((l) => {
        likeCounts[l.post_id] = (likeCounts[l.post_id] ?? 0) + 1;
      });
      (commentsRes.data ?? []).forEach((c) => {
        commentCounts[c.post_id] = (commentCounts[c.post_id] ?? 0) + 1;
      });

      return {
        posts: (posts ?? []).map((p) => ({
          ...p,
          likes: likeCounts[p.id] ?? 0,
          comments: commentCounts[p.id] ?? 0,
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
      const { error } = await supabase.from("feed_posts").delete().eq("id", id).select().single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count", "feed_posts"] });
      toast.success("Post deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete post"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.allSettled(ids.map(async (id) => {
      const { error } = await supabase.from("feed_posts").delete().eq("id", id).select().single();
      if (error) throw error;
    })),
    onSuccess: (results) => {
      const deleted = results.filter((result) => result.status === "fulfilled").length;
      const failed = results.length - deleted;
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-count", "feed_posts"] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      if (failed) toast.error(`${deleted} of ${results.length} deleted — ${failed} failed`);
      else toast.success(`${deleted} posts deleted`);
    },
    onError: () => toast.error("Failed to delete selected posts"),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Posts" subtitle="Manage all posts across the platform." />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Posts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <BulkActionBar count={selectedIds.length} actions={[{ label: "Delete Selected", destructive: true, onClick: () => setBulkDeleteOpen(true) }]} />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox checked={!!data?.posts.length && data.posts.every((post) => selectedIds.includes(post.id))} onCheckedChange={(checked) => setSelectedIds(checked ? (data?.posts.map((post) => post.id) ?? []) : [])} aria-label="Select all posts" /></TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-center">
                    <Heart className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead className="text-center">
                    <MessageCircle className="inline h-4 w-4" />
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isError ? (
                  <TableRow><TableCell colSpan={7}><AdminInlineError /></TableCell></TableRow>
                ) : isLoading ? (
                  <TableSkeletonRows columns={7} />
                ) : data?.posts.length === 0 ? (
                  <EmptyStateRow colSpan={7} message="No posts found." />
                ) : (
                  data?.posts.map((p) => {
                    const author = p.profiles as unknown as { name: string; avatar_url: string | null } | null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell><Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...new Set([...ids, p.id])] : ids.filter((id) => id !== p.id))} aria-label={`Select post ${p.id}`} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={author?.name} url={author?.avatar_url} className="h-7 w-7" />
                            <span className="text-sm font-medium truncate max-w-[120px]">{author?.name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm truncate max-w-[250px]">{p.content}</span>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{p.type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(p.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-center text-sm">{p.likes}</TableCell>
                        <TableCell className="text-center text-sm">{p.comments}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Open post actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => window.open(`/posts/${p.id}`, "_blank", "noopener,noreferrer")}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Post
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Post
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

          <AdminPagination page={page} pageSize={PAGE_SIZE} total={data?.total ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} title="Delete Post" description="This action cannot be undone. The post and all its likes, comments, and reports will be permanently removed." confirmLabel="Delete" pending={deleteMutation.isPending} onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); }} />

      <ConfirmDeleteDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} title={`Delete ${selectedIds.length} posts?`} description="This action cannot be undone." confirmLabel="Delete" pending={bulkDeleteMutation.isPending} onConfirm={() => bulkDeleteMutation.mutate(selectedIds)} />
    </div>
  );
}

