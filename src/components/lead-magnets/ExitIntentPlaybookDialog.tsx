import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import playbookCover from "@/assets/athenaone-playbook-cover.jpg";
import { PlaybookLeadForm } from "./PlaybookLeadForm";

const SHOWN_KEY = "playbook_exit_shown";
const SUBMITTED_KEY = "playbook_lead_submitted";

export function ExitIntentPlaybookDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alreadyShown = false;
    try {
      if (sessionStorage.getItem(SHOWN_KEY)) alreadyShown = true;
      if (localStorage.getItem(SUBMITTED_KEY)) alreadyShown = true;
    } catch {
      // ignore
    }
    if (alreadyShown) return;

    const trigger = () => {
      try {
        sessionStorage.setItem(SHOWN_KEY, "1");
      } catch {
        // ignore
      }
      setOpen(true);
    };

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        trigger();
        cleanup();
      }
    };

    const isMobile =
      typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

    let mobileTimer: number | undefined;
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = (doc.scrollTop + window.innerHeight) / doc.scrollHeight;
      if (scrolled > 0.5 && !mobileTimer) {
        mobileTimer = window.setTimeout(trigger, 0);
        cleanup();
      }
    };

    function cleanup() {
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    }

    if (isMobile) {
      window.addEventListener("scroll", onScroll, { passive: true });
      const timer = window.setTimeout(() => {
        // Fall back to time-based trigger
        if (window.scrollY / document.documentElement.scrollHeight > 0.3) trigger();
      }, 60_000);
      return () => {
        cleanup();
        window.clearTimeout(timer);
        if (mobileTimer) window.clearTimeout(mobileTimer);
      };
    }

    document.addEventListener("mouseleave", onMouseLeave);
    return cleanup;
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <div className="grid sm:grid-cols-[160px_1fr]">
          <div className="hidden sm:flex items-center justify-center bg-muted/40 p-4">
            <img
              src={playbookCover}
              alt=""
              aria-hidden
              loading="lazy"
              width={1024}
              height={1024}
              className="w-32 drop-shadow-md"
            />
          </div>
          <div className="p-6 space-y-4">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-2xl font-extrabold">
                Before you go — grab the free playbook
              </DialogTitle>
              <DialogDescription>
                The AthenaOne Optimization Playbook: a technical guide for FQHC
                quality, risk, and audit readiness.
              </DialogDescription>
            </DialogHeader>
            <PlaybookLeadForm
              variant="dialog"
              surface="exit_intent"
              onSubmitted={() => setTimeout(() => setOpen(false), 4000)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
