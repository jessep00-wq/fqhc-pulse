import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Organization {
  id: string;
  name: string;
  npi: string;
}

interface OrgContextType {
  organization: Organization;
  loading: boolean;
  hasOrg: boolean;
  refetchOrg: () => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

const fallbackOrg: Organization = { id: "", name: "Loading...", npi: "" };

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
          setOrganization({ id: org.id, name: org.name, npi: org.npi || "" });
        }
      }
      setLoading(false);
    };

    fetchOrg();
  }, [user, refreshKey]);

  const hasOrg = !!organization.id && organization.id !== "";

  return (
    <OrgContext.Provider value={{ organization, loading, hasOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
