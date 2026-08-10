import { Moon, Sun, LogOut, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "../hooks/useAdminAuth";

export function AdminTopbar() {
  const { toggle, isDark } = useTheme();
  const { signOut } = useAuth();
  const { profile } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex-1" />

      <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground">
        <Link to="/feed">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to App</span>
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="h-8 w-8"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
            <UserAvatar
              name={profile?.name}
              url={profile?.avatar_url}
              className="h-8 w-8"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{profile?.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
