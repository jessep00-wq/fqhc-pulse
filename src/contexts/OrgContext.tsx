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
}

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
  const [organization, setOrganization] = useState<Organization>(fallbackOrg);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Sticky flag: once we've confirmed an org exists, transient errors won't
  // bounce the user back to /onboarding.
  const confirmedOrgRef = useRef(false);
  const [hasOrgState, setHasOrgState] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  const refetchOrg = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setOrganization(fallbackOrg);
      setHasOrgState(false);
      confirmedOrgRef.current = false;
      setError(null);
      setLoading(false);
      return;
    }

    const fetchOrg = async () => {
      setLoading(true);
      setError(null);

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) {
        console.error("[OrgContext] profile fetch failed", profileErr);
        setError(profileErr.message);
        // Don't clear hasOrg on transient errors — avoids /onboarding loop.
        setLoading(false);
        return;
      }

      let targetOrgId = profile?.organization_id ?? null;

      // Founder-admin "acting as org" override: if the admin has no org of
      // their own (or wants to act inside another tenant), they can set
      // `mw_admin_active_org` in localStorage via the admin org switcher.
      if (!targetOrgId && typeof window !== "undefined") {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["founder_admin", "internal_support"])
          .maybeSingle();
        if (roleRow) {
          const acting = window.localStorage.getItem("mw_admin_active_org");
          if (acting) targetOrgId = acting;
        }
      }

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
        .eq("id", profile.organization_id)
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
  }, [user, refreshKey, authLoading]);

  const hasOrg = hasOrgState || confirmedOrgRef.current;
  const isDemo = hasOrg && organization.dataMode === "demo";

  return (
    <OrgContext.Provider value={{ organization, loading, hasOrg, isDemo, error, refetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
