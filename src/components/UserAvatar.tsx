import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Only accept real, loadable image URLs. A stale signed URL, relative ref,
// or blob: string makes the hidden Image() probe in Radix Avatar throw during
// render, which trips the ErrorBoundary. Anything suspicious falls back to initials.
const isValidImageUrl = (url?: string | null): url is string => {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const UserAvatar = ({
  name,
  url,
  className,
}: {
  name?: string;
  url?: string | null;
  className?: string;
}) => {
  const initials = (name || "U")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Avatar className={className}>
      {isValidImageUrl(url) ? <AvatarImage src={url} alt={name} /> : null}
      <AvatarFallback className="bg-secondary text-primary font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
};
