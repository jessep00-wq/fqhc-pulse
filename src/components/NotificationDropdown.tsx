import { useQuery } from "@tanstack/react-query";
import { Bell, FlaskConical, CheckSquare, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "@/lib/router-compat";

const TYPE_ICON: Record<string, React.ElementType> = {
  success: TrendingUp,
  warning: FlaskConical,
  task: CheckSquare,
  info: Info,
};

const TYPE_COLOR: Record<string, string> = {
  success: "text-success",
  warning: "text-warning",
  task: "text-primary",
  info: "text-muted-foreground",
};

function formatTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDropdown() {
  const { organization } = useOrg();
  const navigate = useNavigate();
  const orgId = organization?.id;

  const { data: notifications } = useQuery({
    queryKey: ["notifications", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_log")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(15);
      return data || [];
    },
    enabled: !!orgId,
    refetchInterval: 60000,
  });

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentCount = notifications?.filter(
    (n) => new Date(n.created_at).getTime() > sevenDaysAgo
  ).length ?? 0;

  const handleClick = (type: string) => {
    if (type === "warning" || type === "success") navigate("/dashboard/pdsa-lab");
    else if (type === "task") navigate("/dashboard/staff-tasks");
    else navigate("/dashboard");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {recentCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              {recentCount > 9 ? "9+" : recentCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Notifications</h4>
          <p className="text-xs text-muted-foreground">{recentCount} new this week</p>
        </div>
        <ScrollArea className="h-[320px]">
          {!notifications?.length ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] || Info;
                const color = TYPE_COLOR[n.type] || "text-muted-foreground";
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n.type)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">{n.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTime(n.created_at)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
