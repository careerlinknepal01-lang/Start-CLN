import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, MoreHorizontal, Eye, Ban, Trash2, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, page],
    queryFn: async () => {
      // Query profiles directly — admin_users_view joins auth.users which is
      // inaccessible to regular authenticated users, so the view always returns
      // 0 rows. Profiles has an open SELECT policy for authenticated users.
      let query = supabase
        .from("profiles")
        .select("id, name, avatar_url, college, created_at, role, is_verified", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { users: data ?? [], total: count ?? 0 };
    },
    staleTime: 30_000,
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, suspended }: { id: string; suspended: boolean }) => {
      // .select().single() turns a silent RLS no-op (0 rows updated) into
      // a thrown error instead of a false "success" toast.
      const { error } = await supabase
        .from("profiles")
        .update({ role: suspended ? "suspended" : "user" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
    },
    onSuccess: (_, { suspended }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(suspended ? "User suspended" : "User unsuspended");
    },
    onError: () => toast.error("Failed to update user status"),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: verified })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
    },
    onSuccess: (_, { verified }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(verified ? "User verified" : "Verification removed");
    },
    onError: () => toast.error("Failed to update verification status"),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const roleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage all registered users on the platform.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-lg">All Users</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name…"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">University</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><div><Skeleton className="h-4 w-28 mb-1" /><Skeleton className="h-3 w-36" /></div></div></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={u.name} url={u.avatar_url} className="h-8 w-8" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="truncate text-sm font-medium">{u.name}</p>
                              {u.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{u.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.college || "—"}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/profile/${u.id}`, "_blank")}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => verifyMutation.mutate({ id: u.id, verified: !u.is_verified })}
                            >
                              <BadgeCheck className="mr-2 h-4 w-4" />
                              {u.is_verified ? "Remove Verification" : "Verify User"}
                            </DropdownMenuItem>
                            {u.role !== "admin" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  suspendMutation.mutate({
                                    id: u.id,
                                    suspended: u.role !== "suspended",
                                  })
                                }
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                {u.role === "suspended" ? "Unsuspend" : "Suspend"}
                              </DropdownMenuItem>
                            )}
                            {u.role !== "admin" && (
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  toast.info(
                                    "Full account deletion will be available after the secure server-side deletion flow is implemented."
                                  );
                                }}
                                title="Full account deletion will be available after the secure server-side deletion flow is implemented."
                                className="text-muted-foreground focus:bg-transparent focus:text-muted-foreground cursor-not-allowed"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                                <Badge variant="outline" className="ml-auto text-[10px] font-normal">
                                  Soon
                                </Badge>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
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
    </div>
  );
}
