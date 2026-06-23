## Bug

Clicking a PDSA card opens `PDSADetailDialog`, which immediately crashes with:

> Rendered more hooks than during the previous render.

The ErrorBoundary then shows "Something went wrong".

## Root cause

In `src/components/PDSADetailDialog.tsx`, there is an early return:

```ts
if (!cycle) return null;   // line 224
```

This sits **between** the first batch of hooks (`useQuery` for tasks, `useMutation` x4) and a second batch of hooks declared further down (`useQuery` for `orgProfiles` on line 247, `useQuery` for `cycleEvidence` on line 261).

On the first render, `cycle` is `null`, so React only sees the hooks above line 224. On the next render `cycle` is truthy and React sees additional hooks below — violating the Rules of Hooks. React throws, the ErrorBoundary swallows it, and the user gets the generic error screen.

## Fix

Move every hook to the top of the component (above any conditional return) so the hook count is stable across renders.

In `src/components/PDSADetailDialog.tsx`:

1. Move the `useQuery` for `orgProfiles` (currently lines 247-257) and `useQuery` for `cycleEvidence` (currently lines 261-271) up so they sit alongside the other `useQuery` / `useMutation` calls, before the `if (!cycle) return null;` guard on line 224.
2. Keep their existing `enabled: !!cycle?.id && !!organization?.id` guards so they don't fire when there's no cycle.
3. Leave the `if (!cycle) return null;` guard in place — just ensure it comes **after** all hook declarations.
4. The `score` calculation and `workstreamFacts` derivation (currently lines 259, 273-277) stay where they are (they're plain expressions, not hooks), but move below the null-guard so they can safely dereference `cycle`.

No other files need changes. The fix is purely a reordering inside `PDSADetailDialog.tsx`.

## Verification

Re-run the Playwright repro: open `/dashboard/pdsa-lab`, click the "Improve Cervical Cancer" card, and confirm the dialog renders with no `pageerror` and no ErrorBoundary fallback.
