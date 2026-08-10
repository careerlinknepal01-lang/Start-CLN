import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, Loader2, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const PAGE_SIZE = 10;

type Event = {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string | null;
  created_at: string;
  profiles: unknown;
  communities: unknown;
};

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-events", search, page],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("id, title, type, date, location, created_at, creator_id, community_id, profiles:creator_id(name), communities:community_id(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,location.ilike.%${search.trim()}%`);
      }

      const { data: events, count, error } = await query;
      if (error) throw error;
      return { events: (events ?? []) as Event[], total: count ?? 0 };
    },
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id).select().single();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success("Event deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete event"),
  });

  const bulkDeleteMutation = useMutation({ mutationFn: async (ids: string[]) => Promise.allSettled(ids.map(async (id) => { const { error } = await supabase.from("events").delete().eq("id", id).select().single(); if (error) throw error; })), onSuccess: (results) => { const deleted = results.filter((result) => result.status === "fulfilled").length; const failed = results.length - deleted; queryClient.invalidateQueries({ queryKey: ["admin-events"] }); setSelectedIds([]); setBulkDeleteOpen(false); if (failed) toast.error(`${deleted} of ${results.length} deleted — ${failed} failed`); else toast.success(`${deleted} events deleted`); }, onError: () => toast.error("Failed to delete selected events") });
  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold tracking-tight">Events</h1><p className="text-muted-foreground">Manage events across the platform.</p></div>
    <Card><CardHeader className="flex-row items-center justify-between gap-4 space-y-0"><CardTitle className="text-lg">All Events</CardTitle><div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search events…" className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} /></div></CardHeader><CardContent className="p-0">{selectedIds.length > 0 && <div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm text-muted-foreground">{selectedIds.length} selected</p><Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete Selected</Button></div>}<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="w-12"><Checkbox checked={!!data?.events.length && data.events.every((event) => selectedIds.includes(event.id))} onCheckedChange={(checked) => setSelectedIds(checked ? (data?.events.map((event) => event.id) ?? []) : [])} /></TableHead><TableHead>Event</TableHead><TableHead>Type</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableHead className="hidden md:table-cell">Location</TableHead><TableHead className="hidden md:table-cell">Creator</TableHead><TableHead className="hidden lg:table-cell">Community</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>
      {isLoading ? Array.from({ length: PAGE_SIZE }).map((_, index) => <TableRow key={index}><TableCell><Skeleton className="h-4 w-4" /></TableCell><TableCell><Skeleton className="h-4 w-36" /></TableCell><TableCell><Skeleton className="h-5 w-16" /></TableCell><TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell><TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell><TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell><TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="h-8 w-8" /></TableCell></TableRow>) : data?.events.length === 0 ? <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No events found.</TableCell></TableRow> : data?.events.map((event) => {
        const creator = event.profiles as { name: string } | null;
        const community = event.communities as { name: string } | null;
        return <TableRow key={event.id}><TableCell><Checkbox checked={selectedIds.includes(event.id)} onCheckedChange={(checked) => setSelectedIds((ids) => checked ? [...new Set([...ids, event.id])] : ids.filter((id) => id !== event.id))} /></TableCell><TableCell><p className="max-w-[200px] truncate text-sm font-medium">{event.title}</p></TableCell><TableCell><Badge variant="secondary">{event.type}</Badge></TableCell><TableCell className="hidden sm:table-cell whitespace-nowrap text-sm text-muted-foreground">{format(new Date(event.date), "MMM d, yyyy")}</TableCell><TableCell className="hidden md:table-cell text-sm text-muted-foreground">{event.location || "—"}</TableCell><TableCell className="hidden md:table-cell text-sm text-muted-foreground">{creator?.name || "Unknown"}</TableCell><TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{community?.name || "—"}</TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => window.open(`/events/${event.id}`, "_blank")}><Eye className="mr-2 h-4 w-4" />View Event</DropdownMenuItem><DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteId(event.id)}><Trash2 className="mr-2 h-4 w-4" />Delete Event</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>;
      })}
    </TableBody></Table></div>{totalPages > 1 && <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-sm text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0}</p><div className="flex gap-1"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage((current) => current - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage((current) => current + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>}</CardContent></Card>
    <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open && !deleteMutation.isPending) setDeleteId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Event</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. The event and all related data will be permanently removed.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); if (deleteId) deleteMutation.mutate(deleteId); }}>{deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!open && !bulkDeleteMutation.isPending) setBulkDeleteOpen(false); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete {selectedIds.length} events?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={bulkDeleteMutation.isPending} onClick={(event) => { event.preventDefault(); bulkDeleteMutation.mutate(selectedIds); }}>{bulkDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

