import { useParams, Link } from "react-router-dom";
import { useTopicBySlug, useTopicArticles } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Calendar,
  Newspaper,
  Flame,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function TopicDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: topic, isLoading: topicLoading } = useTopicBySlug(slug);
  const { data: articles, isLoading: articlesLoading } = useTopicArticles(topic?.id);

  // Search for related CareerLink posts
  const { data: relatedPosts } = useQuery({
    queryKey: ["topic_related_posts", topic?.topic_name],
    queryFn: async () => {
      if (!topic?.topic_name) return [];
      const { data, error } = await supabase
        .from("feed_posts")
        .select("id, content, created_at, author_id, profiles:profiles!feed_posts_author_id_fkey(name, avatar_url)")
        .ilike("content", `%${topic.topic_name}%`)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!topic?.topic_name,
  });

  // Search for related events
  const { data: relatedEvents } = useQuery({
    queryKey: ["topic_related_events", topic?.topic_name],
    queryFn: async () => {
      if (!topic?.topic_name) return [];
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, location, type")
        .or(`title.ilike.%${topic.topic_name}%,description.ilike.%${topic.topic_name}%`)
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(3);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!topic?.topic_name,
  });

  if (topicLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl space-y-6 pb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!topic) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl text-center py-20">
          <TrendingUp className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Topic not found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This topic may have expired or doesn't exist.
          </p>
          <Link to="/feed">
            <Button variant="outline" className="mt-4">Back to Feed</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        {/* Back button */}
        <Link to="/feed">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Feed
          </Button>
        </Link>

        {/* Topic Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="uppercase text-xs font-bold">
              {topic.category}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Trending globally
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Flame className="h-7 w-7 text-orange-500 shrink-0" />
            {topic.topic_name}
          </h1>

          {topic.description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {topic.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Newspaper className="h-4 w-4" />
              {topic.article_count} article{topic.article_count !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {topic.source_diversity} source{topic.source_diversity !== 1 ? "s" : ""}
            </span>
            {topic.first_seen_at && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Since {format(new Date(topic.first_seen_at), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {/* Relevant fields */}
          {topic.relevant_fields && topic.relevant_fields.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground font-medium">Relevant for:</span>
              {topic.relevant_fields.map((field) => (
                <Badge key={field} variant="outline" className="text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Latest Coverage */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Latest Coverage
          </h2>

          {articlesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map((article) => (
                <a
                  key={article.id}
                  href={article.article_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="overflow-hidden hover:border-primary/30 hover:shadow-md transition group">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {article.article_image_url && (
                          <img
                            src={article.article_image_url}
                            alt=""
                            className="w-20 h-16 object-cover rounded-lg shrink-0 bg-muted"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-foreground group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                            {article.article_title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {article.source_name && (
                              <span className="font-medium">{article.source_name}</span>
                            )}
                            {article.article_published_at && (
                              <>
                                <span>·</span>
                                <span>{format(new Date(article.article_published_at), "MMM d, yyyy")}</span>
                              </>
                            )}
                            <ExternalLink className="h-3 w-3 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No articles available for this topic.</p>
          )}
        </div>

        {/* Related CareerLink Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Related CareerLink Posts
            </h2>
            <div className="space-y-2">
              {relatedPosts.map((post: any) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="block p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition"
                >
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {post.profiles?.name && `by ${post.profiles.name} · `}
                    {format(new Date(post.created_at), "MMM d")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Events */}
        {relatedEvents && relatedEvents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Related Events
            </h2>
            <div className="space-y-2">
              {relatedEvents.map((event: any) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block p-3 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition"
                >
                  <p className="text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(event.date), "MMM d, yyyy · h:mm a")}
                    {event.location && ` · ${event.location}`}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
