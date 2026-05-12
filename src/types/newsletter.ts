export type SectionType =
  | "intro"
  | "body_text"
  | "comparison"
  | "checklist"
  | "roles_grid"
  | "sprint_steps"
  | "quote"
  | "callout"
  | "divider";

export interface IntroSection {
  type: "intro";
  text: string;
}

export interface BodyTextSection {
  type: "body_text";
  pill?: string;
  heading?: string;
  text: string;
}

export interface ComparisonSection {
  type: "comparison";
  pill?: string;
  heading?: string;
  bad: { label: string; text: string };
  good: { label: string; text: string };
}

export interface ChecklistSection {
  type: "checklist";
  pill?: string;
  heading?: string;
  items: string[];
}

export interface RoleCard {
  title: string;
  owns: string;
  description: string;
}

export interface RolesGridSection {
  type: "roles_grid";
  pill?: string;
  heading?: string;
  roles: RoleCard[];
}

export interface SprintStep {
  title: string;
  description: string;
}

export interface SprintStepsSection {
  type: "sprint_steps";
  pill?: string;
  heading?: string;
  steps: SprintStep[];
}

export interface QuoteSection {
  type: "quote";
  text: string;
}

export interface CalloutSection {
  type: "callout";
  label: string;
  text: string;
}

export interface DividerSection {
  type: "divider";
}

export type NewsletterSection =
  | IntroSection
  | BodyTextSection
  | ComparisonSection
  | ChecklistSection
  | RolesGridSection
  | SprintStepsSection
  | QuoteSection
  | CalloutSection
  | DividerSection;

export interface Newsletter {
  id: string;
  title: string;
  subtitle: string | null;
  hero_emoji: string | null;
  hero_image_url: string | null;
  hero_summary: string | null;
  sections: NewsletterSection[];
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}
