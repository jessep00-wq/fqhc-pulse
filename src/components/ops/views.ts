/** The five views the Operations OS switches between. */
export const OPS_VIEWS = [
  "briefing",
  "board",
  "ventures",
  "rituals",
  "inbox",
] as const;

export type OpsView = (typeof OPS_VIEWS)[number];

export const OPS_VIEW_LABELS: Record<OpsView, string> = {
  briefing: "Briefing",
  board: "Board",
  ventures: "Ventures",
  rituals: "Rituals",
  inbox: "Inbox",
};

export function isOpsView(value: string): value is OpsView {
  return (OPS_VIEWS as readonly string[]).includes(value);
}
