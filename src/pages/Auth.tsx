import { useState, useMemo } from "react";
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
import qualityosLogo from "@/assets/qualityos_logo_v1.png";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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
  const { session } = useAuth();
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

  const passwordValid = useMemo(
    () => passwordRules.every((r) => r.test(password)),
    [password]
  );

  if (session) return <Navigate to="/dashboard" replace />;

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, staff_role: staffRole },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Redirecting…");
      navigate("/onboarding");
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
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed. Please try again.");
  };

  const signupDisabled = loading || !passwordValid || !agreedToTerms;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={qualityosLogo} alt="QualityOS" className="h-10" />
          </div>
          <CardTitle className="text-xl">QualityOS</CardTitle>
          <CardDescription>
            {showForgot ? "Reset your password" : "Quality operations, simplified for FQHCs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForgot ? (
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
