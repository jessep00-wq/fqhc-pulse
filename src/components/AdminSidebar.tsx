import {
  LayoutDashboard,
  CreditCard,
  Activity,
  Newspaper,
  FileText,
  ShoppingBag,
  ArrowLeft,
  Shield,
  Sparkles,
  FlaskConical,
  Mail,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const oversight = [
  { title: "Accounts", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Adoption", url: "/admin/adoption", icon: Activity },
];

const growth = [
  { title: "Billing", url: "/admin/billing", icon: CreditCard },
  { title: "Readiness Leads", url: "/admin/readiness", icon: Sparkles },
  { title: "Waitlist Tester", url: "/admin/waitlist-test", icon: FlaskConical },
  { title: "Waitlist Status", url: "/admin/waitlist-status", icon: Mail },
];

const content = [
  { title: "Content Ops", url: "/admin/content", icon: Sparkles },
  { title: "Blog", url: "/admin/blog", icon: FileText },
  { title: "Newsletter", url: "/admin/newsletter", icon: Newspaper },
  { title: "Store", url: "/admin/store", icon: ShoppingBag },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const renderGroup = (label: string, items: typeof oversight) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title}>
                <NavLink
                  to={item.url}
                  end={item.end}
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
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Logo size="sm" markOnly />
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground whitespace-nowrap">
                MeasureWise
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary whitespace-nowrap">
                <Shield className="h-3 w-3 shrink-0" /> Admin Console
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Oversight", oversight)}
        {renderGroup("Growth", growth)}
        {renderGroup("Content", content)}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-lg border border-border bg-sidebar-accent/40 px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Back to App</span>}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
