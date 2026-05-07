
## Visual Enhancements for Landing Page

### 1. Three-step workflow diagram below the hero screenshot

Replace the current "What happens when you sign up" micro-steps (lines 408-425) with a visually prominent three-step workflow strip:

**Plan PDSA → Track UDS Impact → Export Audit Binder**

Each step gets a large icon, step number, short title, and one-line description — connected by arrow dividers. This acts as a quick product illustration showing the core loop without needing a full mockup.

### 2. Alternating section backgrounds for visual rhythm

Currently several sections use `bg-muted/30` while others have no background, but the pattern isn't consistent. I'll audit and apply a strict alternating pattern:

- Hero: default background
- Stats: `bg-muted/50` (already done)
- "What MeasureWise does": default ✓
- "How it works": `bg-muted/30` ✓
- SPC Chart: default ✓
- Key Features: `bg-muted/30` ✓
- Outcomes: default ✓ — add a subtle top border for separation
- Comparison: `bg-muted/30` ✓
- Objections: default ✓
- Sample Export: `bg-muted/30` ✓
- Personas: default ✓
- Founder: `bg-muted/30` ✓
- Security: border-y (keeps)
- FAQ: `bg-muted/30` ✓
- CTA: `bg-primary` ✓

This is mostly correct already. I'll add subtle `border-t border-border` dividers where two plain-background sections meet.

### 3. Credibility badges with iconography

Add a horizontal badge strip (below the stats bar or within the hero) featuring visual pill-shaped badges:

- **HRSA Aligned** (Shield icon)
- **NCQA PCMH & Q-PASS Ready** (ClipboardCheck icon)
- **Audit Binder Exports** (FileCheck icon)

These already exist as `complianceBadges` in the hero (lines 377-386) but are small and subtle. I'll make them more prominent — larger, with stronger styling (filled background, bolder text) — and duplicate a similar credibility strip right after the stats section for reinforcement.

### Technical Details

All changes are in `src/pages/Landing.tsx` only:

1. Replace the "What happens when you sign up" block with a styled 3-step workflow visual (Plan → Track → Export) using larger cards with connecting arrows
2. Enhance the existing compliance badges in the hero with stronger visual styling (filled teal background, larger size)
3. Add a thin credibility badge bar after the stats section
4. Add `border-t border-border` between consecutive plain-background sections (Outcomes → Comparison transition, Objections → Sample Export)
