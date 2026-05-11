import { FileSpreadsheet, ListChecks, FileText, LineChart, type LucideIcon } from "lucide-react";

export interface Deliverable {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const DEFAULT_PDSA_BUNDLE_DELIVERABLES: Deliverable[] = [
  { icon: FileSpreadsheet, title: "PDSA workbook", description: "Plan / Do / Study / Act laid out for two measures." },
  { icon: ListChecks, title: "Intervention tracker", description: "Log who did what, when, and the result." },
  { icon: FileText, title: "Meeting-ready summary", description: "One-page recap for QI committee and board." },
  { icon: LineChart, title: "SPC chart setup", description: "Pre-built control limits — drop in your data." },
];

interface DeliverablesListProps {
  items: Deliverable[];
  title?: string;
  compact?: boolean;
}

export function DeliverablesList({ items, title = "You'll receive", compact = false }: DeliverablesListProps) {
  if (!items?.length) return null;

  if (compact) {
    return (
      <div>
        <p className="text-sm font-semibold mb-2">{title}</p>
        <ul className="space-y-1.5">
          {items.map((d) => (
            <li key={d.title} className="flex items-start gap-2 text-sm">
              <d.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span><span className="font-medium text-foreground">{d.title}</span></span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <ul className="grid sm:grid-cols-2 gap-3">
        {items.map((d) => (
          <li
            key={d.title}
            className="flex items-start gap-3 rounded-lg border bg-card p-3.5"
          >
            <div className="rounded-md bg-primary/10 p-2 shrink-0">
              <d.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="text-sm leading-snug">
              <p className="font-semibold">{d.title}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{d.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
