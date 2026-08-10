import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, Loader2, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const PAGE_SIZE = 10;

type Question = { id: string; title: string; content: string; tags: string[] | null; upvotes: number | null; created_at: string; profiles: unknown; answers: number };

export default function AdminQA() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailsQuestion, setDetailsQuestion] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-qa", search, page],
    queryFn: async () => {
      let query = supabase.from("qa_posts").select("id, title, content, tags, upvotes, created_at, author_id, profiles:author_id(name)", { count: "exact" }).order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (search.trim()) query = query.ilike("title", `%${search.trim()}%`);
      const { data: questions, count, error } = await query;
      if (error) throw error;
      const ids = (questions ?? []).map((question) => question.id);
      const { data: answers, error: answersError } = await supabase.from("qa_answers").select("post_id").in("post_id", ids);
      if (answersError) throw answersError;
      const answerCounts: Record<string, number> = {};
      (answers ?? []).forEach((answer) => { answerCounts[answer.post_id] = (answerCounts[answer.post_id] ?? 0) + 1; });
      return { questions: (questions ?? []).map((question) => ({ ...question, answers: answerCounts[question.id] ?? 0 })) as Question[], total: count ?? 0 };
    }, staleTime: 30_000,
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("qa_posts").delete().eq("id", id).select().single(); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-qa"] }); toast.success("Question deleted"); setDeleteId(null); },
    onError: () => toast.error("Failed to delete question"),
  });
  const bulkDeleteMutation = useMutation({ mutationFn: async (ids: string[]) => Promise.allSettled(ids.map(async (id) => { const { error } = await supabase.from("qa_posts").delete().eq("id", id).select().single(); if (error) throw error; })), onSuccess: (results) => { const deleted = results.filter((result) => result.status === "fulfilled").length; const failed = results.length - deleted; queryClient.invalidateQueries({ queryKey: ["admin-qa"] }); setSelectedIds([]); setBulkDeleteOpen(false); if (failed) toast.error(`${deleted} of ${results.length} deleted — ${failed} failed`); else toast.success(`${deleted} questions deleted`); }, onError: () => toast.error("Failed to delete selected questions") });
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold tracking-tight">Q&amp;A</h1><p className="text-muted-foreground">Manage questions across the platform.</p></div><Card><CardHeader className="flex-row items-center justify-between gap-4 space-y-0"><CardTitle className="text-lg">All Questions</CardTitle><div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search questions…" className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></div></CardHeader><CardContent className="p-0">{selectedIds.length > 0 && <div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm text-muted-foreground">{selectedIds.length} selected</p><Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete Selected</Button></div>}<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="w-12"><Checkbox checked={!!data?.questions.length && data.questions.every((question) => selectedIds.includes(question.id))} onCheckedChange={(checked) => setSelectedIds(checked ? (data?.questions.map((question) => question.id) ?? []) : [])} /></TableHead><TableHead>Question</TableHead><TableHead className="hidden sm:table-cell">Author</TableHead><TableHead className="text-center">Upvotes</TableHead><TableHead className="text-center">Answers</TableHead><TableHead className="hidden md:table-cell">Created</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>
    {isLoading ? Array.from({ length: PAGE_SIZE }).map((_, index) => <TableRow key={index}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-48" /></TableCell><TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="mx-auto h-4 w-8" /></TableCell><TableCell><Skeleton className="mx-auto h-4 w-8" /></TableCell><TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-8 w-8" /></TableCell></TableRow>) : data?.questions.length === 0 ? <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">No questions found.</TableCell></TableRow> : data?.questions.map((question) => { const author = question.profiles as { name: string } | null; return <TableRow key={question.id}><TableCell><Checkbox checked={selectedIds.includes(question.id)} onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...new Set([...ids, question.id])] : ids.filter((id) => id !== question.id))} /></TableCell><TableCell><p className="max-w-[280px] truncate text-sm font-medium">{question.title}</p></TableCell><TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{author?.name || "Unknown"}</TableCell><TableCell className="text-center text-sm">{question.upvotes ?? 0}</TableCell><TableCell className="text-center text-sm">{question.answers}</TableCell><TableCell className="hidden md:table-cell whitespace-nowrap text-sm text-muted-foreground">{format(new Date(question.created_at), "MMM d, yyyy")}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setDetailsQuestion(question)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(question.id)}><Trash2 className="mr-2 h-4 w-4" />Delete Question</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>; })}
  </TableBody></Table></div>{totalPages > 1 && <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-sm text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0}</p><div className="flex gap-1"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage((current) => current - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>}</CardContent></Card>
  <Dialog open={!!detailsQuestion} onOpenChange={(open) => { if (!open) setDetailsQuestion(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{detailsQuestion?.title}</DialogTitle></DialogHeader><div className="space-y-4 text-sm"><p className="text-muted-foreground">Tags: {detailsQuestion?.tags?.join(", ") || "—"}</p><p className="whitespace-pre-wrap">{detailsQuestion?.content}</p></div></DialogContent></Dialog>
  <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Question</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. The question and all of its answers will be permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); if (deleteId) deleteMutation.mutate(deleteId); }}>{deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!open && !bulkDeleteMutation.isPending) setBulkDeleteOpen(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.length} questions?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={bulkDeleteMutation.isPending} onClick={(event) => { event.preventDefault(); bulkDeleteMutation.mutate(selectedIds); }}>{bulkDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

