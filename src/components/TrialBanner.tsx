import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export function TrialBanner() {
  const { isTrialing, daysLeftInTrial } = useSubscription();
  if (!isTrialing || daysLeftInTrial === null) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 flex items-center justify-center gap-3">
      <Clock className="h-4 w-4" />
      <span>
        {daysLeftInTrial === 0
          ? "Your free trial ends today."
          : `${daysLeftInTrial} ${daysLeftInTrial === 1 ? "day" : "days"} left in your free trial.`}
      </span>
      <Link to="/pricing" className="underline font-semibold hover:text-amber-950">
        Choose a plan →
      </Link>
    </div>
  );
}
