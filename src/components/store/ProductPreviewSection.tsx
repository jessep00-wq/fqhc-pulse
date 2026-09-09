import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, ImageIcon, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  images: string[];
  sampleFileUrl?: string | null;
  productSlug: string;
}

/**
 * PDP preview block: page thumbnails plus an email-gated free sample download.
 * Renders nothing when the product has neither previews nor a sample file.
 */
export function ProductPreviewSection({ images, sampleFileUrl, productSlug }: Props) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const thumbs = (images ?? []).filter(Boolean);
  const hasSample = !!sampleFileUrl;
  if (thumbs.length === 0 && !hasSample) return null;

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("store_waitlist_signups").insert({
      email: value,
      product_slug: productSlug,
      intent: "sample",
    });
    setSaving(false);
    if (error) {
      toast.error("Something went wrong. Try again.");
      return;
    }
    setUnlocked(true);
    if (sampleFileUrl) window.open(sampleFileUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
        <ImageIcon className="h-5 w-5 text-primary" /> Preview
      </h2>

      {thumbs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {thumbs.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setZoom(url)}
              className="group relative overflow-hidden rounded-lg border bg-muted aspect-[4/3] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={url}
                alt="Sample page from this template"
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {hasSample && (
        <div className="mt-4 rounded-lg border bg-muted/40 p-4">
          {unlocked ? (
            <div className="space-y-2">
              <p className="text-sm font-medium inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" /> Your sample is downloading.
              </p>
              <a
                href={sampleFileUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline underline-offset-2"
              >
                Download it again
              </a>
            </div>
          ) : (
            <form onSubmit={submitEmail} className="space-y-2">
              <p className="text-sm font-medium">Download a free 3-page sample</p>
              <p className="text-xs text-muted-foreground">
                Enter your work email and we'll open the sample right away.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@healthcenter.org"
                  aria-label="Work email for the free sample"
                  className="sm:flex-1"
                />
                <Button type="submit" variant="outline" disabled={saving} className="shrink-0">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" /> Get the sample
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      <Dialog open={!!zoom} onOpenChange={(v) => !v && setZoom(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background">
          <DialogTitle className="sr-only">Template page preview</DialogTitle>
          <DialogDescription className="sr-only">Enlarged preview of a page from this template.</DialogDescription>
          {zoom && <img src={zoom} alt="Enlarged sample page" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
