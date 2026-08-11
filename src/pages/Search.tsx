import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, Users, FileText, Globe, Calendar, UserPlus, ExternalLink, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { AdvancedSearch, SearchResult } from "@/lib/search";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = searchParams.get("tab") || "all";
  
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialTab);

  // We only fetch when the user presses Enter or clicks Search, to avoid excessive queries
  const { data: results, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["advancedSearch", initialQuery],
    queryFn: () => AdvancedSearch(initialQuery, 20),
    enabled: !!initialQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query.trim(), tab: activeTab });
    // React Query will automatically refetch because queryKey depends on searchParams.get("q")
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams(prev => {
      prev.set("tab", value);
      return prev;
    });
  };

  const filteredResults = useMemo(() => {
    if (!results) return [];
    if (activeTab === "all") return results;
    return results.filter(r => r.type === activeTab);
  }, [results, activeTab]);

  const typeIcons: Record<string, React.ReactNode> = {
    person: <Users className="h-4 w-4" />,
    post: <FileText className="h-4 w-4" />,
    community: <Globe className="h-4 w-4" />,
    event: <Calendar className="h-4 w-4" />,
    study_partner: <UserPlus className="h-4 w-4" />,
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <SearchIcon className="h-8 w-8 text-primary" />
              Advanced Search
            </h1>
            <p className="text-muted-foreground mt-1">
              Find people, communities, posts, and more across the platform.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-2xl mx-auto mt-6">
          <Input 
            className="h-14 text-lg rounded-full px-6 bg-background border-primary/20"
            placeholder="Search for something..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" size="lg" className="h-14 rounded-full px-8 shrink-0">
            {isFetching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
          </Button>
        </form>

        <div className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex justify-center mb-6 overflow-x-auto pb-2">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="all" className="min-w-[80px]">All</TabsTrigger>
                <TabsTrigger value="person" className="min-w-[80px]">People</TabsTrigger>
                <TabsTrigger value="post" className="min-w-[80px]">Posts</TabsTrigger>
                <TabsTrigger value="community" className="min-w-[80px]">Communities</TabsTrigger>
                <TabsTrigger value="event" className="min-w-[80px]">Events</TabsTrigger>
                <TabsTrigger value="study_partner" className="min-w-[100px]">Study Partners</TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-6">
              {isLoading || isFetching ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : !initialQuery ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                  <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-muted-foreground">Enter a search term to find results.</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
                  <h3 className="text-lg font-semibold mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    We couldn't find anything matching "{initialQuery}" in this category.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredResults.map((result) => (
                    <Card key={`${result.type}-${result.id}`} className="transition-all hover:border-primary/50 group">
                      <Link to={result.url} className="block h-full">
                        <CardHeader className="flex flex-row items-start gap-4 pb-4">
                          {result.imageUrl ? (
                            <UserAvatar
                              user={{ id: result.id, name: result.title, avatar_url: result.imageUrl }}
                              className="h-12 w-12 rounded-md"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                              {typeIcons[result.type]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                              {result.title}
                            </CardTitle>
                            <CardDescription className="line-clamp-2 mt-1">
                              {result.subtitle || `A ${result.type.replace("_", " ")}`}
                            </CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 flex justify-between items-center text-sm text-muted-foreground">
                          <Badge variant="outline" className="capitalize flex items-center gap-1.5">
                            {typeIcons[result.type]}
                            {result.type.replace("_", " ")}
                          </Badge>
                          <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                            View <ExternalLink className="h-3 w-3" />
                          </span>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
