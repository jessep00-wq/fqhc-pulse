import { isTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  if (!isTestMode()) return null;
  return (
    <div className="w-full bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-xs sm:text-sm text-amber-900">
      <strong>Test mode:</strong> all payments are simulated. Use card{" "}
      <code className="font-mono bg-white/70 px-1.5 py-0.5 rounded">4242 4242 4242 4242</code>,
      any future expiry, any CVC.
    </div>
  );
}
