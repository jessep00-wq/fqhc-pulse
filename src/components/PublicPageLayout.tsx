import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import measurewiseLogo from "@/assets/measurewise-logo.png";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface PublicPageLayoutProps {
  children: React.ReactNode;
  backTo?: { label: string; href: string };
  slimNav?: boolean;
}

export function PublicPageLayout({ children, backTo, slimNav = false }: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={measurewiseLogo} alt="MeasureWise" className="h-14" />
          </Link>
          <div className="flex items-center gap-3">
            {!slimNav && (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/features/pdsa-cycle-manager">Features</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/how-it-works">How It Works</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/blog">Blog</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/newsletter">Newsletter</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/pricing">Pricing</Link>
                </Button>
              </>
            )}
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            {!slimNav && (
              <Button asChild>
                <Link to="/auth?signup=true">Start free — no credit card <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {backTo && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <Link to={backTo.href} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> {backTo.label}
          </Link>
        </div>
      )}

      {children}

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to link quality improvement to funding outcomes?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Run your first PDSA cycle in under 10 minutes. No sales call, no credit card.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/70">
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Free for one site</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> No sales call</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> HRSA-aligned</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild className="text-base px-8">
              <Link to="/auth?signup=true">Start free — no credit card <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MeasureWise. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
