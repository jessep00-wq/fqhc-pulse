// Auto-included MeasureWise OSV Evidence Binder stylesheet.
// Ported verbatim from the branded master template — do not modify ad hoc.
// Additions: print-only page-break rules at the bottom.

export const BINDER_CSS = String.raw`
:root {
  --teal:         #1A7A7A;
  --teal-hover:   #157070;
  --brunswick:    #0F4F4F;
  --obsidian:     #0F172A;
  --denim:        #475569;
  --white:        #FFFFFF;
  --bg:           #F8FAFA;
  --surface:      #FFFFFF;
  --surface-2:    #F0F7F7;
  --border:       rgba(26,122,122,0.15);
  --border-light: rgba(15,23,42,0.08);
  --text:         #0F172A;
  --text-muted:   #475569;
  --text-faint:   #94A3B8;
  --teal-bg:      rgba(26,122,122,0.06);
  --teal-bg-md:   rgba(26,122,122,0.12);
  --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --text-xs:   clamp(0.70rem,  0.65rem + 0.2vw, 0.75rem);
  --text-sm:   clamp(0.8rem,   0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(0.9rem,   0.85rem + 0.25vw, 1rem);
  --text-lg:   clamp(1rem,     0.9rem  + 0.5vw,  1.125rem);
  --text-xl:   clamp(1.2rem,   1rem    + 0.75vw, 1.5rem);
  --text-2xl:  clamp(1.5rem,   1.2rem  + 1.25vw, 2rem);
  --text-3xl:  clamp(2rem,     1.5rem  + 2vw,    2.75rem);
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-5: 1.25rem; --space-6: 1.5rem; --space-8: 2rem; --space-10: 2.5rem;
  --space-12: 3rem; --space-16: 4rem;
  --radius-sm: 0.25rem; --radius-md: 0.5rem; --radius-lg: 0.75rem; --radius-xl: 1rem;
  --shadow-sm: 0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04);
  --transition: 180ms cubic-bezier(0.16,1,0.3,1);
  --content: 960px; --content-wide: 1200px;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-font-smoothing: antialiased; }
body { font-family: var(--font); font-size: var(--text-base); color: var(--text); background: var(--bg); line-height: 1.6; }
img { display: block; max-width: 100%; }
table { border-collapse: collapse; width: 100%; }
h1,h2,h3,h4,h5,h6 { line-height: 1.2; }

.cover { background: var(--obsidian); position: relative; overflow: hidden; padding: var(--space-16) var(--space-8) var(--space-12); }
.cover::before { content:''; position:absolute; inset:0; background: radial-gradient(ellipse 60% 80% at 90% 50%, rgba(26,122,122,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at -10% 80%, rgba(15,79,79,0.25) 0%, transparent 60%); pointer-events:none; }
.cover-grid { max-width: var(--content-wide); margin: 0 auto; display: grid; grid-template-columns: 1fr auto; align-items: end; gap: var(--space-8); position: relative; z-index: 1; }
.cover-eyebrow { display:inline-flex; align-items:center; gap:var(--space-2); background:rgba(26,122,122,0.2); border:1px solid rgba(26,122,122,0.35); border-radius:9999px; padding:var(--space-1) var(--space-3); font-size:var(--text-xs); color:rgba(255,255,255,0.75); letter-spacing:0.06em; text-transform:uppercase; font-weight:500; margin-bottom:var(--space-5); }
.cover-eyebrow::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--teal); }
.cover-title { font-size: var(--text-3xl); font-weight: 700; color: var(--white); letter-spacing: -0.03em; line-height: 1.1; margin-bottom: var(--space-4); }
.cover-title span { color: var(--teal); }
.cover-subtitle { font-size: var(--text-base); color: rgba(255,255,255,0.55); max-width: 50ch; line-height: 1.65; margin-bottom: var(--space-8); }
.cover-meta-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: var(--space-4); max-width: 600px; }
.cover-meta-item { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07); border-radius: var(--radius-lg); padding: var(--space-4); }
.cover-meta-label { font-size: var(--text-xs); color: rgba(255,255,255,0.4); letter-spacing: 0.06em; text-transform: uppercase; font-weight: 500; margin-bottom: var(--space-2); }
.cover-meta-value { font-size: var(--text-sm); font-weight: 500; color: rgba(255,255,255,0.85); }
.cover-completeness { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: var(--radius-xl); padding: var(--space-6); min-width: 220px; text-align: center; }
.completeness-ring { width: 80px; height: 80px; margin: 0 auto var(--space-4); position: relative; }
.completeness-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg { fill: none; stroke: rgba(255,255,255,0.08); stroke-width: 6; }
.ring-fill { fill: none; stroke: var(--teal); stroke-width: 6; stroke-linecap: round; }
.completeness-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: var(--text-sm); font-weight: 700; color: var(--white); }
.completeness-label { font-size: var(--text-xs); color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: var(--space-4); }
.completeness-items { list-style: none; text-align: left; display: flex; flex-direction: column; gap: var(--space-2); }
.completeness-items li { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-xs); color: rgba(255,255,255,0.6); }
.completeness-items li::before { content:''; width:10px; height:10px; border-radius:50%; flex-shrink:0; background: var(--teal); }
.completeness-items li.missing::before { background: #B44B1A; }

.toc-section { background: var(--white); border-bottom: 1px solid var(--border-light); padding: var(--space-10) var(--space-8); }
.toc-inner { max-width: var(--content-wide); margin: 0 auto; }
.toc-heading { font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--teal); margin-bottom: var(--space-6); }
.toc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-2); }
.toc-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); text-decoration: none; }
.toc-num { width: 24px; height: 24px; background: var(--teal-bg-md); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: 700; color: var(--teal); flex-shrink: 0; }
.toc-text { font-size: var(--text-sm); color: var(--text-muted); font-weight: 500; }

.main-content { max-width: var(--content-wide); margin: 0 auto; padding: var(--space-10) var(--space-8) var(--space-16); display: flex; flex-direction: column; gap: var(--space-6); }
.section-card { background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-xl); overflow: hidden; box-shadow: var(--shadow-sm); }
.section-header { display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: var(--space-4); padding: var(--space-6) var(--space-6) var(--space-5); border-bottom: 1px solid var(--border-light); background: linear-gradient(to right, rgba(26,122,122,0.03), transparent); }
.section-num-badge { width: 36px; height: 36px; background: var(--brunswick); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); font-weight: 700; color: var(--white); flex-shrink: 0; }
.section-heading-group { display: flex; flex-direction: column; gap: var(--space-1); }
.section-svp { font-size: var(--text-xs); color: var(--teal); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
.section-title { font-size: var(--text-lg); font-weight: 600; color: var(--text); letter-spacing: -0.02em; }
.section-status { display: inline-flex; align-items: center; gap: var(--space-1); background: rgba(26,122,122,0.1); border: 1px solid rgba(26,122,122,0.2); border-radius: 9999px; padding: 2px 10px; font-size: var(--text-xs); font-weight: 600; color: var(--brunswick); white-space: nowrap; align-self: flex-start; }
.section-status::before { content:''; width:6px; height:6px; border-radius:50%; background: var(--teal); }
.section-status.incomplete { background: rgba(180,75,26,0.08); border-color: rgba(180,75,26,0.25); color: #7A3D0F; }
.section-status.incomplete::before { background: #B44B1A; }
.section-status.pending { background: rgba(71,85,105,0.08); border-color: rgba(71,85,105,0.2); color: var(--denim); }
.section-status.pending::before { background: var(--denim); }
.section-body { padding: var(--space-5) var(--space-6); }

.alert { display:flex; gap: var(--space-3); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-5); font-size: var(--text-sm); line-height: 1.55; }
.alert-teal { background: rgba(26,122,122,0.06); border: 1px solid rgba(26,122,122,0.18); color: var(--brunswick); }
.alert-warning { background: rgba(180,100,30,0.06); border: 1px solid rgba(180,100,30,0.18); color: #7A3D0F; }
.alert-title { font-weight: 600; margin-bottom: var(--space-1); }
.body-text { font-size: var(--text-sm); color: var(--text-muted); line-height: 1.65; margin-bottom: var(--space-5); max-width: 80ch; }
.section-subhead { font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-faint); margin-bottom: var(--space-3); margin-top: var(--space-5); }

.table-wrap { overflow-x: auto; margin-bottom: var(--space-5); }
.evidence-table { width: 100%; font-size: var(--text-sm); border: 1px solid var(--border-light); border-radius: var(--radius-lg); overflow: hidden; }
.evidence-table thead tr { background: var(--teal-bg); border-bottom: 1px solid var(--border); }
.evidence-table th { padding: var(--space-3) var(--space-4); text-align: left; font-size: var(--text-xs); font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--teal); white-space: nowrap; }
.evidence-table tbody tr { border-bottom: 1px solid var(--border-light); }
.evidence-table tbody tr:last-child { border-bottom: none; }
.evidence-table td { padding: var(--space-3) var(--space-4); color: var(--text-muted); vertical-align: top; }
.evidence-table td:first-child { color: var(--text); font-weight: 500; }
.tag { display: inline-flex; align-items: center; background: var(--teal-bg-md); color: var(--brunswick); border-radius: 9999px; padding: 2px 8px; font-size: var(--text-xs); font-weight: 600; }
.tag-incomplete { background: rgba(180,75,26,0.1); color: #7A3D0F; }
.tag-pending { background: rgba(71,85,105,0.1); color: var(--denim); }

.checklist { list-style: none; display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-5); }
.checklist li { display: flex; align-items: flex-start; gap: var(--space-3); font-size: var(--text-sm); color: var(--text-muted); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); background: var(--bg); border: 1px solid var(--border-light); }
.check-box { width: 18px; height: 18px; border-radius: 4px; border: 1.5px solid rgba(26,122,122,0.35); background: rgba(26,122,122,0.05); flex-shrink: 0; margin-top: 1px; display:flex; align-items:center; justify-content:center; font-size:11px; color: var(--teal); font-weight:700; }
.check-box.checked { background: var(--teal); border-color: var(--teal); color: white; }

.uds-tracker thead tr { background: var(--obsidian); }
.uds-tracker th { color: rgba(255,255,255,0.7) !important; }
.uds-tracker tbody tr:nth-child(even) { background: rgba(26,122,122,0.03); }
.measure-gap { color: #B44B1A; font-weight: 600; }
.measure-ok  { color: var(--teal); font-weight: 600; }

.gaps-table thead tr { background: rgba(180,75,26,0.07); }
.gaps-table th { color: #7A3D0F !important; }
.risk-high { color: #B44B1A; font-weight: 700; font-size: var(--text-xs); }
.risk-med  { color: #8A6210; font-weight: 700; font-size: var(--text-xs); }

.prep-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: var(--space-3); margin-bottom: var(--space-5); }
.prep-item { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--bg); border: 1px solid var(--border-light); font-size: var(--text-sm); color: var(--text-muted); }
.prep-check { width: 20px; height: 20px; border-radius: 5px; border: 1.5px solid var(--border); background: var(--white); flex-shrink: 0; margin-top: 1px; display:flex; align-items:center; justify-content:center; font-size:13px; color: var(--teal); font-weight:700; }
.prep-check.checked { background: var(--teal); border-color: var(--teal); color: white; }

.signoff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: var(--space-4); margin-bottom: var(--space-5); }
.signoff-item { border-bottom: 1px dashed var(--border); padding-bottom: var(--space-3); }
.signoff-label { font-size: var(--text-xs); color: var(--text-faint); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: var(--space-4); font-weight: 500; }
.signoff-date { font-size: var(--text-xs); color: var(--text-faint); margin-top: var(--space-3); }

.site-footer { background: var(--obsidian); padding: var(--space-8); }
.footer-inner { max-width: var(--content-wide); margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.footer-brand { display: flex; align-items: center; gap: var(--space-3); }
.footer-logo-mark { width: 24px; height: 24px; background: var(--teal); border-radius: 6px; display:flex; align-items:center; justify-content:center; }
.footer-name { font-size: var(--text-sm); font-weight: 600; color: rgba(255,255,255,0.75); }
.footer-name span { color: var(--teal); }
.footer-meta { font-size: var(--text-xs); color: rgba(255,255,255,0.35); }

.pending-callout { background: rgba(71,85,105,0.04); border: 1px dashed rgba(71,85,105,0.25); border-radius: var(--radius-lg); padding: var(--space-5); margin-bottom: var(--space-5); }
.pending-callout .pc-title { font-size: var(--text-sm); font-weight: 700; color: var(--denim); margin-bottom: var(--space-2); display:flex; align-items:center; gap: var(--space-2); }
.pending-callout .pc-title::before { content:'!'; width:18px; height:18px; border-radius:50%; background:#B44B1A; color:white; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
.pending-callout ul { list-style: none; margin-top: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2); }
.pending-callout li { font-size: var(--text-sm); color: var(--text-muted); padding-left: var(--space-4); position: relative; }
.pending-callout li::before { content:'·'; position:absolute; left: var(--space-2); color: var(--teal); font-weight: 700; }
.notes-line { border-bottom: 1px dashed var(--border); padding-bottom: var(--space-6); margin-top: var(--space-3); }
.preparer-note { font-size: var(--text-sm); color: var(--text-muted); white-space: pre-wrap; background: var(--bg); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); }

@page { size: Letter; margin: 0.5in; }
@media print {
  body { background: white; }
  .cover { break-after: page; }
  .toc-section { break-after: page; }
  .section-card { break-inside: avoid; page-break-inside: avoid; }
  .evidence-table { break-inside: auto; }
  .site-footer { break-before: page; }
}
`;
