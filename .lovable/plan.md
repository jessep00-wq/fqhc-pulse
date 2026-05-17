## Problem

The public header packs 8 nav items + Sign In + a long "Start 14-day free trial" CTA into a `max-w-6xl` container using `justify-between` with `gap-3`. At laptop widths (~1160 CSS px, today's viewport) the CTA is shoved hard against the right edge with no breathing room, and links wrap or hide unpredictably because the sm: breakpoint reveals all 8 at once.

## Changes (single file: `src/components/PublicPageLayout.tsx`)

Restructure the header into a **three-column grid** so logo, nav, and CTA each have a fixed lane — the nav stays centered regardless of CTA width:

```text
[ Logo ........ ] [ ......... centered nav ......... ] [ Sign in · CTA ]
```

1. **Container** — widen from `max-w-6xl` to `max-w-7xl`, keep `h-20`, switch the flex row to `grid grid-cols-[auto_1fr_auto] items-center gap-6`.

2. **Center nav lane** — wrap the 8 nav links in a `<nav>` that is `justify-self-center` with `flex items-center gap-1`. Render links as plain `<Link>` with `px-2.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md` instead of full ghost Buttons (Button's `px-4` is the main thing eating horizontal space). Show this lane at `hidden lg:flex` so it only appears when there's actually room; below `lg` the lane collapses and the CTA is never crowded. (Tablet/mobile menu is out of scope — current code already hides nav below `sm`; behavior below `lg` matches.)

3. **Right cluster** — `justify-self-end flex items-center gap-2`. Make the CTA visually deliberate without enlarging it:
   - Sign In: `variant="ghost" size="sm"` 
   - CTA: `size="sm"` with `px-4 font-semibold shadow-sm` and the existing arrow icon. `whitespace-nowrap` so it never wraps.
   - Add a subtle left spacer (`ml-1`) on the CTA so it reads as separated from Sign In.

4. **Breathing room** — replace the outer `px-6` with `px-6 lg:px-8` so the CTA has comfortable padding from the viewport edge on wide screens.

5. **No visual-weight change to the button** — keep the existing primary background and text size; only padding and shadow tighten. This matches the requested rule: shorten button padding / condense menu spacing before changing visual weight.

## Out of scope

- Mobile hamburger menu (no current implementation; not requested).
- Auth-state-aware header (Sign In stays static; unchanged from today).
- Footer, CTA banner section, `slimNav` variant — untouched.

## Verification

After edit, at 1920 / 1440 / 1160 px the nav remains centered, the CTA shows full label with ≥ 24 px from the right edge, and nothing wraps. Below 1024 px the centered nav hides cleanly, leaving logo + Sign In + CTA with proper spacing.
