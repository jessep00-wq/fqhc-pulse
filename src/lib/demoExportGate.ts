/**
 * Returns true if it is safe to proceed with an export.
 * When the workspace is in demo mode, surfaces a confirmation prompt warning
 * that the export must not be submitted to HRSA / the board.
 */
export function confirmDemoExport(isDemo: boolean, label = "this export"): boolean {
  if (!isDemo) return true;
  return window.confirm(
    `This workspace is in DEMO MODE.\n\n${label} will contain fictional sample data and must not be submitted to HRSA, the board, or any external party.\n\nSwitch to Live Mode in Settings → Facility before generating production reports.\n\nContinue with the demo export?`
  );
}
