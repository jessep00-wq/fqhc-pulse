import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContentIcon } from "@/components/ContentIcon";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value: string | null;
  emojiFallback: string;
  onEmojiChange: (e: string) => void;
  onChange: (url: string | null) => void;
  /** "blog" or "newsletter" — used as folder prefix */
  folder: string;
  label?: string;
};

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];
const MAX_BYTES = 1024 * 1024; // 1 MB

export function IconUploader({ value, emojiFallback, onEmojiChange, onChange, folder, label = "Icon" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Use PNG, JPG, WEBP, SVG, or GIF");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 1 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("content-icons")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("content-icons").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Icon uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-3 mt-1">
        <div className="border rounded-md p-1 bg-muted/30">
          <ContentIcon imageUrl={value} emoji={emojiFallback} size={56} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              {value ? "Replace image" : "Upload image"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
                <X className="h-4 w-4 mr-1" /> Remove
              </Button>
            )}
          </div>
          {!value && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Or emoji fallback:</span>
              <Input
                value={emojiFallback}
                onChange={(e) => onEmojiChange(e.target.value)}
                maxLength={4}
                className="w-16 h-8"
              />
            </div>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground mt-1">PNG/JPG/WEBP/SVG, max 1 MB. Square works best.</p>
    </div>
  );
}
