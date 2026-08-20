import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PostHogPageView } from "@/components/PostHogPageView";
import { RouteFallback } from "@/components/RouteFallback";

// Landing stays eager — it's the LCP page and root entry
import Landing from "./pages/Landing";

// Lazy-load everything else to trim the initial bundle
const Index = lazy(() => import("./pages/Index"));
const PDSALab = lazy(() => import("./pages/PDSALab"));
const PlaybookLibrary = lazy(() => import("./pages/PlaybookLibrary"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const StaffTasks = lazy(() => import("./pages/StaffTasks"));
const Settings = lazy(() => import("./pages/Settings"));
const AIGovernance = lazy(() => import("./pages/AIGovernance"));
const AuditBinder = lazy(() => import("./pages/AuditBinder"));
const QIReportsList = lazy(() => import("./pages/qi-reports/QIReportsList"));
const QIReportWizard = lazy(() => import("./pages/qi-reports/QIReportWizard"));
const QIReportDetail = lazy(() => import("./pages/qi-reports/QIReportDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const Security = lazy(() => import("./pages/Security"));
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const PublicDemo = lazy(() => import("./pages/PublicDemo"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Status = lazy(() => import("./pages/Status"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const Features = lazy(() => import("./pages/Features"));
const NetworkDashboard = lazy(() => import("./pages/NetworkDashboard"));

const AdminRoute = lazy(() => import("./components/AdminRoute").then(m => ({ default: m.AdminRoute })));
const AdminLayout = lazy(() => import("./components/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminBilling = lazy(() => import("./pages/admin/AdminBilling"));
const AdminAdoption = lazy(() => import("./pages/admin/AdminAdoption"));
const AdminAccountDetail = lazy(() => import("./pages/admin/AdminAccountDetail"));
const AdminReadinessLeads = lazy(() => import("./pages/admin/AdminReadinessLeads"));
const AdminEmailHealth = lazy(() => import("./pages/admin/AdminEmailHealth"));

const StoreIndex = lazy(() => import("./pages/store/StoreIndex"));
const StoreProductDetail = lazy(() => import("./pages/store/StoreProductDetail"));
const StoreBundleDetail = lazy(() => import("./pages/store/StoreBundleDetail"));
const StoreSuccess = lazy(() => import("./pages/store/StoreSuccess"));
const AdminStore = lazy(() => import("./pages/admin/AdminStore"));
const ManualLanding = lazy(() => import("./pages/ManualLanding"));
const ManualThankYou = lazy(() => import("./pages/ManualThankYou"));

const ReadinessScore = lazy(() => import("./pages/ReadinessScore"));

// Tab-focus must never trigger a refetch/loading flash: returning to the tab
// should feel like un-pausing, not reloading. Data refreshes on explicit
// invalidation after mutations, or once it is genuinely stale.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <OrgProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ScrollToTop />
            <PostHogPageView />
            <ErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/invite/:token" element={<AcceptInvite />} />
                {/* Persona pages consolidated into homepage anchors */}
                <Route path="/for/qi-directors" element={<Navigate to="/#for-qi-directors" replace />} />
                <Route path="/for/pcmh-coordinators" element={<Navigate to="/#for-compliance-leads" replace />} />
                <Route path="/for/operations-managers" element={<Navigate to="/#for-operations-managers" replace />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/how-it-works" element={<Navigate to="/#how-it-works" replace />} />
                <Route path="/status" element={<Status />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/security" element={<Security />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/demo" element={<PublicDemo />} />

                {/* Features (single page with hash anchors; old slugs redirect for SEO) */}
                <Route path="/features" element={<Features />} />
                <Route path="/features/pdsa-cycle-manager" element={<Navigate to="/features#pdsa" replace />} />
                <Route path="/features/uds-tracking" element={<Navigate to="/features#uds-tracking" replace />} />
                <Route path="/features/hrsa-audit-binder" element={<Navigate to="/features#audit-binder" replace />} />
                <Route path="/features/spc-charts" element={<Navigate to="/features#spc-charts" replace />} />
                <Route path="/features/pcmh-evidence" element={<Navigate to="/features" replace />} />

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
                          <Suspense fallback={<RouteFallback />}>
                            <Routes>
                              <Route index element={<AdminOverview />} />
                              <Route path="users" element={<AdminUsers />} />
                              <Route path="billing" element={<AdminBilling />} />
                              <Route path="adoption" element={<AdminAdoption />} />
                              <Route path="store" element={<AdminStore />} />
                              <Route path="readiness" element={<AdminReadinessLeads />} />
                              <Route path="account/:orgId" element={<AdminAccountDetail />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
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
                          <Suspense fallback={<RouteFallback />}>
                            <Routes>
                              <Route index element={<Index />} />
                              <Route path="pdsa-lab" element={<PDSALab />} />
                              <Route path="network" element={<NetworkDashboard />} />
                              <Route path="playbooks" element={<PlaybookLibrary />} />
                              <Route path="ai-assistant" element={<AIAssistant />} />
                              <Route path="staff-tasks" element={<StaffTasks />} />
                              <Route path="ai-governance" element={<AIGovernance />} />
                              <Route path="audit-binder" element={<AuditBinder />} />
                              <Route path="qi-reports" element={<QIReportsList />} />
                              <Route path="qi-reports/new" element={<QIReportWizard />} />
                              <Route path="qi-reports/:id" element={<QIReportDetail />} />
                              <Route path="settings" element={<Settings />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>
                        </ErrorBoundary>
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </TooltipProvider>
        </OrgProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
