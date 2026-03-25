import React, { createContext, useContext } from "react";

interface Organization {
  id: string;
  name: string;
  npi: string;
}

interface OrgContextType {
  organization: Organization;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

const mockOrg: Organization = {
  id: "org-001",
  name: "Sunrise Community Health",
  npi: "1234567890",
};

export function OrgProvider({ children }: { children: React.ReactNode }) {
  return (
    <OrgContext.Provider value={{ organization: mockOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
