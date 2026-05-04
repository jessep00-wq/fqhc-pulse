
# Reposition Landing Page for FQHC/CHC/PCMH Audiences

## Overview

Overhaul the landing page and add three persona-specific landing pages based on the positioning strategy: lead with HRSA Chapter 10, NCQA PCMH Q-PASS, and UDS-reporting language. Target QI Directors, PCMH Coordinators, and CHC Operations Managers.

## Changes

### 1. Revamp `src/pages/Landing.tsx`

- **Hero**: Change headline to *"The PDSA tracker built for FQHCs, CHCs, and PCMH-recognized clinics"* with subtext: *"HRSA-aligned, audit-ready, and priced for community health budgets."*
- **Social proof badges**: Add pill badges for "HRSA Chapter 10 Aligned", "NCQA PCMH Q-PASS Ready", "UDS-Friendly Reporting"
- **Features section**: Rewrite feature cards to lead with regulatory/compliance value (e.g., "HRSA OSV-Ready PDSA Tracking", "NCQA Q-PASS Evidence Collection", "UDS Clinical Measure Dashboards", "Audit Binder Export")
- **Persona navigation**: Add a "Built for your role" section with three cards linking to persona pages (QI Director, PCMH Coordinator, CHC Ops Manager)
- **CTA**: Update to *"Start your free PDSA tracker — no enterprise sales call required"*

### 2. Create three persona landing pages

Each page follows the same template structure but with persona-specific messaging:

- **`src/pages/PersonaQIDirector.tsx`** — For QI Directors at FQHCs. Emphasizes UDS measure tracking, SPC charts, HRSA Quality Award tier impact, and PDSA cycle management.
- **`src/pages/PersonaPCMHCoordinator.tsx`** — For PCMH Coordinators. Emphasizes NCQA Q-PASS evidence requirements, documentation workflows, and audit readiness.
- **`src/pages/PersonaCHCOpsManager.tsx`** — For CHC Operations Managers. Emphasizes cost savings vs. enterprise QI tools, staff task management, and financial impact tracking.

Each page includes: persona-specific hero, 3-4 tailored feature highlights, a "How it works" section, and a CTA to sign up.

### 3. Add routes in `src/App.tsx`

Add three new public routes:
- `/for/qi-directors`
- `/for/pcmh-coordinators`  
- `/for/operations-managers`

### Files to create/modify

| File | Action |
|------|--------|
| `src/pages/Landing.tsx` | Rewrite hero, features, add persona section |
| `src/pages/PersonaQIDirector.tsx` | Create |
| `src/pages/PersonaPCMHCoordinator.tsx` | Create |
| `src/pages/PersonaCHCOpsManager.tsx` | Create |
| `src/App.tsx` | Add 3 new routes |
