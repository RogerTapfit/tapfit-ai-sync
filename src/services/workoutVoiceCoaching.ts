// Workout Voice Coaching Service
// Provides contextual encouragement and coaching during workouts

export interface CoachingContext {
  type: 
    | 'workout_start'
    | 'rep_milestone'
    | 'set_complete'
    | 'rest_start'
    | 'rest_countdown'
    | 'form_correction'
    | 'personal_record'
    | 'near_target'
    | 'workout_complete'
    | 'encouragement';
  data?: {
    currentReps?: number;
    targetReps?: number;
    currentSet?: number;
    totalSets?: number;
    restTimeLeft?: number;
    formScore?: number;
    improvementPercent?: number;
    exerciseName?: string;
  };
}

// Coaching phrases for different workout moments
const COACHING_PHRASES = {
  workout_start: [
    "Let's crush this workout! You've got this!",
    "Time to shine! Focus on your form and let's go!",
    "Ready to get stronger? Let's do this!",
    "Your future self will thank you for this! Let's begin!",
  ],
  
  rep_milestone: {
    quarter: [
      "Great start! Keep that energy up!",
      "Nice rhythm! You're looking strong!",
      "Excellent form so far! Stay focused!",
    ],
    half: [
      "Halfway there! You're doing amazing!",
      "Keep pushing! You're right on track!",
      "Strong work! Maintain that form!",
    ],
    threeQuarter: [
      "Almost there! Finish strong!",
      "You've got this! Just a few more!",
      "Final push! Keep that intensity!",
    ],
  },
  
  set_complete: [
    "Set complete! Excellent work!",
    "Great set! You crushed it!",
    "Awesome! Take a quick rest!",
    "Perfect! You're getting stronger with every rep!",
  ],
  
  rest_start: [
    "Take your rest! You've earned it!",
    "Rest up! We'll go again soon!",
    "Breathe and recover! Great work on that set!",
    "Rest period! Hydrate and prepare for the next one!",
  ],
  
  rest_countdown: {
    30: ["30 seconds left! Get ready!"],
    15: ["15 seconds! Prepare yourself!"],
    10: ["10 seconds! Let's go again!"],
    5: ["5, 4, 3, 2, 1, Go!"],
  },
  
  form_correction: {
    excellent: [
      "Perfect form! Keep it up!",
      "Excellent technique! That's how it's done!",
    ],
    good: [
      "Good form! Small adjustments and you'll be perfect!",
      "Nice! Just focus on keeping that alignment!",
    ],
    needsWork: [
      "Watch your form! Slow down if needed!",
      "Focus on technique! Quality over speed!",
      "Let's dial in that form! You've got this!",
    ],
  },
  
  personal_record: [
    "Personal record! You're unstoppable!",
    "New PR! That's what I'm talking about!",
    "You just set a personal best! Amazing!",
    "Record broken! You're leveling up!",
  ],
  
  near_target: [
    "So close! Give it everything you've got!",
    "Almost there! Don't quit now!",
    "You're nearly at your goal! Finish strong!",
  ],
  
  workout_complete: [
    "Workout complete! You absolutely crushed it today!",
    "Amazing work! You're getting stronger every day!",
    "Done! That was an incredible session!",
    "Workout finished! You should be proud of yourself!",
  ],
  
  encouragement: {
    struggling: [
      "Keep going! Every rep counts!",
      "You're stronger than you think! Push through!",
      "Don't give up! You've come this far!",
    ],
    strong: [
      "Looking powerful! Keep that energy!",
      "You're on fire today! Keep it up!",
      "Incredible! You're in the zone!",
    ],
    consistent: [
      "Great consistency! That's how champions train!",
      "Steady and strong! Love the dedication!",
      "Perfect pace! You're nailing this!",
    ],
  },
};

// Get random phrase from array
function getRandomPhrase(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// Main coaching function
export function getCoachingPhrase(context: CoachingContext): string | null {
  const { type, data } = context;
  
  switch (type) {
    case 'workout_start':
      return getRandomPhrase(COACHING_PHRASES.workout_start);
    
    case 'rep_milestone':
      if (!data?.currentReps || !data?.targetReps) return null;
      const progress = data.currentReps / data.targetReps;
      
      if (progress >= 0.75) {
        return getRandomPhrase(COACHING_PHRASES.rep_milestone.threeQuarter);
      } else if (progress >= 0.5) {
        return getRandomPhrase(COACHING_PHRASES.rep_milestone.half);
      } else if (progress >= 0.25) {
        return getRandomPhrase(COACHING_PHRASES.rep_milestone.quarter);
      }
      return null;
    
    case 'set_complete':
      return getRandomPhrase(COACHING_PHRASES.set_complete);
    
    case 'rest_start':
      return getRandomPhrase(COACHING_PHRASES.rest_start);
    
    case 'rest_countdown':
      const timeLeft = data?.restTimeLeft || 0;
      if (timeLeft === 30) return COACHING_PHRASES.rest_countdown[30][0];
      if (timeLeft === 15) return COACHING_PHRASES.rest_countdown[15][0];
      if (timeLeft === 10) return COACHING_PHRASES.rest_countdown[10][0];
      if (timeLeft === 5) return COACHING_PHRASES.rest_countdown[5][0];
      return null;
    
    case 'form_correction':
      const formScore = data?.formScore || 100;
      if (formScore >= 90) {
        return getRandomPhrase(COACHING_PHRASES.form_correction.excellent);
      } else if (formScore >= 70) {
        return getRandomPhrase(COACHING_PHRASES.form_correction.good);
      } else {
        return getRandomPhrase(COACHING_PHRASES.form_correction.needsWork);
      }
    
    case 'personal_record':
      const improvement = data?.improvementPercent || 0;
      const exerciseName = data?.exerciseName || 'exercise';
      const basePhrase = getRandomPhrase(COACHING_PHRASES.personal_record);
      if (improvement > 20) {
        return `${basePhrase} ${improvement}% improvement on ${exerciseName}!`;
      }
      return basePhrase;
    
    case 'near_target':
      return getRandomPhrase(COACHING_PHRASES.near_target);
    
    case 'workout_complete':
      return getRandomPhrase(COACHING_PHRASES.workout_complete);
    
    case 'encouragement':
      // This can be triggered based on workout metrics
      // Default to consistent encouragement
      return getRandomPhrase(COACHING_PHRASES.encouragement.consistent);
    
    default:
      return null;
  }
}

// Determine if coaching should be spoken based on workout state
export function shouldCoach(
  lastCoachTime: number,
  currentTime: number,
  minIntervalMs: number = 15000 // Minimum 15 seconds between general coaching
): boolean {
  return currentTime - lastCoachTime >= minIntervalMs;
}

// Get encouragement type based on performance metrics
export function getEncouragementType(
  formScore: number,
  repsProgress: number
): 'struggling' | 'strong' | 'consistent' {
  if (formScore < 70 || repsProgress < 0.3) {
    return 'struggling';
  } else if (formScore >= 90 && repsProgress >= 0.7) {
    return 'strong';
  }
  return 'consistent';
}
