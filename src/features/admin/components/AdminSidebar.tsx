import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Network,
  Flag,
  ChartNoAxesCombined,
  FolderKanban,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  Settings,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Users", icon: Users, path: "/admin/users" },
  { label: "Posts", icon: FileText, path: "/admin/posts" },
  { label: "Communities", icon: Network, path: "/admin/communities" },
  { label: "Reports", icon: Flag, path: "/admin/reports" },
  { label: "Analytics", icon: ChartNoAxesCombined, path: "/admin/analytics" },
  { label: "Projects", icon: FolderKanban, path: "/admin/projects" },
  { label: "Opportunities", icon: BriefcaseBusiness, path: "/admin/opportunities" },
  { label: "Events", icon: CalendarDays, path: "/admin/events" },
  { label: "Q&A", icon: CircleHelp, path: "/admin/qa" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
] as const;

export function AdminSidebar() {
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link to="/admin" className="flex items-center gap-2.5 group">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground">CareerLink</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </Link>
      </SidebarHeader>

      <Separator className="mx-4 w-auto" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} CareerLink Nepal
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
