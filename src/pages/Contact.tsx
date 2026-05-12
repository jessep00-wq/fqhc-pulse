import { Mail, MapPin, Clock, ShieldCheck } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { PublicPageLayout } from "@/components/PublicPageLayout";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <PublicPageLayout slimNav>
      <SEO
        title="Contact MeasureWise — Quality Improvement Software for FQHCs"
        description="Get in touch with MeasureWise. Email support@measurewise.org or send a message. We reply within 1 business day."
        canonical="https://measurewise.org/contact"
      />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Contact MeasureWise</h1>
          <p className="text-muted-foreground text-lg">
            Built by an FQHC Quality Director. Real human replies within 1 business day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Mail className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <a href="mailto:support@measurewise.org" className="text-primary hover:underline">
                  support@measurewise.org
                </a>
                <p className="text-sm text-muted-foreground mt-1">
                  Sales, billing, support, and security inquiries.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Mailing address</p>
                <p className="text-muted-foreground">MeasureWise<br />Fulton, MS</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Response time</p>
                <p className="text-muted-foreground">
                  We reply within 1 business day (Monday–Friday, US Central).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <ShieldCheck className="h-5 w-5 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Security &amp; trust</p>
                <p className="text-muted-foreground text-sm">
                  See our{" "}
                  <Link to="/security" className="text-primary hover:underline">
                    Security &amp; Compliance
                  </Link>
                  {", "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  {", "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms
                  </Link>
                  {", and "}
                  <Link to="/refund-policy" className="text-primary hover:underline">
                    Refund Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
