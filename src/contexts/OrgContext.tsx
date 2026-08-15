import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Organization {
  id: string;
  name: string;
  npi: string;
  dataMode: "demo" | "live";
  orgType: string | null;
  reportingPeriod: string | null;
  qualityLeadName: string | null;
  qualityLeadEmail: string | null;
  timezone: string | null;
}

interface OrgContextType {
  organization: Organization;
  loading: boolean;
  hasOrg: boolean;
  isDemo: boolean;
  error: string | null;
  refetchOrg: () => void;
  /** True when a founder/support admin is viewing another tenant's workspace. */
  isActingAs: boolean;
  /** Clears the admin "acting as" override and re-resolves the real workspace. */
  exitActingAs: () => void;
}

export const ACTING_ORG_KEY = "mw_admin_active_org";
export const ACTING_ORG_EVENT = "mw-acting-org-changed";

const OrgContext = createContext<OrgContextType | undefined>(undefined);

const fallbackOrg: Organization = {
  id: "",
  name: "Loading...",
  npi: "",
  dataMode: "live",
  orgType: null,
  reportingPeriod: null,
  qualityLeadName: null,
  qualityLeadEmail: null,
  timezone: null,
};

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [organization, setOrganization] = useState<Organization>(fallbackOrg);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Sticky flag: once we've confirmed an org exists, transient errors won't
  // bounce the user back to /onboarding.
  const confirmedOrgRef = useRef(false);
  const [hasOrgState, setHasOrgState] = useState(false);
  const [isActingAs, setIsActingAs] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const refetchOrg = () => setRefreshKey((k) => k + 1);

  const exitActingAs = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACTING_ORG_KEY);
      window.dispatchEvent(new Event(ACTING_ORG_EVENT));
    }
    setRefreshKey((k) => k + 1);
  };

  // Re-resolve whenever the admin org switcher changes (this tab or another).
  useEffect(() => {
    const onChange = () => setRefreshKey((k) => k + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTING_ORG_KEY) onChange();
    };
    window.addEventListener(ACTING_ORG_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ACTING_ORG_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (authLoading) {
      if (!confirmedOrgRef.current) setLoading(true);
      return;
    }


    if (!userId) {
      setOrganization(fallbackOrg);
      setHasOrgState(false);
      confirmedOrgRef.current = false;
      setError(null);
      setLoading(false);
      return;
    }

    const fetchOrg = async () => {
      // Only surface a loading state before the first successful resolution.
      // Background refreshes stay silent so the app never flashes a spinner.
      if (!confirmedOrgRef.current) setLoading(true);
      setError(null);

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle();

      if (profileErr) {
        console.error("[OrgContext] profile fetch failed", profileErr);
        setError(profileErr.message);
        // Don't clear hasOrg on transient errors — avoids /onboarding loop.
        setLoading(false);
        return;
      }

      let targetOrgId = profile?.organization_id ?? null;
      let acting = false;

      // Founder/support "acting as org" override. This wins over the admin's
      // own workspace so the switcher is never a no-op.
      const actingId =
        typeof window !== "undefined" ? window.localStorage.getItem(ACTING_ORG_KEY) : null;
      if (actingId) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .in("role", ["founder_admin", "internal_support"])
          .maybeSingle();
        if (roleRow) {
          acting = actingId !== targetOrgId;
          targetOrgId = actingId;
        }
      }
      setIsActingAs(acting);

      if (!targetOrgId) {
        // Authoritative "no org" — safe to send to onboarding.
        setOrganization(fallbackOrg);
        setHasOrgState(false);
        confirmedOrgRef.current = false;
        setLoading(false);
        return;
      }


      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", targetOrgId)
        .maybeSingle();

      if (orgErr) {
        console.error("[OrgContext] org fetch failed", orgErr);
        setError(orgErr.message);
        setLoading(false);
        return;
      }

      if (org) {
        const o = org as typeof org & {
          data_mode?: string;
          org_type?: string | null;
          reporting_period?: string | null;
          quality_lead_name?: string | null;
          quality_lead_email?: string | null;
          timezone?: string | null;
        };
        setOrganization({
          id: o.id,
          name: o.name,
          npi: o.npi || "",
          dataMode: (o.data_mode === "demo" ? "demo" : "live"),
          orgType: o.org_type ?? null,
          reportingPeriod: o.reporting_period ?? null,
          qualityLeadName: o.quality_lead_name ?? null,
          qualityLeadEmail: o.quality_lead_email ?? null,
          timezone: o.timezone ?? null,
        });
        confirmedOrgRef.current = true;
        setHasOrgState(true);
      }
      setLoading(false);
    };

    fetchOrg();
  }, [userId, refreshKey, authLoading]);

  const hasOrg = hasOrgState || confirmedOrgRef.current;
  const isDemo = hasOrg && organization.dataMode === "demo";

  return (
    <OrgContext.Provider
      value={{ organization, loading, hasOrg, isDemo, error, refetchOrg, isActingAs, exitActingAs }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
