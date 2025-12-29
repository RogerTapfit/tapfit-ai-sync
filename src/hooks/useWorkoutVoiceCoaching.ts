import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkoutVoiceCoachingState {
  isEnabled: boolean;
  toggleEnabled: () => void;
  setEnabled: (enabled: boolean) => void;
}

/**
 * Persisted state for workout voice coaching toggle.
 * When enabled, the AI coach will give motivational feedback after each set.
 */
export const useWorkoutVoiceCoaching = create<WorkoutVoiceCoachingState>()(
  persist(
    (set) => ({
      isEnabled: false, // Off by default - not annoying
      toggleEnabled: () => set((state) => ({ isEnabled: !state.isEnabled })),
      setEnabled: (enabled: boolean) => set({ isEnabled: enabled }),
    }),
    {
      name: 'workout-voice-coaching-storage',
    }
  )
);
