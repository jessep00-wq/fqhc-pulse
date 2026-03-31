import {
  LayoutDashboard,
  FlaskConical,
  BookOpen,
  Bot,
  Users,
} from "lucide-react";
import qualityosLogo from "@/assets/qualityos_logo_v1.png";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "PDSA Lab", url: "/dashboard/pdsa-lab", icon: FlaskConical },
  { title: "Playbook Library", url: "/dashboard/playbooks", icon: BookOpen },
  { title: "AI Assistant", url: "/dashboard/ai-assistant", icon: Bot },
  { title: "Staff Tasks", url: "/dashboard/staff-tasks", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { organization } = useOrg();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                QualityOS
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                FQHC Quality Platform
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <p className="text-xs text-sidebar-foreground/60">Organization</p>
            <p className="text-sm font-medium text-sidebar-foreground">
              {organization.name}
            </p>
            <p className="text-xs text-sidebar-foreground/40">NPI: {organization.npi}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
