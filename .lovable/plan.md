## Fix console warnings: Dialog descriptions + PWA manifest icons

Two unrelated console issues showed up on the landing page. Both are small, isolated fixes.

### 1. Radix Dialog missing `aria-describedby`

Radix logs a warning whenever a `<DialogContent>` renders without either a `<DialogDescription>` child or an explicit `aria-describedby={undefined}` opt-out. Screen readers rely on this to announce the dialog's purpose.

**Approach**
- Grep the project for every `<DialogContent>` / `<SheetContent>` / `<AlertDialogContent>` usage.
- For each one that lacks a `<DialogDescription>`, add one — visible when there's a natural subtitle, or wrapped in `sr-only` when the title alone is self-explanatory.
- Leave existing descriptions untouched.

Likely candidates based on the file list: `CreatePDSAWizard`, `PDSADetailDialog`, `AuditBinderDialog`, `BoardReportDialog`, `EvidencePacketDialog`, `ExitIntentPlaybookDialog`, `CartDrawer`, `AddSiteDialog`, admin `OrgActionsMenu` confirm dialogs, and any shadcn command/menu dialogs. I'll confirm the exact set during implementation.

### 2. PWA manifest icon errors

`public/site.webmanifest` references `/icons/icon-192.png` and `/icons/icon-512.png`, but Chrome reports "Resource size is not correct - typo in the Manifest" — meaning the files are either missing, the wrong dimensions, or not valid PNGs.

**Approach**
- Check whether `public/icons/icon-192.png` and `public/icons/icon-512.png` exist and what their actual dimensions are.
- If missing or wrong size: generate proper square PNGs (192×192 and 512×512) from the MeasureWise logo using the existing brand teal background, and place them at the manifest paths.
- Leave `name`, `theme_color`, `background_color`, and `display` as-is.

### Out of scope

- No changes to auth, billing, RLS, or any business logic.
- No redesign of any dialog — only the missing description node is added.
- No changes to `index.html` or the Google Ads tag.

### Verification

- Reload the landing page and confirm the Radix warning and both manifest icon errors disappear from the console.
- Open one or two dialogs (e.g. PDSA detail, audit binder) to confirm nothing visual regressed.
