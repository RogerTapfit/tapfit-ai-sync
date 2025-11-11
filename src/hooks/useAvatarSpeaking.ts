import { create } from 'zustand';

interface AvatarSpeakingState {
  isSpeaking: boolean;
  avatarName: string | null;
  setIsSpeaking: (speaking: boolean, avatarName?: string) => void;
}

export const useAvatarSpeaking = create<AvatarSpeakingState>((set) => ({
  isSpeaking: false,
  avatarName: null,
  setIsSpeaking: (speaking: boolean, avatarName?: string) => 
    set({ isSpeaking: speaking, avatarName: speaking ? avatarName || null : null }),
}));
