import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playBase64Audio } from '@/lib/audioPlayer';
import { toast } from '@/hooks/use-toast';

export const useVoiceIntroduction = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const playIntroduction = async (avatarName: string, gender: string = 'neutral') => {
    try {
      setIsPlaying(true);
      
      // Generate the introduction text
      const introText = `Hey, I'm ${avatarName}! Thanks for selecting me, let's get your pump on!`;
      
      console.log(`🔊 Playing introduction for ${avatarName} (${gender})`);
      
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
      await playBase64Audio(data.audioContent);
      
      console.log(`✅ Introduction played successfully for ${avatarName}`);
      
    } catch (error) {
      console.error('Failed to play voice introduction:', error);
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
