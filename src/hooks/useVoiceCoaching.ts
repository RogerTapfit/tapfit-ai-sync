import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { playBase64Audio } from '@/lib/audioPlayer';
import { getDisplayName } from '@/lib/userDisplay';
import { useAvatar } from '@/lib/avatarState';

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
    set_complete: (data: any) => `Set ${data.currentSet} done! ${data.reps} solid reps. No slacking now!`,
    rest_start: () => `60 seconds. Catch your breath but stay focused!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Get ready to attack this next set!` : `${data.timeLeft} seconds left. Stay sharp!`,
    halfway_point: () => `Halfway there! This is where champions are made. Keep pushing!`,
    final_push: (data: any) => `Last ${data.setsRemaining} set${data.setsRemaining > 1 ? 's' : ''}! Leave nothing in the tank!`,
    form_tip: () => `Focus on form over speed. Every rep counts. Control the weight!`,
    workout_complete: (data: any) => `${data.totalReps} reps in ${data.duration} minutes. Outstanding work! You earned this!`,
  },
  'Petrie': {
    set_complete: (data: any) => `Excellent work on set ${data.currentSet}. Quality over quantity, remember that.`,
    rest_start: () => `Take your full rest. Recovery is just as important as the work.`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds. Prepare your mind for the next set.` : `${data.timeLeft} seconds. Breathe deeply.`,
    halfway_point: () => `You're halfway through. Stay consistent, that's the key to long-term success.`,
    final_push: (data: any) => `${data.setsRemaining} more to go. Finish what you started with the same intensity.`,
    form_tip: () => `Maintain proper posture. Feel the muscle working through the full range of motion.`,
    workout_complete: (data: any) => `${data.totalReps} reps completed. Another brick in the foundation. Well done.`,
  },
  'Night Hawk': {
    set_complete: (data: any) => `Set ${data.currentSet} complete. ${data.reps} precise reps. Exactlywhat we need.`,
    rest_start: () => `60 seconds. Reset, refocus, execute.`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds to go time. Lock in!` : `${data.timeLeft} seconds. Stay locked in.`,
    halfway_point: () => `Halfway mark. Every detail matters from here. Stay sharp!`,
    final_push: (data: any) => `Final ${data.setsRemaining} set${data.setsRemaining > 1 ? 's' : ''}. This is where precision meets performance!`,
    form_tip: () => `Perfect form equals perfect results. Control every inch of the movement.`,
    workout_complete: (data: any) => `Mission complete. ${data.totalReps} reps, ${data.duration} minutes. Flawless execution!`,
  },
  'Tails': {
    set_complete: (data: any) => `Woohoo! Set ${data.currentSet} crushed! You're doing amazing!`,
    rest_start: () => `Take a breather! You've earned it! 60 seconds of recovery coming up!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Let's bring that energy back up!` : `${data.timeLeft} seconds left! Stay positive!`,
    halfway_point: () => `Yes! We're halfway there! You're absolutely killing it!`,
    final_push: (data: any) => `Last ${data.setsRemaining} set${data.setsRemaining > 1 ? 's' : ''}! Let's finish this strong! You've got this!`,
    form_tip: () => `Keep that form tight! You're moving beautifully! Let's keep it up!`,
    workout_complete: (data: any) => `Amazing! ${data.totalReps} reps in ${data.duration} minutes! You're a superstar!`,
  },
  'Tygrus': {
    set_complete: (data: any) => `Set ${data.currentSet} conquered! ${data.reps} powerful reps! Feel that beast inside you!`,
    rest_start: () => `Rest like a predator. Conserve your energy for the hunt!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Time to strike again!` : `${data.timeLeft} seconds. Stay fierce!`,
    halfway_point: () => `Halfway through the hunt! The prey is in sight! Keep that intensity!`,
    final_push: (data: any) => `${data.setsRemaining} more! Unleash everything! No mercy!`,
    form_tip: () => `Explosive power with controlled aggression! Feel every muscle engage!`,
    workout_complete: (data: any) => `Dominant performance! ${data.totalReps} reps in ${data.duration} minutes! You're unstoppable!`,
  },
  'Banjo': {
    set_complete: (data: any) => `Hey, set ${data.currentSet} is in the books! ${data.reps} reps looking smooth!`,
    rest_start: () => `Alright, chill time! 60 seconds to vibe and recover!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Time to jam on the next set!` : `${data.timeLeft} seconds. Just flow with it!`,
    halfway_point: () => `Sweet! We're halfway through! You're grooving perfectly!`,
    final_push: (data: any) => `Last ${data.setsRemaining} set${data.setsRemaining > 1 ? 's' : ''}! Let's finish this jam session strong!`,
    form_tip: () => `Stay loose but controlled! Feel the rhythm of the movement!`,
    workout_complete: (data: any) => `That was awesome! ${data.totalReps} reps in ${data.duration} minutes! Great session!`,
  },
  'Ceasar': {
    set_complete: (data: any) => `Set ${data.currentSet} secured! ${data.reps} reps executed perfectly. Advance to the next objective!`,
    rest_start: () => `60 seconds tactical recovery. Assess and prepare for the next assault!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Prepare to engage!` : `${data.timeLeft} seconds. Stay tactical!`,
    halfway_point: () => `Campaign is 50% complete. Maintain discipline and we will achieve total victory!`,
    final_push: (data: any) => `Final ${data.setsRemaining} objective${data.setsRemaining > 1 ? 's' : ''}! Execute with precision and claim your conquest!`,
    form_tip: () => `Strategic form equals battlefield superiority. Command every movement!`,
    workout_complete: (data: any) => `Victory achieved! ${data.totalReps} reps conquered in ${data.duration} minutes. Well fought!`,
  },
  'Reptile': {
    set_complete: (data: any) => `Set ${data.currentSet} complete. ${data.reps} calculated reps. Smooth and deadly!`,
    rest_start: () => `60 seconds to coil back. Patience before the strike!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds. Ready to strike again!` : `${data.timeLeft} seconds. Stay cool!`,
    halfway_point: () => `Halfway through. Like a snake, we're patient but relentless!`,
    final_push: (data: any) => `${data.setsRemaining} more set${data.setsRemaining > 1 ? 's' : ''}! Time to strike with full venom!`,
    form_tip: () => `Slow and controlled. Then explode! Feel that serpent power!`,
    workout_complete: (data: any) => `Impressive hunt! ${data.totalReps} reps in ${data.duration} minutes! Silent but deadly!`,
  },
  'Rhydon': {
    set_complete: (data: any) => `Set ${data.currentSet} crushed! ${data.reps} unstoppable reps! Built like a fortress!`,
    rest_start: () => `60 seconds to recharge! Even tanks need fuel!`,
    rest_countdown: (data: any) => data.timeLeft === 10 ? `10 seconds! Time to bulldoze through the next set!` : `${data.timeLeft} seconds left. Stay solid!`,
    halfway_point: () => `Halfway there! Nothing can stop this momentum! Keep rolling!`,
    final_push: (data: any) => `${data.setsRemaining} more! Unstoppable force meets immovable will! Let's go!`,
    form_tip: () => `Strong, steady, powerful! Feel that rock-solid strength in every rep!`,
    workout_complete: (data: any) => `Incredible power! ${data.totalReps} reps in ${data.duration} minutes! Absolutely unshakeable!`,
  },
};

export const useVoiceCoaching = () => {
  const { avatar } = useAvatar();
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
      await playBase64Audio(data.audioContent);

    } catch (error) {
      console.error('Voice coaching failed:', error);
      // Silently fail - don't disrupt workout
    } finally {
      setIsPlaying(false);
    }
  }, [isPlaying, userName, avatarName, avatarGender]);

  return { speak, isPlaying, avatarName };
};
