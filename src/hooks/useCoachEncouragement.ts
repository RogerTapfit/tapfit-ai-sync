import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAvatarSpeaking } from './useAvatarSpeaking';
import { coachEncouragementService } from '@/services/coachEncouragementService';
import { getDisplayName } from '@/lib/userDisplay';
import { playBase64Audio } from '@/lib/audioPlayer';
import { useVoiceVolume } from './useVoiceVolume';

export const useCoachEncouragement = () => {
  const [lastClickTime, setLastClickTime] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { isSpeaking, setIsSpeaking } = useAvatarSpeaking();
  const { volume } = useVoiceVolume();

  const COOLDOWN_MS = 30000; // 30 seconds

  const handleCoachClick = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // Check cooldown
    if (timeSinceLastClick < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastClick) / 1000);
      console.log(`Coach is resting... ${remainingSeconds}s remaining`);
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const userName = getDisplayName(user, profile) || 'champ';

      // Fetch encouragement context
      const context = await coachEncouragementService.fetchUserContext(user.id);

      // Generate message
      const message = coachEncouragementService.generateEncouragementMessage(context, userName);

      console.log('🎙️ Coach encouragement:', message);

      // Speak the message
      setIsSpeaking(true, 'Coach');
      
      // Call text-to-speech edge function
      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: message }
      });

      if (ttsError) {
        console.error('TTS error:', ttsError);
        setIsSpeaking(false);
        return;
      }

      if (ttsData?.audioContent) {
        await playBase64Audio(ttsData.audioContent, {
          onStart: () => setIsSpeaking(true, 'Coach'),
          onEnd: () => setIsSpeaking(false),
          volume,
        });
      }

      // Update last click time and start cooldown
      setLastClickTime(now);
      
      // Start cooldown countdown
      let remaining = 30;
      const interval = setInterval(() => {
        remaining--;
        setCooldownSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setCooldownSeconds(0);
        }
      }, 1000);

    } catch (error) {
      console.error('Error generating coach encouragement:', error);
      setIsSpeaking(false);
    }
  }, [lastClickTime, setIsSpeaking, volume]);

  const canSpeak = Date.now() - lastClickTime >= COOLDOWN_MS;

  return {
    handleCoachClick,
    isSpeaking,
    canSpeak,
    cooldownSeconds,
  };
};
