export interface AtHomeExercise {
  id: string;
  name: string;
  category: string;
  emoji: string;
  defaultSets: number;
  defaultReps: number;
  defaultHoldSeconds?: number; // For holds like plank
  isHold?: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string;
}

export interface ExerciseCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const exerciseCategories: ExerciseCategory[] = [
  { id: 'lower-body', name: 'Lower Body', emoji: '🦵', color: 'text-blue-500' },
  { id: 'upper-push', name: 'Upper Body – Push', emoji: '💪', color: 'text-red-500' },
  { id: 'upper-pull', name: 'Upper Body – Pull', emoji: '🧲', color: 'text-purple-500' },
  { id: 'core', name: 'Core & Abs', emoji: '🧠', color: 'text-yellow-500' },
  { id: 'cardio', name: 'Cardio / Full Body', emoji: '❤️', color: 'text-pink-500' },
  { id: 'mobility', name: 'Mobility & Flexibility', emoji: '🧘', color: 'text-green-500' },
  { id: 'balance', name: 'Balance & Stability', emoji: '⚖️', color: 'text-cyan-500' },
];

export const atHomeExercises: AtHomeExercise[] = [
  // Lower Body
  { id: 'squats', name: 'Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Stand with feet shoulder-width apart, lower hips back and down as if sitting in a chair.' },
  { id: 'half-squats', name: 'Half Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 15, difficulty: 'beginner', instructions: 'Perform a squat but only go halfway down.' },
  { id: 'wall-sit', name: 'Wall Sit', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Slide your back down a wall until thighs are parallel to the ground. Hold.' },
  { id: 'forward-lunges', name: 'Forward Lunges', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 10, difficulty: 'beginner', instructions: 'Step forward and lower your back knee toward the floor.' },
  { id: 'reverse-lunges', name: 'Reverse Lunges', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 10, difficulty: 'beginner', instructions: 'Step backward and lower your back knee toward the floor.' },
  { id: 'walking-lunges', name: 'Walking Lunges', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 12, difficulty: 'intermediate', instructions: 'Lunge forward alternating legs as you walk.' },
  { id: 'split-squats', name: 'Split Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Stand in a staggered stance and lower your back knee toward the floor.' },
  { id: 'bulgarian-split-squats', name: 'Bulgarian Split Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 8, difficulty: 'advanced', instructions: 'Rear foot elevated on a surface, lower into a lunge.' },
  { id: 'step-backs', name: 'Step-backs', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Step backward into a lunge, then return to standing.' },
  { id: 'jump-squats', name: 'Jump Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Perform a squat then explosively jump up.' },
  { id: 'pulse-squats', name: 'Pulse Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 15, difficulty: 'intermediate', instructions: 'Hold at the bottom of a squat and pulse up and down.' },
  { id: 'sumo-squats', name: 'Sumo Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Wide stance squat with toes pointed outward.' },
  { id: 'cossack-squats', name: 'Cossack Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 8, difficulty: 'advanced', instructions: 'Wide stance, shift weight to one leg while straightening the other.' },
  { id: 'pistol-squats', name: 'Pistol Squats', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 5, difficulty: 'advanced', instructions: 'Single-leg squat with the other leg extended forward.' },
  { id: 'glute-bridges', name: 'Glute Bridges', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 15, difficulty: 'beginner', instructions: 'Lie on back, feet flat, lift hips toward ceiling.' },
  { id: 'single-leg-glute-bridges', name: 'Single-Leg Glute Bridges', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Glute bridge with one leg extended.' },
  { id: 'hip-thrusts', name: 'Hip Thrusts', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 12, difficulty: 'intermediate', instructions: 'Upper back on a surface, drive hips upward.' },
  { id: 'calf-raises', name: 'Calf Raises', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 20, difficulty: 'beginner', instructions: 'Rise up onto your toes, then lower.' },
  { id: 'single-leg-calf-raises', name: 'Single-Leg Calf Raises', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 15, difficulty: 'intermediate', instructions: 'Calf raise on one leg at a time.' },
  { id: 'donkey-kicks', name: 'Donkey Kicks', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 15, difficulty: 'beginner', instructions: 'On all fours, kick one leg back and up.' },
  { id: 'fire-hydrants', name: 'Fire Hydrants', category: 'lower-body', emoji: '🦵', defaultSets: 3, defaultReps: 15, difficulty: 'beginner', instructions: 'On all fours, lift one leg out to the side.' },

  // Upper Body – Push
  { id: 'push-ups', name: 'Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 10, difficulty: 'beginner', instructions: 'Lower your body to the ground, then push back up.' },
  { id: 'knee-push-ups', name: 'Knee Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Push-ups with knees on the ground.' },
  { id: 'wide-push-ups', name: 'Wide Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Push-ups with hands wider than shoulder-width.' },
  { id: 'diamond-push-ups', name: 'Diamond Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 8, difficulty: 'intermediate', instructions: 'Push-ups with hands forming a diamond shape.' },
  { id: 'incline-push-ups', name: 'Incline Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Push-ups with hands elevated on a surface.' },
  { id: 'decline-push-ups', name: 'Decline Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Push-ups with feet elevated on a surface.' },
  { id: 'archer-push-ups', name: 'Archer Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 6, difficulty: 'advanced', instructions: 'Wide push-ups shifting weight to one arm.' },
  { id: 'hindu-push-ups', name: 'Hindu Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 8, difficulty: 'intermediate', instructions: 'Dive down through arms in an arc motion.' },
  { id: 'pike-push-ups', name: 'Pike Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 8, difficulty: 'intermediate', instructions: 'Push-ups in an inverted V position for shoulders.' },
  { id: 'handstand-push-ups', name: 'Handstand Push-ups', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 5, difficulty: 'advanced', instructions: 'Push-ups in a handstand against a wall.' },
  { id: 'shoulder-taps', name: 'Shoulder Taps', category: 'upper-push', emoji: '💪', defaultSets: 3, defaultReps: 20, difficulty: 'beginner', instructions: 'In plank position, tap opposite shoulders.' },

  // Upper Body – Pull
  { id: 'superman-pulls', name: 'Superman Pulls', category: 'upper-pull', emoji: '🧲', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Lie face down, lift arms and legs, pull elbows back.' },
  { id: 'reverse-snow-angels', name: 'Reverse Snow Angels', category: 'upper-pull', emoji: '🧲', defaultSets: 3, defaultReps: 10, difficulty: 'beginner', instructions: 'Lie face down, arms out, sweep arms in an arc.' },
  { id: 'ytw-raises', name: 'Y-T-W Raises', category: 'upper-pull', emoji: '🧲', defaultSets: 3, defaultReps: 8, difficulty: 'intermediate', instructions: 'Lie face down, form Y, T, and W shapes with arms.' },
  { id: 'floor-pull-backs', name: 'Floor Pull-backs', category: 'upper-pull', emoji: '🧲', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Lie face down, hands by sides, pull elbows back.' },
  { id: 'towel-rows', name: 'Towel Rows', category: 'upper-pull', emoji: '🧲', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Use a towel over a door for resistance rows.' },
  { id: 'isometric-towel-pulls', name: 'Isometric Towel Pulls', category: 'upper-pull', emoji: '🧲', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 20, isHold: true, difficulty: 'intermediate', instructions: 'Pull against a fixed towel and hold.' },

  // Core & Abs
  { id: 'plank', name: 'Plank', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Hold a straight body position on forearms and toes.' },
  { id: 'side-plank', name: 'Side Plank', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 20, isHold: true, difficulty: 'intermediate', instructions: 'Hold on one forearm and feet stacked sideways.' },
  { id: 'plank-shoulder-taps', name: 'Plank Shoulder Taps', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 20, difficulty: 'intermediate', instructions: 'In plank, tap opposite shoulder alternating.' },
  { id: 'hollow-body-hold', name: 'Hollow Body Hold', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 20, isHold: true, difficulty: 'intermediate', instructions: 'Lie on back, lift arms and legs slightly, hold.' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'On back, extend opposite arm and leg alternately.' },
  { id: 'bird-dog', name: 'Bird Dog', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'On all fours, extend opposite arm and leg.' },
  { id: 'crunches', name: 'Crunches', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 20, difficulty: 'beginner', instructions: 'Lie on back, curl shoulders toward hips.' },
  { id: 'bicycle-crunches', name: 'Bicycle Crunches', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 20, difficulty: 'intermediate', instructions: 'Crunch while bringing opposite elbow to knee.' },
  { id: 'reverse-crunches', name: 'Reverse Crunches', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 15, difficulty: 'intermediate', instructions: 'Lie on back, curl hips toward shoulders.' },
  { id: 'leg-raises', name: 'Leg Raises', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 12, difficulty: 'intermediate', instructions: 'Lie on back, raise straight legs up and down.' },
  { id: 'flutter-kicks', name: 'Flutter Kicks', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 30, difficulty: 'intermediate', instructions: 'Lie on back, alternate small leg kicks.' },
  { id: 'scissor-kicks', name: 'Scissor Kicks', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 20, difficulty: 'intermediate', instructions: 'Lie on back, cross legs over each other alternately.' },
  { id: 'v-ups', name: 'V-ups', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 10, difficulty: 'advanced', instructions: 'Lie flat, simultaneously raise legs and torso to form V.' },
  { id: 'sit-ups', name: 'Sit-ups', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 15, difficulty: 'beginner', instructions: 'Lie on back, sit all the way up.' },
  { id: 'russian-twists', name: 'Russian Twists', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 20, difficulty: 'intermediate', instructions: 'Seated, lean back slightly, rotate torso side to side.' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 30, difficulty: 'intermediate', instructions: 'Plank position, alternate driving knees to chest.' },
  { id: 'heel-taps', name: 'Heel Taps', category: 'core', emoji: '🧠', defaultSets: 3, defaultReps: 20, difficulty: 'beginner', instructions: 'Lie on back, reach side to side to tap heels.' },

  // Cardio / Full Body
  { id: 'jumping-jacks', name: 'Jumping Jacks', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 30, difficulty: 'beginner', instructions: 'Jump while spreading arms and legs, then return.' },
  { id: 'high-knees', name: 'High Knees', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 30, difficulty: 'beginner', instructions: 'Run in place, driving knees high.' },
  { id: 'butt-kicks', name: 'Butt Kicks', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 30, difficulty: 'beginner', instructions: 'Run in place, kicking heels to glutes.' },
  { id: 'skaters', name: 'Skaters', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 20, difficulty: 'intermediate', instructions: 'Jump side to side like a speed skater.' },
  { id: 'burpees', name: 'Burpees', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Squat, jump back to plank, push-up, jump up.' },
  { id: 'half-burpees', name: 'Half Burpees', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Burpee without the push-up.' },
  { id: 'squat-thrusts', name: 'Squat Thrusts', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 12, difficulty: 'intermediate', instructions: 'Jump from squat to plank and back.' },
  { id: 'bear-crawl', name: 'Bear Crawl', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 20, difficulty: 'intermediate', instructions: 'Crawl forward on hands and feet, knees off ground.' },
  { id: 'crab-walk', name: 'Crab Walk', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 20, difficulty: 'intermediate', instructions: 'Walk on hands and feet face up.' },
  { id: 'inchworms', name: 'Inchworms', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 8, difficulty: 'intermediate', instructions: 'Walk hands out to plank, then walk feet to hands.' },
  { id: 'shadow-boxing', name: 'Shadow Boxing', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 60, isHold: true, difficulty: 'beginner', instructions: 'Throw punches in the air with footwork.' },
  { id: 'fast-feet', name: 'Fast Feet', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Run in place as fast as possible.' },
  { id: 'stair-running', name: 'Stair Running', category: 'cardio', emoji: '❤️', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Run up and down stairs.' },

  // Mobility & Flexibility
  { id: 'arm-circles', name: 'Arm Circles', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 20, difficulty: 'beginner', instructions: 'Extend arms and make circular motions.' },
  { id: 'leg-swings', name: 'Leg Swings', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 15, difficulty: 'beginner', instructions: 'Swing leg forward and backward or side to side.' },
  { id: 'hip-circles', name: 'Hip Circles', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 15, difficulty: 'beginner', instructions: 'Circle hips in both directions.' },
  { id: 'cat-cow-stretch', name: 'Cat-Cow Stretch', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 10, difficulty: 'beginner', instructions: 'On all fours, alternate arching and rounding back.' },
  { id: 'childs-pose', name: "Child's Pose", category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Kneel, sit back on heels, stretch arms forward.' },
  { id: 'downward-dog', name: 'Downward Dog', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Inverted V position, hands and feet on ground.' },
  { id: 'cobra-stretch', name: 'Cobra Stretch', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 1, defaultHoldSeconds: 20, isHold: true, difficulty: 'beginner', instructions: 'Lie face down, push chest up with arms.' },
  { id: 'hip-flexor-stretch', name: 'Hip Flexor Stretch', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Lunge position, push hips forward.' },
  { id: 'hamstring-stretch', name: 'Hamstring Stretch', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Sit with one leg extended, reach for toes.' },
  { id: 'calf-stretch', name: 'Calf Stretch', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Push against a wall with one leg back.' },
  { id: 'shoulder-stretch', name: 'Shoulder Stretch', category: 'mobility', emoji: '🧘', defaultSets: 2, defaultReps: 1, defaultHoldSeconds: 20, isHold: true, difficulty: 'beginner', instructions: 'Cross one arm across chest and hold.' },

  // Balance & Stability
  { id: 'single-leg-balance', name: 'Single-Leg Balance', category: 'balance', emoji: '⚖️', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 30, isHold: true, difficulty: 'beginner', instructions: 'Stand on one leg, hold balance.' },
  { id: 'single-leg-reach', name: 'Single-Leg Reach', category: 'balance', emoji: '⚖️', defaultSets: 3, defaultReps: 10, difficulty: 'intermediate', instructions: 'Stand on one leg, reach down and around.' },
  { id: 'airplane-pose', name: 'Airplane Pose', category: 'balance', emoji: '⚖️', defaultSets: 3, defaultReps: 1, defaultHoldSeconds: 20, isHold: true, difficulty: 'intermediate', instructions: 'Balance on one leg with arms and back leg extended.' },
  { id: 'single-leg-rdl', name: 'Single-Leg Romanian Deadlift', category: 'balance', emoji: '⚖️', defaultSets: 3, defaultReps: 8, difficulty: 'intermediate', instructions: 'Hinge at hips on one leg, extend other leg back.' },
  { id: 'standing-knee-raises', name: 'Standing Knee Raises', category: 'balance', emoji: '⚖️', defaultSets: 3, defaultReps: 12, difficulty: 'beginner', instructions: 'Lift knee to hip height while balancing.' },
];

export const getExercisesByCategory = (categoryId: string): AtHomeExercise[] => {
  return atHomeExercises.filter(ex => ex.category === categoryId);
};

export const getExerciseById = (id: string): AtHomeExercise | undefined => {
  return atHomeExercises.find(ex => ex.id === id);
};
