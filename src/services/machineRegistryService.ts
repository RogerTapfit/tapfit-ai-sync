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
    synonyms: ['lat pulldown', 'lat pull down', 'pulldown', 'wide grip pulldown'],
    imageUrl: '/lovable-uploads/f42105be-a95d-44b0-8d72-a77b6cbffee1.png',
    workoutId: 'lat-pulldown',
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
    name: 'Elliptical Machine',
    type: 'Cardio',
    synonyms: ['elliptical', 'cross trainer', 'elliptical trainer'],
    imageUrl: '/lovable-uploads/9b6efa63-f917-4f9e-8b82-31076b66aff5.png',
    workoutId: 'elliptical-cardio',
    muscleGroup: 'cardio'
  },
  {
    id: 'MCH-STATIONARY-BIKE',
    name: 'Stationary Bike',
    type: 'Cardio',
    synonyms: ['stationary bike', 'exercise bike', 'spin bike', 'cycling machine'],
    imageUrl: '/lovable-uploads/28009a8a-51b5-4196-bd00-c1ad68b67bc0.png',
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
    synonyms: ['stair climber', 'stair master', 'step machine'],
    imageUrl: '/lovable-uploads/6630a6e4-06d7-48ce-9212-f4d4991f4b35.png',
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