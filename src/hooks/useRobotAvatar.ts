import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTapCoins } from './useTapCoins';

export interface RobotAvatarData {
  // Character selection - now accepts avatar ID from database
  character_type: string;
  
  // Character customization
  base_hue: number; // 0-360 degree hue for color shifting
  character_species: string;
  special_features: string[]; // wings, horns, tail, spots, etc.
  personality_traits: string[]; // fierce, wise, playful, protective, etc.
  
  color_scheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Tech modules and equipment
  tech_modules: string[];
  power_level: number;
  led_patterns: string[];
  energy_core: string;
  
  // Classic avatar properties (backward compatible)
  chassis_type?: string; // for backward compatibility
  body_type: string;
  skin_tone: string;
  hair_style: string;
  hair_color: string;
  eye_color: string;
  outfit: string;
  accessory: string | null;
  shoes: string;
  animation: string;
  background: string;
  
  // Robot-specific features
  visor_type?: string;
  sensor_array?: string[];
  workout_modules?: string[];
  ai_personality?: string;
  
  // Custom character images
  custom_character_images?: Record<string, string>;
}

export const useRobotAvatar = () => {
  const [avatarData, setAvatarData] = useState<RobotAvatarData | null>(null);
  const [loading, setLoading] = useState(true);
  const { purchaseItem, hasPurchased } = useTapCoins();

  useEffect(() => {
    fetchAvatarData();
  }, []);

  const fetchAvatarData = async () => {
    try {
      console.log('🔄 Fetching avatar data...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No authenticated user found');
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('avatar_data')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('📊 Profile data received:', profile);
      
      // Safe type casting for avatar_data
      const avatarDataRaw = profile?.avatar_data as any;
      console.log('🎨 Custom images in profile:', avatarDataRaw?.custom_character_images);

      const defaultRobotAvatar: RobotAvatarData = {
        character_type: "steel_warrior",
        base_hue: 0,
        character_species: "humanoid",
        special_features: ["armor_plating", "led_visor"],
        personality_traits: ["determined", "reliable", "focused"],
        color_scheme: {
          primary: "hsl(0, 84%, 60%)", // TapFit red
          secondary: "hsl(0, 0%, 15%)", // Dark metallic
          accent: "hsl(0, 100%, 70%)" // Bright accent
        },
        tech_modules: ["basic_scanner"],
        power_level: 25,
        led_patterns: ["steady"],
        energy_core: "standard",
        // Backward compatible properties
        chassis_type: "slim_bot", // for migration
        body_type: "robot",
        skin_tone: "metallic",
        hair_style: "none",
        hair_color: "none",
        eye_color: "blue_led",
        outfit: "chassis_armor",
        accessory: "data_port",
        shoes: "hover_boots",
        animation: "power_up",
        background: "tech_lab"
      };
      
      if (profile?.avatar_data && 
          typeof profile.avatar_data === 'object' && 
          !Array.isArray(profile.avatar_data) &&
          profile.avatar_data !== null) {
        // Merge existing data with robot defaults for backward compatibility
        const existingData = profile.avatar_data as any;
        console.log('Existing avatar data:', existingData);
        
        const robotData: RobotAvatarData = {
          ...defaultRobotAvatar,
          ...existingData,
          // Migrate old chassis_type to character_type if needed
          character_type: existingData.character_type || (existingData.chassis_type === 'slim_bot' ? 'steel_warrior' : 'steel_warrior'),
          base_hue: existingData.base_hue || 0,
          character_species: existingData.character_species || 'humanoid',
          special_features: existingData.special_features || ['armor_plating'],
          personality_traits: existingData.personality_traits || ['determined'],
          // Ensure robot-specific properties exist with proper fallbacks
          color_scheme: existingData.color_scheme || defaultRobotAvatar.color_scheme,
          tech_modules: existingData.tech_modules || defaultRobotAvatar.tech_modules,
          power_level: typeof existingData.power_level === 'number' ? existingData.power_level : defaultRobotAvatar.power_level,
          led_patterns: existingData.led_patterns || defaultRobotAvatar.led_patterns,
          energy_core: existingData.energy_core || defaultRobotAvatar.energy_core
        };
        console.log('✅ Merged robot data:', robotData);
        console.log('🎯 Custom images merged:', robotData.custom_character_images);
        setAvatarData(robotData);
      } else {
        console.log('📝 Using default robot avatar');
        setAvatarData(defaultRobotAvatar);
      }
    } catch (error) {
      console.error('Error fetching robot avatar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async (newAvatarData: Partial<RobotAvatarData>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !avatarData) return false;

      const updatedData = { ...avatarData, ...newAvatarData };

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_data: updatedData })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarData(updatedData);
      return true;
    } catch (error) {
      console.error('Error updating robot avatar:', error);
      return false;
    }
  };

  const purchaseRobotItem = async (itemId: string, itemType: string, itemValue: string) => {
    const success = await purchaseItem(itemId);
    if (success) {
      // Handle robot-specific updates
      if (itemType === 'character_type') {
        await updateAvatar({ character_type: itemValue as any });
      } else if (itemType === 'chassis_type') {
        // Legacy support - convert chassis to character
        const characterMap: Record<string, any> = {
          'slim_bot': 'steel_warrior',
          'bulky_bot': 'iron_guardian',
          'agile_bot': 'lightning_cheetah',
          'tall_bot': 'gorilla_guardian',
          'compact_bot': 'cosmic_bunny'
        };
        await updateAvatar({ character_type: characterMap[itemValue] || 'steel_warrior' });
      } else if (itemType === 'base_hue') {
        await updateAvatar({ base_hue: parseInt(itemValue) });
      } else if (itemType === 'tech_module') {
        const currentModules = avatarData?.tech_modules || [];
        await updateAvatar({ tech_modules: [...currentModules, itemValue] });
      } else if (itemType === 'color_scheme') {
        // Parse color scheme from itemValue
        try {
          const colorScheme = JSON.parse(itemValue);
          await updateAvatar({ color_scheme: colorScheme });
        } catch {
          console.error('Invalid color scheme format');
        }
      } else {
        // Handle classic avatar properties
        const updateKey = itemType.replace('avatar_', '') as keyof RobotAvatarData;
        await updateAvatar({ [updateKey]: itemValue } as any);
      }
    }
    return success;
  };

  const canUseItem = (itemName: string, category: string) => {
    // Free robot items
    if (itemName === 'Basic Chassis' || itemName === 'Standard Core' || 
        itemName === 'Power Up Animation' || itemName === 'Tech Lab') {
      return true;
    }
    return hasPurchased(itemName);
  };

  const upgradePowerLevel = async (amount: number) => {
    if (!avatarData) return false;
    
    const newPowerLevel = Math.min(100, avatarData.power_level + amount);
    return await updateAvatar({ power_level: newPowerLevel });
  };

  const equipTechModule = async (module: string) => {
    if (!avatarData) return false;
    
    const currentModules = avatarData.tech_modules || [];
    if (!currentModules.includes(module)) {
      const updatedModules = [...currentModules, module];
      return await updateAvatar({ tech_modules: updatedModules });
    }
    return true;
  };

  const unequipTechModule = async (module: string) => {
    if (!avatarData) return false;
    
    const currentModules = avatarData.tech_modules || [];
    const updatedModules = currentModules.filter(m => m !== module);
    return await updateAvatar({ tech_modules: updatedModules });
  };

  return {
    avatarData,
    loading,
    updateAvatar,
    purchaseRobotItem,
    canUseItem,
    fetchAvatarData,
    upgradePowerLevel,
    equipTechModule,
    unequipTechModule
  };
};