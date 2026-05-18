import playbookCover from "@/assets/athenaone-playbook-cover.jpg";
import { PlaybookLeadForm } from "./PlaybookLeadForm";

export function PlaybookSidebarCard() {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/40 flex items-center gap-3">
          <img
            src={playbookCover}
            alt=""
            aria-hidden
            loading="lazy"
            width={1024}
            height={1024}
            className="h-20 w-auto drop-shadow"
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Free Resource
            </p>
            <p className="text-sm font-bold text-foreground leading-tight">
              AthenaOne Optimization Playbook
            </p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">
            Master 2025 UDS reporting and audit readiness inside AthenaOne.
          </p>
          <PlaybookLeadForm variant="sidebar" surface="blog_sidebar" />
        </div>
      </div>
    </aside>
  );
}
