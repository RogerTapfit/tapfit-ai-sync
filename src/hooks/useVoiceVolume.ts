import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VoiceVolumeState {
  volume: number;
  setVolume: (volume: number) => void;
}

export const useVoiceVolume = create<VoiceVolumeState>()(
  persist(
    (set) => ({
      volume: 0.8, // Default 80%
      setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    {
      name: 'voice-volume-storage',
    }
  )
);
