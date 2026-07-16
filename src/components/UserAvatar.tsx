import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      {url ? <AvatarImage src={url} alt={name} /> : null}
      <AvatarFallback className="bg-secondary text-primary font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
};
