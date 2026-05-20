import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ImageIcon } from "lucide-react";

interface PreviewGalleryProps {
  images: string[];
  title?: string;
}

export function PreviewGallery({ images, title = "Preview" }: PreviewGalleryProps) {
  const [open, setOpen] = useState<string | null>(null);
  if (!images || images.length === 0) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-primary" /> {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpen(url)}
            className="group relative overflow-hidden rounded-lg border bg-muted aspect-[4/3] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={url}
              alt="Deliverable preview"
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background">
          <DialogTitle className="sr-only">Deliverable preview</DialogTitle>
          <DialogDescription className="sr-only">Enlarged image preview of the selected deliverable.</DialogDescription>
          {open && <img src={open} alt="Deliverable preview" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
