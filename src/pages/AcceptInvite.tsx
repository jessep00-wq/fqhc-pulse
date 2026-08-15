import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { Logo } from "@/components/Logo";

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const { refetchOrg } = useOrg();
  const navigate = useNavigate();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading || !token) return;

    if (!user) {
      // Remember the invite so Auth can bounce back here after sign-in.
      window.sessionStorage.setItem("mw_pending_invite", token);
      navigate(`/auth?redirect=${encodeURIComponent(`/invite/${token}`)}`, { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("team-invite", {
        body: { action: "accept", token },
      });
      if (cancelled) return;

      const errText =
        (data as { error?: string } | null)?.error ??
        (error ? "We couldn't process this invitation." : null);

      if (errText) {
        setState("error");
        setMessage(errText);
        return;
      }
      window.sessionStorage.removeItem("mw_pending_invite");
      refetchOrg();
      setState("done");
      setMessage("You're in. Taking you to the dashboard…");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user, authLoading, navigate, refetchOrg]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center space-y-3">
          <Logo className="h-8" />
          <CardTitle className="text-xl">Team invitation</CardTitle>
          <CardDescription>Joining your health center's MeasureWise workspace</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state === "working" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Checking your invitation…</p>
            </div>
          )}
          {state === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <p className="text-sm text-foreground">{message}</p>
            </div>
          )}
          {state === "error" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-foreground">{message}</p>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
