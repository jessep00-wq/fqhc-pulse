import { useEffect, type ReactNode } from "react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { HelmetProvider } from "react-helmet-async";

import appCss from "@/styles.css?url";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PostHogPageView } from "@/components/PostHogPageView";
import { reportLovableError } from "@/lib/lovable-error-reporting";
import { initPostHog } from "@/lib/posthog";
import NotFound from "@/pages/NotFound";

// Ported from the pre-migration src/main.tsx: PostHog must initialize before
// the first pageview capture. posthog-js is browser-only, so skip on SSR.
if (typeof window !== "undefined") {
  initPostHog();
}

const SOFTWARE_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MeasureWise",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Quality operations platform for Federally Qualified Health Centers (FQHCs). Plan PDSA cycles, track UDS measures on SPC charts, and export the HRSA Audit Binder.",
  url: "https://measurewise.org",
  provider: {
    "@type": "Organization",
    name: "MeasureWise",
    email: "support@measurewise.org",
    url: "https://measurewise.org",
  },
  offers: [
    { "@type": "Offer", name: "Solo", price: "149", priceCurrency: "USD" },
    { "@type": "Offer", name: "Multi-Site", price: "349", priceCurrency: "USD" },
    { "@type": "Offer", name: "Network", price: "699", priceCurrency: "USD" },
  ],
});

const ORG_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MeasureWise",
  url: "https://measurewise.org",
  logo: "https://measurewise.org/measurewise-logo.png",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Fulton",
    addressRegion: "MS",
    addressCountry: "US",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: "support@measurewise.org",
      contactType: "customer support",
      areaServed: "US",
      availableLanguage: "English",
    },
  ],
  founder: { "@type": "Person", name: "Jessica R. Smith", jobTitle: "FQHC Quality Director" },
});

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "MeasureWise — PDSA & UDS Quality Software for FQHCs" },
      {
        name: "description",
        content:
          "Link every PDSA cycle to a UDS measure, track impact with SPC charts, and export an HRSA Audit Binder. Built for FQHC quality teams.",
      },
      { name: "author", content: "MeasureWise" },
      { name: "theme-color", content: "#1a7a7a" },
      {
        name: "google-site-verification",
        content: "n-ysn4TPhqqJbgMsd55MuAjsg-b_f1tsOGsiYTNvFhE",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "MeasureWise — PDSA & UDS Quality Software for FQHCs" },
      {
        property: "og:description",
        content:
          "Link every PDSA cycle to a UDS measure, track impact with SPC charts, and export an HRSA Audit Binder. Built for FQHC quality teams.",
      },
      { property: "og:image", content: "https://measurewise.org/og-image.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "MeasureWise — Quality operations platform for FQHCs",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://measurewise.org/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      {
        rel: "preload",
        as: "image",
        href: "/dashboard-preview.webp",
        imageSrcSet:
          "/dashboard-preview-640.webp 640w, /dashboard-preview-960.webp 960w, /dashboard-preview.webp 1503w",
        imageSizes: "(min-width: 1024px) 42vw, calc(100vw - 3rem)",
        type: "image/webp",
        fetchPriority: "high",
      },
    ],
    scripts: [
      {
        src: "https://www.googletagmanager.com/gtag/js?id=AW-18116909916",
        async: true,
      },
      {
        children:
          "window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'AW-18116909916');",
      },
      { type: "application/ld+json", children: SOFTWARE_JSON_LD },
      { type: "application/ld+json", children: ORG_JSON_LD },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <NotFound />,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <OrgProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ScrollToTop />
              <PostHogPageView />
              <Outlet />
            </TooltipProvider>
          </OrgProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

function ErrorComponent({ error }: { error: Error; reset: () => void }) {
  console.error(error);
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
          <a
            className="rounded-md border border-border bg-card px-4 py-2 font-medium text-foreground"
            href="/"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
