import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FlaskConical,
  BarChart3,
  LineChart,
  BookOpen,
  ArrowRight,
  Shield,
} from "lucide-react";
import qualityosLogo from "@/assets/qualityos_logo_v1.png";

const features = [
  {
    icon: FlaskConical,
    title: "PDSA Cycle Management",
    description:
      "Plan-Do-Study-Act cycles with drag-and-drop Kanban boards, root cause tracking, and team assignments.",
  },
  {
    icon: BarChart3,
    title: "UDS Measure Tracking",
    description:
      "Monitor 20+ UDS clinical quality measures with real-time dashboards and trend analysis.",
  },
  {
    icon: LineChart,
    title: "SPC Analytics",
    description:
      "Statistical Process Control charts with automatic control limit calculations to detect special cause variation.",
  },
  {
    icon: BookOpen,
    title: "Playbook Library",
    description:
      "Evidence-based QI playbooks for preventive care, chronic disease, behavioral health, and ACO workflows.",
  },
];

const stats = [
  { value: "20+", label: "UDS Measures Tracked" },
  { value: "PDSA", label: "Cycle Management" },
  { value: "SPC", label: "Control Charts" },
  { value: "HRSA", label: "Compliance Ready" },
];

export default function Landing() {

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={qualityosLogo} alt="QualityOS" className="h-9" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth?signup=true">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            Built for FQHC Quality Improvement
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            The QI Operating System
            <br />
            <span className="text-primary">for FQHCs</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Streamline PDSA cycles, track UDS measures, and drive quality
            improvement across your health center — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/auth?signup=true">
                Start Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/50 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">
              Everything you need for QI success
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Purpose-built tools for community health center quality
              improvement teams.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border-border hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-6 flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {f.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">
            Ready to transform your QI program?
          </h2>
          <p className="text-primary-foreground/80 text-lg">
            Join health centers already using QualityOS to improve patient
            outcomes and meet HRSA requirements.
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-base px-8"
          >
            <Link to="/auth?signup=true">
              Get Started — It's Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} QualityOS. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
