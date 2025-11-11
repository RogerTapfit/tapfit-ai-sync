import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playBase64Audio } from '@/lib/audioPlayer';
import { getDisplayName } from '@/lib/userDisplay';
import { useAvatar } from '@/lib/avatarState';
import { useAvatarSpeaking } from './useAvatarSpeaking';
import { useVoiceVolume } from './useVoiceVolume';

type CoachingContext = 
  | { type: 'set_complete'; data: { currentSet: number; totalSets: number; reps: number } }
  | { type: 'rest_start'; data: { restTime: number } }
  | { type: 'rest_countdown'; data: { timeLeft: number } }
  | { type: 'halfway_point'; data: { currentSet: number; totalSets: number } }
  | { type: 'final_push'; data: { setsRemaining: number } }
  | { type: 'form_tip'; data: { exerciseName: string } }
  | { type: 'workout_complete'; data: { totalReps: number; duration: number } };

const AVATAR_COACHING_STYLES = {
  'Stark': {
    set_complete: (data: any) => `Set ${data.currentSet} done! ${data.reps} solid reps. This crimson armor is proud! No slacking now!`,
    rest_start: () => `60 seconds. Power systems recharging. Stay focused like a machine!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Red armor ready to attack this next set!` : `${data.timeLeft} seconds left. Stay tactical!`,
    halfway_point: () => `Halfway there! My iron will never quits. This is where champions are made!`,
    final_push: (data: any) => `Last ${data.setsRemaining} set${data.setsRemaining > 1 ? 's' : ''}! Full power output! Leave nothing in the tank!`,
    form_tip: () => `Mechanical precision! Focus on form over speed. Control every movement like tech!`,
    workout_complete: (data: any) => `${data.totalReps} reps in ${data.duration} minutes. My red suit salutes you! Outstanding work!`,
  },
  'Petrie': {
    set_complete: (data: any) => `Excellent work on set ${data.currentSet}. These cyan wings approve! Quality over quantity.`,
    rest_start: () => `Glide into recovery. These wings know—rest is just as important as flight.`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds. Time to soar again! Prepare your mind.` : `${data.timeLeft} seconds. Breathe like you're gliding.`,
    halfway_point: () => `Halfway through the flight! Stay consistent from this altitude. That's the pterodactyl way!`,
    final_push: (data: any) => `${data.setsRemaining} more to go. Wings spread wide! Finish with ancient wisdom!`,
    form_tip: () => `Proper posture like a flying reptile. Feel the muscle through the full range like a wing stroke!`,
    workout_complete: (data: any) => `${data.totalReps} reps completed. My cyan wings salute you! Another brick in the foundation.`,
  },
  'Night Hawk': {
    set_complete: (data: any) => `Set ${data.currentSet} complete. ${data.reps} precise reps with hawk eyes. Exactly what we need.`,
    rest_start: () => `60 seconds. Hawk perched. Reset talons, refocus, execute.`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds to swoop time. Lock those keen eyes in!` : `${data.timeLeft} seconds. Stay locked in like midnight blue steel.`,
    halfway_point: () => `Halfway mark. These sharp talons don't miss details. Stay sharp as a hawk!`,
    final_push: (data: any) => `Final ${data.setsRemaining} set${data.setsRemaining > 1 ? 's' : ''}! Dive from the blue! Precision meets performance!`,
    form_tip: () => `Hawk precision! Control every inch like a predator hunting. Perfect form, perfect strike!`,
    workout_complete: (data: any) => `Mission complete. ${data.totalReps} reps, ${data.duration} minutes. Flawless hawk execution!`,
  },
  'Tails': {
    set_complete: (data: any) => `Woohoo! Set ${data.currentSet} crushed! My pink tails are spinning with joy! You're amazing!`,
    rest_start: () => `Take a breather! These tails need a break too! 60 seconds of fox recovery coming up!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Time to fly high again with fox speed!` : `${data.timeLeft} seconds left! Stay positive like a playful fox!`,
    halfway_point: () => `Yes! Halfway there with fox agility! You're absolutely killing it!`,
    final_push: (data: any) => `Last ${data.setsRemaining} set${data.setsRemaining > 1 ? 's' : ''}! All tails engaged! Let's soar to the finish!`,
    form_tip: () => `Fox-like precision! Keep that form tight! Move with cunning grace!`,
    workout_complete: (data: any) => `Amazing! ${data.totalReps} reps in ${data.duration} minutes! My pink tails salute you, superstar!`,
  },
  'Tygrus': {
    set_complete: (data: any) => `Set ${data.currentSet} conquered! ${data.reps} powerful reps! These purple stripes are roaring!`,
    rest_start: () => `Rest like a tiger in the shadows. Conserve your feline energy for the hunt!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Time to pounce again with claws out!` : `${data.timeLeft} seconds. Stay fierce like a prowling tiger!`,
    halfway_point: () => `Halfway through the hunt! These purple stripes never quit! Prey is in sight!`,
    final_push: (data: any) => `${data.setsRemaining} more! Unleash your inner tiger! Claws, fangs, everything! No mercy!`,
    form_tip: () => `Tiger power! Explosive like a pounce with controlled aggression! Feel every stripe engage!`,
    workout_complete: (data: any) => `Dominant tiger performance! ${data.totalReps} reps in ${data.duration} minutes! Absolutely unstoppable!`,
  },
  'Banjo': {
    set_complete: (data: any) => `Hey, set ${data.currentSet} is in the books! ${data.reps} reps looking smooth! This bear approves!`,
    rest_start: () => `Alright, bear chill time! 60 seconds in the forest green to vibe and recover!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Time to jam with bear strength on the next set!` : `${data.timeLeft} seconds. Just flow with natural bear rhythm!`,
    halfway_point: () => `Sweet! Halfway through with bear power! You're grooving perfectly in the green!`,
    final_push: (data: any) => `Last ${data.setsRemaining} set${data.setsRemaining > 1 ? 's' : ''}! Bear hug this finish! Let's jam strong!`,
    form_tip: () => `Bear-style! Stay loose but controlled! Feel the natural rhythm like the forest!`,
    workout_complete: (data: any) => `That was awesome! ${data.totalReps} reps in ${data.duration} minutes! This green bear is proud!`,
  },
  'Ceasar': {
    set_complete: (data: any) => `Set ${data.currentSet} secured! ${data.reps} reps executed with royal precision! My aqua armor approves!`,
    rest_start: () => `60 seconds tactical recovery like a king. Assess your legion and prepare for next assault!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Prepare to engage with regal power!` : `${data.timeLeft} seconds. Stay tactical in your aqua armor!`,
    halfway_point: () => `Campaign 50% complete! The kingdom is within reach! Maintain discipline for total victory!`,
    final_push: (data: any) => `Final ${data.setsRemaining} objective${data.setsRemaining > 1 ? 's' : ''}! Execute like royalty! Claim your conquest!`,
    form_tip: () => `Strategic royal form equals battlefield superiority! Command every movement with king-like precision!`,
    workout_complete: (data: any) => `Victory achieved! ${data.totalReps} reps conquered in ${data.duration} minutes. The aqua kingdom is proud!`,
  },
  'Reptile': {
    set_complete: (data: any) => `Set ${data.currentSet} complete. ${data.reps} calculated reps. These lime-green scales are smooth and deadly!`,
    rest_start: () => `60 seconds to coil back like a serpent. Cold-blooded patience before the strike!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds. Scales ready! Time to strike again!` : `${data.timeLeft} seconds. Stay cool like reptile blood!`,
    halfway_point: () => `Halfway through the hunt! Like a lizard in the sun, patient but relentless with green scales!`,
    final_push: (data: any) => `${data.setsRemaining} more set${data.setsRemaining > 1 ? 's' : ''}! Strike with full serpent venom! Lime-green fury!`,
    form_tip: () => `Serpent style! Slow and controlled coiling. Then explode like a striking snake!`,
    workout_complete: (data: any) => `Impressive hunt! ${data.totalReps} reps in ${data.duration} minutes! These scales don't lie—silent but deadly!`,
  },
  'Rhydon': {
    set_complete: (data: any) => `Set ${data.currentSet} crushed! ${data.reps} unstoppable reps! This rose-pink armor is built like a fortress!`,
    rest_start: () => `60 seconds to recharge the rhino! Even tanks in pink armor need fuel!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Time to charge horn-first through the next set!` : `${data.timeLeft} seconds left. Stay solid as rhino hide!`,
    halfway_point: () => `Halfway there! Nothing stops a charging rhino! This pink armor keeps rolling!`,
    final_push: (data: any) => `${data.setsRemaining} more! Unstoppable rhino force meets immovable horn! Full charge!`,
    form_tip: () => `Rhino strong, steady, powerful! Feel that rock-solid horn strength in every rep!`,
    workout_complete: (data: any) => `Incredible rhino power! ${data.totalReps} reps in ${data.duration} minutes! This pink armor is absolutely unshakeable!`,
  },
};

export const useVoiceCoaching = () => {
  const { avatar } = useAvatar();
  const { setIsSpeaking } = useAvatarSpeaking();
  const { volume } = useVoiceVolume();
  const [isPlaying, setIsPlaying] = useState(false);
  const [userName, setUserName] = useState<string>('there');
  const [avatarName, setAvatarName] = useState<string>('Coach');
  const [avatarGender, setAvatarGender] = useState<string>('neutral');

  useEffect(() => {
    const fetchUserAndAvatar = async () => {
      // Get user's name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', user.id)
          .single();
        
        const displayName = getDisplayName(user, profile);
        if (displayName) {
          setUserName(displayName.split(' ')[0]);
        } else if (profile?.username) {
          setUserName(profile.username);
        }
      }

      // Get avatar info
      if (avatar?.id) {
        const { data: avatarData } = await supabase
          .from('avatars')
          .select('name, gender')
          .eq('id', avatar.id)
          .single();
        
        if (avatarData) {
          setAvatarName(avatarData.name);
          setAvatarGender(avatarData.gender || 'neutral');
        }
      }
    };

    fetchUserAndAvatar();
  }, [avatar]);

  const speak = useCallback(async (context: CoachingContext) => {
    if (isPlaying) return; // Don't overlap coaching messages
    
    try {
      setIsPlaying(true);

      // Get coaching message based on avatar personality
      const coachingStyle = AVATAR_COACHING_STYLES[avatarName as keyof typeof AVATAR_COACHING_STYLES];
      let message = '';

      if (coachingStyle) {
        const messageGenerator = coachingStyle[context.type];
        if (messageGenerator) {
          message = messageGenerator(context.data);
        }
      }

      // Fallback generic messages if avatar not found
      if (!message) {
        switch (context.type) {
          case 'set_complete':
            message = `Great set ${userName}! ${context.data.reps} reps done!`;
            break;
          case 'rest_start':
            message = `Take ${context.data.restTime} seconds to recover!`;
            break;
          case 'rest_countdown':
            message = `${context.data.timeLeft} seconds left!`;
            break;
          case 'halfway_point':
            message = `You're halfway there ${userName}! Keep it up!`;
            break;
          case 'final_push':
            message = `Last set! Give it everything you've got!`;
            break;
          case 'form_tip':
            message = `Focus on your form! Control the movement!`;
            break;
          case 'workout_complete':
            message = `Amazing work ${userName}! Workout complete!`;
            break;
        }
      }

      // Personalize with user's name if not already included
      if (!message.includes(userName) && context.type !== 'rest_countdown') {
        message = `${userName}, ${message}`;
      }

      console.log(`🔊 Voice coaching from ${avatarName}: ${message}`);

      // Call text-to-speech edge function
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: message,
          gender: avatarGender
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

    } catch (error) {
      console.error('Voice coaching failed:', error);
      setIsSpeaking(false);
      // Silently fail - don't disrupt workout
    } finally {
      setIsPlaying(false);
    }
  }, [isPlaying, userName, avatarName, avatarGender]);

  return { speak, isPlaying, avatarName };
};
