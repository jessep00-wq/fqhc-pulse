

# Branding Overhaul: Logo, Colors, Tagline & Badge Removal

## 1. Add QualityOS Logo

Copy the uploaded logo to `src/assets/qualityos_logo_v1.png` and use it in three locations:
- **Landing page nav** — replace the `Building2` icon + text with an `<img>` logo
- **Auth card header** — replace the icon square with the logo image
- **Sidebar header** — replace the `Building2` icon with the logo (small version)

## 2. Remove "Edit with Lovable" Badge

Use the `set_badge_visibility` tool to hide the badge.

## 3. Auth Card Tagline

Update the `CardDescription` in `Auth.tsx` to include a value statement:
- Sign in: "Quality operations, simplified for FQHCs"
- Sign up: "Quality operations, simplified for FQHCs"
- Forgot password: "Reset your password"

## 4. Branded Color Palette — Healthcare Teal

Update CSS variables in `src/index.css` to shift from generic blue to the teal from the logo (approximately `hsl(192, 70%, 35%)`):

**Light mode primary changes:**
- `--primary`: `192 70% 35%` (teal matching logo)
- `--ring`: `192 70% 35%`
- `--sidebar-primary`: `192 70% 45%`
- `--sidebar-ring`: `192 70% 45%`
- `--info` / `--info-foreground`: align to same teal

**Dark mode:**
- `--primary`: `192 65% 45%`
- `--ring`: `192 65% 45%`
- `--sidebar-primary` / `--sidebar-ring`: `192 65% 45%`

## Files Changed

| File | Change |
|------|--------|
| `src/assets/qualityos_logo_v1.png` | New — copied from upload |
| `src/pages/Landing.tsx` | Replace icon with logo image in nav |
| `src/pages/Auth.tsx` | Replace icon with logo, add tagline |
| `src/components/AppSidebar.tsx` | Replace icon with logo |
| `src/index.css` | Update primary/ring/sidebar-primary HSL values to branded teal |
| Badge tool | Hide "Edit with Lovable" badge |

