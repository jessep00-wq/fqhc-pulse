import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

type StaffRole = "Front Desk" | "MA/RN" | "Provider" | "Care Coordinator" | "QI Manager";
const ROLES: StaffRole[] = ["Front Desk", "MA/RN", "Provider", "Care Coordinator", "QI Manager"];

export default function Auth() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("QI Manager");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Update profile with staff_role and org
    if (data.user) {
      const ORG_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
      // Wait a moment for trigger to create profile
      await new Promise((r) => setTimeout(r, 500));
      await supabase
        .from("profiles")
        .update({ staff_role: staffRole, organization_id: ORG_ID, full_name: fullName })
        .eq("id", data.user.id);
    }

    setLoading(false);
    toast.success("Check your email to verify your account before signing in.");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-xl">QualityOS</CardTitle>
          <CardDescription>
            {showForgot ? "Reset your password" : isLogin ? "Sign in to your account" : "Create your account"}
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
              </div>
              {!isLogin && (
                <div className="space-y-2">
                  <Label>Staff Role</Label>
                  <Select value={staffRole} onValueChange={(v) => setStaffRole(v as StaffRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full" onClick={isLogin ? handleLogin : handleSignUp} disabled={loading}>
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
