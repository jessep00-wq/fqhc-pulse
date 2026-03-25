
# FQHC Quality Management Platform

## Overview
A multi-tenant B2B SaaS application for Federally Qualified Health Centers to manage Quality Improvement, UDS reporting, and HRSA compliance.

## Navigation & Layout
- Sidebar navigation with org name, links to: Dashboard, PDSA Lab, Playbook Library, AI Assistant, Staff Tasks
- Top bar with user avatar and notifications bell

## Pages & Features

### 1. Dashboard ("The Operating System")
- Three metric cards: Active PDSA Cycles, UDS Measures at Risk, Tasks Due
- Financial Impact widget showing estimated ACO shared savings with a dollar figure and trend arrow
- Mini charts for UDS measure trends (line/bar charts using Recharts)
- Recent activity feed

### 2. PDSA Lab & OSV Audit Binder
- Kanban board with columns: Plan → Do → Study → Act → Completed
- Draggable cards showing PDSA title, assigned measure, progress
- "New PDSA" dialog with structured form: Title, Root Cause Analysis (textarea), Target UDS Measure (dropdown), Clinical Workflow Impact, Assigned Staff (multi-select by role)
- On completed PDSAs: prominent "Generate HRSA OSV Audit Binder" button that opens a compiled report view (simulated) linking PDSA details, tasks, and metric improvement

### 3. UDS & ACO Playbook Library
- Grid of template cards (CMS124, CMS125, AWV Optimization, etc.) with icons and descriptions
- Clicking a card opens a modal with pre-populated PDSA plan, athenaOne EHR template changes, and Azara DRVS reporting cadences
- "Deploy as PDSA" button to create a new cycle from the template

### 4. AI Root Cause Analysis Assistant
- Chat-style interface with message bubbles
- System prompt area: "Describe your failing metric..."
- Suggestion chips: "Clinical documentation issue", "Patient outreach issue", "Referral loop failure"
- Simulated AI responses for demo purposes

### 5. Staff Accountability & Task Routing
- Data table with columns: Task, PDSA Cycle, Assigned Role (Front Desk/MA-RN/Provider), Status, Due Date
- Filters by role and status
- Compliance status ring/progress bar per PDSA showing % of staff who acknowledged workflow changes
- Inline status updates

## Database Schema (Supabase)
- `organizations` (id, name, npi)
- `profiles` (id, user_id, org_id, role, full_name)
- `pdsa_cycles` (id, org_id, title, status, uds_measure, root_cause, target_goal, created_at)
- `tasks` (id, org_id, pdsa_id, assigned_role, status, title, due_date)
- `uds_playbooks` (id, measure_id, title, description, ehr_workflow_steps)
- RLS policies using a security definer function to check org membership

## Mock Data
All views populated with realistic FQHC mock data (measure names, role assignments, sample PDSAs) so the UI is immediately visualizable.

## Tech
- React + TypeScript + Tailwind + shadcn/ui
- Recharts for dashboard charts
- React Router for page navigation
- Supabase client boilerplate (connection ready but using mock data initially)
