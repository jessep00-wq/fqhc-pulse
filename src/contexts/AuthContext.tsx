import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { trackEvent } from "@/lib/trackEvent";
import { identifyUser, resetPostHog } from "@/lib/posthog";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const loginTracked = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Track login event and update last_login_at
        if (event === "SIGNED_IN" && session?.user && !loginTracked.current) {
          loginTracked.current = true;
          trackEvent("login");
          // Identify user in PostHog
          identifyUser(session.user.id, {
            email: session.user.email,
          });
          const userId = session.user.id;
          supabase
            .from("profiles")
            .update({ last_login_at: new Date().toISOString() })
            .eq("id", userId)
            .then(() => {});

          // Send welcome email exactly once per user. Guard via localStorage key
          // so password resets / re-logins don't re-trigger it.
          const welcomeKey = `mw_welcome_sent_${userId}`;
          if (typeof window !== "undefined" && !window.localStorage.getItem(welcomeKey)) {
            window.localStorage.setItem(welcomeKey, "1");
            supabase.functions
              .invoke("send-welcome-email", { body: { user_id: userId } })
              .catch(() => {
                // Non-blocking — clear the marker so a retry can happen on next login.
                window.localStorage.removeItem(welcomeKey);
              });
          }
        }
        if (event === "SIGNED_OUT") {
          loginTracked.current = false;
          resetPostHog();
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
