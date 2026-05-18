import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LogOut, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialGuard } from "@/components/TrialGuard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut } = useAuth();
  const { organization, hasOrg } = useOrg();

  const truncated =
    organization.name.length > 28 ? `${organization.name.slice(0, 27)}…` : organization.name;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TrialBanner />
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="ml-0 shrink-0" />
              {hasOrg && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 min-w-0 rounded-md border bg-muted/40 px-2.5 py-1">
                        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground truncate max-w-[14rem] sm:max-w-[20rem]">
                          {truncated}
                        </span>
                        {organization.npi && (
                          <>
                            <span className="hidden sm:inline text-border">·</span>
                            <span className="hidden sm:inline text-xs text-muted-foreground whitespace-nowrap">
                              NPI {organization.npi}
                            </span>
                          </>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">
                        {organization.name}
                        {organization.npi && ` · NPI ${organization.npi}`}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <NotificationDropdown />
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <TrialGuard>{children}</TrialGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
