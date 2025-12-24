import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playBase64Audio } from '@/lib/audioPlayer';
import { toast } from '@/hooks/use-toast';
import { getDisplayName } from '@/lib/userDisplay';
import { useAvatarSpeaking } from './useAvatarSpeaking';
import { useVoiceVolume } from './useVoiceVolume';

const AVATAR_SAYINGS: Record<string, string[]> = {
  'Stark': [
    "Red means go hard. Let's crush it!",
    "These crimson arms are ready to pump!",
    "Iron body, iron will. You in?",
    "My cyan eyes see a champion. That's you!",
    "Red hot and ready to roll!",
  ],
  'Petrie': [
    "Silver scales, golden gains. Let's fly!",
    "This dino doesn't do lazy. Move it!",
    "Cyan powered and ready to soar!",
    "Ancient wisdom, modern muscles. Let's go!",
    "Roar into action with me!",
  ],
  'Night Hawk': [
    "Midnight blue, maximum effort!",
    "Sharp talons, sharper focus. Ready?",
    "Silent but deadly workouts ahead!",
    "These blue wings only fly forward!",
    "Hunt those gains with me!",
  ],
  'Banjo': [
    "Green light means go time, friend!",
    "This panda packs a punch!",
    "Bear hugs and big gains ahead!",
    "Forest green and fighting fit!",
    "Let's make fitness fun together!",
  ],
  'Tails': [
    "Purple power activated. Let's move!",
    "These tails bring the trails!",
    "Foxes stay foxy. Workout time!",
    "Dark and swift. Keep up!",
    "Shadow speed, real results!",
  ],
  'Tygrus': [
    "Yellow spots, zero stops!",
    "This cat's got claws. Show yours!",
    "Leopard speed, lion heart!",
    "Purple stripes mean business!",
    "Pounce on these gains!",
  ],
  'Ceasar': [
    "Teal tech, total transformation!",
    "Chrome finish, polished workout!",
    "Royal results await, champion!",
    "Silver and smooth. Let's flow!",
    "Precision in every rep!",
  ],
  'Reptile': [
    "Green machine, mean routine!",
    "Scales up, weight up!",
    "Cold blooded, hot workout!",
    "Slither into shape with me!",
    "Lime time is grind time!",
  ],
  'Rhydon': [
    "Red bull, no quit!",
    "These horns point to victory!",
    "Pink power, unstoppable force!",
    "Built like a tank. You next!",
    "Charge through with me!",
  ],
  // New female avatars
  'Aurora': [
    "Ice cold focus, warm heart. Let's flow!",
    "Graceful moves, powerful results!",
    "Find your zen, then find your strength!",
    "Crystal clear goals, diamond hard gains!",
    "Frost and fire in every rep!",
  ],
  'Ember': [
    "Rise from the ashes. Let's burn!",
    "Fire up those muscles!",
    "Phoenix power ignite!",
    "Flames don't rest, neither do we!",
    "Burn bright, burn strong!",
  ],
  'Nova': [
    "Dance among the stars with me!",
    "Cosmic energy flows through you!",
    "Elegant and unstoppable!",
    "Stellar moves, stellar results!",
    "Light up your fitness journey!",
  ],
  // Feminine robot animal hybrids
  'Luna': [
    "Soft steps, strong core. Let's stretch!",
    "Bunny hops to better health!",
    "Pink power, gentle strength!",
    "Hop into your best self!",
    "Cute but fierce. Ready?",
  ],
  'Siren': [
    "Flow like water, strong like waves!",
    "Aqua energy, infinite motion!",
    "Dive deep into your workout!",
    "Make a splash with every move!",
    "Ocean heart, champion spirit!",
  ],
  'Velvet': [
    "Grace and power in perfect balance!",
    "Dance your way to strength!",
    "Elegance is the ultimate strength!",
    "Royal results for royal effort!",
    "Glide into greatness!",
  ],
  'Pixie': [
    "Flutter into fitness mode!",
    "Coral energy ignite!",
    "Small moves, big transformation!",
    "Butterfly wings, warrior heart!",
    "Sparkle and sweat!",
  ],
};

const getRandomSaying = (avatarName: string): string => {
  const sayings = AVATAR_SAYINGS[avatarName];
  if (!sayings || sayings.length === 0) {
    return "Let's get your pump on!";
  }
  const randomIndex = Math.floor(Math.random() * sayings.length);
  return sayings[randomIndex];
};

export const useVoiceIntroduction = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { setIsSpeaking } = useAvatarSpeaking();
  const { volume } = useVoiceVolume();

  const playIntroduction = async (avatarName: string, gender: string = 'neutral') => {
    try {
      setIsPlaying(true);
      
      // Get user's name from profile
      const { data: { user } } = await supabase.auth.getUser();
      let userName = 'there';
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
        
        // Use the display name utility
        const displayName = getDisplayName(user, profile);
        if (displayName) {
          userName = displayName.split(' ')[0]; // Use first name only
        } else if (profile?.username) {
          userName = profile.username;
        }
      }
      
      // Get random saying for this avatar
      const saying = getRandomSaying(avatarName);
      
      // Generate short, punchy introduction
      const introText = `Hey ${userName}! ${saying}`;
      
      console.log(`🔊 Playing introduction for ${avatarName} (${gender}) to user: ${userName}`);
      
      // Call text-to-speech edge function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: introText,
          gender: gender
        }
      });

      if (error) throw error;
      if (!data?.audioContent) throw new Error('No audio data received');

      // Play the audio
      await playBase64Audio(data.audioContent, {
        onStart: () => setIsSpeaking(true, avatarName),
        onEnd: () => setIsSpeaking(false),
        volume,
      });
      
      console.log(`✅ Introduction played successfully for ${avatarName}`);
      
    } catch (error) {
      console.error('Failed to play voice introduction:', error);
      setIsSpeaking(false);
      toast({
        title: "Voice introduction unavailable",
        description: "Continuing with silent selection",
        variant: "default"
      });
    } finally {
      setIsPlaying(false);
    }
  };

  return { playIntroduction, isPlaying };
};
