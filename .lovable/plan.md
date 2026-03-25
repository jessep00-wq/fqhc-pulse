

# Playbook Library: Market-Ready Improvements

## Overview
Five enhancements to transform the Playbook Library from a static grid into an actionable, prioritized tool for FQHC leaders.

## Changes

### 1. Add `domain` and `financial_impact` fields to mock data
**File:** `src/data/mockData.ts`

Add two new fields to `UDSPlaybook` type and each playbook entry:
- `domain`: `"Preventive Care" | "Chronic Disease" | "Behavioral Health" | "Financial/ACO"`
- `financial_impact`: string (e.g., `"High ROI: HRSA Quality Tier"`, `"High ROI: ACO Shared Savings"`)

Mapping:
- CMS124 (Cervical) → Preventive Care, "High ROI: HRSA Quality Tier"
- CMS125 (Breast) → Preventive Care, "High ROI: HRSA Quality Tier"
- AWV → Financial/ACO, "High ROI: ACO Shared Savings"
- CMS165 (BP) → Chronic Disease, "High ROI: HRSA Quality Tier"

### 2. Tabbed interface by clinical domain
**File:** `src/pages/PlaybookLibrary.tsx`

Import `Tabs, TabsList, TabsTrigger, TabsContent` from shadcn. Add an "All" tab plus one per domain. Filter playbooks by domain within each `TabsContent`. The "All" tab shows everything.

### 3. Financial Impact badge on outer card
Add a green-tinted `Badge` at the bottom of each `CardContent` showing `pb.financial_impact` (e.g., "High ROI: ACO Shared Savings").

### 4. Required Roles on outer card
Below the "View Playbook" link, render the `pdsa_template.assigned_staff` as small secondary badges (e.g., "Front Desk", "MA/RN", "Provider").

### 5. Wire "Deploy as PDSA Cycle" button
When clicked:
- Create a new `PDSACycle` object from the playbook's `pdsa_template` with status `"plan"`
- Store it in a shared state mechanism — use `localStorage` to persist across page navigation (since cycles are currently local state in PDSALab)
- Navigate to `/pdsa-lab` using `useNavigate`
- Show a sonner toast: `"[Playbook title] deployed to PDSA Lab"`

In `PDSALab.tsx`, on mount, check `localStorage` for any queued deployed playbook and merge it into the cycles state.

### 6. Checklist-style EHR workflow steps in modal
Replace the numbered `<ol>` with `Checkbox` components from shadcn (read-only / disabled). Each step gets a checkbox + label layout instead of a numbered circle.

## Technical Details

- **New imports in PlaybookLibrary.tsx:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Checkbox`, `useNavigate` (react-router-dom), `toast` (sonner), `DollarSign` or `TrendingUp` icon
- **localStorage key:** `"deployed-playbook"` — stores serialized `PDSACycle` object
- **PDSALab.tsx change:** ~5 lines in a `useEffect` to check for and consume the deployed playbook from localStorage
- **mockData.ts type update:** Add `domain` and `financial_impact` to `UDSPlaybook` interface

