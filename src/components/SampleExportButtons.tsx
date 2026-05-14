import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, Download, Loader2, ExternalLink } from "lucide-react";

const PDF_URL = "/MeasureWise_Sample_Export.pdf";
const DOCX_URL = "/MeasureWise_Sample_Export.docx";

export function SampleExportButtons() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleDocxDownload = () => {
    setDownloading(true);
    // Small visual delay so the user sees the click registered, then trigger.
    setTimeout(() => {
      const a = document.createElement("a");
      a.href = DOCX_URL;
      a.download = "MeasureWise_Sample_Export.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloading(false);
    }, 250);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Dialog
          open={previewOpen}
          onOpenChange={(open) => {
            setPreviewOpen(open);
            if (!open) setIframeLoaded(false);
          }}
        >
          <DialogTrigger asChild>
            <Button size="lg" variant="outline" className="text-base px-8">
              <Eye className="mr-2 h-4 w-4" /> Preview Sample Export (PDF)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Sample HRSA Audit Binder</DialogTitle>
            </DialogHeader>
            <div className="flex-1 relative bg-muted/30">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Loading PDF preview…</p>
                  </div>
                </div>
              )}
              <iframe
                src={`${PDF_URL}#view=FitH`}
                title="MeasureWise sample audit binder PDF"
                className="w-full h-full"
                onLoad={() => setIframeLoaded(true)}
              />
            </div>
            <DialogFooter className="px-6 py-3 border-t flex flex-col sm:flex-row gap-2 sm:justify-between">
              <p className="text-xs text-muted-foreground sm:max-w-md text-left">
                Sample binder uses fictional data. Actual exports reflect your health center's real QI activity.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={PDF_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in new tab
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href={PDF_URL} download="MeasureWise_Sample_Export.pdf">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </a>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          size="lg"
          variant="outline"
          className="text-base px-8"
          onClick={handleDocxDownload}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {downloading ? "Preparing…" : "Download Sample Export (Word)"}
        </Button>
      </div>
    </>
  );
}
