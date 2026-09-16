// Browser-side re-export of the canonical deterministic rule engine.
// The engine itself lives beside the server function so both sides run the
// exact same code — see supabase/functions/_shared/evidence-rules.ts.
export * from "../../../supabase/functions/_shared/evidence-rules.ts";
