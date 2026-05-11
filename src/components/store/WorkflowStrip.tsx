import { Download, Settings2, Play, Presentation } from "lucide-react";

const STEPS = [
  { icon: Download, label: "Download" },
  { icon: Settings2, label: "Customize for your site" },
  { icon: Play, label: "Run the PDSA" },
  { icon: Presentation, label: "Present results" },
];

export function WorkflowStrip() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">How teams use it</h2>
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li
            key={s.label}
            className="flex items-center gap-2.5 rounded-lg border bg-card p-3"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
              {i + 1}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <s.icon className="h-4 w-4 text-primary" />
              <span>{s.label}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
