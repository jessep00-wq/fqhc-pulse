## Fixes 21–32

### 1. Store type casts (`useQuery` in StoreIndex/StoreProductDetail/StoreBundleDetail/AdminStore)
Replace `as never` / `as unknown as StoreProduct[]` with a small mapper `mapStoreProduct(row)` and `mapStoreBundle(row)` that explicitly reads each field from the Supabase row type. Drift now surfaces as a TS error at the mapper.

### 2. `useUserRole` non-null assertion
Replace `user!.id` with a guarded query — `enabled: !!user?.id` already gates it, but switch the queryFn to accept `user?.id` and early-return `[]` when undefined. Removes the `!`.

### 3. Welcome-email localStorage race (AuthContext)
Reorder: call `supabase.functions.invoke("send-welcome-email")` first, set the `mw_welcome_sent_${userId}` flag only inside `.then()` on success, clear nothing on failure (no flag was set). Keeps "exactly once" semantics without permanent lockout on crash.

### 4. NetworkDashboard free-tier guard
At top of component, after `useSubscription()` loads, if plan tier is not `network`, render the upgrade banner and `return` before any `useQuery` for sites/aggregates. Move the queries below the guard or gate them with `enabled: tier === "network"`.

### 5. SEO.tsx meta cleanup
- Add `<meta property="og:site_name" content={BRAND.name} />`.
- Add `<meta property="og:image:width" content="1200" />` and `og:image:height" content="630"`.
- Remove redundant `twitter:title` / `twitter:description` (Twitter falls back to `og:*`); keep `twitter:card` and `twitter:image`.

### 6. apple-touch-icon path (index.html)
Change `<link rel="apple-touch-icon" href="/favicon.png">` → `href="/icons/apple-touch-icon.png"`. Verify file exists in `public/icons/`; if missing, fall back to existing `/icons/icon-192.png`.

### 7. /manual in sitemap + llms.txt
- `public/sitemap.xml`: add `<url><loc>https://measurewise.org/manual</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`.
- `public/llms.txt`: add `- [FQHC QI Manual](/manual): Operations manual for FQHC quality directors.` under a relevant section.

### 8. site.webmanifest
Add `"start_url": "/"`, `"scope": "/"`, `"description": "Quality operations platform for FQHCs — PDSA cycles, UDS tracking, HRSA audit binders."`, and `"id": "/"`.

### 9. LCP image WebP + preload type
- Generate `public/dashboard-preview.webp` (use existing JPG; skip if user prefers no new asset — fallback option: just add `type` to preload).
- Update Landing's hero `<img>` to `<picture>` with `<source srcset="/dashboard-preview.webp" type="image/webp">` + `<img src="/dashboard-preview.jpg">`.
- In `index.html`, change `<link rel="preload" as="image" href="/dashboard-preview.jpg">` to preload the WebP with `type="image/webp"` and `imagesrcset`.

### 10. Resource pages Article JSON-LD dates
In `src/components/ResourcePage.tsx` (or wherever the Article JSON-LD is emitted), add `datePublished` and `dateModified` fields. Source from a per-resource constant map keyed by slug (use today's date or last edit; hardcode reasonable historical dates for existing resources).

### 11. Unconditional PDF prefetch in index.html
Remove the `<link rel="prefetch" href="/MeasureWise_Sample_Export.pdf">` from `index.html`. If we want it on the landing page only, move it into `<Landing>` via `<Helmet>`.

### 12. ManualLanding double-Helmet
Remove the bare `<Helmet>` block in `ManualLanding.tsx`; consolidate all meta into the single `<SEO>` component call (add any missing props like `image` or `jsonLd` to SEO if needed).

### Files touched
- `src/pages/store/StoreIndex.tsx`, `StoreProductDetail.tsx`, `StoreBundleDetail.tsx`, `src/pages/admin/AdminStore.tsx`, new `src/lib/storeMappers.ts`
- `src/hooks/useUserRole.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/NetworkDashboard.tsx`
- `src/components/SEO.tsx`
- `src/components/ResourcePage.tsx`
- `src/pages/ManualLanding.tsx`
- `src/pages/Landing.tsx` (picture tag)
- `index.html`
- `public/sitemap.xml`, `public/llms.txt`, `public/site.webmanifest`
- `public/dashboard-preview.webp` (new, optional)

### Out of scope
Code-splitting, broader perf work, manifest icon redesign.
