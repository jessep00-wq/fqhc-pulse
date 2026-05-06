
## Problem

With JS disabled (or before it loads), visitors see a completely blank page. For healthcare buyers, this signals an unfinished product.

## Solution

Add a `<noscript>` block **plus** static fallback content inside `#root` in `index.html`. The static content will be visible immediately on page load and will be replaced once React hydrates. The `<noscript>` block adds a supplementary message for users who have JS fully disabled.

### What the fallback will show

1. **Header** — MeasureWise logo (via `<img>`) + "Sign In" / "Get Started Free" links
2. **Headline** — "Walk into your next HRSA site visit with your PDSA binder already generated."
3. **Value prop paragraph** — The existing sub-headline text
4. **CTA buttons** — styled as simple links to `/auth` and `/auth?signup=true`
5. **Dashboard screenshot** — The existing `dashboard-preview.jpg` image
6. **`<noscript>` banner** — A visible note saying "JavaScript is required for the full MeasureWise experience" with a link to contact/sign-up

### Technical details

| File | Change |
|------|--------|
| `index.html` | Add inline-styled static HTML inside `<div id="root">` and a `<noscript>` block in `<body>`. Uses inline styles (no Tailwind needed at this stage). React's `createRoot().render()` will replace this content automatically. |

The static fallback uses only the brand's teal color (`#1a7a7a` / `hsl(192, 70%, 35%)`) and standard system fonts, keeping it lightweight and on-brand. No additional files or dependencies needed.
