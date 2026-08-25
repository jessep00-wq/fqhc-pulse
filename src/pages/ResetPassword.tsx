import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Circle } from "lucide-react";
import { toast } from "sonner";

// Must match signup rules in Auth.tsx — keep these in sync.
const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Pessimistic default — we only flip to a usable state once a recovery
  // token is confirmed (via PKCE `?code=` exchange, implicit `#type=recovery`,
  // or the PASSWORD_RECOVERY event fired by onAuthStateChange).
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    let cancelled = false;

    // PASSWORD_RECOVERY fires when Supabase processes a recovery link —
    // handles both PKCE and implicit/hash flows.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) {
        setStatus("ready");
      }
    });

    (async () => {
      // PKCE flow: token arrives as ?code=...
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          setStatus("invalid");
        } else {
          setStatus("ready");
        }
        return;
      }
      // Implicit/hash flow: token arrives in URL fragment
      if (window.location.hash.includes("type=recovery")) {
        setStatus("ready");
        return;
      }
      // No token yet — give onAuthStateChange a brief window to fire
      // PASSWORD_RECOVERY (Supabase can emit it asynchronously on detectSessionInUrl)
      setTimeout(() => {
        if (!cancelled) {
          setStatus((s) => (s === "checking" ? "invalid" : s));
        }
      }, 1500);
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Strip auth tokens from the URL once the recovery token has been consumed
  // so they don't linger for analytics, history, or screenshots.
  useEffect(() => {
    if (status !== "ready") return;
    const search = window.location.search;
    const hash = window.location.hash;
    const hasAuthToken =
      /(?:^|[?&])(access_token|refresh_token|code)=/.test(search) ||
      /(?:^|[#&])(access_token|refresh_token)=/.test(hash);
    if (hasAuthToken) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [status]);

  const passwordValid = passwordRules.every((r) => r.test(password));

  const handleReset = async () => {
    if (!passwordValid) {
      toast.error("Please meet all password requirements.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      // Sign out so user logs in with the new password on a clean session
      await supabase.auth.signOut();
      navigate("/auth");
    }
  };

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Invalid or expired password reset link.</p>
            <Button className="mt-4" onClick={() => navigate("/auth")}>Back to Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Helmet>
        <title>Reset your password — MeasureWise</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Set New Password</CardTitle>
          <CardDescription>Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {password.length > 0 && (
              <ul className="space-y-1 mt-2">
                {passwordRules.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <li key={rule.label} className="flex items-center gap-2 text-xs">
                      {passed ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className={passed ? "text-success" : "text-muted-foreground"}>
                        {rule.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Button
            className="w-full"
            onClick={handleReset}
            disabled={loading || !passwordValid}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
