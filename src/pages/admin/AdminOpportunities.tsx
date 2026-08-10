import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, Loader2, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
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

type Opportunity = {
  id: string;
  title: string;
  type: string;
  description: string;
  company_name: string | null;
  location: string | null;
  stipend: string | null;
  deadline: string | null;
  created_at: string;
  profiles: unknown;
};

export default function AdminOpportunities() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailsOpportunity, setDetailsOpportunity] = useState<Opportunity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-opportunities", search, page],
    queryFn: async () => {
      let query = supabase
        .from("opportunities")
        .select("id, title, type, description, company_name, location, stipend, deadline, created_at, creator_id, profiles:creator_id(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,company_name.ilike.%${search.trim()}%`);
      }

      const { data: opportunities, count, error } = await query;
      if (error) throw error;
      return { opportunities: (opportunities ?? []) as Opportunity[], total: count ?? 0 };
    },
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").delete().eq("id", id).select().single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-opportunities"] });
      toast.success("Opportunity deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete opportunity"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.allSettled(ids.map(async (id) => { const { error } = await supabase.from("opportunities").delete().eq("id", id).select().single(); if (error) throw error; })),
    onSuccess: (results) => { const deleted = results.filter((result) => result.status === "fulfilled").length; const failed = results.length - deleted; queryClient.invalidateQueries({ queryKey: ["admin-opportunities"] }); setSelectedIds([]); setBulkDeleteOpen(false); if (failed) toast.error(`${deleted} of ${results.length} deleted — ${failed} failed`); else toast.success(`${deleted} opportunities deleted`); },
    onError: () => toast.error("Failed to delete selected opportunities"),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Opportunities</h1><p className="text-muted-foreground">Manage opportunities across the platform.</p></div>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0"><CardTitle className="text-lg">All Opportunities</CardTitle><div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search opportunities…" className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></div></CardHeader>
        <CardContent className="p-0">{selectedIds.length > 0 && <div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm text-muted-foreground">{selectedIds.length} selected</p><Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete Selected</Button></div>}<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="w-12"><Checkbox checked={!!data?.opportunities.length && data.opportunities.every((opportunity) => selectedIds.includes(opportunity.id))} onCheckedChange={(checked) => setSelectedIds(checked ? (data?.opportunities.map((opportunity) => opportunity.id) ?? []) : [])} /></TableHead><TableHead>Opportunity</TableHead><TableHead>Type</TableHead><TableHead className="hidden sm:table-cell">Company</TableHead><TableHead className="hidden md:table-cell">Creator</TableHead><TableHead className="hidden md:table-cell">Deadline</TableHead><TableHead className="hidden md:table-cell">Created</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>
          {isLoading ? Array.from({ length: PAGE_SIZE }).map((_, index) => <TableRow key={index}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-36" /></TableCell><TableCell><Skeleton className="h-5 w-16" /></TableCell><TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-28" /></TableCell><TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell><TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell><TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-8 w-8" /></TableCell></TableRow>) : data?.opportunities.length === 0 ? <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No opportunities found.</TableCell></TableRow> : data?.opportunities.map((opportunity) => {
            const creator = opportunity.profiles as { name: string } | null;
            return <TableRow key={opportunity.id}><TableCell><Checkbox checked={selectedIds.includes(opportunity.id)} onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...new Set([...ids, opportunity.id])] : ids.filter((id) => id !== opportunity.id))} /></TableCell><TableCell><p className="max-w-[220px] truncate text-sm font-medium">{opportunity.title}</p></TableCell><TableCell><Badge variant="secondary">{opportunity.type}</Badge></TableCell><TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{opportunity.company_name || "—"}</TableCell><TableCell className="hidden md:table-cell text-sm text-muted-foreground">{creator?.name || "Unknown"}</TableCell><TableCell className="hidden md:table-cell whitespace-nowrap text-sm text-muted-foreground">{opportunity.deadline ? format(new Date(opportunity.deadline), "MMM d, yyyy") : "—"}</TableCell><TableCell className="hidden md:table-cell whitespace-nowrap text-sm text-muted-foreground">{format(new Date(opportunity.created_at), "MMM d, yyyy")}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => setDetailsOpportunity(opportunity)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(opportunity.id)}><Trash2 className="mr-2 h-4 w-4" />Delete Opportunity</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>;
          })}
        </TableBody></Table></div>
        {totalPages > 1 && <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-sm text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0}</p><div className="flex gap-1"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage((current) => current - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>}
        </CardContent>
      </Card>
      <Dialog open={!!detailsOpportunity} onOpenChange={(open) => { if (!open) setDetailsOpportunity(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{detailsOpportunity?.title}</DialogTitle></DialogHeader><div className="space-y-4 text-sm"><div className="grid grid-cols-2 gap-3 text-muted-foreground"><span>Type: {detailsOpportunity?.type}</span><span>Company: {detailsOpportunity?.company_name || "—"}</span><span>Location: {detailsOpportunity?.location || "—"}</span><span>Stipend: {detailsOpportunity?.stipend || "—"}</span><span>Deadline: {detailsOpportunity?.deadline ? format(new Date(detailsOpportunity.deadline), "MMM d, yyyy") : "—"}</span></div><p className="whitespace-pre-wrap">{detailsOpportunity?.description}</p></div></DialogContent></Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Opportunity</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. The opportunity and all related data will be permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); if (deleteId) deleteMutation.mutate(deleteId); }}>{deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!open && !bulkDeleteMutation.isPending) setBulkDeleteOpen(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.length} opportunities?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={bulkDeleteMutation.isPending} onClick={(event) => { event.preventDefault(); bulkDeleteMutation.mutate(selectedIds); }}>{bulkDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

