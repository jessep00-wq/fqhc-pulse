

# PDSA Lab: Market-Ready Improvements

## 1. Drag-and-Drop Kanban Board
Install `@hello-pangea/dnd` and wrap the Kanban board with `DragDropContext`, each column as a `Droppable`, and each card as a `Draggable`. On drop, update the cycle's `status` in local state via `setCycles`.

**Files:** `package.json` (add dep), `src/pages/PDSALab.tsx` (refactor board)

## 2. AI Root Cause Assistant in Create Modal
Add a "Help me analyze" button below the Root Cause textarea. Clicking it opens a collapsible section with a mini chat interface (text input + message list). This will call a Supabase Edge Function (`supabase/functions/ai-root-cause/index.ts`) that uses the Lovable AI Gateway to generate root cause suggestions based on the selected UDS measure. The form fields need to become controlled (useState for each field).

**Files:** `src/pages/PDSALab.tsx` (add collapsible AI section in modal), `supabase/functions/ai-root-cause/index.ts` (new edge function)

## 3. Playbook Template Pre-fill
Add a "Use Playbook Template" button at the top of the Create PDSA modal. When a UDS measure is selected that matches a playbook, show a banner offering to auto-fill. Clicking it populates the Root Cause, Workflow Impact, and Target Goal fields from `mockPlaybooks`.

**Files:** `src/pages/PDSALab.tsx` (add template lookup + pre-fill logic)

## 4. Working PDF Export for Audit Binder
Install `jspdf` and `html2canvas`. Add a hidden print-layout div inside `AuditBinderDialog` with letter-sized formatting. The "Export PDF" button captures this div and downloads a PDF.

**Files:** `package.json` (add jspdf, html2canvas), `src/pages/PDSALab.tsx` (implement export)

## 5. Enhanced Card UI
Replace the "3 roles" text with an `AvatarGroup` component showing overlapping role initials (FD, MA, PR, CC, QI). Add a small `Progress` bar showing task completion percentage (computed from `mockTasks` filtered by `pdsa_id`).

**Files:** `src/pages/PDSALab.tsx` (update `PDSACard` with avatars + progress bar, import mockTasks)

## Technical Details

### Drag-and-Drop Structure
```text
DragDropContext (onDragEnd → update cycle status)
├── Droppable (column: "plan")
│   └── Draggable (PDSACard)
├── Droppable (column: "do")
│   └── Draggable (PDSACard)
└── ...
```

### AI Edge Function
- Endpoint: `supabase/functions/ai-root-cause/index.ts`
- Uses `LOVABLE_API_KEY` with Lovable AI Gateway
- System prompt: FQHC quality improvement expert, generates root cause analysis based on UDS measure context
- Non-streaming response (simple invoke)

### Playbook Pre-fill Logic
- Match selected UDS measure string against `mockPlaybooks[].title` prefix
- If match found, show "Template available" banner with "Apply" button
- Fills: root_cause, clinical_workflow_impact, target_goal, title

### PDF Export
- Use `jspdf` with `html2canvas` to capture a ref'd div
- Format: Letter size, margins, clinic branding header
- Sections mirror the dialog: PDSA summary, RCA, goals, staff log, workflow impact

### Avatar Mapping
```text
Front Desk → FD (blue)
MA/RN → MA (green)
Provider → PR (purple)
Care Coordinator → CC (orange)
QI Manager → QI (teal)
```

