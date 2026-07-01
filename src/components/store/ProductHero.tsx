import {
  FileText,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  Users,
  Layers,
  Package,
  BookOpen,
  Stethoscope,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  FileText,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  Users,
  Layers,
  Package,
  BookOpen,
  Stethoscope,
  Building2,
};

export const HERO_ICON_OPTIONS = Object.keys(ICONS);

type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-10 w-10 rounded-md",
  md: "h-14 w-14 rounded-lg",
  lg: "h-20 w-20 rounded-xl",
};

const ICON_SIZE: Record<Size, string> = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

interface Props {
  imageUrl?: string | null;
  icon?: string | null;
  fallbackIcon?: keyof typeof ICONS;
  size?: Size;
  alt?: string;
  className?: string;
}

/**
 * Store product/bundle hero tile. Renders an uploaded cover image when
 * provided, otherwise a branded Lucide icon inside a teal-tinted tile.
 * Replaces the previous emoji-based hero placeholder.
 */
export function ProductHero({
  imageUrl,
  icon,
  fallbackIcon = "FileText",
  size = "md",
  alt = "",
  className,
}: Props) {
  if (imageUrl) {
    return (
      <div
        className={cn(
          "overflow-hidden bg-muted shrink-0",
          SIZE_CLASS[size],
          className,
        )}
      >
        <img src={imageUrl} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }
  const IconComp = (icon && ICONS[icon]) || ICONS[fallbackIcon];
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-primary/10 text-primary shrink-0 ring-1 ring-primary/15",
        SIZE_CLASS[size],
        className,
      )}
    >
      <IconComp className={ICON_SIZE[size]} />
    </div>
  );
}
