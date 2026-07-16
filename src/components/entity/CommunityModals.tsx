import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users } from "lucide-react";
import { useCreateCommunity, useToggleCommunityMembership } from "@/hooks/usePlatform";
import { UserAvatar } from "@/components/UserAvatar";

export type CommunityRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar_url: string | null;
  creator_id: string;
  creator?: { name: string; avatar_url?: string | null } | null;
  community_members?: Array<{ id: string; user_id: string; role: string }>;
};

export function CreateCommunityDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}) {
  const create = useCreateCommunity();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Tech & Coding");

  const submit = () => {
    if (!name.trim() || !description.trim()) return;
    create.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        category,
        creator_id: userId,
      },
      {
        onSuccess: () => {
          setName("");
          setDescription("");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create community</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tech & Coding">Tech & Coding</SelectItem>
                <SelectItem value="Arts & Culture">Arts & Culture</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending} className="bg-blue-600 hover:bg-blue-700">
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CommunityDetailDialog({
  community,
  userId,
  open,
  onOpenChange,
}: {
  community: CommunityRow | null;
  userId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toggle = useToggleCommunityMembership();
  if (!community) return null;

  const members = community.community_members ?? [];
  const myMember = userId ? members.find((m) => m.user_id === userId) : undefined;
  const isMember = !!myMember;
  const isCreator = userId === community.creator_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <UserAvatar name={community.name} url={community.avatar_url} className="h-12 w-12 rounded-xl" />
            <div>
              <DialogTitle>{community.name}</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                {community.category}
              </Badge>
            </div>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{community.description}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {members.length} {pluralize(members.length, "member")}
        </div>
        <DialogFooter>
          {isCreator ? (
            <Button variant="outline" disabled>
              You created this community
            </Button>
          ) : (
            <Button
              className={isMember ? "" : "bg-blue-600 hover:bg-blue-700"}
              variant={isMember ? "outline" : "default"}
              disabled={!userId || toggle.isPending}
              onClick={() =>
                toggle.mutate({
                  communityId: community.id,
                  userId: userId!,
                  isMember,
                  memberId: myMember?.id,
                })
              }
            >
              {toggle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isMember ? "Leave community" : "Join community"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
