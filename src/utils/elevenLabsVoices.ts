// ElevenLabs voice mapping by gender
export type ElevenLabsGender = 'male' | 'female' | 'neutral';

export interface VoiceOption {
  id: string;
  name: string;
}

const VOICE_MAP: Record<ElevenLabsGender, VoiceOption[]> = {
  female: [
    { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
    { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' }
  ],
  male: [
    { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
    { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
    { id: 'bIHbv24MWmeRgasZH58o', name: 'Will' }
  ],
  neutral: [
    { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River' }
  ]
};

// Avatar-specific voice assignments for unique character voices
const AVATAR_VOICE_OVERRIDES: Record<string, VoiceOption> = {
  // Existing female avatars
  'Tails': { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  'Tygrus': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  // New female avatars with unique voices
  'Aurora': { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  'Ember': { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  'Nova': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  // Feminine robot animal hybrids
  'Luna': { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria' },
  'Siren': { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica' },
  'Velvet': { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  'Pixie': { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily' },
  // Existing male avatars with unique voices
  'Stark': { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  'Petrie': { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  'Night Hawk': { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  'Banjo': { id: 'bIHbv24MWmeRgasZH58o', name: 'Will' },
  'Ceasar': { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  'Reptile': { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  'Rhydon': { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
};

export function getVoiceForGender(gender: string | null | undefined): VoiceOption {
  // Normalize gender
  const normalizedGender = (gender?.toLowerCase() || 'neutral') as ElevenLabsGender;
  
  // Get voice list for gender, fallback to neutral
  const voices = VOICE_MAP[normalizedGender] || VOICE_MAP.neutral;
  
  // Return first voice for that gender
  return voices[0];
}

// Get voice for specific avatar, with fallback to gender-based voice
export function getVoiceForAvatar(avatarName: string | null | undefined, gender: string | null | undefined): VoiceOption {
  // Check for avatar-specific override first
  if (avatarName && AVATAR_VOICE_OVERRIDES[avatarName]) {
    return AVATAR_VOICE_OVERRIDES[avatarName];
  }
  // Fall back to gender-based voice
  return getVoiceForGender(gender);
}

export function getAllVoicesForGender(gender: string | null | undefined): VoiceOption[] {
  const normalizedGender = (gender?.toLowerCase() || 'neutral') as ElevenLabsGender;
  return VOICE_MAP[normalizedGender] || VOICE_MAP.neutral;
}
