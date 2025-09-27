import { RecognitionResult, Machine } from '@/types/machine';
import { MachineRegistryService } from './machineRegistryService';

export class MachineRecognitionService {
  private static readonly CONFIDENCE_THRESHOLD = 0.75;
  private static readonly MIN_ALTERNATIVES = 3;

  /**
   * Template matching using existing machine images
   * This is a placeholder for actual computer vision implementation
   */
  static async recognizeFromFrame(imageData: ImageData | HTMLCanvasElement): Promise<RecognitionResult[]> {
    // Simulate recognition processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // For MVP, return mock results based on available machines
    // In production, this would use actual computer vision
    const machines = MachineRegistryService.getAllMachines();
    
    // Mock recognition with random confidence scores
    const results: RecognitionResult[] = machines
      .map(machine => ({
        machineId: machine.id,
        name: machine.name,
        confidence: Math.random() * 0.4 + 0.5, // Random confidence 0.5-0.9
        imageUrl: machine.imageUrl
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Top 5 results

    return results;
  }

  /**
   * Get the best recognition result above threshold
   */
  static getBestMatch(results: RecognitionResult[]): RecognitionResult | null {
    const best = results[0];
    return best && best.confidence >= this.CONFIDENCE_THRESHOLD ? best : null;
  }

  /**
   * Get alternative matches when confidence is low
   */
  static getAlternatives(results: RecognitionResult[]): RecognitionResult[] {
    return results.slice(0, this.MIN_ALTERNATIVES);
  }

  /**
   * Check if confidence is high enough for auto-navigation
   */
  static isHighConfidence(confidence: number): boolean {
    return confidence >= this.CONFIDENCE_THRESHOLD;
  }

  /**
   * Process recognition results and determine action
   */
  static processResults(results: RecognitionResult[]): {
    bestMatch: RecognitionResult | null;
    alternatives: RecognitionResult[];
    shouldAutoNavigate: boolean;
  } {
    const bestMatch = this.getBestMatch(results);
    const alternatives = this.getAlternatives(results);
    const shouldAutoNavigate = bestMatch !== null;

    return {
      bestMatch,
      alternatives,
      shouldAutoNavigate
    };
  }
}