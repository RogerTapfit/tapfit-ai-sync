import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WorkoutList from "./pages/WorkoutList";
import WorkoutDetail from "./pages/WorkoutDetail";
import WorkoutSummary from "./pages/WorkoutSummary";
import { AuthGuard } from "./components/AuthGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
