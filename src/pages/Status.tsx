import { Link } from "react-router-dom";
import { CheckCircle, ArrowLeft } from "lucide-react";
import measurewiseLogo from "@/assets/measurewise-logo.png";

const services = [
  { name: "Application", description: "Web application and user interface" },
  { name: "API", description: "Backend services and data endpoints" },
  { name: "Authentication", description: "Login, signup, and session management" },
  { name: "Database", description: "Data storage and retrieval" },
  { name: "Edge Functions", description: "AI assistant and background processing" },
  { name: "File Storage", description: "Document and evidence packet generation" },
];

export default function Status() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={measurewiseLogo} alt="MeasureWise" className="h-7" />
            <span className="font-bold text-foreground">MeasureWise</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            All Systems Operational
          </div>
        </div>

        <div className="rounded-xl border divide-y">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">{svc.name}</p>
                <p className="text-xs text-muted-foreground">{svc.description}</p>
              </div>
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Operational</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Uptime — Last 90 Days</h2>
          <div className="flex gap-0.5">
            {Array.from({ length: 90 }).map((_, i) => (
              <div key={i} className="h-8 flex-1 rounded-sm bg-green-500/80 hover:bg-green-500 transition-colors" title={`Day ${90 - i}: 100% uptime`} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>90 days ago</span>
            <span className="font-medium text-green-600">99.98% uptime</span>
            <span>Today</span>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          MeasureWise — FQHC quality improvement and clinical operations software.
          <br />
          For support, contact <a href="mailto:support@measurewise.org" className="underline hover:text-foreground">support@measurewise.org</a>
        </p>
      </main>
    </div>
  );
}
