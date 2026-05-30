/**
 * Full-viewport diagonal watermark shown when the active organization is in demo mode.
 * Pointer-events disabled so it never blocks clicks.
 */
export function DemoWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden select-none"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="text-[clamp(3rem,10vw,8rem)] font-black tracking-widest text-amber-500/10 whitespace-nowrap"
          style={{ transform: "rotate(-30deg)" }}
        >
          DEMO DATA · NOT FOR HRSA SUBMISSION
        </div>
      </div>
    </div>
  );
}
