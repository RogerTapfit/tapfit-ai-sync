import { RecognitionResult, Machine } from '@/types/machine';
import { MachineRegistryService } from './machineRegistryService';
import { supabase } from '@/integrations/supabase/client';

export class MachineRecognitionService {
  private static readonly CONFIDENCE_THRESHOLD = 0.75;
  private static readonly MIN_ALTERNATIVES = 3;

  /**
   * AI-powered machine recognition using OpenAI vision
   */
  static async recognizeFromFrame(imageData: ImageData | HTMLCanvasElement): Promise<RecognitionResult[]> {
    try {
      // Convert image data to base64
      const base64Image = await this.convertToBase64(imageData);
      
      // Call our Supabase edge function for AI analysis
      const { data, error } = await supabase.functions.invoke('analyzeMachine', {
        body: {
          imageData: base64Image,
          imageFormat: 'jpeg'
        }
      });

      if (error) {
        console.error('Machine analysis error:', error);
        return this.getFallbackResults();
      }

      if (!data.success || !data.analysis) {
        console.warn('Machine analysis failed:', data.error);
        return this.getFallbackResults();
      }

      const analysis = data.analysis;
      
      // If AI identified a machine, return it with high confidence
      if (analysis.machineId && analysis.confidence >= 0.6) {
        const machine = MachineRegistryService.getMachineById(analysis.machineId);
        if (machine) {
          const mainResult: RecognitionResult = {
            machineId: analysis.machineId,
            name: analysis.machineName,
            confidence: analysis.confidence,
            imageUrl: machine.imageUrl,
            reasoning: analysis.reasoning
          };

          // Add some alternatives with lower confidence
          const alternatives = this.getAlternativeResults(analysis.machineId, analysis.confidence);
          
          return [mainResult, ...alternatives];
        }
      }

      // If AI couldn't identify with good confidence, return alternatives
      console.log('AI analysis uncertain:', analysis.reasoning);
      return this.getFallbackResults();

    } catch (error) {
      console.error('Error in machine recognition:', error);
      return this.getFallbackResults();
    }
  }

  /**
   * Convert ImageData or Canvas to base64
   */
  private static async convertToBase64(imageData: ImageData | HTMLCanvasElement): Promise<string> {
    return new Promise((resolve) => {
      let canvas: HTMLCanvasElement;
      
      if (imageData instanceof HTMLCanvasElement) {
        canvas = imageData;
      } else {
        // Convert ImageData to canvas
        canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);
      }

      // Convert to base64 (remove data:image/jpeg;base64, prefix)
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      resolve(base64);
    });
  }

  /**
   * Get fallback results when AI analysis fails
   */
  private static getFallbackResults(): RecognitionResult[] {
    const machines = MachineRegistryService.getAllMachines();
    
    // Return top machines with moderate confidence
    return machines
      .slice(0, this.MIN_ALTERNATIVES)
      .map(machine => ({
        machineId: machine.id,
        name: machine.name,
        confidence: 0.4, // Lower confidence to indicate uncertainty
        imageUrl: machine.imageUrl,
        reasoning: 'Unable to analyze image clearly. Please try a clearer photo.'
      }));
  }

  /**
   * Get alternative machine suggestions based on the identified machine
   */
  private static getAlternativeResults(identifiedMachineId: string, baseConfidence: number): RecognitionResult[] {
    const machines = MachineRegistryService.getAllMachines();
    const identifiedMachine = machines.find(m => m.id === identifiedMachineId);
    
    if (!identifiedMachine) return [];

    // Find similar machines (same muscle group or type)
    const alternatives = machines
      .filter(machine => 
        machine.id !== identifiedMachineId && 
        machine.muscleGroup === identifiedMachine.muscleGroup
      )
      .slice(0, 2)
      .map(machine => ({
        machineId: machine.id,
        name: machine.name,
        confidence: Math.max(0.3, baseConfidence - 0.2 - Math.random() * 0.1),
        imageUrl: machine.imageUrl,
        reasoning: `Similar ${machine.muscleGroup} machine`
      }));

    return alternatives;
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