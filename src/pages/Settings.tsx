import { UDS_MEASURE_LIST, UDS_MEASURE_IDS } from "@/data/udsMeasures";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "@/lib/router-compat";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLogger";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import {
  Loader2, User, Lock, Building2, TrendingUp, Upload, Plus, Trash2, Download, Database,
  Check, Users, ArrowUp, ArrowDown,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamInviteSection } from "@/components/TeamInviteSection";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataModeCard } from "@/components/DataModeCard";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/trackEvent";

const STAFF_ROLES = ["QI Manager", "Provider", "MA/RN", "Front Desk", "Care Coordinator", "Administrator"];

const UDS_MEASURES = UDS_MEASURE_LIST.map((m) => ({ id: m.id, label: m.label, short: m.short }));

const MEASURE_MAP: Record<string, string> = UDS_MEASURES.reduce((acc, m) => {
  acc[m.id] = m.short;
  return acc;
}, {} as Record<string, string>);

const PAGE_SIZE = 10;
type SortKey = "month_desc" | "month_asc" | "measure_asc" | "measure_desc" | "value_desc" | "value_asc";
const VALID_TABS = new Set(["account", "facility", "clinical", "team"]);

export default function Settings() {
  const { user } = useAuth();
  const { organization, refetchOrg } = useOrg();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = VALID_TABS.has(searchParams.get("tab") ?? "") ? (searchParams.get("tab") as string) : "account";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const sortKey = (searchParams.get("sort") as SortKey) || "month_desc";

  const updateParam = useCallback((key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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

  // Audit fix 29: hydrate from profile inside an effect rather than mutating
  // state during the render body (Strict-Mode double-render bug).
  useEffect(() => {
    if (profile && !profileLoaded) {
      setFullName(profile.full_name || "");
      setStaffRole(profile.staff_role || "");
      setProfileLoaded(true);
    }
  }, [profile, profileLoaded]);

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
      trackEvent("settings_updated", { section: "profile" });
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

  useEffect(() => {
    if (organization.id && !orgLoaded && organization.name !== "Loading...") {
      setOrgName(organization.name);
      setOrgNpi(organization.npi);
      setOrgLoaded(true);
    }
  }, [organization.id, organization.name, organization.npi, orgLoaded]);

  const npiTrimmed = orgNpi.trim();
  const isValidNpi = /^\d{10}$/.test(npiTrimmed);
  const npiHasContent = npiTrimmed.length > 0;

  const orgMutation = useMutation({
    mutationFn: async () => {
      if (!organization.id) {
        throw new Error("No organization selected. Open the Admin Console and pick a clinic from the 'Acting as' dropdown.");
      }
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName.trim(), npi: npiTrimmed || null })
        .eq("id", organization.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchOrg();
      toast.success("Organization updated");
      trackEvent("settings_updated", { section: "facility" });
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
  const [isDragOver, setIsDragOver] = useState(false);

  const processCsvFile = async (file: File) => {
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

      const VALID_MEASURES = new Set(UDS_MEASURE_IDS);
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

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processCsvFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      await processCsvFile(file);
    } else if (file) {
      toast.error("Please drop a .csv file");
    }
  };

  // ── Sorted + paginated trends ──
  const sortedTrends = useMemo(() => {
    const arr = [...(trends ?? [])];
    arr.sort((a, b) => {
      switch (sortKey) {
        case "month_asc": return a.month.localeCompare(b.month);
        case "month_desc": return b.month.localeCompare(a.month);
        case "measure_asc": return a.measure_id.localeCompare(b.measure_id);
        case "measure_desc": return b.measure_id.localeCompare(a.measure_id);
        case "value_asc": return Number(a.value) - Number(b.value);
        case "value_desc": return Number(b.value) - Number(a.value);
      }
    });
    return arr;
  }, [trends, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedTrends.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = sortedTrends.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSort = (col: "month" | "measure" | "value") => {
    const asc = `${col}_asc` as SortKey;
    const desc = `${col}_desc` as SortKey;
    const next: SortKey = sortKey === desc ? asc : desc;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("sort", next);
    nextParams.delete("page");
    setSearchParams(nextParams, { replace: true });
  };

  const sortIcon = (col: "month" | "measure" | "value") => {
    if (sortKey === `${col}_asc`) return <ArrowUp className="h-3 w-3 inline ml-1" />;
    if (sortKey === `${col}_desc`) return <ArrowDown className="h-3 w-3 inline ml-1" />;
    return null;
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <SEO
        title="Settings — Account, Facility & Team"
        description="Manage your MeasureWise account, facility profile, UDS clinical data, and team members."
        canonical="https://measurewise.org/dashboard/settings"
      />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account, facility, clinical data, and team</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => {
        const next = new URLSearchParams(searchParams);
        next.set("tab", v);
        next.delete("page");
        setSearchParams(next, { replace: true });
      }}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto h-auto">
          <TabsTrigger value="account" className="gap-2"><User className="h-4 w-4" /> Account</TabsTrigger>
          <TabsTrigger value="facility" className="gap-2"><Building2 className="h-4 w-4" /> Facility</TabsTrigger>
          <TabsTrigger value="clinical" className="gap-2"><TrendingUp className="h-4 w-4" /> Clinical Data</TabsTrigger>
          <TabsTrigger value="team" className="gap-2"><Users className="h-4 w-4" /> Team</TabsTrigger>
        </TabsList>

        {/* ─── Account ─── */}
        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><User className="h-4 w-4" /> Profile</CardTitle>
              <CardDescription>Update your name and role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Staff Role</Label>
                  <Select value={staffRole} onValueChange={setStaffRole}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
                {profileMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4" /> Change Password</CardTitle>
              <CardDescription>Sensitive action — review carefully before saving</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>
              <Button onClick={handlePasswordChange} disabled={pwLoading} variant="destructive">
                {pwLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Facility ─── */}
        <TabsContent value="facility" className="space-y-6 mt-6">
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
                <div className="relative max-w-xs">
                  <Input
                    value={orgNpi}
                    onChange={(e) => setOrgNpi(e.target.value)}
                    placeholder="10-digit NPI"
                    maxLength={10}
                    inputMode="numeric"
                    className={cn(npiHasContent && !isValidNpi && "border-destructive", isValidNpi && "border-green-500 pr-9")}
                  />
                  {isValidNpi && (
                    <Check className="h-4 w-4 text-green-600 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                <p className={cn("text-xs", npiHasContent && !isValidNpi ? "text-destructive" : "text-muted-foreground")}>
                  {npiHasContent && !isValidNpi ? `Must be exactly 10 digits (${npiTrimmed.length}/10)` : "10-digit National Provider Identifier"}
                </p>
              </div>
              <Button
                onClick={() => orgMutation.mutate()}
                disabled={orgMutation.isPending || !organization.id || !orgName.trim() || (npiHasContent && !isValidNpi)}
              >
                {orgMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Save Organization
              </Button>
              {!organization.id && (
                <p className="text-xs text-amber-600">
                  No organization selected. Open the Admin Console and pick a clinic from the "Acting as" dropdown to edit facility details.
                </p>
              )}
            </CardContent>
          </Card>

          <DataModeCard />
        </TabsContent>

        {/* ─── Clinical Data ─── */}
        <TabsContent value="clinical" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Manual entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" /> Manual Entry</CardTitle>
                <CardDescription>Add a single UDS measurement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Measure</Label>
                  <Select value={newMeasure} onValueChange={setNewMeasure}>
                    <SelectTrigger><SelectValue placeholder="Select measure" /></SelectTrigger>
                    <SelectContent>
                      {UDS_MEASURES.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Month</Label>
                    <Input type="month" value={newMonth} onChange={(e) => setNewMonth(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Value (%)</Label>
                    <Input type="number" min={0} max={100} step={0.1} value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="e.g. 65" />
                  </div>
                </div>
                <Button onClick={() => addTrendMutation.mutate()} disabled={addTrendMutation.isPending} className="w-full">
                  {addTrendMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                  Add Entry
                </Button>
              </CardContent>
            </Card>

            {/* CSV import */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Upload className="h-4 w-4" /> Bulk CSV Import</CardTitle>
                <CardDescription>Columns: measure_id, month (YYYY-MM), value</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors",
                    isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                    csvLoading && "pointer-events-none opacity-60"
                  )}
                >
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                  {csvLoading ? (
                    <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Drop CSV here or click to browse</p>
                      <p className="text-xs text-muted-foreground mt-1">Max 500 rows per import</p>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
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
                    <Download className="h-4 w-4 mr-1" /> Sample CSV
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> Historical Entries</CardTitle>
              <CardDescription>{sortedTrends.length} total {sortedTrends.length === 1 ? "entry" : "entries"}</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedTrends.length > 0 ? (
                <>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("measure")}>
                            Measure{sortIcon("measure")}
                          </TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("month")}>
                            Month{sortIcon("month")}
                          </TableHead>
                          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("value")}>
                            Value{sortIcon("value")}
                          </TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageRows.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs">
                              <span className="font-medium">{t.measure_id}</span>
                              <span className="text-muted-foreground"> — {MEASURE_MAP[t.measure_id] ?? "Unknown"}</span>
                            </TableCell>
                            <TableCell className="text-xs">{t.month}</TableCell>
                            <TableCell className="text-xs">{Number(t.value)}%</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => deleteTrendMutation.mutate(t.id)}
                                disabled={
                                  deleteTrendMutation.isPending &&
                                  deleteTrendMutation.variables === t.id
                                }
                              >
                                {deleteTrendMutation.isPending &&
                                deleteTrendMutation.variables === t.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <Pagination className="mt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); if (safePage > 1) updateParam("page", String(safePage - 1)); }}
                            className={safePage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                          .map((p, idx, arr) => (
                            <span key={p} className="contents">
                              {idx > 0 && arr[idx - 1] !== p - 1 && (
                                <PaginationItem><PaginationEllipsis /></PaginationItem>
                              )}
                              <PaginationItem>
                                <PaginationLink
                                  href="#"
                                  isActive={p === safePage}
                                  onClick={(e) => { e.preventDefault(); updateParam("page", p === 1 ? null : String(p)); }}
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            </span>
                          ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); if (safePage < totalPages) updateParam("page", String(safePage + 1)); }}
                            className={safePage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No UDS data yet. Add entries above or import a CSV.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Team ─── */}
        <TabsContent value="team" className="space-y-6 mt-6">
          <TeamInviteSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
