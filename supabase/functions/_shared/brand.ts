// Single source of truth for brand naming on the edge-function (Deno) side.
// Mirrors src/lib/brand.ts — keep both in sync when values change.

export const BRAND = {
  name: "MeasureWise",
  nameTm: "MeasureWise\u2122",
  tagline: "PDSA & UDS Quality Operations for FQHCs",
  legalEntity: "MeasureWise",
  legalLocation: "Fulton, MS",
  domain: "measurewise.org",
  url: "https://measurewise.org",
  supportEmail: "hello@measurewise.org",
  helloEmail: "hello@measurewise.org",
  founder: {
    name: "Jessica Smith",
    formalName: "Jessica R. Smith, BSN",
    title: "Founder, MeasureWise",
    email: "jessica@measurewise.org",
    newsletterEmail: "newsletter@notify.thebrandstudio.studio",
  },
} as const;

export const copyright = (year: number = new Date().getFullYear()) =>
  `© ${year} ${BRAND.legalEntity}. All rights reserved.`;

export const fromAddress = (
  mailbox: "hello" | "jessica" | "newsletter" | "brand",
  label: string = BRAND.name,
): string => {
  switch (mailbox) {
    case "jessica":
      return `Jessica at ${BRAND.name} <${BRAND.founder.email}>`;
    case "newsletter":
      return `${BRAND.name} Newsletter <${BRAND.founder.newsletterEmail}>`;
    case "brand":
      return `${label} <${BRAND.helloEmail}>`;
    case "hello":
    default:
      return `${BRAND.name} <${BRAND.helloEmail}>`;
  }
};
