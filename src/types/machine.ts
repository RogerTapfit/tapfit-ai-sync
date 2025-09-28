export interface Machine {
  id: string;              // "MCH-PEC-DECK"
  name: string;            // "Pec Deck (Butterfly) Machine"
  type: string;            // "Chest Press"
  synonyms?: string[];     // ["pec deck", "butterfly"]
  imageUrl: string;        // Existing lovable-uploads path
  workoutId: string;       // Direct mapping to workout system
  muscleGroup: string;     // "chest", "back", etc.
}

export interface MachineToWorkout {
  machineId: string;       // "MCH-PEC-DECK"
  workoutId: string;       // "WKT-PEC-DECK-01"
  variant?: string;        // "wide-grip" | "neutral"
}

export interface ScanResult {
  type: "vision" | "manual" | "nfc";
  machineId: string;
  confidence: number;
  alternatives?: Machine[];
}

export interface RecognitionResult {
  machineId: string;
  name: string;
  confidence: number;
  imageUrl: string;
  reasoning?: string;
}