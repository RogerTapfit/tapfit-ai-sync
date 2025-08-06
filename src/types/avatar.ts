// Avatar type definitions for ReadyPlayerMe integration
export interface AvatarData {
  readyPlayerMeId?: string;
  // Legacy avatar properties for backward compatibility
  shoes?: string;
  outfit?: string;
  accessory?: string | null;
  animation?: string;
  body_type?: string;
  eye_color?: string;
  skin_tone?: string;
  background?: string;
  hair_color?: string;
  hair_style?: string;
  // ReadyPlayerMe specific properties
  modelUrl?: string;
  imageUrl?: string;
  customizations?: {
    bodyType: string;
    colorScheme: string;
    accessories: string[];
    expressions: string[];
  };
  metadata?: {
    createdAt: string;
    lastModified: string;
    fitnessLevel: number;
    achievements: string[];
  };
}