import type { OrgViewFilter as FilterType } from "@/hooks/useAdminOrgs";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  value: FilterType;
  onChange: (v: FilterType) => void;
}

export function OrgViewFilter({ value, onChange }: Props) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as FilterType)}>
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="archived">Archived</TabsTrigger>
        <TabsTrigger value="all">All</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
