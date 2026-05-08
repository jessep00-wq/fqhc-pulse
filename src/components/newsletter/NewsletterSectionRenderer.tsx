import type { NewsletterSection } from "@/types/newsletter";

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-block bg-primary/10 text-primary text-[11px] font-bold tracking-[2px] uppercase px-3 py-1 rounded-full border border-primary/20 mb-3">
      {text}
    </span>
  );
}

function SectionHeading({ text }: { text: string }) {
  return (
    <h2 className="font-serif text-2xl text-foreground mb-4 leading-tight">{text}</h2>
  );
}

function IntroBlock({ text }: { text: string }) {
  return (
    <p className="text-base leading-relaxed text-muted-foreground border-l-[3px] border-primary pl-5 mb-7">
      {text}
    </p>
  );
}

function BodyTextBlock({ section }: { section: Extract<NewsletterSection, { type: "body_text" }> }) {
  return (
    <div className="mb-6">
      {section.pill && <Pill text={section.pill} />}
      {section.heading && <SectionHeading text={section.heading} />}
      <p className="text-[15px] leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: section.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
    </div>
  );
}

function ComparisonBlock({ section }: { section: Extract<NewsletterSection, { type: "comparison" }> }) {
  return (
    <div className="mb-6">
      {section.pill && <Pill text={section.pill} />}
      {section.heading && <SectionHeading text={section.heading} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="rounded-lg p-5 bg-red-50 border border-red-200">
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-red-600 mb-2">❌ {section.bad.label}</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{section.bad.text}</p>
        </div>
        <div className="rounded-lg p-5 bg-primary/5 border border-primary/20">
          <div className="text-[10px] font-bold tracking-[2px] uppercase text-primary mb-2">✓ {section.good.label}</div>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(215, 30%, 30%)" }}>{section.good.text}</p>
        </div>
      </div>
    </div>
  );
}

function ChecklistBlock({ section }: { section: Extract<NewsletterSection, { type: "checklist" }> }) {
  return (
    <div className="mb-6">
      {section.pill && <Pill text={section.pill} />}
      {section.heading && <SectionHeading text={section.heading} />}
      <ul className="space-y-2.5 my-5">
        {section.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-foreground">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RolesGridBlock({ section }: { section: Extract<NewsletterSection, { type: "roles_grid" }> }) {
  return (
    <div className="mb-6">
      {section.pill && <Pill text={section.pill} />}
      {section.heading && <SectionHeading text={section.heading} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6">
        {section.roles.map((role, i) => (
          <div key={i} className="rounded-lg p-4 bg-muted border border-border border-t-[3px] border-t-primary">
            <div className="text-xs font-bold tracking-[1px] uppercase text-primary mb-1.5">{role.title}</div>
            <div className="text-sm font-semibold text-foreground mb-1">{role.owns}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">{role.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SprintStepsBlock({ section }: { section: Extract<NewsletterSection, { type: "sprint_steps" }> }) {
  return (
    <div className="mb-6">
      {section.pill && <Pill text={section.pill} />}
      {section.heading && <SectionHeading text={section.heading} />}
      <div className="space-y-3.5 my-5">
        {section.steps.map((step, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-sidebar text-primary text-sm font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </div>
            <div>
              <strong className="block text-sm font-bold text-foreground mb-0.5">{step.title}</strong>
              <span className="text-sm text-muted-foreground leading-relaxed">{step.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuoteBlock({ text }: { text: string }) {
  return (
    <div className="relative rounded-xl bg-muted p-7 my-8 border-l-4 border-primary">
      <span className="absolute top-1 left-5 font-serif text-7xl text-primary/20 leading-none">"</span>
      <p className="font-serif text-lg text-foreground leading-relaxed pl-7">{text}</p>
    </div>
  );
}

function CalloutBlock({ section }: { section: Extract<NewsletterSection, { type: "callout" }> }) {
  return (
    <div className="relative rounded-xl bg-sidebar p-7 my-8 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary to-primary/60" />
      <div className="text-[10px] tracking-[2px] font-bold uppercase text-primary mb-2.5">{section.label}</div>
      <p className="text-[15px] leading-relaxed text-sidebar-foreground/90" dangerouslySetInnerHTML={{ __html: section.text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-sidebar-foreground">$1</strong>') }} />
    </div>
  );
}

function DividerBlock() {
  return <div className="h-px my-9 bg-gradient-to-r from-transparent via-border to-transparent" />;
}

export function NewsletterSectionRenderer({ section }: { section: NewsletterSection }) {
  switch (section.type) {
    case "intro":
      return <IntroBlock text={section.text} />;
    case "body_text":
      return <BodyTextBlock section={section} />;
    case "comparison":
      return <ComparisonBlock section={section} />;
    case "checklist":
      return <ChecklistBlock section={section} />;
    case "roles_grid":
      return <RolesGridBlock section={section} />;
    case "sprint_steps":
      return <SprintStepsBlock section={section} />;
    case "quote":
      return <QuoteBlock text={section.text} />;
    case "callout":
      return <CalloutBlock section={section} />;
    case "divider":
      return <DividerBlock />;
    default:
      return null;
  }
}
