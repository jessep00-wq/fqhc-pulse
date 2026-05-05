
## Problem

Google Search Console reports "Sitemap is HTML" because Lovable's hosting serves `sitemap.xml` with a `text/html` Content-Type header. Google cannot parse it, so 0 pages are discovered.

## Solution

Create a backend function that serves the sitemap with the correct `application/xml` Content-Type. Then update `robots.txt` to point to the function URL instead.

### Changes

| File | Change |
|------|--------|
| `supabase/functions/sitemap/index.ts` | New edge function that returns the sitemap XML with `Content-Type: application/xml` |
| `public/robots.txt` | Update Sitemap URL to point to the edge function |
| `index.html` | Update any sitemap references in JSON-LD or meta tags |

### How it works

1. The edge function returns the same sitemap XML content but with the correct `Content-Type: application/xml` header.
2. `robots.txt` will point Google to the function URL (e.g., `https://eeyigxcwewdqfeidqbxk.supabase.co/functions/v1/sitemap`).
3. We keep `public/sitemap.xml` as a fallback but the canonical reference will be the function.

### Alternative considered

We could also try adding a `_headers` file in `public/`, but Lovable's hosting does not support custom header configuration, so the edge function approach is the reliable fix.
