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

export function getVoiceForGender(gender: string | null | undefined): VoiceOption {
  // Normalize gender
  const normalizedGender = (gender?.toLowerCase() || 'neutral') as ElevenLabsGender;
  
  // Get voice list for gender, fallback to neutral
  const voices = VOICE_MAP[normalizedGender] || VOICE_MAP.neutral;
  
  // Return first voice for that gender
  return voices[0];
}

export function getAllVoicesForGender(gender: string | null | undefined): VoiceOption[] {
  const normalizedGender = (gender?.toLowerCase() || 'neutral') as ElevenLabsGender;
  return VOICE_MAP[normalizedGender] || VOICE_MAP.neutral;
}
