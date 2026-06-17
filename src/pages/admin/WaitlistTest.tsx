import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, FlaskConical, Play, RotateCcw, Trash2, Clock } from "lucide-react";

type Row = {
  id: string;
  name: string;
  email: string;
  organization: string;
  status: string;
  sequence_step: number;
  last_sequence_sent_at: string | null;
  created_at: string;
};

const NURTURE_DAYS = [4, 18, 35, 56, 77];

export default function WaitlistTest() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState("Test Lead");
  const [email, setEmail] = useState("");
  const [lastResult, setLastResult] = useState<string>("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("waitlist_applications")
      .select("id,name,email,organization,status,sequence_step,last_sequence_sent_at,created_at")
      .or("organization.eq.MeasureWise Test,email.ilike.%+wltest%")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => {
      if (!email && data.user?.email) setEmail(plusTag(data.user.email));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function plusTag(addr: string): string {
    const [local, domain] = addr.split("@");
    if (!domain) return addr;
    if (local.includes("+wltest")) return addr;
    return `${local}+wltest${Date.now().toString(36)}@${domain}`;
  }

  async function call(action: string, payload: Record<string, unknown> = {}) {
    const key = `${action}:${payload.id ?? ""}`;
    setBusy(key);
    try {
      const { data, error } = await supabase.functions.invoke("admin-waitlist-test", {
        body: { action, ...payload },
      });
      if (error) throw error;
      setLastResult(JSON.stringify(data, null, 2));
      return data;
    } catch (e) {
      const msg = (e as Error).message ?? "Request failed";
      toast.error(msg);
      setLastResult(msg);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function handleCreate() {
    if (!email.trim()) return toast.error("Enter an email");
    const res = await call("create", { name: name.trim(), email: email.trim() });
    if (res) {
      toast.success("Test applicant created");
      setEmail(plusTag(email.replace(/\+wltest[^@]*/, "")));
      await load();
    }
  }

  async function handleBackdate(id: string) {
    const res = await call("backdate", { id });
    if (res) {
      toast.success(`Backdated — step ${res.next_step} is now due`);
      await load();
    }
  }

  async function handleReset(id: string) {
    const res = await call("reset", { id });
    if (res) { toast.success("Reset"); await load(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this test applicant?")) return;
    const res = await call("delete", { id });
    if (res) { toast.success("Deleted"); await load(); }
  }

  async function handleTriggerCron() {
    const res = await call("trigger_cron");
    if (res) {
      toast.success(`Cron ran: ${JSON.stringify(res.result)}`);
      await load();
    }
  }

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Waitlist Nurture Tester</h1>
          <p className="text-sm text-muted-foreground">
            Create a fake applicant, fast-forward the clock, and run the cron end-to-end.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Create test applicant</CardTitle>
          <CardDescription>
            Use a plus-tagged email (auto-filled) so it's flagged as a test row.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_2fr_auto] items-end">
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Name</Label>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-email">Email</Label>
            <Input id="t-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button onClick={handleCreate} disabled={busy === "create:"}>
            {busy === "create:" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>2. Test applicants</CardTitle>
            <CardDescription>
              Cadence: step 1 @ day 4 · step 2 @ day 18 · step 3 @ day 35 · step 4 @ day 56 · step 5 @ day 77
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
            <Button onClick={handleTriggerCron} disabled={busy === "trigger_cron:"}>
              {busy === "trigger_cron:" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Run cron now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No test applicants yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2 pr-2">Step</th>
                    <th className="py-2 pr-2">Created</th>
                    <th className="py-2 pr-2">Last sent</th>
                    <th className="py-2 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const nextStep = r.sequence_step + 1;
                    const done = nextStep > NURTURE_DAYS.length;
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-2">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        </td>
                        <td className="py-2 pr-2">
                          <Badge variant={done ? "secondary" : "outline"}>
                            {r.sequence_step}/{NURTURE_DAYS.length}
                          </Badge>
                        </td>
                        <td className="py-2 pr-2 text-xs">{fmt(r.created_at)}</td>
                        <td className="py-2 pr-2 text-xs">{fmt(r.last_sequence_sent_at)}</td>
                        <td className="py-2 pr-2">
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={done || busy === `backdate:${r.id}`}
                              onClick={() => handleBackdate(r.id)}
                              title={done ? "Sequence complete" : `Make step ${nextStep} due now`}
                            >
                              {busy === `backdate:${r.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === `reset:${r.id}`}
                              onClick={() => handleReset(r.id)}
                              title="Reset to step 0"
                            >
                              {busy === `reset:${r.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy === `delete:${r.id}`}
                              onClick={() => handleDelete(r.id)}
                              title="Delete"
                            >
                              {busy === `delete:${r.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">{lastResult}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
