import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Loader2, User, Lock, Building2, TrendingUp, Upload, Plus, Trash2, Download, Database } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamInviteSection } from "@/components/TeamInviteSection";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const STAFF_ROLES = ["QI Manager", "Provider", "MA/RN", "Front Desk", "Care Coordinator", "Administrator"];

const UDS_MEASURES = [
  { id: "CMS2", label: "CMS2 – Depression Screening" },
  { id: "CMS122", label: "CMS122 – Diabetes HbA1c Poor Control" },
  { id: "CMS124", label: "CMS124 – Cervical Cancer Screening" },
  { id: "CMS125", label: "CMS125 – Breast Cancer Screening" },
  { id: "CMS127", label: "CMS127 – Pneumococcal Vaccination" },
  { id: "CMS130", label: "CMS130 – Colorectal Cancer Screening" },
  { id: "CMS138", label: "CMS138 – Tobacco Use Screening" },
  { id: "CMS147", label: "CMS147 – Influenza Immunization" },
  { id: "CMS165", label: "CMS165 – Controlling Blood Pressure" },
];

export default function Settings() {
  const { user } = useAuth();
  const { organization, refetchOrg } = useOrg();
  const queryClient = useQueryClient();

  // ── Profile ──
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const [fullName, setFullName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  if (profile && !profileLoaded) {
    setFullName(profile.full_name || "");
    setStaffRole(profile.staff_role || "");
    setProfileLoaded(true);
  }

  const profileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), staff_role: staffRole })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update profile"),
  });

  // ── Password ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setNewPassword(""); setConfirmPassword(""); }
  };

  // ── Organization (editable) ──
  const [orgName, setOrgName] = useState(organization.name === "Loading..." ? "" : organization.name);
  const [orgNpi, setOrgNpi] = useState(organization.npi);
  const [orgLoaded, setOrgLoaded] = useState(false);

  if (organization.id && !orgLoaded && organization.name !== "Loading...") {
    setOrgName(organization.name);
    setOrgNpi(organization.npi);
    setOrgLoaded(true);
  }

  const orgMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName.trim(), npi: orgNpi.trim() || null })
        .eq("id", organization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchOrg();
      toast.success("Organization updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update organization"),
  });

  // ── UDS Trends ──
  const orgId = organization.id;

  const { data: trends, refetch: refetchTrends } = useQuery({
    queryKey: ["uds_trends_settings", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("uds_trends")
        .select("*")
        .eq("organization_id", orgId)
        .order("month", { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  const [newMeasure, setNewMeasure] = useState("");
  const [newMonth, setNewMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [newValue, setNewValue] = useState("");

  const addTrendMutation = useMutation({
    mutationFn: async () => {
      if (!newMeasure || !newMonth || !newValue) throw new Error("All fields are required");
      const val = Number(newValue);
      if (isNaN(val) || val < 0 || val > 100) throw new Error("Value must be 0-100");
      const { error } = await supabase.from("uds_trends").insert({
        organization_id: orgId,
        measure_id: newMeasure,
        month: newMonth,
        value: val,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      refetchTrends();
      queryClient.invalidateQueries({ queryKey: ["uds_trends", orgId] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
      logActivity(orgId, `UDS measure data added: ${newMeasure}`, "info");
      setNewValue("");
      toast.success("UDS measure added");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTrendMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("uds_trends").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchTrends();
      queryClient.invalidateQueries({ queryKey: ["uds_trends", orgId] });
      toast.success("Entry deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── CSV Upload ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

      const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
      const measureIdx = header.indexOf("measure_id");
      const monthIdx = header.indexOf("month");
      const valueIdx = header.indexOf("value");

      if (measureIdx === -1 || monthIdx === -1 || valueIdx === -1) {
        throw new Error("CSV must have columns: measure_id, month, value");
      }

      const VALID_MEASURES = new Set(["CMS2","CMS122","CMS124","CMS125","CMS127","CMS130","CMS138","CMS147","CMS165"]);
      const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
      const MAX_ROWS = 500;

      const dataLines = lines.slice(1).filter((l) => l.trim().length > 0);
      if (dataLines.length > MAX_ROWS) throw new Error(`Maximum ${MAX_ROWS} rows per import`);

      const rows = dataLines.map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        const measureId = cols[measureIdx];
        const month = cols[monthIdx];
        const val = Number(cols[valueIdx]);
        if (!VALID_MEASURES.has(measureId)) throw new Error(`Unknown measure: ${measureId}`);
        if (!MONTH_RE.test(month)) throw new Error(`Invalid month format: ${month}. Expected YYYY-MM`);
        if (isNaN(val) || val < 0 || val > 100) throw new Error(`Value out of range (0-100): ${cols[valueIdx]}`);
        return {
          organization_id: orgId,
          measure_id: measureId,
          month: month,
          value: val,
        };
      });

      const { error } = await supabase.from("uds_trends").insert(rows);
      if (error) throw error;

      refetchTrends();
      queryClient.invalidateQueries({ queryKey: ["uds_trends", orgId] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
      logActivity(orgId, `Imported ${rows.length} UDS entries via CSV`, "success");
      toast.success(`${rows.length} UDS entries imported`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "CSV import failed");
    } finally {
      setCsvLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, organization, and clinical data</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Profile</CardTitle>
          <CardDescription>Update your name and role</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Staff Role</Label>
            <Select value={staffRole} onValueChange={setStaffRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
            {profileMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handlePasswordChange} disabled={pwLoading}>
            {pwLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Organization (editable) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4" /> Organization</CardTitle>
          <CardDescription>Update your health center's name and NPI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Organization Name</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Community Health Center" />
          </div>
          <div className="space-y-2">
            <Label>NPI Number</Label>
            <Input value={orgNpi} onChange={(e) => setOrgNpi(e.target.value)} placeholder="10-digit NPI" maxLength={10} />
          </div>
          <Button onClick={() => orgMutation.mutate()} disabled={orgMutation.isPending || !orgName.trim()}>
            {orgMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save Organization
          </Button>
        </CardContent>
      </Card>

      {/* UDS Clinical Measures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> UDS Clinical Measures</CardTitle>
          <CardDescription>Add individual entries or bulk-import via CSV (columns: measure_id, month, value)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add single entry */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Measure</Label>
              <Select value={newMeasure} onValueChange={setNewMeasure}>
                <SelectTrigger><SelectValue placeholder="Select measure" /></SelectTrigger>
                <SelectContent>
                  {UDS_MEASURES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Month</Label>
              <Input type="month" value={newMonth} onChange={(e) => setNewMonth(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Value (%)</Label>
              <Input type="number" min={0} max={100} step={0.1} value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="e.g. 65" />
            </div>
            <Button onClick={() => addTrendMutation.mutate()} disabled={addTrendMutation.isPending} size="sm">
              {addTrendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Add
            </Button>
          </div>

          {/* CSV Upload & Helpers */}
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={csvLoading}>
              {csvLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Import CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const csv = "measure_id,month,value\nCMS124,2025-01,52\nCMS124,2025-02,55\nCMS165,2025-01,60\nCMS122,2025-01,35";
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "uds_sample.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-1" /> Download Sample CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const { error } = await supabase.rpc("seed_demo_data", { org_id: orgId });
                if (error) {
                  toast.error(error.message || "Failed to seed demo data");
                } else {
                  refetchTrends();
                  queryClient.invalidateQueries({ queryKey: ["uds_trends", orgId] });
                  queryClient.invalidateQueries({ queryKey: ["pdsa_cycles", orgId] });
                  logActivity(orgId, "Seeded demo data for the organization", "info");
                  toast.success("Demo data seeded successfully");
                }
              }}
            >
              <Database className="h-4 w-4 mr-1" /> Seed Demo Data
            </Button>
            <span className="text-xs text-muted-foreground">CSV format: measure_id, month (YYYY-MM), value</span>
          </div>

          <Separator />

          {/* Existing entries table */}
          {trends && trends.length > 0 ? (
            <div className="max-h-64 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Measure</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trends.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs font-medium">{t.measure_id}</TableCell>
                      <TableCell className="text-xs">{t.month}</TableCell>
                      <TableCell className="text-xs">{Number(t.value)}%</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deleteTrendMutation.mutate(t.id)}
                          disabled={deleteTrendMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No UDS data yet. Add entries above or import a CSV.</p>
          )}
        </CardContent>
      </Card>

      {/* Team */}
      <TeamInviteSection />
    </div>
  );
}
