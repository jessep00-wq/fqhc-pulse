import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, Circle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";
import { captureFromUrl, readPlanIntent, appendPlanToUrl } from "@/lib/planIntent";
import { trackAnonEvent } from "@/lib/trackEvent";

import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { Navigate, Link } from "react-router-dom";

type StaffRole = "Front Desk" | "MA/RN" | "Provider" | "Care Coordinator" | "QI Manager";
const ROLES: StaffRole[] = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Contains a number", test: (p: string) => /\d/.test(p) },
];

export default function Auth() {
  const { session, loading: authLoading } = useAuth();
  const { hasOrg, loading: orgLoading } = useOrg();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get("signup"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("QI Manager");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);

  const passwordValid = useMemo(
    () => passwordRules.every((r) => r.test(password)),
    [password]
  );

  // Capture incoming ?plan=&billing= from /pricing → relay through signup,
  // email verification, and onboarding so we can launch checkout afterward.
  useEffect(() => {
    captureFromUrl(searchParams);
  }, [searchParams]);

  // While auth or org state is still resolving for a signed-in visitor,
  // show a spinner instead of rendering the auth form (avoids flash).
  if (session && (authLoading || orgLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  // Always hand authenticated users off to /dashboard. ProtectedRoute owns
  // the /onboarding decision — it has a sticky confirmed-org flag and waits
  // for both auth + org contexts to settle, so we avoid the race where
  // hasOrg is transiently false right after authLoading flips.
  if (session && !authLoading && !orgLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      // If the user came from /pricing with a plan intent, let the
      // post-login dashboard/onboarding redirect logic pick it up.
      navigate("/dashboard");
    }
  };

  const handleSignUp = async () => {
    if (!passwordValid) {
      toast.error("Please meet all password requirements.");
      return;
    }
    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setLoading(true);
    const intent = readPlanIntent();
    trackAnonEvent("signup_started", intent ? { priceId: intent.priceId } : undefined);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, staff_role: staffRole },
        emailRedirectTo: appendPlanToUrl(`${window.location.origin}/auth`, intent),
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      trackAnonEvent("signup_completed", {
        priceId: intent?.priceId,
        userId: data?.user?.id,
      });
      // Welcome email is sent server-side by the `send-welcome-email` edge
      // function on first SIGNED_IN (see AuthContext) — do not invoke
      // `send-email` here with client-supplied HTML, which would let any
      // authenticated user push arbitrary HTML through the email pipeline.
      setShowVerifyEmail(true);
    }
  };


  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email");
      setShowForgot(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (error) toast.error("Google sign-in failed. Please try again.");
  };

  const signupDisabled = loading || !passwordValid || !agreedToTerms;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <h1 className="sr-only">
        {showForgot ? "Reset your MeasureWise password" : isLogin ? "Sign in to MeasureWise" : "Create your MeasureWise account"}
      </h1>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="md" className="justify-center" />
          </div>
          <CardTitle className="text-xl">{BRAND.name}</CardTitle>
          <CardDescription>
            {showForgot ? "Reset your password" : "Quality operations, simplified for FQHCs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showVerifyEmail ? (
            <div className="flex flex-col items-center text-center py-6 space-y-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Check your email</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  We sent a verification link to <span className="font-medium text-foreground">{email}</span>. Click the link to activate your account.
                </p>
              </div>
              <Button variant="outline" onClick={() => { setShowVerifyEmail(false); setIsLogin(true); }}>
                Back to Sign In
              </Button>
            </div>
          ) : showForgot ? (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.org" />
              </div>
              <Button className="w-full" onClick={handleForgotPassword} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Reset Link
              </Button>
              <Button variant="link" className="w-full" onClick={() => setShowForgot(false)}>
                Back to sign in
              </Button>
            </>
          ) : (
            <>
              {/* Google SSO */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Smith" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.org" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                {!isLogin && password.length > 0 && (
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
                          <span className={passed ? "text-green-600" : "text-muted-foreground"}>
                            {rule.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label>Staff Role</Label>
                    <Select value={staffRole} onValueChange={(v) => setStaffRole(v as StaffRole)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(c) => setAgreedToTerms(c === true)}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" className="underline text-primary hover:text-primary/80">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" target="_blank" className="underline text-primary hover:text-primary/80">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </>
              )}
              <Button
                className="w-full"
                onClick={isLogin ? handleLogin : handleSignUp}
                disabled={isLogin ? loading : signupDisabled}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
              {isLogin && (
                <Button variant="link" className="w-full text-xs" onClick={() => setShowForgot(true)}>
                  Forgot password?
                </Button>
              )}
              <Button variant="ghost" className="w-full text-sm" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
