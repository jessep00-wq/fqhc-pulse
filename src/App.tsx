import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrgProvider } from "@/contexts/OrgContext";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import PDSALab from "./pages/PDSALab";
import PlaybookLibrary from "./pages/PlaybookLibrary";
import AIAssistant from "./pages/AIAssistant";
import StaffTasks from "./pages/StaffTasks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OrgProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pdsa-lab" element={<PDSALab />} />
              <Route path="/playbooks" element={<PlaybookLibrary />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/staff-tasks" element={<StaffTasks />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </OrgProvider>
  </QueryClientProvider>
);

export default App;
