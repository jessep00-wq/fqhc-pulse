import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  route: string;
  checkFn: (data: ChecklistData) => boolean;
}

interface ChecklistData {
  cycleCount: number;
  taskCount: number;
  trendCount: number;
  financialsExist: boolean;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "pdsa",
    label: "Create your first PDSA cycle",
    description: "Start a quality improvement cycle using a guided template or from scratch.",
    route: "/dashboard/pdsa-lab",
    checkFn: (d) => d.cycleCount > 0,
  },
  {
    id: "task",
    label: "Assign a staff task",
    description: "Route work to the right team members with deadlines and priorities.",
    route: "/dashboard/staff-tasks",
    checkFn: (d) => d.taskCount > 0,
  },
  {
    id: "trends",
    label: "Add UDS trend data",
    description: "Seed your UDS measures to see trend charts and SPC analysis on the dashboard.",
    route: "/dashboard/settings",
    checkFn: (d) => d.trendCount > 0,
  },
  {
    id: "financials",
    label: "Configure financial impact",
    description: "Enter shared savings and grant data to connect clinical work to revenue.",
    route: "/dashboard",
    checkFn: (d) => d.financialsExist,
  },
];

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { organization } = useOrg();
  const orgId = organization.id;
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    const key = `checklist_dismissed_${orgId}`;
    if (localStorage.getItem(key) === "true") setDismissed(true);
  }, [orgId]);

  const { data } = useQuery({
    queryKey: ["onboarding_checklist", orgId],
    queryFn: async () => {
      const [cycles, tasks, trends, financials] = await Promise.all([
        supabase.from("pdsa_cycles").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("uds_trends").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase
          .from("org_financials")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId),
      ]);
      return {
        cycleCount: cycles.count ?? 0,
        taskCount: tasks.count ?? 0,
        trendCount: trends.count ?? 0,
        financialsExist: (financials.count ?? 0) > 0,
      } as ChecklistData;
    },
    enabled: !!orgId,
  });

  if (dismissed || !data) return null;

  const completedItems = CHECKLIST_ITEMS.filter((item) => item.checkFn(data));
  const progress = Math.round((completedItems.length / CHECKLIST_ITEMS.length) * 100);

  // All done — auto-dismiss
  if (progress === 100) {
    localStorage.setItem(`checklist_dismissed_${orgId}`, "true");
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(`checklist_dismissed_${orgId}`, "true");
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Get started with MeasureWise</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleDismiss}>
              Dismiss
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground font-medium">{completedItems.length}/{CHECKLIST_ITEMS.length}</span>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-0 space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const done = item.checkFn(data);
            return (
              <button
                key={item.id}
                className={`w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                  done ? "opacity-60" : "hover:bg-primary/10 cursor-pointer"
                }`}
                onClick={() => !done && navigate(item.route)}
                disabled={done}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
              </button>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
