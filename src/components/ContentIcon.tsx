import { cn } from "@/lib/utils";

type Props = {
  imageUrl?: string | null;
  emoji?: string | null;
  size?: number;
  className?: string;
  alt?: string;
};

export function ContentIcon({ imageUrl, emoji, size = 32, className, alt = "" }: Props) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        width={size}
        height={size}
        className={cn("object-cover rounded-md shrink-0", className)}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <span
      className={cn("inline-flex items-center justify-center leading-none shrink-0", className)}
      style={{ fontSize: size * 0.85, width: size, height: size }}
      aria-hidden
    >
      {emoji || "📋"}
    </span>
  );
}
