import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSites } from "@/hooks/useSites";

export const NO_SITE = "__no_site__";

/**
 * Optional site tag. Renders nothing for organizations that have not created
 * any sites, so single-site health centers never see the extra field.
 */
export function SiteSelect({
  value,
  onChange,
  label = "Site",
  helpText,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  helpText?: string;
}) {
  const { sites } = useSites();
  if (sites.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>
        {label} <span className="text-muted-foreground font-normal">(optional)</span>
      </Label>
      <Select value={value || NO_SITE} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="All sites" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_SITE}>Not site-specific</SelectItem>
          {sites.map((s) => (
            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  );
}
