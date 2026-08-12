import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  Briefcase,
  Camera,
  CalendarDays,
  Check,
  Clock,
  Edit3,
  ExternalLink,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Loader2,
  MapPin,
  MessageSquare,
  Newspaper,
  Save,
  Share2,
  Sparkles,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  X,
  Zap,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import { pluralize } from "@/lib/pluralize";

import { AppLayout } from "@/components/AppLayout";
import { UserAvatar } from "@/components/UserAvatar";
import { isValidUUID } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { resolveProfileViewContext } from "@/lib/profileView";
import {
  fetchMyConnections,
  fetchPendingIncomingRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  respondToConnectionRequest,
  stateFor,
  type ConnRow,
  type PendingIncomingRequest,
} from "@/lib/connections";
import { supabase } from "@/integrations/supabase/client";
import type { ConnState } from "@/components/UserCard";
import type {
  Tables,
  TablesUpdate,
} from "@/integrations/supabase/types";
import { PostCard } from "@/components/feed/PostCard";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import type { FeedPost } from "@/hooks/useFeed";

type ProfileRow = Tables<"profiles">;

type ProfileForm = {
  name: string;
  bio: string;
  college: string;
  field: string;
  location: string;
  year_semester: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  website_url: string;
  skills: string[];
  interests: string[];
};

type PendingRequest = PendingIncomingRequest;

type ConnectionProfile = {
  id: string;
  name: string;
  avatar_url: string | null;
  field: string | null;
  college: string | null;
};

const asArray = (value: string[] | null | undefined) =>
  Array.isArray(value) ? value : [];

const cleanOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const profileToForm = (profile: ProfileRow): ProfileForm => ({
  name: profile.name ?? "",
  bio: profile.bio ?? "",
  college: profile.college ?? "",
  field: profile.field ?? "",
  location: profile.location ?? "",
  year_semester: profile.year_semester ?? "",
  github_url: profile.github_url ?? "",
  linkedin_url: profile.linkedin_url ?? "",
  portfolio_url: profile.portfolio_url ?? "",
  website_url: profile.website_url ?? "",
  skills: asArray(profile.skills),
  interests: asArray(profile.interests),
});

const completionScore = (profile: ProfileRow) => {
  const checks = [
    profile.name,
    profile.bio,
    profile.college,
    profile.field,
    profile.location,
    profile.year_semester,
    profile.avatar_url,
    profile.cover_image,
    asArray(profile.skills).length > 0,
    asArray(profile.interests).length > 0,
    profile.github_url || profile.linkedin_url || profile.portfolio_url || profile.website_url,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const joinedDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

const SectionCard = ({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <Card className="hover:shadow-soft hover:border-primary/20 transition-all duration-300 group">
    <CardContent className="p-6">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5 text-base font-semibold group-hover:text-primary transition-colors">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          {title}
        </div>
        {action}
      </div>
      <div className="pt-1">{children}</div>
    </CardContent>
  </Card>
);

const EmptyState = ({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-8 px-4 text-center text-sm text-muted-foreground transition-all hover:bg-muted/40">
    <div className="mb-2 text-muted-foreground/60">
      <Sparkles className="h-6 w-6" />
    </div>
    <div className="max-w-xs">{children}</div>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

const TagEditor = ({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const next = draft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    onChange(Array.from(new Set([...value, ...next])));
    setDraft("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((item) => item !== tag));
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="rounded-full p-0.5 hover:bg-background"
                onClick={() => remove(tag)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
};

const ProfileEditor = ({
  open,
  profile,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  profile: ProfileRow;
  onOpenChange: (open: boolean) => void;
  onSaved: (profile: ProfileRow) => void;
}) => {
  const [form, setForm] = useState<ProfileForm>(() => profileToForm(profile));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profileToForm(profile));
  }, [profile, open]);

  const save = async () => {
    setSaving(true);

    const patch: TablesUpdate<"profiles"> = {
      name: form.name.trim() || "Unnamed Student",
      bio: cleanOptional(form.bio),
      college: form.college.trim(),
      field: form.field.trim(),
      location: cleanOptional(form.location),
      year_semester: cleanOptional(form.year_semester),
      github_url: cleanOptional(form.github_url),
      linkedin_url: cleanOptional(form.linkedin_url),
      portfolio_url: cleanOptional(form.portfolio_url),
      website_url: cleanOptional(form.website_url),
      skills: form.skills,
      interests: form.interests,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", profile.id)
      .select("*")
      .single();

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    onSaved(data);
    onOpenChange(false);
    toast.success("Profile updated");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5 pb-10">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                maxLength={100}
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                name="location"
                maxLength={100}
                value={form.location}
                placeholder="Kathmandu, Nepal"
                onChange={(event) =>
                  setForm((current) => ({ ...current, location: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              name="bio"
              maxLength={500}
              rows={4}
              value={form.bio}
              placeholder="Tell students, recruiters, and collaborators about yourself."
              onChange={(event) =>
                setForm((current) => ({ ...current, bio: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-college">College</Label>
              <Input
                id="edit-college"
                name="college"
                maxLength={150}
                value={form.college}
                onChange={(event) =>
                  setForm((current) => ({ ...current, college: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-field">Field of study</Label>
              <Input
                id="edit-field"
                name="field"
                maxLength={100}
                value={form.field}
                onChange={(event) =>
                  setForm((current) => ({ ...current, field: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-year">Year / semester</Label>
              <Input
                id="edit-year"
                name="year_semester"
                maxLength={50}
                value={form.year_semester}
                placeholder="3rd year, 6th semester"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    year_semester: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <TagEditor
              value={form.skills}
              placeholder="React, TypeScript, Python"
              onChange={(skills) => setForm((current) => ({ ...current, skills }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Interests</Label>
            <TagEditor
              value={form.interests}
              placeholder="AI, startups, open source"
              onChange={(interests) =>
                setForm((current) => ({ ...current, interests }))
              }
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-github" className="flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5" />
                GitHub
              </Label>
              <Input
                id="edit-github"
                name="github_url"
                maxLength={200}
                value={form.github_url}
                placeholder="https://github.com/username"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    github_url: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-linkedin" className="flex items-center gap-1.5">
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </Label>
              <Input
                id="edit-linkedin"
                name="linkedin_url"
                maxLength={200}
                value={form.linkedin_url}
                placeholder="https://linkedin.com/in/username"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    linkedin_url: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-portfolio" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Portfolio
              </Label>
              <Input
                id="edit-portfolio"
                name="portfolio_url"
                maxLength={200}
                value={form.portfolio_url}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    portfolio_url: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-website" className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                Website
              </Label>
              <Input
                id="edit-website"
                name="website_url"
                maxLength={200}
                value={form.website_url}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    website_url: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ─── Main Profile Component ──────────────────────────────────────────────────

const ProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { viewerId: currentUserId, targetId, isOwn } = resolveProfileViewContext(user?.id, id);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [connections, setConnections] = useState<ConnRow[]>([]);
  const [connectionProfiles, setConnectionProfiles] = useState<ConnectionProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [profilePosts, setProfilePosts] = useState<FeedPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [respondingOnProfile, setRespondingOnProfile] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = useCallback(async () => {
    if (!targetId) return;
    setPostsLoading(true);
    try {
      const { data } = await supabase
        .rpc("get_feed_posts", {
          p_user_id: currentUserId,
          p_filter: "recent",
          p_limit: 20,
          p_offset: 0,
        });
      const all = (data ?? []) as FeedPost[];
      setProfilePosts(all.filter((p) => p.author_id === targetId));
    } catch {
      // non-critical
    } finally {
      setPostsLoading(false);
    }
  }, [targetId, currentUserId]);

  const reload = useCallback(async () => {
    if (!targetId) {
      setLoading(false);
      setLoadError("No profile was selected.");
      return;
    }

    if (!isValidUUID(targetId)) {
      setLoading(false);
      setLoadError("Profile not found.");
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const [
        profileResult,
        myConnections,
        profileConnections,
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", targetId).maybeSingle(),
        currentUserId ? fetchMyConnections(currentUserId) : Promise.resolve([]),
        supabase
          .from("connections")
          .select("id, requester_id, addressee_id, status")
          .eq("status", "accepted")
          .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`),
      ]);

      if (profileResult.error) {
        setLoadError(profileResult.error.message);
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!profileResult.data) {
        setLoadError("Profile not found.");
        setProfile(null);
        setLoading(false);
        return;
      }

      if (profileConnections.error) toast.error(profileConnections.error.message);

      setProfile(profileResult.data);
      setConnections(myConnections);

      // Load connection profiles
      const connectedIds = (profileConnections.data ?? []).map((c) =>
        c.requester_id === targetId ? c.addressee_id : c.requester_id
      );

      if (connectedIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, field, college")
          .in("id", connectedIds);
        setConnectionProfiles((profData as ConnectionProfile[]) ?? []);
      } else {
        setConnectionProfiles([]);
      }

      // Load pending requests (only for profile owner)
      if (isOwn && currentUserId) {
        try {
          const pending = await fetchPendingIncomingRequests(currentUserId);
          setPendingRequests(pending);
        } catch (pendingError) {
          const msg =
            pendingError instanceof Error
              ? pendingError.message
              : "Failed to load connection requests";
          toast.error(msg);
          setPendingRequests([]);
        }
      } else {
        setPendingRequests([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load profile";
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, targetId, isOwn]);

  useEffect(() => {
    reload();
    loadPosts();
  }, [reload, loadPosts]);

  // Real-time connection request updates for owner
  useEffect(() => {
    if (!isOwn || !currentUserId) return;
    const channel = supabase
      .channel("profile-requests-" + currentUserId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "connections",
          filter: `addressee_id=eq.${currentUserId}`,
        },
        () => { void reload(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOwn, currentUserId, reload]);

  const acceptRequest = async (req: PendingRequest) => {
    if (!currentUserId || acceptingId) return;

    console.log('[DEBUG Profile] acceptRequest called', { 
      requestId: req.id, 
      requesterId: req.requester_id, 
      currentUserId,
      acceptingId,
      pendingRequestsCount: pendingRequests.length 
    });

    setAcceptingId(req.id);
    try {
      await acceptConnectionRequest(req.id, currentUserId);
      toast.success(`Connected with ${req.requester.name}`);
      
      console.log('[DEBUG Profile] Before filter - pendingRequests:', pendingRequests.map(r => ({ id: r.id, requester: r.requester.name })));
      setPendingRequests((prev) => {
        const filtered = prev.filter((r) => r.id !== req.id);
        console.log('[DEBUG Profile] After filter - pendingRequests:', filtered.map(r => ({ id: r.id, requester: r.requester.name })));
        return filtered;
      });
      
      setConnectionProfiles((prev) => {
        if (prev.some((p) => p.id === req.requester_id)) return prev;
        return [
          ...prev,
          {
            id: req.requester_id,
            name: req.requester.name,
            avatar_url: req.requester.avatar_url,
            field: req.requester.field,
            college: req.requester.college,
          },
        ];
      });
      
      const updatedConnections = await fetchMyConnections(currentUserId);
      console.log('[DEBUG Profile] Updated connections:', updatedConnections);
      setConnections(updatedConnections);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not accept connection request";
      console.log('[DEBUG Profile] Accept error:', msg, e);
      toast.error(msg);
    } finally {
      setAcceptingId(null);
    }
  };

  const rejectRequest = async (req: PendingRequest) => {
    if (!currentUserId || rejectingId) return;

    setRejectingId(req.id);
    try {
      await rejectConnectionRequest(req.id, currentUserId);
      toast.success("Request declined");
      setPendingRequests((prev) => prev.filter((r) => r.id !== req.id));
      setConnections(await fetchMyConnections(currentUserId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not decline connection request";
      toast.error(msg);
    } finally {
      setRejectingId(null);
    }
  };

  const uploadFile = async (kind: "avatar" | "cover", file: File) => {
    if (!user || !profile || !isOwn) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please choose an image under 5MB");
      return;
    }

    const bucket = kind === "avatar" ? "avatars" : "covers";
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${kind}-${Date.now()}.${extension}`;

    setUploading(kind);
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });

    if (error) {
      setUploading(null);
      toast.error(error.message);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);

    const patch: TablesUpdate<"profiles"> =
      kind === "avatar" ? { avatar_url: publicUrl } : { cover_image: publicUrl };

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select("*")
      .single();

    setUploading(null);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setProfile(data);
    toast.success(kind === "avatar" ? "Avatar updated" : "Cover updated");
  };

  const shareProfile = async () => {
    const url = `${window.location.origin}/profile/${targetId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied");
    } catch {
      toast.error(url);
    }
  };

  const connect = async () => {
    if (!user || !targetId || isOwn) return;
    const { error } = await supabase
      .from("connections")
      .insert({ requester_id: user.id, addressee_id: targetId });
    if (error) { toast.error(error.message); return; }
    toast.success("Connection request sent");
    setConnections(await fetchMyConnections(user.id));
  };

  const connectionState = useMemo(() => {
    if (!user || isOwn || !targetId) return null;
    return stateFor(user.id, targetId, connections) as {
      state: ConnState;
      connectionId?: string;
    };
  }, [connections, isOwn, targetId, user]);

  const respondOnProfile = async (status: "accepted" | "rejected") => {
    if (!user || !connectionState?.connectionId || respondingOnProfile) return;

    setRespondingOnProfile(true);
    try {
      await respondToConnectionRequest(connectionState.connectionId, user.id, status);
      toast.success(status === "accepted" ? "Connection accepted" : "Request declined");
      setConnections(await fetchMyConnections(user.id));
      if (status === "accepted") {
        await reload();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not update connection request";
      toast.error(msg);
    } finally {
      setRespondingOnProfile(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
      <div className="mx-auto max-w-4xl space-y-4 pb-8 animate-fade-in">
          {/* Cover + avatar skeleton */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="h-44 sm:h-56 bg-muted skeleton-shimmer" />
            <div className="px-6 pb-6 pt-0">
              <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <div className="h-24 w-24 rounded-full bg-muted border-4 border-card skeleton-shimmer" />
                  <div className="pb-2 space-y-2">
                    <div className="h-6 w-40 rounded-lg bg-muted skeleton-shimmer" />
                    <div className="h-4 w-56 rounded-lg bg-muted skeleton-shimmer" />
                    <div className="h-3.5 w-32 rounded-lg bg-muted skeleton-shimmer" />
                  </div>
                </div>
                <div className="flex gap-2 pb-2">
                  <div className="h-10 w-28 rounded-lg bg-muted skeleton-shimmer" />
                  <div className="h-10 w-10 rounded-lg bg-muted skeleton-shimmer" />
                </div>
              </div>
              {/* Progress bar skeleton */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-32 rounded bg-muted skeleton-shimmer" />
                  <div className="h-3 w-8 rounded bg-muted skeleton-shimmer" />
                </div>
                <div className="h-2 w-full rounded-full bg-muted skeleton-shimmer" />
              </div>
            </div>
          </div>

          {/* Tabs skeleton */}
          <div className="h-12 rounded-xl border border-border bg-card skeleton-shimmer" />

          {/* Section cards skeleton */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-border/40 pb-4">
                <div className="h-8 w-8 rounded-lg bg-muted skeleton-shimmer" />
                <div className="h-5 w-32 rounded bg-muted skeleton-shimmer" />
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 rounded bg-muted skeleton-shimmer" style={{ width: `${85 - j * 10}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
      <EmptyState>{loadError ?? "Profile not found."}</EmptyState>
      </AppLayout>
    );
  }

  const skills = asArray(profile.skills);
  const interests = asArray(profile.interests);
  const score = completionScore(profile);
  const acceptedConnCount = connectionProfiles.length;

  return (
    <AppLayout>
    <div className="mx-auto max-w-4xl space-y-4 pb-8">
        {/* ── Cover + Avatar + Header ─────────────────────────────── */}
        <Card className="overflow-hidden">
          <div
            className="relative h-44 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary sm:h-56"
            style={
              profile.cover_image
                ? { backgroundImage: `url(${profile.cover_image})`, backgroundPosition: "center", backgroundSize: "cover" }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
            {isOwn ? (
              <>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile("cover", file);
                    event.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute right-3 top-3"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading === "cover"}
                >
                  {uploading === "cover" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                  Cover
                </Button>
              </>
            ) : null}
          </div>

          <CardContent className="relative px-5 pb-5 pt-0 sm:px-6">
            <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="relative w-fit">
                  <UserAvatar
                    name={profile.name}
                    url={profile.avatar_url}
                    className="h-24 w-24 border-4 border-card"
                  />
                  {isOwn ? (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadFile("avatar", file);
                          event.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border bg-background shadow-sm"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploading === "avatar"}
                      >
                        {uploading === "avatar" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                    </>
                  ) : null}
                </div>

                <div className="min-w-0 pb-1">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
                    {profile.name || "Unnamed Student"}
                    {(profile as any).is_verified && (
                      <BadgeCheck className="h-6 w-6 fill-blue-500 text-white shrink-0" />
                    )}
                  </h1>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    {profile.field ? (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {profile.field}
                      </span>
                    ) : null}
                    {profile.college ? (
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {profile.college}
                      </span>
                    ) : null}
                    {profile.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.location}
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Joined {joinedDate(profile.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {isOwn ? (
                  <Button onClick={() => setProfileEditorOpen(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit profile
                  </Button>
                ) : (
                  <>
                    {connectionState?.state === "accepted" ? (
                      <Button asChild variant="secondary">
                        <Link to={`/messages?u=${profile.id}`}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Message
                        </Link>
                      </Button>
                    ) : connectionState?.state === "pending_out" ? (
                      <Button disabled variant="secondary">
                        <Clock className="mr-2 h-4 w-4" />
                        Pending
                      </Button>
                    ) : connectionState?.state === "pending_in" ? (
                      <>
                        <Button
                          onClick={() => respondOnProfile("accepted")}
                          disabled={respondingOnProfile}
                        >
                          {respondingOnProfile ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => respondOnProfile("rejected")}
                          disabled={respondingOnProfile}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Decline
                        </Button>
                      </>
                    ) : (
                      <Button onClick={connect}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Connect
                      </Button>
                    )}
                  </>
                )}
                <Button variant="outline" onClick={shareProfile}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Connections</div>
              <div className="mt-1 text-2xl font-bold">{acceptedConnCount}</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {isOwn && pendingRequests.length > 0
                  ? `${pendingRequests.length} ${pluralize(pendingRequests.length, "pending request")}`
                  : "accepted connections"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Profile completion</span>
                <span>{score}%</span>
              </div>
              <Progress value={score} className="mt-3" />
              <div className="mt-2 text-xs text-muted-foreground">
                Add details to improve discoverability.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Tabbed content ──────────────────────────────────────── */}
        <Tabs defaultValue="posts">
          <TabsList className="w-full h-11 bg-card border border-border rounded-xl">
            <TabsTrigger value="posts" className="flex-1 gap-2">
              <Newspaper className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="about" className="flex-1 gap-2">
              <Activity className="h-4 w-4" />
              About
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex-1 gap-2">
              <Users className="h-4 w-4" />
              Connections
              {acceptedConnCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px]">{acceptedConnCount}</Badge>
              )}
            </TabsTrigger>
            {isOwn && (
              <TabsTrigger value="requests" className="flex-1 gap-2">
                <UserCheck className="h-4 w-4" />
                Requests
                {pendingRequests.length > 0 && (
                  <Badge className="ml-1 text-[10px] bg-destructive text-destructive-foreground">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Posts Tab ── */}
          <TabsContent value="posts" className="mt-4 space-y-4">
            {postsLoading ? (
              <FeedSkeleton />
            ) : profilePosts.length === 0 ? (
              <EmptyState>
                {isOwn ? "You haven't posted anything yet. Share an update from the feed!" : "No posts yet."}
              </EmptyState>
            ) : (
              profilePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUserId ?? ""}
                  currentUserName=""
                  currentAvatarUrl={null}
                />
              ))
            )}
          </TabsContent>

          {/* ── About Tab ── */}
          <TabsContent value="about" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <SectionCard
                  title="Bio"
                  icon={Activity}
                  action={
                    isOwn ? (
                      <Button size="sm" variant="ghost" onClick={() => setProfileEditorOpen(true)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    ) : null
                  }
                >
                  {profile.bio ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{profile.bio}</p>
                  ) : (
                    <EmptyState>
                      {isOwn ? "Add a short bio to introduce yourself." : "No bio yet."}
                    </EmptyState>
                  )}
                </SectionCard>

                <SectionCard title="Academic" icon={GraduationCap}>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">College</dt>
                      <dd className="text-right font-medium">{profile.college || "Not set"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Field</dt>
                      <dd className="text-right font-medium">{profile.field || "Not set"}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Year</dt>
                      <dd className="text-right font-medium">{profile.year_semester || "Not set"}</dd>
                    </div>
                  </dl>
                </SectionCard>

                <SectionCard title="Links" icon={Globe}>
                  <div className="space-y-2 text-sm">
                    {profile.github_url ? (
                      <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                        <Github className="h-4 w-4" /> GitHub <ExternalLink className="ml-auto h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {profile.linkedin_url ? (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                        <Linkedin className="h-4 w-4" /> LinkedIn <ExternalLink className="ml-auto h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {profile.portfolio_url ? (
                      <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                        <Globe className="h-4 w-4" /> Portfolio <ExternalLink className="ml-auto h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {profile.website_url ? (
                      <a href={profile.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                        <Globe className="h-4 w-4" /> Website <ExternalLink className="ml-auto h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {!profile.github_url && !profile.linkedin_url && !profile.portfolio_url && !profile.website_url ? (
                      <EmptyState>No links added.</EmptyState>
                    ) : null}
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard
                  title="Skills"
                  icon={Zap}
                  action={
                    isOwn ? (
                      <Button size="sm" variant="ghost" onClick={() => setProfileEditorOpen(true)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    ) : null
                  }
                >
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>No skills listed.</EmptyState>
                  )}
                </SectionCard>

                <SectionCard title="Interests" icon={Sparkles}>
                  {interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <Badge key={interest} variant="outline">{interest}</Badge>
                      ))}
                    </div>
                  ) : (
                    <EmptyState>No interests listed.</EmptyState>
                  )}
                </SectionCard>
              </div>
            </div>
          </TabsContent>

          {/* ── Connections Tab ── */}
          <TabsContent value="connections" className="mt-4">
            {connectionProfiles.length === 0 ? (
              <EmptyState>No connections yet.</EmptyState>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {connectionProfiles.map((conn) => (
                  <Link
                    key={conn.id}
                    to={`/profile/${conn.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <UserAvatar name={conn.name} url={conn.avatar_url} className="h-12 w-12 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{conn.name}</div>
                      {conn.field && <div className="text-xs text-muted-foreground truncate">{conn.field}</div>}
                      {conn.college && <div className="text-xs text-muted-foreground truncate">{conn.college}</div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Requests Tab (owner only) ── */}
          {isOwn && (
            <TabsContent value="requests" className="mt-4">
              {pendingRequests.length === 0 ? (
                <EmptyState>No pending connection requests.</EmptyState>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                      <Link to={`/profile/${req.requester_id}`} className="shrink-0">
                        <UserAvatar name={req.requester.name} url={req.requester.avatar_url} className="h-12 w-12" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${req.requester_id}`} className="font-semibold text-sm hover:underline truncate block">
                          {req.requester.name}
                        </Link>
                        {req.requester.field && (
                          <div className="text-xs text-muted-foreground truncate">{req.requester.field}</div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => acceptRequest(req)}
                          disabled={acceptingId === req.id}
                          className="gap-1.5"
                        >
                          {acceptingId === req.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectRequest(req)}
                          disabled={rejectingId === req.id}
                          className="gap-1.5"
                        >
                          {rejectingId === req.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {isOwn ? (
        <ProfileEditor
          open={profileEditorOpen}
          profile={profile}
          onOpenChange={setProfileEditorOpen}
          onSaved={setProfile}
        />
      ) : null}
      </AppLayout>
  );
};

export default ProfilePage;
