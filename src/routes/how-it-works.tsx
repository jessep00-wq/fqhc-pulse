import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { MeasureRescueSimulator } from "@/components/simulator/MeasureRescueSimulator";
import { Button } from "@/components/ui/button";
import { DATA_SCOPE_STATEMENT } from "@/lib/siteContent";

const TITLE = "How MeasureWise Works: Measure Rescue Walkthrough";
const DESC =
  "Walk through a PDSA cycle for an off-pace FQHC measure: baseline, intervention, owner, 30-day result, Study, Act, and the evidence record.";

export const Route = createFileRoute("/how-it-works")({
  validateSearch: (search: Record<string, unknown>): { measure?: string } => {
    const measure = typeof search.measure === "string" ? search.measure : undefined;
    return ["CMS130", "CMS122", "CMS165", "CMS124", "OTHER"].includes(measure ?? "") ? { measure } : {};
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://measurewise.org/how-it-works" }],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const { measure } = Route.useSearch();
  return (
    <PublicPageLayout>
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">How it works: the Measure Rescue walkthrough</h1>
          <p className="text-lg text-muted-foreground">
            See how MeasureWise turns an off-pace measure into a documented PDSA cycle. Pick a measure and click through.
          </p>
          <p className="text-sm font-medium text-foreground">{DATA_SCOPE_STATEMENT}</p>
        </div>
      </section>
      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <MeasureRescueSimulator key={measure ?? "choose"} initialMeasure={measure} />
        </div>
      </section>
      <section className="border-t border-border bg-muted/40 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-5 text-center">
          <h2 className="text-2xl font-bold text-foreground">Want to walk through your own measure?</h2>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/contact?topic=measure-rescue">Book a 15-minute Measure Rescue call</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth?signup=true">Start 14-day free trial</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
