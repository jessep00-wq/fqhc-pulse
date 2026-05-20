## Fix Chrome Issues panel: 9 unnamed form fields + 1 orphan label

Both warnings come from forms on `/` (Landing).

### 1. Nine fields missing `id`/`name` → Radix `Select` hidden inputs

shadcn's `<Select>` wraps Radix Select, which renders a hidden native form control for browser autofill. That control gets its `name` from the `name` prop on `<Select>`. None of our Selects pass one, so Chrome flags every hidden field.

**Fix:** add a `name` prop to every `<Select>` rendered on landing-page forms:
- `src/components/ContactForm.tsx` — 6 Selects (role, fqhcSize, numberOfSites, emr, timeline, plus any I find on a second pass)
- `src/components/lead-magnets/PlaybookLeadForm.tsx` — 1 Select (role) × rendered on homepage + sidebar + exit-intent dialog

This is the lightest possible change and resolves all 9 affected resources.

### 2. One `<Label>` not associated with a field

`ContactForm.tsx` line 299: `<Label>What are you interested in?...</Label>` introduces a checkbox group but has no `htmlFor` and no input child, so Chrome reports an orphan label.

**Fix:** wrap the interests group in `<fieldset>` with the heading as `<legend>` (preserving current visual styling via Tailwind), and drop the `<Label>` element. Each individual checkbox keeps its existing associated `<label htmlFor={id}>`.

### Out of scope

- No changes to form validation, submission, or layout.
- No changes to PlaybookLeadForm field labels (already correctly associated).
- No new dependencies.

### Verification

Reload `/`, reopen the Chrome Issues panel, and confirm both warnings clear. Visually confirm the Contact form's "What are you interested in?" heading still renders the same.
