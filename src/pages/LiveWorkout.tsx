import { useLocation, useNavigate } from 'react-router-dom';
import { LiveExerciseTracker } from '@/components/LiveExerciseTracker';
import SEO from '@/components/SEO';
import { type ExerciseType } from '@/utils/exerciseDetection';
import { usePageContext } from '@/hooks/usePageContext';
import { PageHeader } from '@/components/PageHeader';

export default function LiveWorkout() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse URL parameters
  const searchParams = new URLSearchParams(location.search);
  const exerciseParam = searchParams.get('exercise') as ExerciseType | null;
  const machineIdParam = searchParams.get('machine');
  const sourceParam = searchParams.get('source');
  
  // Get state from navigation
  const state = location.state as { 
    machineName?: string;
    workoutId?: string;
    aiSelectedImageUrl?: string;
  } | undefined;

  // Register page context for chatbot
  usePageContext({
    pageName: 'Live Workout',
    pageDescription: 'AI-powered live exercise tracking with camera-based form analysis and automatic rep counting',
    visibleContent: `Live exercise tracking${exerciseParam ? ` for ${exerciseParam}` : ''}${state?.machineName ? ` on ${state.machineName}` : ''}. Camera analyzes form in real-time and counts reps automatically.`
  });

  const handleBackToMachine = () => {
    if (state?.workoutId) {
      navigate(`/machine-workout/${state.workoutId}`, {
        state: {
          fromAITracking: true,
          machineId: machineIdParam,
          machineName: state.machineName,
          aiSelectedImageUrl: state.aiSelectedImageUrl
        }
      });
    } else {
      navigate('/workout-list');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Live Workout" />
      <div className="p-4 md:p-8">
        <SEO 
          title="Live Exercise Tracker | AI Form Analysis"
          description="Track your bodyweight exercises in real-time with AI-powered form feedback and rep counting"
        />
        <LiveExerciseTracker 
          preSelectedExercise={exerciseParam || undefined}
          machineName={state?.machineName}
          onBackToMachine={sourceParam === 'scan' && state?.workoutId ? handleBackToMachine : undefined}
          onBackToDashboard={handleBackToDashboard}
        />
      </div>
    </div>
  );
}
