import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playBase64Audio } from '@/lib/audioPlayer';
import { toast } from '@/hooks/use-toast';
import { getDisplayName } from '@/lib/userDisplay';
import { useAvatarSpeaking } from './useAvatarSpeaking';
import { useVoiceVolume } from './useVoiceVolume';

const AVATAR_PERSONALITIES: Record<string, string> = {
  'Stark': "Hope you're ready to work because I don't do excuses—only results. This crimson armor means business. Let's turn that sweat into strength!",
  'Petrie': "These cyan wings have been soaring for ages. I've been in this game long enough to know—consistency beats intensity every time. Let's build something that lasts!",
  'Night Hawk': "See this midnight blue suit? It's built for precision. Peak performance happens in the details—sharp eyes, sharper talons. Let's sharpen every rep, every set, every session. Excellence awaits!",
  'Tails': "Check out these pink tails—they're not just for show! Ready to fly high today? We're going to crush these goals with fox-like agility and have a blast doing it! Let's gooo!",
  'Tygrus': "See these purple stripes? They're my battle scars. Time to unleash your inner beast! Every workout is a battle—and we tigers are here to dominate. Let's hunt down those gains!",
  'Banjo': "This bear knows fitness doesn't have to be serious all the time in my forest green. Let's keep it fun and fresh—we're gonna jam through this workout together!",
  'Ceasar': "Victory in fitness comes from strategy and discipline—just like a king ruling his kingdom in aqua armor. Let's conquer today's session with precision and power!",
  'Reptile': "These lime-green scales aren't just for show. Slow and steady wins the race—but we'll add some serpent bite to it. Let's strike fast and make every move count!",
  'Rhydon': "This rose-pink armor is tougher than it looks! I'm built like a tank with my rhino horn, and so will you be. Let's grind through this with unstoppable force!",
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
      
      // Get personality message for this avatar
      const personalityMessage = AVATAR_PERSONALITIES[avatarName] || 
        "Thanks for selecting me, let's get your pump on!";
      
      // Generate the personalized introduction text
      const introText = `Hey ${userName}, ${avatarName} here. ${personalityMessage}`;
      
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
