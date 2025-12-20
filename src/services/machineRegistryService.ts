import { Machine, MachineToWorkout } from '@/types/machine';
import { getMachineImageUrl } from '@/utils/machineImageUtils';

// Unified machine catalog including both strength and cardio machines
export const MACHINE_CATALOG: Machine[] = [
  // Strength Training Machines
  {
    id: 'MCH-CHEST-PRESS',
    name: 'Chest Press Machine',
    type: 'Chest Press',
    synonyms: ['chest press', 'seated chest press', 'horizontal chest press'],
    imageUrl: '/lovable-uploads/72acfefe-3a0e-4d74-b92f-ce88b0a38d7e.png',
    workoutId: 'chest-press',
    muscleGroup: 'chest'
  },
  {
    id: 'MCH-INCLINE-CHEST-PRESS',
    name: 'Incline Chest Press Machine',
    type: 'Incline Press',
    synonyms: ['incline chest press', 'incline press', 'angled chest press'],
    imageUrl: '/lovable-uploads/a0730c0a-c88b-43fa-b6d0-fad9941cc39b.png',
    workoutId: 'incline-chest-press',
    muscleGroup: 'chest'
  },
  {
    id: 'MCH-SHOULDER-PRESS',
    name: 'Shoulder Press Machine',
    type: 'Shoulder Press',
    synonyms: ['shoulder press', 'overhead press', 'military press'],
    imageUrl: '/lovable-uploads/61f89507-de07-4a05-82a5-5114ac500e76.png',
    workoutId: 'shoulder-press',
    muscleGroup: 'shoulders'
  },
  {
    id: 'MCH-PEC-DECK',
    name: 'Pec Deck (Butterfly) Machine',
    type: 'Pec Deck',
    synonyms: ['pec deck', 'butterfly', 'pec fly', 'chest fly'],
    imageUrl: '/lovable-uploads/af389dea-9b59-4435-99bb-8c851f048940.png',
    workoutId: 'pec-deck',
    muscleGroup: 'chest'
  },
  {
    id: 'MCH-LAT-PULLDOWN',
    name: 'Lat Pulldown Machine',
    type: 'Lat Pulldown',
    synonyms: ['lat pulldown', 'lat pull down', 'pulldown', 'wide grip pulldown', 'close grip pulldown', 'reverse grip pulldown'],
    imageUrl: '/lovable-uploads/lat-pulldown-machine-red.png',
    workoutId: 'lat-pulldown',
    muscleGroup: 'back'
  },
  {
    id: 'MCH-LAT-PULLDOWN-HOIST',
    name: 'Hoist Lat Pulldown Machine',
    type: 'Lat Pulldown',
    synonyms: ['hoist lat pulldown', 'hoist pulldown', 'plate loaded lat pulldown', 'hoist lat pull down', 'hoist machine'],
    imageUrl: '/lovable-uploads/hoist-lat-pulldown-red-black.png',
    workoutId: 'lat-pulldown-hoist',
    muscleGroup: 'back'
  },
  {
    id: 'MCH-SEATED-ROW',
    name: 'Seated Row Machine',
    type: 'Seated Row',
    synonyms: ['seated row', 'cable row', 'horizontal row'],
    imageUrl: '/lovable-uploads/c38c89e5-0aa7-45e8-954a-109f4e471db7.png',
    workoutId: 'seated-row',
    muscleGroup: 'back'
  },
  {
    id: 'MCH-LEG-PRESS',
    name: 'Leg Press Machine',
    type: 'Leg Press',
    synonyms: ['leg press', 'seated leg press', 'plate loaded leg press'],
    imageUrl: '/lovable-uploads/f62a3fb2-b5ea-4582-b7ff-550a03b3c767.png',
    workoutId: 'leg-press',
    muscleGroup: 'legs'
  },
  {
    id: 'MCH-LEG-EXTENSION',
    name: 'Leg Extension Machine',
    type: 'Leg Extension',
    synonyms: ['leg extension', 'quad extension', 'knee extension', 'leg lift machine', 'leg lifts', 'leg lift'],
    imageUrl: '/lovable-uploads/2bdee4e4-d58f-4a51-96fc-5d7e92eeced9.png',
    workoutId: 'leg-extension',
    muscleGroup: 'legs'
  },
  
  // Free Weight Stations
  {
    id: 'MCH-BENCH-PRESS',
    name: 'Bench Press (Barbell Station)',
    type: 'Bench Press',
    synonyms: ['bench press', 'flat bench press', 'barbell bench', 'olympic bench', 'bench with rack', 'bench station'],
    imageUrl: '/lovable-uploads/bench-press.png',
    workoutId: 'bench-press',
    muscleGroup: 'chest'
  },
  {
    id: 'MCH-SMITH-MACHINE',
    name: 'Smith Machine',
    type: 'Smith Machine',
    synonyms: ['smith machine', 'guided bar', 'smith rack', 'linear bearings', 'guided barbell'],
    imageUrl: '/lovable-uploads/55d72a0c-1e5a-4d6f-abfa-edfe80701063.png',
    workoutId: 'smith-machine',
    muscleGroup: 'chest'
  },
  
  // Cardio Machines
  {
    id: 'MCH-TREADMILL',
    name: 'Treadmill',
    type: 'Cardio',
    synonyms: ['treadmill', 'running machine', 'walking machine'],
    imageUrl: '/lovable-uploads/6630a6e4-06d7-48ce-9212-f4d4991f4b35.png',
    workoutId: 'treadmill-cardio',
    muscleGroup: 'cardio'
  },
  {
    id: 'MCH-ELLIPTICAL',
    name: 'Precor Elliptical Trainer',
    type: 'Cardio',
    synonyms: ['elliptical', 'cross trainer', 'elliptical trainer', 'precor', 'precor elliptical', 'cross-trainer'],
    imageUrl: '/assets/precor-elliptical-red.png',
    workoutId: 'elliptical-cardio',
    muscleGroup: 'cardio'
  },
  {
    id: 'MCH-STATIONARY-BIKE',
    name: 'Stationary Bike',
    type: 'Cardio',
    synonyms: ['stationary bike', 'exercise bike', 'spin bike', 'cycling machine', 'cycle'],
    imageUrl: '/assets/indoor-cycling-bike-red.png',
    workoutId: 'bike-cardio',
    muscleGroup: 'cardio'
  },
  {
    id: 'MCH-ROWING-MACHINE',
    name: 'Rowing Machine',
    type: 'Cardio',
    synonyms: ['rowing machine', 'rower', 'erg', 'concept2'],
    imageUrl: '/lovable-uploads/2659df27-2ead-4acf-ace3-edd4b33cad78.png',
    workoutId: 'rowing-cardio',
    muscleGroup: 'cardio'
  },
  {
    id: 'MCH-STAIR-CLIMBER',
    name: 'Stair Climber',
    type: 'Cardio',
    synonyms: ['stair climber', 'stair master', 'step machine', 'stairmaster'],
    imageUrl: '/lovable-uploads/53858814-478c-431c-8c54-feecf0b00e19.png',
    workoutId: 'stairs-cardio',
    muscleGroup: 'cardio'
  },
  {
    id: 'MCH-INDOOR-CYCLING-BIKE',
    name: 'Indoor Cycling Bike',
    type: 'Cardio',
    synonyms: ['indoor cycling bike', 'spin bike', 'indoor bike', 'cycle bike', 'stages bike', 'peloton', 'spinning bike'],
    imageUrl: '/assets/indoor-cycling-bike-red.png',
    workoutId: 'indoor-cycling-cardio',
    muscleGroup: 'cardio'
  },
  {
    id: 'MCH-AMT',
    name: 'Precor AMT (Adaptive Motion Trainer)',
    type: 'Cardio',
    synonyms: ['amt', 'adaptive motion trainer', 'precor amt', 'adaptive trainer', 'motion trainer'],
    imageUrl: '/assets/precor-amt-red.png',
    workoutId: 'amt-cardio',
    muscleGroup: 'cardio'
  },
  {
    id: 'MCH-ROPE-TRAINER',
    name: 'Marpo Rope Trainer',
    type: 'Functional',
    synonyms: ['rope trainer', 'marpo', 'rope climb', 'rope pull', 'vmx', 'vlt', 'rope machine'],
    imageUrl: '/assets/marpo-rope-trainer-red.png',
    workoutId: 'rope-trainer',
    muscleGroup: 'functional'
  },
  {
    id: 'MCH-FIXED-BARBELL-RACK',
    name: 'Fixed Barbell Rack',
    type: 'Free Weights',
    synonyms: ['fixed barbell', 'barbell rack', 'free weights', 'straight bar', 'ez bar', 'curl bar', 'preloaded barbell'],
    imageUrl: '/assets/fixed-barbell-rack-red.png',
    workoutId: 'fixed-barbell-rack',
    muscleGroup: 'strength'
  },
  {
    id: 'MCH-DUMBBELLS',
    name: 'Dumbbells',
    type: 'Free Weights',
    synonyms: ['dumbbells', 'dumbbell', 'free weights', 'hand weights', 'rubber dumbbells', 'hex dumbbells', 'adjustable dumbbells'],
    imageUrl: '/assets/dumbbells-red-black.png',
    workoutId: 'dumbbells',
    muscleGroup: 'strength'
  },
  {
    id: 'MCH-GLUTE-KICKBACK',
    name: 'Glute Kickback Machine',
    type: 'Hip Extension',
    synonyms: ['glute kickback', 'hip extension machine', 'rear kick machine', 'glute extension', 'kickback machine', 'lying glute extension'],
    imageUrl: '/lovable-uploads/glute-kickback-machine-red-black.png',
    workoutId: 'glute-kickback',
    muscleGroup: 'glutes'
  },
  {
    id: 'MCH-INNER-THIGH-ADDUCTOR',
    name: 'Inner Thigh (Adductor) Machine',
    type: 'Hip Adduction',
    synonyms: ['adductor machine', 'inner thigh machine', 'hip adduction machine', 'thigh adductor', 'inner leg machine', 'leg adduction'],
    imageUrl: '/lovable-uploads/inner-thigh-adductor-machine-red-black.png',
    workoutId: 'inner-thigh-adductor',
    muscleGroup: 'legs'
  },
  {
    id: 'MCH-OUTER-THIGH-ABDUCTOR',
    name: 'Outer Thigh (Hip Abduction) Machine',
    type: 'Hip Abduction',
    synonyms: ['hip abduction machine', 'outer thigh machine', 'abductor machine', 'thigh abductor', 'outer leg machine', 'leg abduction', 'hip abductor'],
    imageUrl: '/lovable-uploads/outer-thigh-abductor-machine-red-black.png',
    workoutId: 'outer-thigh-abductor',
    muscleGroup: 'glutes'
  },
  {
    id: 'MCH-ABDOMINAL-CRUNCH',
    name: 'Abdominal Crunch Machine (Hoist)',
    type: 'Core',
    synonyms: ['abdominal crunch machine', 'ab crunch machine', 'crunch machine', 'hoist crunch', 'ab machine', 'core machine', 'rectus abdominis machine'],
    imageUrl: '/lovable-uploads/abdominal-crunch-machine-hoist-red.png',
    workoutId: 'abdominal-crunch',
    muscleGroup: 'core'
  },
  {
    id: 'MCH-BICEPS-CURL',
    name: 'Seated Biceps Curl Machine (Hoist Roc-It)',
    type: 'Arm Curl',
    synonyms: ['biceps curl machine', 'bicep curl', 'arm curl machine', 'seated biceps curl', 'hoist biceps', 'roc-it biceps'],
    imageUrl: '/lovable-uploads/hoist-biceps-curl-machine-red.png',
    workoutId: 'biceps-curl',
    muscleGroup: 'arms'
  },
  {
    id: 'MCH-SEATED-DIP',
    name: 'Seated Dip Machine',
    type: 'Compound Push',
    synonyms: ['seated dip', 'dip machine', 'assisted dip', 'tricep dip machine', 'chest dip machine'],
    imageUrl: '/lovable-uploads/seated-dip-machine-red.png',
    workoutId: 'seated-dip',
    muscleGroup: 'arms'
  },
  {
    id: 'MCH-TRICEPS-PUSHDOWN',
    name: 'Triceps Pushdown (Cable)',
    type: 'Isolation Push',
    synonyms: ['triceps pushdown', 'cable pushdown', 'tricep pushdown', 'rope pushdown', 'triceps extension', 'overhead cable extension', 'cable tricep extension'],
    imageUrl: '/lovable-uploads/triceps-pushdown-machine-red.png',
    workoutId: 'triceps-pushdown',
    muscleGroup: 'arms'
  }
];

// Machine to workout mapping
export const MACHINE_TO_WORKOUT: MachineToWorkout[] = MACHINE_CATALOG.map(machine => ({
  machineId: machine.id,
  workoutId: machine.workoutId
}));

export class MachineRegistryService {
  static getMachineById(id: string): Machine | undefined {
    return MACHINE_CATALOG.find(machine => machine.id === id);
  }

  static getMachineByName(name: string): Machine | undefined {
    const normalizedName = name.toLowerCase().trim();
    return MACHINE_CATALOG.find(machine => 
      machine.name.toLowerCase().includes(normalizedName) ||
      machine.synonyms?.some(synonym => synonym.toLowerCase().includes(normalizedName))
    );
  }

  static getWorkoutIdByMachineId(machineId: string): string | undefined {
    const mapping = MACHINE_TO_WORKOUT.find(m => m.machineId === machineId);
    return mapping?.workoutId;
  }

  static getAllMachines(): Machine[] {
    return MACHINE_CATALOG;
  }

  static getMachineByWorkoutId(workoutId: string): Machine | undefined {
    return MACHINE_CATALOG.find(machine => machine.workoutId === workoutId);
  }

  static searchMachines(query: string): Machine[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return MACHINE_CATALOG;

    return MACHINE_CATALOG.filter(machine =>
      machine.name.toLowerCase().includes(normalizedQuery) ||
      machine.type.toLowerCase().includes(normalizedQuery) ||
      machine.muscleGroup.toLowerCase().includes(normalizedQuery) ||
      machine.synonyms?.some(synonym => synonym.toLowerCase().includes(normalizedQuery))
    );
  }
}