## The real problem

The current logo is a PNG (`src/assets/measurewise-logo.png`) where the "MeasureWise" wordmark only takes up a small fraction of the image canvas. So even at `h-14` in the header, the actual letters render around 18–20px tall — that's why you're squinting. Generating a new PNG won't fix this reliably; AI image gen keeps producing wordmarks with tons of internal padding.

The fix is to **stop using a raster logo** and build the lockup as code: an inline **SVG mark** + **real text wordmark**. That way the letters always fill the available height, stay razor-sharp at any zoom, and we control the exact size.

## What I'll build

A new `<Logo />` component (`src/components/Logo.tsx`) that renders:

```
[ M ]  MeasureWise
```

- **Mark (left):** compact inline SVG — a rounded-square teal tile with a white "M" whose right stroke rises into a tick (the measurement/improvement metaphor). Two-tone: solid `--primary` teal fill, accent-green gradient on the rising stroke. Sized to match wordmark cap height exactly.
- **Wordmark (right):** the literal text `MeasureWise` set in the app's existing geometric sans (Inter), `font-bold`, tight tracking (`tracking-tight`), `text-foreground`. Tiny `™` superscript.
- **Sizing prop:** `size="sm" | "md" | "lg"` →
  - `sm` (footer): mark 28px, text `text-xl` (~20px)
  - `md` (default header): mark 40px, text `text-2xl` (~24px) — **roughly 2× the current visual size**
  - `lg`: mark 48px, text `text-3xl` (~30px)
- **Accessibility:** `aria-label="MeasureWise"`, mark marked `aria-hidden`.

Reference feel: the bold, high-contrast wordmark weight you liked in the "100 Performance SEO" and "Seraphina's Starlight Soirée" examples — business name reads instantly, no squinting.

## Where it gets used

Swap the `<img src={measurewiseLogo} … />` usage in:
- `src/components/PublicPageLayout.tsx` header → `<Logo size="md" />`
- `src/components/PublicPageLayout.tsx` footer → `<Logo size="sm" />`
- Any other spot still importing `@/assets/measurewise-logo.png` (I'll grep and update them all — likely Auth, Onboarding, AppSidebar, email templates stay on raster).

The header bar will also grow from `h-16` to `h-20` so the larger lockup breathes properly. The PNG file stays on disk (still used by OG/social meta + emails) — only the on-page rendering switches to the component.

## Out of scope

- No nav structure, color token, or routing changes.
- No favicon change (current teal-M favicon stays).
- No email template logo changes.

## Technical notes

- Pure presentation component, no new deps.
- SVG uses `currentColor` + a `<linearGradient>` referencing `--primary` and `--accent` via inline `style={{ color: 'hsl(var(--primary))' }}` so it auto-themes.
- I'll verify visually in the preview at 988px after the swap (header at `/`, `/about`, `/pricing`, plus footer).
