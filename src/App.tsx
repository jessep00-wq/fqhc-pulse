import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import EvidenceBinderOverview from "./pages/evidence-binder/Overview";
import EvidenceBinderCategoryDetail from "./pages/evidence-binder/CategoryDetail";
import AuditBinder from "./pages/AuditBinder";
import QIReportsList from "./pages/qi-reports/QIReportsList";
import QIReportWizard from "./pages/qi-reports/QIReportWizard";
import QIReportDetail from "./pages/qi-reports/QIReportDetail";
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
import Pricing from "./pages/Pricing";
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

// Features (consolidated single page)
import Features from "./pages/Features";
import NetworkDashboard from "./pages/NetworkDashboard";
import HowItWorks from "./pages/HowItWorks";

// Admin pages
import { AdminRoute } from "./components/AdminRoute";
import { AdminLayout } from "./components/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPipeline from "./pages/admin/AdminPipeline";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminAdoption from "./pages/admin/AdminAdoption";
import AdminAccountDetail from "./pages/admin/AdminAccountDetail";
import AdminReadinessLeads from "./pages/admin/AdminReadinessLeads";

// Store pages
import StoreIndex from "./pages/store/StoreIndex";
import StoreProductDetail from "./pages/store/StoreProductDetail";
import StoreBundleDetail from "./pages/store/StoreBundleDetail";
import StoreSuccess from "./pages/store/StoreSuccess";
import AdminStore from "./pages/admin/AdminStore";
import ManualLanding from "./pages/ManualLanding";
import ManualThankYou from "./pages/ManualThankYou";

// Lead magnets
import ReadinessScore from "./pages/ReadinessScore";

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
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                {/* Persona pages consolidated into homepage anchors */}
                <Route path="/for/qi-directors" element={<Navigate to="/#for-qi-directors" replace />} />
                <Route path="/for/pcmh-coordinators" element={<Navigate to="/#for-pcmh-coordinators" replace />} />
                <Route path="/for/operations-managers" element={<Navigate to="/#for-operations-managers" replace />} />
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

                {/* Features (single page with hash anchors; old slugs redirect for SEO) */}
                <Route path="/features" element={<Features />} />
                <Route path="/features/pdsa-cycle-manager" element={<Navigate to="/features#pdsa" replace />} />
                <Route path="/features/uds-tracking" element={<Navigate to="/features#uds-tracking" replace />} />
                <Route path="/features/hrsa-audit-binder" element={<Navigate to="/features#audit-binder" replace />} />
                <Route path="/features/spc-charts" element={<Navigate to="/features#spc-charts" replace />} />
                <Route path="/features/pcmh-evidence" element={<Navigate to="/features#pcmh-evidence" replace />} />

                {/* Store */}
                <Route path="/store" element={<StoreIndex />} />
                <Route path="/store/success" element={<StoreSuccess />} />
                <Route path="/store/bundle/:slug" element={<StoreBundleDetail />} />
                <Route path="/store/:slug" element={<StoreProductDetail />} />

                {/* Standalone watermarked-manual sales flow */}
                <Route path="/manual" element={<ManualLanding />} />
                <Route path="/manual/thank-you" element={<ManualThankYou />} />

                {/* Lead magnets */}
                <Route path="/readiness" element={<ReadinessScore />} />

                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <AdminLayout>
                        <ErrorBoundary>
                          <Routes>
                            <Route index element={<AdminOverview />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="pipeline" element={<AdminPipeline />} />
                            <Route path="billing" element={<AdminBilling />} />
                            <Route path="adoption" element={<AdminAdoption />} />
                            <Route path="store" element={<AdminStore />} />
                            <Route path="readiness" element={<AdminReadinessLeads />} />
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
                            <Route path="evidence-binder" element={<EvidenceBinderOverview />} />
                            <Route path="evidence-binder/category/:slug" element={<EvidenceBinderCategoryDetail />} />
                            <Route path="audit-binder" element={<AuditBinder />} />
                            <Route path="qi-reports" element={<QIReportsList />} />
                            <Route path="qi-reports/new" element={<QIReportWizard />} />
                            <Route path="qi-reports/:id" element={<QIReportDetail />} />
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
