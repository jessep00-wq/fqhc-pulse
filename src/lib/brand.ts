// Single source of truth for brand naming, legal entity, domain, and signatures.
// Edge functions mirror this file at supabase/functions/_shared/brand.ts — keep both in sync.

export const BRAND = {
  name: "MeasureWise",
  nameTm: "MeasureWise\u2122",
  tagline: "PDSA & UDS Quality Operations for FQHCs",
  legalEntity: "MeasureWise",
  legalLocation: "Fulton, MS",
  domain: "measurewise.org",
  url: "https://measurewise.org",
  supportEmail: "support@measurewise.org",
  helloEmail: "hello@measurewise.org",
  founder: {
    name: "Jessica Smith",
    formalName: "Jessica R. Smith, BSN",
    title: "Founder, MeasureWise",
    email: "jessica@measurewise.org",
  },
} as const;

export const copyright = (year: number = new Date().getFullYear()) =>
  `© ${year} ${BRAND.legalEntity}. All rights reserved.`;

export const brandTitle = (pageTitle: string) =>
  pageTitle.includes(BRAND.name) ? pageTitle : `${pageTitle} | ${BRAND.nameTm}`;
