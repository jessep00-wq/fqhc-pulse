## Fix: Replace Lovable default branding in index.html

All meta tags currently show "Lovable Generated Project" defaults. This affects link previews on LinkedIn, Slack, Discord, and search results.

### Changes to `index.html`

1. **Remove** the TODO comments and `<meta name="author" content="Lovable" />`
2. **Update description** to: `"MeasureWise™ — Quality operations, simplified for FQHCs. Link clinical improvements to financial outcomes."`
3. **Update OG/Twitter descriptions** to match
4. **Remove** `twitter:site` pointing to `@Lovable`
5. **Generate a branded OG image** (1200×630) with:
   - Teal background matching brand palette
   - MeasureWise™ logo and tagline
   - Clean, professional layout
   - Save to `public/og-image.png`
6. **Point `og:image` and `twitter:image`** to `/og-image.png` (relative, served from the domain)
7. **Add `og:url`** pointing to `https://measurewise.org`

### Result

Any shared link will preview with the MeasureWise brand, tagline, and a professional image instead of Lovable defaults.
