import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { X } from "lucide-react";

export interface PdsaFilterState {
  measure: string;
  role: string;
  stalledOnly: boolean;
  sort: "newest" | "oldest" | "due";
}

interface Props {
  measures: string[];
  roles: string[];
  value: PdsaFilterState;
  onChange: (next: Partial<PdsaFilterState>) => void;
  onClear: () => void;
}

export function PDSAFilters({ measures, roles, value, onChange, onClear }: Props) {
  const dirty =
    value.measure !== "all" ||
    value.role !== "all" ||
    value.stalledOnly ||
    value.sort !== "newest";

  // Audit fix 34: fixed widths overflow narrow viewports — make each
  // control full-width on mobile and capped at the previous fixed width
  // on sm+.
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2">
      <Select value={value.measure} onValueChange={(v) => onChange({ measure: v })}>
        <SelectTrigger className="h-8 w-full sm:w-[180px] text-xs">
          <SelectValue placeholder="CMS measure" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All measures</SelectItem>
          {measures.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.role} onValueChange={(v) => onChange({ role: v })}>
        <SelectTrigger className="h-8 w-full sm:w-[160px] text-xs">
          <SelectValue placeholder="Assigned role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          {roles.map((r) => (
            <SelectItem key={r} value={r}>
              {r}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Toggle
        pressed={value.stalledOnly}
        onPressedChange={(v) => onChange({ stalledOnly: v })}
        size="sm"
        className="h-8 text-xs data-[state=on]:bg-warning/15 data-[state=on]:text-warning"
        aria-label="Show stalled cycles only"
      >
        Stalled only
      </Toggle>

      <Select
        value={value.sort}
        onValueChange={(v) => onChange({ sort: v as PdsaFilterState["sort"] })}
      >
        <SelectTrigger className="h-8 w-full sm:w-[150px] text-xs sm:ml-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
          <SelectItem value="due">Due soonest</SelectItem>
        </SelectContent>
      </Select>

      {dirty && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>
          <X className="h-3 w-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}
