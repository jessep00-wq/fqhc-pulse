import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminOrgs } from "@/hooks/useAdminOrgs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

const ACTING_KEY = ACTING_ORG_KEY;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { orgs } = useAdminOrgs("active");
  const [acting, setActing] = useState<string>(() =>
    typeof window !== "undefined" ? window.localStorage.getItem(ACTING_KEY) ?? "" : ""
  );

  // Keep state in sync if changed in another tab
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTING_KEY) setActing(e.newValue ?? "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleChange = (val: string) => {
    if (val === "__clear__") {
      window.localStorage.removeItem(ACTING_KEY);
      setActing("");
    } else {
      window.localStorage.setItem(ACTING_KEY, val);
      setActing(val);
    }
    // Let OrgContext re-resolve in place — no full page reload.
    window.dispatchEvent(new Event(ACTING_ORG_EVENT));
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Admin Console
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Acting as:</span>
              <Select value={acting || "__clear__"} onValueChange={handleChange}>
                <SelectTrigger className="h-8 w-[220px] text-xs">
                  <SelectValue placeholder="No organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__clear__">No organization</SelectItem>
                  {orgs.map((o: { id: string; name: string }) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
