import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard, Users, CreditCard, Activity, LogOut, Newspaper, FileText, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const adminNav = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Pipeline", url: "/admin/pipeline", icon: Users },
  { title: "Billing", url: "/admin/billing", icon: CreditCard },
  { title: "Adoption", url: "/admin/adoption", icon: Activity },
  { title: "Newsletter", url: "/admin/newsletter", icon: Newspaper },
  { title: "Blog", url: "/admin/blog", icon: FileText },
  { title: "Store", url: "/admin/store", icon: ShoppingBag },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center justify-between border-b bg-card px-6">
        <div className="flex items-center gap-4">
          <img src={measurewiseLogo} alt="MeasureWise" className="h-7" />
          <span className="text-sm font-semibold text-muted-foreground">Admin Console</span>
          <div className="h-5 w-px bg-border" />
          <nav className="flex items-center gap-1">
            {adminNav.map((item) => {
              const active = location.pathname === item.url;
              return (
                <Link key={item.url} to={item.url}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("gap-2", active && "font-semibold")}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to App
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6 bg-background">{children}</main>
    </div>
  );
}
