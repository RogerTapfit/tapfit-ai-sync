import { Machine, MachineToWorkout } from '@/types/machine';
import { getMachineImageUrl } from '@/utils/machineImageUtils';

// Machine catalog based on existing workout system
export const MACHINE_CATALOG: Machine[] = [
  {
    id: 'MCH-CHEST-PRESS',
    name: 'Chest Press Machine',
    type: 'Chest Press',
    synonyms: ['chest press', 'seated chest press'],
    imageUrl: '/lovable-uploads/72acfefe-3a0e-4d74-b92f-ce88b0a38d7e.png',
    workoutId: 'chest-press',
    muscleGroup: 'chest'
  },
  {
    id: 'MCH-PEC-DECK',
    name: 'Pec Deck (Butterfly) Machine',
    type: 'Pec Deck',
    synonyms: ['pec deck', 'butterfly', 'pec fly'],
    imageUrl: '/lovable-uploads/af389dea-9b59-4435-99bb-8c851f048940.png',
    workoutId: 'pec-deck',
    muscleGroup: 'chest'
  },
  {
    id: 'MCH-INCLINE-CHEST',
    name: 'Incline Chest Press',
    type: 'Incline Press',
    synonyms: ['incline chest', 'incline press'],
    imageUrl: '/lovable-uploads/a0730c0a-c88b-43fa-b6d0-fad9941cc39b.png',
    workoutId: 'incline-chest-press',
    muscleGroup: 'chest'
  },
  {
    id: 'MCH-LAT-PULLDOWN',
    name: 'Lat Pulldown Machine',
    type: 'Lat Pulldown',
    synonyms: ['lat pulldown', 'lat pull down', 'pulldown'],
    imageUrl: '/lovable-uploads/f42105be-a95d-44b0-8d72-a77b6cbffee1.png',
    workoutId: 'lat-pulldown',
    muscleGroup: 'back'
  },
  {
    id: 'MCH-SEATED-ROW',
    name: 'Seated Row Machine',
    type: 'Seated Row',
    synonyms: ['seated row', 'cable row'],
    imageUrl: '/lovable-uploads/c38c89e5-0aa7-45e8-954a-109f4e471db7.png',
    workoutId: 'seated-row',
    muscleGroup: 'back'
  },
  {
    id: 'MCH-LEG-PRESS',
    name: 'Leg Press Machine',
    type: 'Leg Press',
    synonyms: ['leg press', 'seated leg press'],
    imageUrl: '/lovable-uploads/f62a3fb2-b5ea-4582-b7ff-550a03b3c767.png',
    workoutId: 'leg-press',
    muscleGroup: 'legs'
  },
  {
    id: 'MCH-LEG-EXTENSION',
    name: 'Leg Extension Machine',
    type: 'Leg Extension',
    synonyms: ['leg extension', 'quad extension'],
    imageUrl: '/lovable-uploads/2bdee4e4-d58f-4a51-96fc-5d7e92eeced9.png',
    workoutId: 'leg-extension',
    muscleGroup: 'legs'
  },
  {
    id: 'MCH-SHOULDER-PRESS',
    name: 'Shoulder Press Machine',
    type: 'Shoulder Press',
    synonyms: ['shoulder press', 'overhead press'],
    imageUrl: '/lovable-uploads/61f89507-de07-4a05-82a5-5114ac500e76.png',
    workoutId: 'shoulder-press',
    muscleGroup: 'shoulders'
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