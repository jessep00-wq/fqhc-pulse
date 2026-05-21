import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization>(fallbackOrg);
  const [loading, setLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  const refetchOrg = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    if (!user) {
      setOrganization(fallbackOrg);
      setLoading(false);
      return;
    }

    const fetchOrg = async () => {
      setLoading(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.organization_id)
          .single();

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
        }
      }
      setLoading(false);
    };

    fetchOrg();
  }, [user, refreshKey]);

  const hasOrg = !!organization.id && organization.id !== "";
  const isDemo = hasOrg && organization.dataMode === "demo";

  return (
    <OrgContext.Provider value={{ organization, loading, hasOrg, isDemo, refetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
