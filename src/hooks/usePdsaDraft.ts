import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DraftSaveState = "idle" | "saving" | "saved" | "error";

export interface PdsaDraftRow {
  id: string;
  current_step: string;
  form_data: Record<string, unknown>;
  updated_at: string;
}

const LOCAL_KEY = "mw_pdsa_draft_mirror";
const DEBOUNCE_MS = 800;

function writeMirror(payload: unknown) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
  } catch {
    /* noop */
  }
}
function clearMirror() {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* noop */
  }
}
export function readMirror(): { current_step: string; form_data: Record<string, unknown> } | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Auto-saving draft store for the guided PDSA wizard.
 * One active draft per user; the DB row is the source of truth on load,
 * with a localStorage mirror so an offline/failed save still survives a refresh.
 */
export function usePdsaDraft(organizationId: string | undefined) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<PdsaDraftRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<DraftSaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const draftIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ step: string; data: unknown } | null>(null);
  const inFlightRef = useRef(false);

  // Load the most recent unfinished draft.
  useEffect(() => {
    let cancelled = false;
    if (!user?.id || !organizationId) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("pdsa_drafts")
        .select("id,current_step,form_data,updated_at")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1);
      if (cancelled) return;
      const row = (data?.[0] as PdsaDraftRow | undefined) ?? null;
      if (row) {
        draftIdRef.current = row.id;
        const mirror = readMirror();
        // Prefer the local mirror only when it's for this same draft session.
        setDraft(mirror ? { ...row, ...mirror } : row);
      } else {
        clearMirror();
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, organizationId]);

  const flush = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending || !user?.id || !organizationId || inFlightRef.current) return;
    inFlightRef.current = true;
    pendingRef.current = null;
    setSaveState("saving");
    const payload = {
      user_id: user.id,
      organization_id: organizationId,
      status: "draft",
      current_step: pending.step,
      form_data: pending.data as never,
    };
    try {
      if (draftIdRef.current) {
        const { error } = await supabase
          .from("pdsa_drafts")
          .update(payload)
          .eq("id", draftIdRef.current);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("pdsa_drafts")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        draftIdRef.current = data.id;
      }
      setSaveState("saved");
      setSavedAt(new Date());
    } catch {
      setSaveState("error");
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current) void flush();
    }
  }, [user?.id, organizationId]);

  /** Debounced auto-save. Call on every field/step change. */
  const saveDraft = useCallback(
    (step: string, data: unknown) => {
      pendingRef.current = { step, data };
      writeMirror({ current_step: step, form_data: data });
      setSaveState("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  // Best-effort save when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (pendingRef.current) void flush();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush]);

  const markComplete = useCallback(async (cycleId?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = null;
    const id = draftIdRef.current;
    draftIdRef.current = null;
    clearMirror();
    setDraft(null);
    setSaveState("idle");
    setSavedAt(null);
    if (id) {
      await supabase
        .from("pdsa_drafts")
        .update({ status: "complete", pdsa_cycle_id: cycleId ?? null })
        .eq("id", id);
    }
  }, []);

  const discardDraft = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = null;
    const id = draftIdRef.current;
    draftIdRef.current = null;
    clearMirror();
    setDraft(null);
    setSaveState("idle");
    setSavedAt(null);
    if (id) await supabase.from("pdsa_drafts").delete().eq("id", id);
  }, []);

  return { draft, loading, saveState, savedAt, saveDraft, markComplete, discardDraft };
}
