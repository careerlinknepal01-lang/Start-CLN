import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Range = 30 | 90;

function createGrowthBuckets(days: Range) {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, index) => {
    const date = subDays(today, days - index - 1);
    return {
      date: format(date, "yyyy-MM-dd"),
      label: format(date, days === 30 ? "MMM d" : "MMM d"),
      signups: 0,
      posts: 0,
    };
  });
}

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>(30);

  const growth = useQuery({
    queryKey: ["admin-analytics-growth", range],
    queryFn: async () => {
      const since = startOfDay(subDays(new Date(), range - 1)).toISOString();
      const [profilesResult, postsResult] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", since),
        supabase.from("feed_posts").select("created_at").gte("created_at", since),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (postsResult.error) throw postsResult.error;

      const buckets = createGrowthBuckets(range);
      const bucketByDate = new Map(buckets.map((bucket) => [bucket.date, bucket]));

      (profilesResult.data ?? []).forEach(({ created_at }) => {
        const bucket = bucketByDate.get(format(new Date(created_at), "yyyy-MM-dd"));
        if (bucket) bucket.signups += 1;
      });

      (postsResult.data ?? []).forEach(({ created_at }) => {
        const bucket = bucketByDate.get(format(new Date(created_at), "yyyy-MM-dd"));
        if (bucket) bucket.posts += 1;
      });

      return buckets;
    },
    staleTime: 60_000,
  });

  const watchlist = useQuery({
    queryKey: ["admin-analytics-watchlist"],
    queryFn: async () => {
      const since = startOfDay(subDays(new Date(), 29)).toISOString();
      const { data, error } = await supabase
        .from("feed_post_reports")
        .select("post_id, post:post_id(content)")
        .gte("created_at", since);

      if (error) throw error;

      const posts = new Map<string, { content: string; reports: number }>();
      (data ?? []).forEach((report) => {
        const post = report.post as unknown as { content: string } | null;
        const existing = posts.get(report.post_id);
        posts.set(report.post_id, {
          content: post?.content ?? "Post deleted",
          reports: (existing?.reports ?? 0) + 1,
        });
      });

      return Array.from(posts.entries())
        .map(([id, post]) => ({ id, ...post }))
        .sort((a, b) => b.reports - a.reports)
        .slice(0, 5);
    },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Monitor platform growth and moderation trends.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-lg">Platform Growth</CardTitle>
          <Tabs value={String(range)} onValueChange={(value) => setRange(Number(value) as Range)}>
            <TabsList>
              <TabsTrigger value="30">Last 30 days</TabsTrigger>
              <TabsTrigger value="90">Last 90 days</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {growth.isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : growth.data?.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No growth data found.</p>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth.data} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={range === 30 ? 24 : 48}
                    className="fill-muted-foreground text-xs"
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="fill-muted-foreground text-xs" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="signups" name="Signups" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="posts" name="Posts" stroke="#059669" fill="#059669" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Reported Posts</CardTitle>
          <p className="text-sm text-muted-foreground">Posts with the most reports in the last 30 days.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead className="text-right">Reports</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchlist.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : watchlist.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="py-12 text-center text-muted-foreground">
                      No reported posts in the last 30 days.
                    </TableCell>
                  </TableRow>
                ) : (
                  watchlist.data?.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="max-w-[420px] truncate text-sm">{post.content}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{post.reports}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
