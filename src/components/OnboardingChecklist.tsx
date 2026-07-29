import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Rocket, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

interface ChecklistItem {
  id: string;
  step: number;
  label: string;
  description: string;
  route: string;
  checkFn: (data: ChecklistData) => boolean;
}

interface ChecklistData {
  cycleCount: number;
  taskCount: number;
  trendCount: number;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "trends",
    step: 1,
    label: "Add UDS trend data",
    description: "Seed your UDS measures to see trend charts and SPC analysis on the dashboard.",
    route: "/dashboard/settings",
    checkFn: (d) => d.trendCount > 0,
  },
  {
    id: "pdsa",
    step: 2,
    label: "Create your first PDSA cycle",
    description: "Start a quality improvement cycle using a guided template or from scratch.",
    route: "/dashboard/pdsa-lab",
    checkFn: (d) => d.cycleCount > 0,
  },
  {
    id: "task",
    step: 3,
    label: "Assign a staff task",
    description: "Route work to the right team members with deadlines and priorities.",
    route: "/dashboard/staff-tasks",
    checkFn: (d) => d.taskCount > 0,
  },
];

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const { organization } = useOrg();
  const orgId = organization.id;
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const key = `checklist_dismissed_${orgId}`;
    if (localStorage.getItem(key) === "true") setDismissed(true);
  }, [orgId]);

  const { data } = useQuery({
    queryKey: ["onboarding_checklist", orgId],
    queryFn: async () => {
      const [cycles, tasks, trends] = await Promise.all([
        supabase.from("pdsa_cycles").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("uds_trends").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
      ]);
      return {
        cycleCount: cycles.count ?? 0,
        taskCount: tasks.count ?? 0,
        trendCount: trends.count ?? 0,
      } as ChecklistData;
    },
    enabled: !!orgId,
  });

  if (dismissed || !data) return null;

  const completedItems = CHECKLIST_ITEMS.filter((item) => item.checkFn(data));
  const progress = Math.round((completedItems.length / CHECKLIST_ITEMS.length) * 100);

  if (progress === 100) {
    localStorage.setItem(`checklist_dismissed_${orgId}`, "true");
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(`checklist_dismissed_${orgId}`, "true");
    setDismissed(true);
  };

  const isNewOrg = completedItems.length === 0;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-sm">
      <CardHeader className="pb-3">
        {isNewOrg && (
          <div className="flex items-start gap-3 mb-3 rounded-lg bg-primary/10 p-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Welcome to MeasureWise!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete these 4 steps to set up your quality improvement workspace. Each step takes about 2 minutes.
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              {isNewOrg ? "Setup Checklist" : "Get started with MeasureWise"}
            </CardTitle>
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
                  <div className="flex items-center justify-center h-5 w-5 rounded-full border-2 border-primary text-primary text-xs font-bold mt-0.5 shrink-0">
                    {item.step}
                  </div>
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
