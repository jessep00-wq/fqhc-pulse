import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
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
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo size="md" />
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
                  <Link to="/case-studies">Case Studies</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/blog">Blog</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/newsletter">Newsletter</Link>
                </Button>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/about">About</Link>
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
                <Link to="/auth?signup=true">Start 14-day free trial <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
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

      <main>{children}</main>

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to link quality improvement to funding outcomes?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Run your first PDSA cycle in under 10 minutes. No sales call, no credit card.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/70">
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> 14-day free trial</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> No sales call</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> HRSA-aligned</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild className="text-base px-8">
              <Link to="/auth?signup=true">Start 14-day free trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/40">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <Link to="/" className="inline-flex items-center">
                <img src={measurewiseLogo} alt="MeasureWise" className="h-10" />
              </Link>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Quality improvement software built by an FQHC Quality Director.
              </p>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <span aria-hidden>🔒</span> SSL secured · TLS 1.2+ · AES-256 at rest
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wide">Product</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/features/pdsa-cycle-manager" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/how-it-works" className="hover:text-foreground transition-colors">How it works</Link></li>
                <li><Link to="/status" className="hover:text-foreground transition-colors">Status</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wide">Company</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/case-studies" className="hover:text-foreground transition-colors">Case Studies</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/newsletter" className="hover:text-foreground transition-colors">Newsletter</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><a href="mailto:support@measurewise.org" className="hover:text-foreground transition-colors">support@measurewise.org</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wide">Legal &amp; Trust</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
                <li><Link to="/security" className="hover:text-foreground transition-colors">Security &amp; Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row gap-3 justify-between items-start md:items-center text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} MeasureWise. All rights reserved. · Fulton, MS
            </p>
            <p>
              Built by Jessica R. Smith, BSN — FQHC Quality Director
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
