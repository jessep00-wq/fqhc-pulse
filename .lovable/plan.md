## What I'll do

**1. Route `support@` mail to your real inbox (Option B)**
- Update `src/lib/brand.ts` and `supabase/functions/_shared/brand.ts`: change `supportEmail` from `support@measurewise.org` → `hello@measurewise.org`.
- That's the only place `supportEmail` is referenced, so footers, legal pages, and any template using `BRAND.supportEmail` will start pointing at the inbox that already works.
- Note: this does **not** create a `support@` mailbox. If you'd rather keep the `support@` brand and just forward it, tell me and I'll leave the code alone — you'd add the forwarder at your DNS/mail provider instead.

**2. Replace the "JS" avatar on the landing page with your photo**
- Found it: `src/pages/Landing.tsx` lines 774–800, the "Built for FQHCs by an FQHC operator" section. It's a 144 px (mobile) / 176 px (desktop) teal circle showing initials "JS".
- Upload your photo (`user-uploads://design_73-2.png`) to Lovable Assets as `src/assets/jessica-smith.jpg.asset.json` so the binary stays out of the repo.
- Replace the initials `<div>` with an `<img>` of the asset, kept at the same circular size, with subtle ring/shadow matching the current design (rounded-full, border-2 border-primary/20, shadow-lg). Alt text: "Jessica R. Smith, BSN — Founder of MeasureWise".
- Object-fit: cover, centered, so the framing matches the agave/portrait composition.

**3. Leave the other "JS" circles alone for now**
- The store pages (`FounderCredibilityCard`) also show "JS" initials in a smaller compact card. I'll leave those unless you say otherwise — happy to swap them too in a follow-up.

## Files touched
- `src/lib/brand.ts` — one-line change
- `supabase/functions/_shared/brand.ts` — one-line change
- `src/assets/jessica-smith.jpg.asset.json` — new (CDN pointer)
- `src/pages/Landing.tsx` — replace initials block with `<img>`

No edge functions to redeploy (the brand constant is read at request time from the file).
