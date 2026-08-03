import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { trackEvent } from "@/lib/trackEvent";

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
  // Last server-verified user id. Used to avoid re-verifying (and re-setting a
  // new object identity) on background TOKEN_REFRESHED events fired when the
  // browser tab regains focus — that churn used to cascade into OrgContext
  // reloading and unmounting the whole dashboard, wiping in-progress forms.
  const verifiedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        // Optimistic: surface the JWT user immediately to avoid logged-out flash,
        // but keep the existing object identity when it's the same user so
        // downstream effects keyed on `user` don't re-run.
        setUser((prev) => {
          const next = session?.user ?? null;
          if (prev && next && prev.id === next.id) return prev;
          return next;
        });
        setLoading(false);

        // IMPORTANT: never await or call other supabase.auth.* methods synchronously
        // inside this callback — gotrue-js holds the auth lock for the duration of
        // the callback, and a nested getUser()/getSession() will deadlock until the
        // lock is force-stolen, producing an unhandled AbortError. Defer all
        // supabase work to a microtask via setTimeout(..., 0).

        const alreadyVerified =
          !!session?.user && verifiedUserIdRef.current === session.user.id;

        if (session && !alreadyVerified) {
          setTimeout(() => {
            // Server-verify identity. session.user is decoded from the local JWT
            // and must not be trusted for authorization decisions.
            supabase.auth
              .getUser()
              .then(({ data, error }) => {
                if (error || !data?.user) {
                  verifiedUserIdRef.current = null;
                  setUser(null);
                  return;
                }
                verifiedUserIdRef.current = data.user.id;
                setUser((prev) => (prev && prev.id === data.user.id ? prev : data.user));
              })
              .catch(() => {
                // Swallow lock-steal aborts and transient network errors —
                // the next auth event will re-verify.
              });
          }, 0);
        }

        // Track login event and update last_login_at
        if (event === "SIGNED_IN" && session?.user && !loginTracked.current) {
          loginTracked.current = true;
          trackEvent("login");
          // Flush any pending pre-auth signup_completed into the DB now that
          // we have an authenticated session. trackEvent no-ops if the profile
          // has no organization_id yet — Onboarding will flush after org exists.
          try {
            if (typeof window !== "undefined") {
              const raw = window.localStorage.getItem("mw_pending_signup_completed");
              if (raw !== null) {
                let meta: Record<string, unknown> = {};
                try { meta = JSON.parse(raw) ?? {}; } catch { /* ignore */ }
                // Best-effort: leave the flag in place; Onboarding removes it
                // once it succeeds post-org-creation.
                trackEvent("signup_completed", meta);
              }
            }
          } catch {
            // best-effort
          }
          const userId = session.user.id;
          setTimeout(() => {
            supabase
              .from("profiles")
              .update({ last_login_at: new Date().toISOString() })
              .eq("id", userId)
              .then(
                () => {},
                () => {},
              );

            // Send welcome email exactly once per user.
            // Source of truth is profiles.welcome_email_sent_at (set by the
            // edge function); localStorage is only a quick local guard so we
            // don't fire the call on every page reload.
            const welcomeKey = `mw_welcome_sent_${userId}`;
            if (typeof window !== "undefined" && !window.localStorage.getItem(welcomeKey)) {
              supabase
                .from("profiles")
                .select("welcome_email_sent_at")
                .eq("id", userId)
                .maybeSingle()
                .then(({ data }) => {
                  if (data?.welcome_email_sent_at) {
                    window.localStorage.setItem(welcomeKey, "1");
                    return;
                  }
                  supabase.functions
                    .invoke("send-welcome-email", { body: { user_id: userId } })
                    .then(({ error }) => {
                      if (!error) window.localStorage.setItem(welcomeKey, "1");
                    })
                    .catch(() => {});
                })
                .then(undefined, () => {});
            }
          }, 0);
        }
        if (event === "SIGNED_OUT") {
          loginTracked.current = false;
        }
      }
    );

    // Note: onAuthStateChange fires an INITIAL_SESSION event on mount,
    // so we do not call getSession() — avoids a logged-out flash race.

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
