import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LogOut, Building2, LayoutDashboard, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialGuard } from "@/components/TrialGuard";
import { DemoWatermark } from "@/components/DemoWatermark";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut, user } = useAuth();

  const { organization, hasOrg, isDemo } = useOrg();

  const truncated =
    organization.name.length > 28 ? `${organization.name.slice(0, 27)}…` : organization.name;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          {isDemo && <DemoModeBanner />}
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
                        {isDemo && (
                          <span className="ml-1 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            Demo
                          </span>
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
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                      <Link to="/dashboard" aria-label="Back to dashboard">
                        <LayoutDashboard className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">Back to dashboard</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account menu">
                    <UserCircle2 className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs font-medium leading-none">Signed in as</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user?.email ?? "your account"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </header>
          <main className="flex-1 overflow-auto relative">
            <TrialGuard>{children}</TrialGuard>
          </main>
        </div>
        {isDemo && <DemoWatermark />}
      </div>
    </SidebarProvider>
  );
}
