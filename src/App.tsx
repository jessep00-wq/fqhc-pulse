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
import AIGovernance from "./pages/AIGovernance";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import Security from "./pages/Security";
import Contact from "./pages/Contact";
import CaseStudies from "./pages/CaseStudies";
import CaseStudyRedirect from "./pages/CaseStudyRedirect";
import About from "./pages/About";
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
import NetworkDashboard from "./pages/NetworkDashboard";
import HowItWorks from "./pages/HowItWorks";

// Admin pages
import { AdminRoute } from "./components/AdminRoute";
import { AdminLayout } from "./components/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminPipeline from "./pages/admin/AdminPipeline";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminAdoption from "./pages/admin/AdminAdoption";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminAccountDetail from "./pages/admin/AdminAccountDetail";
import AdminBlog from "./pages/admin/AdminBlog";

// Newsletter pages
import NewsletterIndex from "./pages/NewsletterIndex";
import NewsletterDetail from "./pages/NewsletterDetail";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe";

// Store pages
import StoreIndex from "./pages/store/StoreIndex";
import StoreProductDetail from "./pages/store/StoreProductDetail";
import StoreBundleDetail from "./pages/store/StoreBundleDetail";
import StoreSuccess from "./pages/store/StoreSuccess";
import AdminStore from "./pages/admin/AdminStore";
import ManualLanding from "./pages/ManualLanding";
import ManualThankYou from "./pages/ManualThankYou";

// Waitlist
import WaitlistLanding from "./pages/waitlist/WaitlistLanding";
import WaitlistApply from "./pages/waitlist/WaitlistApply";
import WaitlistThankYou from "./pages/waitlist/WaitlistThankYou";




// Blog pages
import BlogIndex from "./pages/blog/BlogIndex";
import BlogPDSAGuide from "./pages/blog/BlogPDSAGuide";
import BlogUDSMeasures2026 from "./pages/blog/BlogUDSMeasures2026";
import BlogHRSAChecklist from "./pages/blog/BlogHRSAChecklist";
import BlogQICulture from "./pages/blog/BlogQICulture";
import BlogPostDynamic from "./pages/blog/BlogPostDynamic";

// Resource cornerstones (SEO moat)
import UDSAlignedPDSA from "./pages/resources/UDSAlignedPDSA";
import HRSAReadyQIDocumentation from "./pages/resources/HRSAReadyQIDocumentation";
import FQHCQualityImprovementEvidence from "./pages/resources/FQHCQualityImprovementEvidence";
import AthenaOneDocumentationWorkflows from "./pages/resources/AthenaOneDocumentationWorkflows";
import SPCChartsForUDSMeasures from "./pages/resources/SPCChartsForUDSMeasures";
import AuditBinderExports from "./pages/resources/AuditBinderExports";
import QualityCommitteeProof from "./pages/resources/QualityCommitteeProof";
import SpreadsheetReplacementQITracking from "./pages/resources/SpreadsheetReplacementQITracking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ScrollToTop />
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
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/status" element={<Status />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/security" element={<Security />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/case-studies" element={<CaseStudies />} />
                <Route path="/case-studies/:slug" element={<CaseStudyRedirect />} />

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
                <Route path="/blog/:slug" element={<BlogPostDynamic />} />

                {/* Resource cornerstones (UDS-aligned PDSA SEO moat) */}
                <Route path="/resources/uds-aligned-pdsa" element={<UDSAlignedPDSA />} />
                <Route path="/resources/hrsa-ready-qi-documentation" element={<HRSAReadyQIDocumentation />} />
                <Route path="/resources/fqhc-quality-improvement-evidence" element={<FQHCQualityImprovementEvidence />} />
                <Route path="/resources/athenaone-documentation-workflows" element={<AthenaOneDocumentationWorkflows />} />
                <Route path="/resources/spc-charts-for-uds-measures" element={<SPCChartsForUDSMeasures />} />
                <Route path="/resources/audit-binder-exports" element={<AuditBinderExports />} />
                <Route path="/resources/quality-committee-proof" element={<QualityCommitteeProof />} />
                <Route path="/resources/spreadsheet-replacement-qi-tracking" element={<SpreadsheetReplacementQITracking />} />

                {/* Newsletter */}
                <Route path="/newsletter" element={<NewsletterIndex />} />
                <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
                <Route path="/newsletter/:slug" element={<NewsletterDetail />} />

                {/* Store */}
                <Route path="/store" element={<StoreIndex />} />
                <Route path="/store/success" element={<StoreSuccess />} />
                <Route path="/store/bundle/:slug" element={<StoreBundleDetail />} />
                <Route path="/store/:slug" element={<StoreProductDetail />} />

                {/* Standalone watermarked-manual sales flow */}
                <Route path="/manual" element={<ManualLanding />} />
                <Route path="/manual/thank-you" element={<ManualThankYou />} />

                {/* Waitlist funnel */}
                <Route path="/waitlist" element={<WaitlistLanding />} />
                <Route path="/waitlist/apply" element={<WaitlistApply />} />
                <Route path="/waitlist/thank-you" element={<WaitlistThankYou />} />



                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <ErrorBoundary>
                          <Routes>
                            <Route index element={<AdminOverview />} />
                            <Route path="pipeline" element={<AdminPipeline />} />
                            <Route path="billing" element={<AdminBilling />} />
                            <Route path="adoption" element={<AdminAdoption />} />
                            <Route path="newsletter" element={<AdminNewsletter />} />
                            <Route path="store" element={<AdminStore />} />
                            <Route path="blog" element={<AdminBlog />} />
                            <Route path="account/:orgId" element={<AdminAccountDetail />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </ErrorBoundary>
                      </AdminLayout>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ErrorBoundary>
                          <Routes>
                            <Route index element={<Index />} />
                            <Route path="pdsa-lab" element={<PDSALab />} />
                            <Route path="network" element={<NetworkDashboard />} />
                            <Route path="playbooks" element={<PlaybookLibrary />} />
                            <Route path="ai-assistant" element={<AIAssistant />} />
                            <Route path="staff-tasks" element={<StaffTasks />} />
                            <Route path="ai-governance" element={<AIGovernance />} />
                            <Route path="settings" element={<Settings />} />
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
          </TooltipProvider>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
