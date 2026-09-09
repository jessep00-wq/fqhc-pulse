import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface StoreFaq {
  q: string;
  a: string;
}

/**
 * Shared default FAQ for every storefront product. Answers marked [CONFIRM]
 * are best-effort and should be reviewed against the actual policy/licence
 * terms before launch. Per-product overrides live in store_products.faqs.
 */
export const DEFAULT_STORE_FAQS: StoreFaq[] = [
  {
    q: "What file formats do I get, and are they editable?",
    a: "Everything is delivered as editable working files — Word and Excel documents, with PDFs where a print-ready version helps. You can rename, rebrand, and rewrite anything to match your center. [CONFIRM] exact formats vary by product; check the \"What's inside\" list above.",
  },
  {
    q: "Can my whole team use this, or is it one person?",
    a: "One purchase covers your quality team. Share the files internally with colleagues who work on the same reporting or QI process. [CONFIRM] please confirm this matches your intended licence terms.",
  },
  {
    q: "Can I use this at my health center / does my organization get a license?",
    a: "Yes — you buy it once for your health center and use it across sites and reporting cycles. Reselling or redistributing the files outside your organization isn't permitted. [CONFIRM] wording should match the Terms of Service.",
  },
  {
    q: "Do I get a receipt or invoice I can expense?",
    a: "Yes. Checkout runs through Stripe and emails you a payment receipt right after purchase, which works for expense reports and reimbursement. Email hello@measurewise.org if you need it reissued to a different billing name.",
  },
  {
    q: "How is this different from the MeasureWise software?",
    a: "These templates are one-time purchases you fill in yourself. The MeasureWise subscription is the software that runs PDSA cycles, tracks UDS measures, and builds your audit binder continuously. Buying a template does not include a subscription, and a subscription does not include these templates.",
  },
];

export function ProductFAQ({ faqs }: { faqs?: StoreFaq[] | null }) {
  const items = faqs && faqs.length > 0 ? faqs : DEFAULT_STORE_FAQS;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Questions buyers ask</h2>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
