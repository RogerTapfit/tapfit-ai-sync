import { Avatar } from '@readyplayerme/visage';

// ReadyPlayerMe configuration
export const RPM_CONFIG = {
  subdomain: 'tapfit',
  bodyType: 'fullbody',
  quickStart: false,
  clearCache: false,
  language: 'en',
  avatarApiUrl: 'https://models.readyplayer.me/v1/avatars',
  // TapFit custom configuration
  theme: {
    primary: 'hsl(0, 84%, 60%)', // TapFit red
    secondary: 'hsl(0, 0%, 15%)', // Dark
    accent: 'hsl(0, 100%, 70%)', // Bright accent
  }
};

// Avatar customization options for fitness theme
export const FITNESS_CUSTOMIZATIONS = {
  bodyTypes: [
    { id: 'athletic', name: 'Athletic Build', description: 'Well-rounded fitness physique' },
    { id: 'lean', name: 'Lean Runner', description: 'Slim and agile build' },
    { id: 'muscular', name: 'Strength Athlete', description: 'Muscular and powerful' },
    { id: 'compact', name: 'Compact Fighter', description: 'Short and stocky build' },
    { id: 'tall', name: 'Basketball Player', description: 'Tall and lengthy physique' }
  ],
  
  colorSchemes: [
    {
      id: 'tapfit_red',
      name: 'TapFit Red',
      primary: 'hsl(0, 84%, 60%)',
      secondary: 'hsl(0, 0%, 15%)',
      accent: 'hsl(0, 100%, 70%)'
    },
    {
      id: 'electric_blue',
      name: 'Electric Blue',
      primary: 'hsl(220, 84%, 60%)',
      secondary: 'hsl(220, 20%, 20%)',
      accent: 'hsl(220, 100%, 80%)'
    },
    {
      id: 'cyber_green',
      name: 'Cyber Green',
      primary: 'hsl(120, 84%, 50%)',
      secondary: 'hsl(120, 20%, 15%)',
      accent: 'hsl(120, 100%, 70%)'
    },
    {
      id: 'neon_purple',
      name: 'Neon Purple',
      primary: 'hsl(280, 84%, 60%)',
      secondary: 'hsl(280, 20%, 20%)',
      accent: 'hsl(280, 100%, 80%)'
    }
  ],
  
  accessories: [
    { id: 'fitness_tracker', name: 'Fitness Tracker', category: 'wearable', cost: 50 },
    { id: 'gym_headphones', name: 'Wireless Headphones', category: 'audio', cost: 75 },
    { id: 'protein_shaker', name: 'Protein Shaker', category: 'equipment', cost: 25 },
    { id: 'gym_towel', name: 'Gym Towel', category: 'equipment', cost: 15 },
    { id: 'resistance_bands', name: 'Resistance Bands', category: 'equipment', cost: 40 },
    { id: 'yoga_mat', name: 'Yoga Mat', category: 'equipment', cost: 35 },
    { id: 'dumbbell_set', name: 'Dumbbells', category: 'equipment', cost: 100 },
    { id: 'compression_gear', name: 'Compression Gear', category: 'clothing', cost: 80 }
  ],
  
  expressions: [
    { id: 'motivated', name: 'Motivated', description: 'Ready to crush the workout' },
    { id: 'celebrating', name: 'Celebrating', description: 'Victory after achievement' },
    { id: 'focused', name: 'Focused', description: 'Deep concentration mode' },
    { id: 'resting', name: 'Resting', description: 'Recovery between sets' },
    { id: 'determined', name: 'Determined', description: 'Push through the pain' },
    { id: 'confident', name: 'Confident', description: 'Feeling strong and capable' }
  ]
};

// ReadyPlayerMe avatar creation interface
export interface ReadyPlayerMeAvatar {
  id: string;
  modelUrl: string;
  imageUrl: string;
  customizations: {
    bodyType: string;
    colorScheme: string;
    accessories: string[];
    expressions: string[];
  };
  metadata: {
    createdAt: Date;
    lastModified: Date;
    fitnessLevel: number;
    achievements: string[];
  };
}

// Avatar creation service
export class ReadyPlayerMeService {
  private static instance: ReadyPlayerMeService;
  
  static getInstance(): ReadyPlayerMeService {
    if (!ReadyPlayerMeService.instance) {
      ReadyPlayerMeService.instance = new ReadyPlayerMeService();
    }
    return ReadyPlayerMeService.instance;
  }
  
  // Create new fitness avatar
  async createFitnessAvatar(customizations: {
    bodyType: string;
    colorScheme: string;
    accessories: string[];
    expressions: string[];
    gender?: 'male' | 'female';
  }): Promise<ReadyPlayerMeAvatar | null> {
    try {
      // This would integrate with actual ReadyPlayerMe API
      // For demo purposes, we'll simulate the avatar creation
      const avatarId = `rpm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const avatar: ReadyPlayerMeAvatar = {
        id: avatarId,
        modelUrl: `https://models.readyplayer.me/v1/avatars/${avatarId}.glb`,
        imageUrl: `https://models.readyplayer.me/v1/avatars/${avatarId}.png`,
        customizations,
        metadata: {
          createdAt: new Date(),
          lastModified: new Date(),
          fitnessLevel: 1,
          achievements: []
        }
      };
      
      return avatar;
    } catch (error) {
      console.error('Error creating ReadyPlayerMe avatar:', error);
      return null;
    }
  }
  
  // Update avatar customizations
  async updateAvatarCustomizations(
    avatarId: string, 
    updates: Partial<ReadyPlayerMeAvatar['customizations']>
  ): Promise<ReadyPlayerMeAvatar | null> {
    try {
      // This would call ReadyPlayerMe API to update the avatar
      // For demo, we'll simulate the update
      console.log(`Updating avatar ${avatarId} with:`, updates);
      
      // Return updated avatar data
      return await this.getAvatar(avatarId);
    } catch (error) {
      console.error('Error updating avatar customizations:', error);
      return null;
    }
  }
  
  // Get avatar by ID
  async getAvatar(avatarId: string): Promise<ReadyPlayerMeAvatar | null> {
    try {
      // This would fetch from ReadyPlayerMe API
      // For demo, we'll return a mock avatar
      const avatar: ReadyPlayerMeAvatar = {
        id: avatarId,
        modelUrl: `https://models.readyplayer.me/v1/avatars/${avatarId}.glb`,
        imageUrl: `https://models.readyplayer.me/v1/avatars/${avatarId}.png`,
        customizations: {
          bodyType: 'athletic',
          colorScheme: 'tapfit_red',
          accessories: ['fitness_tracker', 'gym_headphones'],
          expressions: ['motivated', 'focused']
        },
        metadata: {
          createdAt: new Date(),
          lastModified: new Date(),
          fitnessLevel: 5,
          achievements: ['first_workout', 'week_streak', 'month_milestone']
        }
      };
      
      return avatar;
    } catch (error) {
      console.error('Error getting avatar:', error);
      return null;
    }
  }
  
  // Generate avatar thumbnail for NFT
  async generateAvatarThumbnail(avatarId: string, size: number = 512): Promise<string | null> {
    try {
      // This would use ReadyPlayerMe's image generation API
      const thumbnailUrl = `https://models.readyplayer.me/v1/avatars/${avatarId}.png?width=${size}&height=${size}`;
      return thumbnailUrl;
    } catch (error) {
      console.error('Error generating avatar thumbnail:', error);
      return null;
    }
  }
  
  // Get customization options with pricing
  getCustomizationOptions() {
    return FITNESS_CUSTOMIZATIONS;
  }
  
  // Check if customization requires premium
  isCustomizationPremium(customizationId: string): boolean {
    // Basic customizations are free, premium ones cost TapTokens
    const freeCustomizations = [
      'athletic', 'tapfit_red', 'motivated', 'focused',
      'fitness_tracker', 'gym_towel'
    ];
    
    return !freeCustomizations.includes(customizationId);
  }
  
  // Get customization cost in TapTokens
  getCustomizationCost(customizationId: string): number {
    const accessory = FITNESS_CUSTOMIZATIONS.accessories.find(a => a.id === customizationId);
    if (accessory) {
      return accessory.cost;
    }
    
    // Color schemes and expressions cost
    const premiumColorSchemes = ['electric_blue', 'cyber_green', 'neon_purple'];
    const premiumExpressions = ['celebrating', 'confident', 'determined'];
    
    if (premiumColorSchemes.includes(customizationId)) return 100;
    if (premiumExpressions.includes(customizationId)) return 50;
    
    return 0;
  }
}

// Export singleton instance
export const readyPlayerMeService = ReadyPlayerMeService.getInstance();