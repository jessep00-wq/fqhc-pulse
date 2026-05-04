import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import DashboardMock from "./pages/DashboardMock";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrgProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard-mock" element={<DashboardMock />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/for/qi-directors" element={<PersonaQIDirector />} />
              <Route path="/for/pcmh-coordinators" element={<PersonaPCMHCoordinator />} />
              <Route path="/for/operations-managers" element={<PersonaCHCOpsManager />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/pdsa-lab" element={<PDSALab />} />
                        <Route path="/playbooks" element={<PlaybookLibrary />} />
                        <Route path="/ai-assistant" element={<AIAssistant />} />
                        <Route path="/staff-tasks" element={<StaffTasks />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OrgProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
