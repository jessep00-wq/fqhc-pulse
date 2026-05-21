
## Goal

Replace the single-screen `Onboarding.tsx` with a 2-step wizard that captures operational metadata and an explicit Demo vs Live mode choice. Persist the new fields on `organizations`, watermark demo data in the dashboard, and warn before exports while in demo mode.

## Step 1 — Organization Profile

Fields collected on `organizations`:
- `name` (existing, required)
- `npi` (existing, optional)
- `org_type` — enum: `FQHC`, `FQHC Look-Alike`, `RHC`, `Other`
- `reporting_period` — enum: `Calendar Year`, `Fiscal Year (Jul–Jun)`, `HRSA UDS (Jan–Dec)`
- `quality_lead_name` — text
- `quality_lead_email` — text (defaults to current user email)
- `timezone` — select, defaults to browser `Intl.DateTimeFormat().resolvedOptions().timeZone`

Validation: name, org_type, reporting_period, quality_lead_name, timezone required. "Next" disabled until valid.

## Step 2 — Data Governance Confirmation

- Radio: **Demo Mode** (seed sample UDS/PDSA data, watermark everywhere, exports warn) vs **Live Mode** (no seed, production-grade data only).
- Acknowledgement checkbox: "I understand demo data is for evaluation only and must not be used for HRSA submissions or board reporting."
- Submit button labeled "Create Workspace".

On submit:
- Insert `organizations` row with all step-1 + step-2 fields and `data_mode`.
- Update `profiles.organization_id`.
- If `data_mode = 'demo'`, call `seed_demo_data` RPC. If `live`, skip.
- Redirect to `/dashboard`.

## Database changes (migration)

Add to `public.organizations`:
- `org_type text`
- `reporting_period text`
- `quality_lead_name text`
- `quality_lead_email text`
- `timezone text`
- `data_mode text not null default 'live'` with check (`'demo'`, `'live'`)

Existing RLS on `organizations` already covers these columns (row-level, not column-level), so no policy changes needed. Existing `prevent_org_id_change` trigger is unaffected.

## Demo watermarking

Expose `dataMode` on `OrgContext` (extend the `Organization` interface and the org fetch select).

New `<DemoWatermark />` component — fixed diagonal "DEMO DATA — NOT FOR HRSA SUBMISSION" overlay (low-opacity, `pointer-events: none`), rendered by `AppLayout` when `dataMode === 'demo'`.

Add a persistent top-of-page banner via existing `AttentionStrip` / a new `DemoModeBanner` in `AppLayout` linking to Settings to switch to Live.

## Export gating

Affected components: `SampleExportButtons`, `AuditBinderDialog`, `BoardReportDialog`, `EvidencePacketDialog`.

Wrap each export trigger in a confirmation dialog when `dataMode === 'demo'`:
- Title: "Exporting demo data"
- Body: "This workspace is in Demo Mode. The exported file will be watermarked 'DEMO — NOT FOR SUBMISSION'. Switch to Live Mode in Settings before generating HRSA-grade reports."
- Buttons: "Cancel" / "Export anyway"

PDF generators stamp a `DEMO — NOT FOR SUBMISSION` footer on every page when in demo mode (small helper in the existing canvas/PDF pagination utility).

## Settings page

Add a "Data Mode" card in `Settings.tsx` allowing the org owner / founder_admin to flip `data_mode` between `demo` and `live`. Flipping to live shows a confirmation modal warning that demo records will remain visible until manually purged (optional follow-up: add a purge action).

## Files touched

- `supabase/migrations/*` — new migration (new tool call)
- `src/pages/Onboarding.tsx` — rewrite as 2-step wizard
- `src/contexts/OrgContext.tsx` — expose `dataMode`, `orgType`, etc.
- `src/components/AppLayout.tsx` — render `DemoWatermark` + `DemoModeBanner` when demo
- `src/components/DemoWatermark.tsx` (new)
- `src/components/DemoModeBanner.tsx` (new)
- `src/components/ExportGateDialog.tsx` (new) — shared demo-export confirmation
- `src/components/SampleExportButtons.tsx`, `AuditBinderDialog.tsx`, `BoardReportDialog.tsx`, `EvidencePacketDialog.tsx` — wire through gate + PDF footer stamp
- `src/pages/Settings.tsx` — Data Mode card

## Out of scope

- Automatic purge of demo records when switching to live (call out as follow-up).
- Per-record `is_demo` flagging — relying on org-level `data_mode` is enough for v1 since demo records are seeded only in demo orgs.
