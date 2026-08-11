import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Network, Flag } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { StatCard } from "@/features/admin/components/StatCard";

function useCount(table: "profiles" | "feed_posts" | "communities" | "feed_post_reports") {
  return useQuery({
    queryKey: ["admin-count", table],
    queryFn: async () => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

function useRecentUsers() {
  return useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url, college, created_at, role")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

function useRecentPosts() {
  return useQuery({
    queryKey: ["admin-recent-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("id, content, type, created_at, author_id, profiles:author_id(name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });
}

function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function AdminDashboard() {
  const users = useCount("profiles");
  const posts = useCount("feed_posts");
  const communities = useCount("communities");
  const reports = useCount("feed_post_reports");
  const recentUsers = useRecentUsers();
  const recentPosts = useRecentPosts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform activity.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={users.data} icon={Users} isLoading={users.isLoading} iconClassName="bg-primary/10 text-primary" />
        <StatCard label="Total Posts" value={posts.data} icon={FileText} isLoading={posts.isLoading} iconClassName="bg-success/10 text-success" />
        <StatCard label="Total Communities" value={communities.data} icon={Network} isLoading={communities.isLoading} iconClassName="bg-warning/10 text-warning" />
        <StatCard label="Total Reports" value={reports.data} icon={Flag} isLoading={reports.isLoading} iconClassName="bg-destructive/10 text-destructive" />
      </div>

      {/* Recent Data */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently Registered Users</CardTitle>
            <CardDescription>Latest 5 users who joined the platform.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">University</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.isLoading ? (
                  <TableSkeleton rows={5} cols={3} />
                ) : recentUsers.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No users yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentUsers.data?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={u.name} url={u.avatar_url} className="h-8 w-8" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {u.college || "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recently Created Posts</CardTitle>
            <CardDescription>Latest 5 posts on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPosts.isLoading ? (
                  <TableSkeleton rows={5} cols={3} />
                ) : recentPosts.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No posts yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentPosts.data?.map((p) => {
                    const author = p.profiles as unknown as { name: string; avatar_url: string | null } | null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={author?.name} url={author?.avatar_url} className="h-7 w-7" />
                            <span className="text-sm font-medium truncate max-w-[100px]">{author?.name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm truncate max-w-[180px]">{p.content}</span>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{p.type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(p.created_at), "MMM d")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
