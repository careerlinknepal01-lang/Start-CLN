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
import { Loader2, MapPin, Clock, Users, Upload, X } from "lucide-react";
import { useCreateEvent, useToggleEventRsvp } from "@/hooks/usePlatform";
import { uploadImage } from "@/lib/storage";
import { toast } from "sonner";

export type EventRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  location: string | null;
  date: string;
  creator_id: string;
  image_url?: string | null;
  creator?: { name: string; avatar_url?: string | null } | null;
  community?: { name: string } | null;
  event_attendees?: Array<{ id: string; user_id: string; status: string }>;
};

export function CreateEventDialog({
  open,
  onOpenChange,
  userId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}) {
  const create = useCreateEvent();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("workshop");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setTitle("");
    setDescription("");
    setType("workshop");
    setLocation("");
    setDate("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const submit = async () => {
    if (!title.trim() || !description.trim() || !date) return;
    
    let imageUrl: string | null = null;
    
    if (imageFile) {
      setUploading(true);
      const result = await uploadImage(imageFile, "event-images", userId, "event-");
      setUploading(false);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      imageUrl = result.url;
    }
    
    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        type,
        location: location.trim() || null,
        date: new Date(date).toISOString(),
        creator_id: userId,
        image_url: imageUrl,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Host an event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Hackathon 2026" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label>Event Image (optional)</Label>
            {imagePreview ? (
              <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg">
                <label htmlFor="event-image" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                  <input
                    id="event-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date & time</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Campus hall / Online" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending || uploading} className="bg-rose-600 hover:bg-rose-700">
            {(create.isPending || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploading ? "Uploading image..." : "Create event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EventDetailDialog({
  event,
  userId,
  open,
  onOpenChange,
}: {
  event: EventRow | null;
  userId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rsvp = useToggleEventRsvp();
  if (!event) return null;

  const going = event.event_attendees?.filter((a) => a.status === "going") ?? [];
  const myRsvp = userId
    ? going.find((a) => a.user_id === userId)
    : undefined;
  const isGoing = !!myRsvp;
  const eventDate = new Date(event.date);

  const handleRsvp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    rsvp.mutate({
      eventId: event.id,
      userId,
      isGoing,
      attendeeId: myRsvp?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="uppercase text-[10px]">
              {event.type}
            </Badge>
            {event.community && (
              <span className="text-xs text-muted-foreground">by {event.community.name}</span>
            )}
          </div>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {eventDate.toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.location || "TBA"}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {going.length} attending
          </div>
        </div>
        <DialogFooter>
          <Button
            className={isGoing ? "" : "bg-rose-600 hover:bg-rose-700"}
            variant={isGoing ? "outline" : "default"}
            disabled={!userId || rsvp.isPending}
            onClick={handleRsvp}
          >
            {rsvp.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isGoing ? "Cancel RSVP" : "RSVP — Going"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
