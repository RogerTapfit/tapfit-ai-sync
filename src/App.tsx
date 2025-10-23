import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Capacitor } from '@capacitor/core';
import { nfcService } from "./services/nfcService";
import { App as CapacitorApp } from '@capacitor/app';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WorkoutList from "./pages/WorkoutList";
import WorkoutDetail from "./pages/WorkoutDetail";
import WorkoutSummary from "./pages/WorkoutSummary";
import WorkoutPlans from "./pages/WorkoutPlans";
import WorkoutPlan from "./pages/WorkoutPlan";
import MachineAccess from "./pages/MachineAccess";
import MachineWorkout from "./pages/MachineWorkout";
import WorkoutHub from "./pages/WorkoutHub";
import BodyScan from "./pages/BodyScan";
import BodyScanLibrary from "./pages/BodyScanLibrary";
import BodyScanDetail from "./pages/BodyScanDetail";
import AdminReplaceAvatarImage from "./pages/AdminReplaceAvatarImage";
import AvatarSelection from "./pages/AvatarSelection";
import FoodScanner from "./pages/FoodScanner";
import ScanMachine from "./pages/ScanMachine";
import PuckTest from "./pages/PuckTest";
import RunSetup from "./pages/RunSetup";
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

    // Handle deep links
    const handleDeepLink = (url: string) => {
      console.log('Deep link received:', url);
      // Handle both custom scheme and universal links
      if (url.includes('/machine/')) {
        const machineId = url.split('/machine/')[1];
        navigate(`/machine/${machineId}`);
      }
    };

    // Listen for app URL events
    CapacitorApp.addListener('appUrlOpen', (event) => {
      handleDeepLink(event.url);
    });

    initNFC();

    return () => {
      nfcService.stopNFCListening();
      CapacitorApp.removeAllListeners();
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
            <Route path="/machine-workout/:workoutId" element={
              <AuthGuard fallback={<Auth />}>
                <MachineWorkout />
              </AuthGuard>
            } />
            <Route path="/workouts" element={
              <AuthGuard fallback={<Auth />}>
                <WorkoutHub />
              </AuthGuard>
            } />
            <Route path="/body-scan" element={<BodyScan />} />
            <Route path="/body-scans" element={
              <AuthGuard fallback={<Auth />}>
                <BodyScanLibrary />
              </AuthGuard>
            } />
            <Route path="/body-scans/:scanId" element={
              <AuthGuard fallback={<Auth />}>
                <BodyScanDetail />
              </AuthGuard>
            } />
            <Route path="/avatars" element={
              <AuthGuard fallback={<Auth />}>
                <AvatarSelection />
              </AuthGuard>
            } />
            <Route path="/food-scanner" element={
              <AuthGuard fallback={<Auth />}>
                <FoodScanner />
              </AuthGuard>
            } />
            <Route path="/scan-machine" element={
              <AuthGuard fallback={<Auth />}>
                <ScanMachine />
              </AuthGuard>
            } />
            <Route path="/puck-test" element={
              <AuthGuard fallback={<Auth />}>
                <PuckTest />
              </AuthGuard>
            } />
            <Route path="/run/setup" element={
              <AuthGuard fallback={<Auth />}>
                <RunSetup />
              </AuthGuard>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/admin/replace-avatar-image" element={
              <AuthGuard fallback={<Auth />}>
                <AdminReplaceAvatarImage />
              </AuthGuard>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
