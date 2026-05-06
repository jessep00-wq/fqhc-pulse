import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import PDSALab from "./pages/PDSALab";
import PlaybookLibrary from "./pages/PlaybookLibrary";
import AIAssistant from "./pages/AIAssistant";
import StaffTasks from "./pages/StaffTasks";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Onboarding from "./pages/Onboarding";
import PersonaQIDirector from "./pages/PersonaQIDirector";
import PersonaPCMHCoordinator from "./pages/PersonaPCMHCoordinator";
import PersonaCHCOpsManager from "./pages/PersonaCHCOpsManager";
import Pricing from "./pages/Pricing";
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";

// Feature pages
import FeaturePDSA from "./pages/features/FeaturePDSA";
import FeatureUDSTracking from "./pages/features/FeatureUDSTracking";
import FeatureHRSAAuditBinder from "./pages/features/FeatureHRSAAuditBinder";
import FeatureSPCCharts from "./pages/features/FeatureSPCCharts";
import FeaturePCMHEvidence from "./pages/features/FeaturePCMHEvidence";

// Blog pages
import BlogIndex from "./pages/blog/BlogIndex";
import BlogPDSAGuide from "./pages/blog/BlogPDSAGuide";
import BlogUDSMeasures2026 from "./pages/blog/BlogUDSMeasures2026";
import BlogHRSAChecklist from "./pages/blog/BlogHRSAChecklist";
import BlogQICulture from "./pages/blog/BlogQICulture";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrgProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/for/qi-directors" element={<PersonaQIDirector />} />
                <Route path="/for/pcmh-coordinators" element={<PersonaPCMHCoordinator />} />
                <Route path="/for/operations-managers" element={<PersonaCHCOpsManager />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/status" element={<Status />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />

                {/* Feature pages */}
                <Route path="/features/pdsa-cycle-manager" element={<FeaturePDSA />} />
                <Route path="/features/uds-tracking" element={<FeatureUDSTracking />} />
                <Route path="/features/hrsa-audit-binder" element={<FeatureHRSAAuditBinder />} />
                <Route path="/features/spc-charts" element={<FeatureSPCCharts />} />
                <Route path="/features/pcmh-evidence" element={<FeaturePCMHEvidence />} />

                {/* Blog */}
                <Route path="/blog" element={<BlogIndex />} />
                <Route path="/blog/pdsa-cycle-fqhc-guide" element={<BlogPDSAGuide />} />
                <Route path="/blog/uds-clinical-quality-measures-2026" element={<BlogUDSMeasures2026 />} />
                <Route path="/blog/hrsa-site-visit-checklist" element={<BlogHRSAChecklist />} />
                <Route path="/blog/quality-improvement-fqhc-staff" element={<BlogQICulture />} />

                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ErrorBoundary>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/pdsa-lab" element={<PDSALab />} />
                            <Route path="/playbooks" element={<PlaybookLibrary />} />
                            <Route path="/ai-assistant" element={<AIAssistant />} />
                            <Route path="/staff-tasks" element={<StaffTasks />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </ErrorBoundary>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </OrgProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
