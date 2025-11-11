import { LiveExerciseTracker } from '@/components/LiveExerciseTracker';
import SEO from '@/components/SEO';

export default function LiveWorkout() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <SEO 
        title="Live Exercise Tracker | AI Form Analysis"
        description="Track your bodyweight exercises in real-time with AI-powered form feedback and rep counting"
      />
      <LiveExerciseTracker />
    </div>
  );
}
