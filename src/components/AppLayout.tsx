import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Compass,
  LogOut,
  MessageSquare,
  Newspaper,
  User as UserIcon,
  Globe,
  Calendar,
  BellRing,
  CheckCheck,
  Menu,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import React, { ReactNode, useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ScrollArea } from "./ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notif {
  id: string;
  content: string;
  type: string;
  read: boolean;
  created_at: string;
}

type NavItem = {
  section: string;
  items: readonly { to: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
};

const navGroups: NavItem[] = [
  {
    section: "Main",
    items: [
      { to: "/feed", label: "Feed", icon: Newspaper },
      { to: "/explore", label: "Explore", icon: Compass },
      { to: "/communities", label: "Communities", icon: Globe },
    ],
  },
  {
    section: "Connect",
    items: [
      { to: "/events", label: "Events", icon: Calendar },
      { to: "/messages", label: "Messages", icon: MessageSquare },
      { to: "/profile", label: "Profile", icon: UserIcon },
    ],
  },
];

const notifTypeIcon: Record<string, string> = {
  connection: "🤝",
  message: "💬",
  post: "📝",
  comment: "💭",
  like: "❤️",
  event: "📅",
  achievement: "🏆",
  default: "🔔",
};

function SidebarNavLink({
  item,
  collapsed,
  onClick,
}: {
  item: { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = item.to === "/profile"
    ? location.pathname === "/profile"
    : location.pathname.startsWith(item.to);

  return (
    <NavLink
      to={item.to}
      end={item.to === "/profile"}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed ? "justify-center h-10 w-10 mx-auto rounded-[4px]" : "px-3 py-2.5 rounded-[2px]",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent rounded-r-full" />
      )}
      <item.icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} aria-hidden="true" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

function NavSection({
  group,
  collapsed,
  onClick,
}: {
  group: NavItem;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/50">
          {group.section}
        </p>
      )}
      {group.items.map((item) => (
        <SidebarNavLink key={item.to} item={item} collapsed={collapsed} onClick={onClick} />
      ))}
    </div>
  );
}

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = typeof localStorage !== "undefined" && localStorage.getItem("cln-sidebar-collapsed");
    return stored === "true";
  });
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    try { localStorage.setItem("cln-sidebar-collapsed", String(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, content, type, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        toast.error("Could not load notifications");
        return;
      }
      if (data) setNotifs(data as Notif[]);
    };
    load();
    const channel = supabase
      .channel("notif-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notif;
          setNotifs((prev) => [n, ...prev]);
          toast(n.content, { icon: notifTypeIcon[n.type] ?? notifTypeIcon.default });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "U";

  /* ── Shared sidebar content ─────────────────────────────────────────── */
  const sidebarContent = (opts?: { collapsed?: boolean; onNavClick?: () => void }) => (
    <>
      {/* Brand */}
      <div className={cn(
        "flex items-center border-b border-border",
        opts?.collapsed ? "justify-center py-5" : "px-6 py-5",
      )}>
        <Link
          to="/feed"
          className={cn(
            "flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            opts?.collapsed ? "" : "rounded-[2px]",
          )}
          aria-label="CareerLink Nepal — go to feed"
          onClick={opts?.onNavClick}
        >
          <img src="/cln.png" alt="" className="h-7 w-7 object-contain" aria-hidden="true" />
          {!opts?.collapsed && (
            <span className="font-bold text-sm tracking-tight text-foreground">
              CareerLink <span className="text-accent">Nepal</span>
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className={cn("flex flex-col gap-4", opts?.collapsed ? "items-center px-2" : "px-3")}>
          {navGroups.map((group) => (
            <NavSection
              key={group.section}
              group={group}
              collapsed={opts?.collapsed}
              onClick={opts?.onNavClick}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* User + Sign out */}
      <div className={cn(
        "mt-auto border-t border-border",
        opts?.collapsed ? "p-3 flex flex-col items-center gap-2" : "p-4",
      )}>
        {opts?.collapsed ? (
          <>
            <div className="grid h-8 w-8 place-items-center rounded-[2px] bg-primary text-primary-foreground text-xs font-bold">
              {userInitial}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-[2px] text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[2px] bg-primary text-primary-foreground text-xs font-bold">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email?.split("@")[0] ?? "Student"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email ?? ""}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-[2px] text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex w-full md:h-dvh md:overflow-hidden bg-background">
      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {sidebarContent({ collapsed: sidebarCollapsed })}
      </aside>

      {/* ── Main content area ─────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col max-md:overflow-visible md:overflow-hidden">
        {/* ── Topbar ─────────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6"
          role="banner"
        >
          {/* Left: toggle + mobile brand */}
          <div className="flex items-center gap-1">
            {/* Desktop collapse toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex h-8 w-8 rounded-[2px] text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarCollapsed((p) => !p)}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>

            {/* Mobile hamburger + brand */}
            <div className="flex items-center gap-2 md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-[2px]" aria-label="Open menu">
                    <Menu className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 bg-card border-r border-border [&>button]:hidden">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">Main app navigation</SheetDescription>
                  {sidebarContent({ onNavClick: () => setMobileMenuOpen(false) })}
                </SheetContent>
              </Sheet>
              <Link
                to="/feed"
                className="flex items-center gap-2 font-bold text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[2px]"
                aria-label="CareerLink Nepal"
              >
                <img src="/cln.png" alt="" className="h-6 w-6 object-contain" aria-hidden="true" />
                <span className="text-foreground">CLN</span>
              </Link>
            </div>

            {/* Page indicator — active nav label on desktop */}
            <div className="hidden md:flex items-center gap-1.5 ml-2">
              {navGroups.flatMap((g) => g.items).map((item) => {
                const isActive = item.to === "/profile"
                  ? location.pathname === "/profile"
                  : location.pathname.startsWith(item.to);
                return isActive ? (
                  <span key={item.to} className="text-xs text-muted-foreground/60 font-medium tracking-wide uppercase">
                    <span className="hidden lg:inline">
                      {navGroups.find((g) => g.items.some((i) => i.to === item.to))?.section}
                      <ChevronRight className="inline h-3 w-3 mx-1 text-muted-foreground/30" />
                    </span>
                    {item.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Theme toggle + Notification bell */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-[2px] text-muted-foreground hover:text-foreground"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <DropdownMenu
              open={notifOpen}
              onOpenChange={(open) => {
                setNotifOpen(open);
                if (open) markAllRead();
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
                >
                  {unread > 0 ? (
                    <BellRing className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : (
                    <Bell className="h-5 w-5" aria-hidden="true" />
                  )}
                  {unread > 0 && (
                    <Badge
                      className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground"
                      aria-hidden="true"
                    >
                      {unread > 9 ? "9+" : unread}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-80 border-border shadow-xl">
                <div className="flex items-center justify-between px-3 py-2">
                  <DropdownMenuLabel className="font-semibold p-0">Notifications</DropdownMenuLabel>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                      aria-label="Mark all notifications as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Mark all read
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />

                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">You're all caught up!</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-80">
                    {notifs.slice(0, 10).map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`flex cursor-default flex-col items-start gap-1 p-3 ${!n.read ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <span className="text-base shrink-0" aria-hidden="true">
                            {notifTypeIcon[n.type] ?? notifTypeIcon.default}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium leading-tight line-clamp-2">{n.content}</span>
                            <span className="text-xs text-muted-foreground mt-0.5 block">
                              {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" aria-label="Unread" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Page content ───────────────────────────────────────── */}
        <ScrollArea className="hidden md:block flex-1 bg-muted/20">
          <main className="container mx-auto max-w-7xl px-4 py-6 md:pb-6">
            {children}
          </main>
        </ScrollArea>
        <div className="block md:hidden flex-1 bg-muted/20">
          <main className="container mx-auto max-w-7xl px-4 py-6 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
