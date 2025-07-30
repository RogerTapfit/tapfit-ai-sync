import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Capacitor } from '@capacitor/core';
import { nfcService } from "./services/nfcService";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WorkoutList from "./pages/WorkoutList";
import WorkoutDetail from "./pages/WorkoutDetail";
import WorkoutSummary from "./pages/WorkoutSummary";
import WorkoutPlans from "./pages/WorkoutPlans";
import WorkoutPlan from "./pages/WorkoutPlan";
import MachineAccess from "./pages/MachineAccess";
import { AuthGuard } from "./components/AuthGuard";

const queryClient = new QueryClient();

const NFCHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const initNFC = async () => {
      try {
        const isAvailable = await nfcService.isNFCAvailable();
        if (isAvailable) {
          await nfcService.startNFCListening((data) => {
            // Automatically navigate to machine when NFC tag is detected
            navigate(`/machine/${data.machineId}`);
          });
        }
      } catch (error) {
        console.warn('Failed to initialize NFC:', error);
      }
    };

    initNFC();

    return () => {
      nfcService.stopNFCListening();
    };
  }, [navigate]);

  return null;
};

const App = () => {
  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();
  
  console.log('📱 App: Starting TapFit application...');
  console.log('📱 Platform:', platform);
  console.log('📱 Is Native:', isNative);
  console.log('📱 User Agent:', navigator.userAgent);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <NFCHandler />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <AuthGuard fallback={<Auth />}>
                <Index />
              </AuthGuard>
            } />
            <Route path="/workout-list" element={
              <AuthGuard fallback={<Auth />}>
                <WorkoutList />
              </AuthGuard>
            } />
            <Route path="/workout/:workoutId" element={
              <AuthGuard fallback={<Auth />}>
                <WorkoutDetail />
              </AuthGuard>
            } />
            <Route path="/workout-summary" element={
              <AuthGuard fallback={<Auth />}>
                <WorkoutSummary />
              </AuthGuard>
            } />
            <Route path="/workout-plans" element={
              <AuthGuard fallback={<Auth />}>
                <WorkoutPlans />
              </AuthGuard>
            } />
            <Route path="/workout-plan" element={
              <AuthGuard fallback={<Auth />}>
                <WorkoutPlan />
              </AuthGuard>
            } />
            <Route path="/machine/:machineId" element={
              <AuthGuard fallback={<Auth />}>
                <MachineAccess />
              </AuthGuard>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
