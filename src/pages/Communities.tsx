import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { pluralize } from "@/lib/pluralize";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Globe,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateCommunity,
  useToggleCommunityMembership,
} from "@/hooks/usePlatform";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";

type CommunityMember = {
  id: string;
  user_id: string;
  role: string | null;
};

type CommunityRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar_url: string | null;
  cover_url: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
  community_members?: CommunityMember[];
};

const CATEGORY_FILTERS = ["All", "Tech & Coding", "Arts & Culture", "Career", "Study"];

export default function Communities() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
  });

  const createCommunity = useCreateCommunity();
  const toggleMembership = useToggleCommunityMembership();

  const {
    data: communities = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select(
          `
          *,
          community_members(id, user_id, role)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as CommunityRow[];
    },
  });

  const filtered = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return communities.filter((community) => {
      const matchesSearch =
        !term ||
        community.name.toLowerCase().includes(term) ||
        community.description.toLowerCase().includes(term) ||
        community.category.toLowerCase().includes(term);

      const matchesCategory =
        categoryFilter === "All" ||
        community.category.toLowerCase().includes(categoryFilter.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [categoryFilter, communities, searchQuery]);

  const resetForm = () => {
    setForm({ name: "", category: "", description: "" });
  };

  const submitCommunity = () => {
    if (!user) return;
    if (!form.name.trim() || !form.category.trim() || !form.description.trim()) return;

    createCommunity.mutate(
      {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        creator_id: user.id,
      },
      {
        onSuccess: () => {
          resetForm();
          setCreateOpen(false);
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight tracking-tight">
              Communities
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Join clubs, societies, and study groups to connect with like-minded peers.
            </p>
          </div>
          <Button style={{ borderRadius: "2px" }} className="shrink-0 h-11" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Community
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search communities, clubs, societies"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="min-h-11 pl-9 text-sm"
              style={{ borderRadius: "2px" }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:pb-0">
            {CATEGORY_FILTERS.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                  categoryFilter === category
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
                style={{ borderRadius: "2px" }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="border border-destructive/30 bg-destructive/5 p-6 text-center" style={{ borderRadius: "2px" }}>
            <Globe className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive">Could not load communities</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Please check your connection."}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} style={{ borderRadius: "2px" }}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-64 animate-pulse bg-muted" style={{ borderRadius: "2px" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border p-12 text-center" style={{ borderRadius: "2px" }}>
            <Globe className="mb-4 h-10 w-10 text-muted-foreground/30" />
            <h3 className="text-sm font-semibold text-foreground">No communities found</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different search or create the first community in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((community) => {
              const myMembership = community.community_members?.find(
                (member) => member.user_id === user?.id
              );
              const isAdmin = myMembership?.role === "admin";
              const isMember = Boolean(myMembership);

              return (
                <article
                  key={community.id}
                  className="group relative flex flex-col border border-border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md"
                  style={{ borderRadius: "0" }}
                >
                  <div
                    className="h-20 w-full bg-gradient-to-r from-primary/10 to-accent/5"
                    style={
                      community.cover_url
                        ? {
                            backgroundImage: `url(${community.cover_url})`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                          }
                        : undefined
                    }
                  />

                  <div className="relative flex flex-1 flex-col p-5 pt-0">
                    <div className="relative -mt-8 mb-3 inline-block">
                      <div className="inline-block border-2 border-card bg-card shadow-sm" style={{ borderRadius: "2px" }}>
                        <UserAvatar
                          name={community.name}
                          url={community.avatar_url}
                          className="h-14 w-14"
                          style={{ borderRadius: "2px" }}
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h3 className="line-clamp-1 text-lg font-bold group-hover:text-primary">
                          {community.name}
                        </h3>
                        {isAdmin ? (
                          <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        ) : null}
                      </div>

                      <span className="inline-block text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/60 bg-muted px-2 py-0.5 mb-3" style={{ borderRadius: "2px" }}>
                        {community.category}
                      </span>

                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {community.description}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/50 pt-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {community.community_members?.length ?? 0} {pluralize(community.community_members?.length ?? 0, "member")}
                      </div>
                      <Button
                        size="sm"
                        variant={isMember ? "secondary" : "default"}
                        className="min-h-9 text-xs"
                        style={{ borderRadius: "2px" }}
                        disabled={!user || toggleMembership.isPending}
                        onClick={() =>
                          user &&
                          toggleMembership.mutate({
                            communityId: community.id,
                            userId: user.id,
                            isMember,
                            memberId: myMembership?.id,
                          })
                        }
                      >
                        {toggleMembership.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isMember ? (
                          "Joined"
                        ) : (
                          "Join"
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create community</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="community-name">Name *</Label>
              <Input
                id="community-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="min-h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-category">Category *</Label>
              <Input
                id="community-category"
                value={form.category}
                placeholder="Tech & Coding"
                onChange={(event) =>
                  setForm((current) => ({ ...current, category: event.target.value }))
                }
                className="min-h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-description">Description *</Label>
              <Textarea
                id="community-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className="min-h-28 text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitCommunity}
              disabled={
                createCommunity.isPending ||
                !form.name.trim() ||
                !form.category.trim() ||
                !form.description.trim()
              }
            >
              {createCommunity.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
