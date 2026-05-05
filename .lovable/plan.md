
## Problem

Google Search Console rejects the sitemap because:
1. The edge function URL is external — GSC only accepts sitemaps on your own domain
2. The `.xml` file on measurewise.org is served with `text/html` Content-Type (Lovable hosting limitation)

## Solution

Use a **plain text sitemap** (`sitemap.txt`). Google fully supports this format — it's just one URL per line. Text files are served with `text/plain`, which Google accepts without issues.

### Changes

| File | Change |
|------|--------|
| `public/sitemap.txt` | New file — one URL per line listing all 9 public pages |
| `public/robots.txt` | Update Sitemap line to `https://measurewise.org/sitemap.txt` |

### What to do after

In Google Search Console:
1. Delete the old sitemap entries (`/sitemap.xml` and `/sitemap`)
2. Submit `https://measurewise.org/sitemap.txt`

The existing `sitemap.xml` and edge function can stay as-is — they don't hurt anything.
