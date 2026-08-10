import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Users, Plus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { searchStudyPartners } from "@/lib/studyPartners";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudyPartners() {
  const { session } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: partners, isLoading, error } = useQuery({
    queryKey: ["studyPartners", searchTerm],
    queryFn: () => searchStudyPartners(searchTerm),
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Study Partners
            </h1>
            <p className="text-muted-foreground mt-1">
              Find classmates and peers to collaborate and study with.
            </p>
          </div>
          <Button asChild className="shrink-0 transition-transform hover:scale-105">
            <Link to="/study-partners/create">
              <Plus className="h-4 w-4 mr-2" />
              Become a Partner
            </Link>
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by subjects, skills, or bio..."
            className="pl-10 h-12 text-base rounded-full bg-background border-border/50 shadow-sm focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-destructive/10 rounded-lg text-destructive">
            <p>Failed to load study partners. Please try again.</p>
          </div>
        ) : partners?.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-border/50">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No study partners found</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              We couldn't find anyone matching your search criteria. Try different keywords or check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partners?.map((partner) => (
              <Card key={partner.id} className="group overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader className="flex flex-row items-center gap-4 pb-3">
                  <UserAvatar
                    user={{
                      id: partner.user_id,
                      name: partner.profiles.name,
                      avatar_url: partner.profiles.avatar_url,
                    }}
                    className="h-12 w-12"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <h3 className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                      {partner.profiles.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {partner.profiles.field}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-sm text-foreground/80 line-clamp-2 mb-4">
                    {partner.bio || "Looking for study partners."}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {partner.subjects?.slice(0, 3).map((subject) => (
                      <Badge key={subject} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                    {partner.subjects && partner.subjects.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{partner.subjects.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/study-partners/${partner.user_id}`}>
                      View Profile
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
