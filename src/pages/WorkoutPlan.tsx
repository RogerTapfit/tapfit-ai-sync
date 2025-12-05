import EnhancedWorkoutPlanDashboard from "@/components/EnhancedWorkoutPlanDashboard";
import { usePageContext } from '@/hooks/usePageContext';

const WorkoutPlan = () => {
  // Register page context for chatbot
  usePageContext({
    pageName: 'Workout Plan',
    pageDescription: 'AI-generated personalized workout plan with exercises, sets, reps, and rest times',
    visibleContent: 'View your personalized workout plan with daily exercises tailored to your fitness level and goals. Generate new plans or modify existing ones.'
  });

  return <EnhancedWorkoutPlanDashboard />;
};

export default WorkoutPlan;