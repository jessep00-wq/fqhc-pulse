import {
  LayoutDashboard,
  FlaskConical,
  BookOpen,
  Bot,
  Users,
  Settings,
  Sparkles,
  Building2,
  Shield,
  ArrowUpRight,
  ShieldCheck,
  FolderArchive,
  ClipboardCheck,
  BookCheck,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "@/lib/router-compat";
import { useOrg } from "@/contexts/OrgContext";
import { useTierLimits } from "@/hooks/useTierLimits";
import { useUserRole } from "@/hooks/useUserRole";
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

const navGroups: {
  label: string;
  items: {
    title: string;
    url: string;
    icon: typeof LayoutDashboard;
    accent?: boolean;
    badge?: string;
  }[];
}[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Network", url: "/dashboard/network", icon: Building2, badge: "Enterprise" },
    ],
  },
  {
    label: "Quality Tools",
    items: [
      { title: "PDSA Lab", url: "/dashboard/pdsa-lab", icon: FlaskConical, accent: true },
      { title: "Playbook Library", url: "/dashboard/playbooks", icon: BookOpen },
      { title: "AI Assistant", url: "/dashboard/ai-assistant", icon: Bot },
      { title: "AI Governance", url: "/dashboard/ai-governance", icon: ShieldCheck, badge: "NIST" },
    ],
  },
  {
    label: "Compliance & Reporting",
    items: [
      { title: "HRSA Audit Binder", url: "/dashboard/audit-binder", icon: BookCheck, badge: "OSV" },
      { title: "QI/QA Reports", url: "/dashboard/qi-reports", icon: ClipboardCheck, badge: "Quarterly" },
    ],
  },
  {
    label: "Team & Settings",
    items: [
      { title: "Staff Tasks", url: "/dashboard/staff-tasks", icon: Users },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { organization } = useOrg();
  const { isFreeTier, cyclesRemaining } = useTierLimits();
  const { isAdmin } = useUserRole();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link
          to="/dashboard"
          aria-label="Go to dashboard"
          className="flex items-center gap-2.5 min-w-0 rounded-md hover:bg-sidebar-accent/40 transition-colors -m-1 p-1"
        >
          <Logo size="sm" markOnly />
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground whitespace-nowrap">
                MeasureWise
              </span>
              <span className="text-[11px] leading-tight text-sidebar-foreground/60 whitespace-nowrap">
                FQHC Quality Platform
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>


      <SidebarContent>
        {isAdmin && (
          <>
            <SidebarGroup className="pb-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Admin Console"
                      className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary data-[active=true]:bg-primary/20"
                    >
                      <Link to="/admin" className="flex items-center">
                        <Shield className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="font-medium">Admin Console</span>
                            <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-70" />
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <Separator className="mx-3 my-1 w-auto bg-sidebar-border" />
          </>
        )}
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/40 text-xs uppercase tracking-wider">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="hover:bg-sidebar-accent/50"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && (
                          <span className="flex items-center gap-2">
                            {item.title}
                            {item.accent && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                            {item.badge && (
                              <span className="text-[9px] font-semibold rounded bg-primary/10 text-primary px-1.5 py-0.5 leading-none">
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {!collapsed && isFreeTier && !isAdmin && (
          <Link
            to="/#contact"
            className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground hover:bg-primary/10 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Free plan · Contact us to upgrade</span>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
