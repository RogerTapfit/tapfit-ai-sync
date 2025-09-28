import { RecognitionResult, Machine } from '@/types/machine';
import { MachineRegistryService } from './machineRegistryService';
import { supabase } from '@/integrations/supabase/client';

export class MachineRecognitionService {
  private static readonly CONFIDENCE_THRESHOLD = 0.85; // Raised for better accuracy
  private static readonly MIN_ALTERNATIVES = 3;

  /**
   * AI-powered machine recognition using OpenAI vision
   */
  static async recognizeFromFrame(imageData: ImageData | HTMLCanvasElement): Promise<RecognitionResult[]> {
    try {
      // Convert image data to base64
      const base64Image = await this.convertToBase64(imageData);
      
      // Get current machine catalog to send to AI
      const machineCatalog = MachineRegistryService.getAllMachines().map(machine => ({
        id: machine.id,
        name: machine.name,
        type: machine.type,
        synonyms: machine.synonyms || [],
        description: this.getMachineDescription(machine)
      }));
      
      // Call our Supabase edge function for AI analysis
      const { data, error } = await supabase.functions.invoke('analyzeMachine', {
        body: {
          imageData: base64Image,
          imageFormat: 'jpeg',
          machineCatalog: machineCatalog
        }
      });

      if (error) {
        console.error('Machine analysis error:', error);
        return this.getNotRecognizedResult('Unable to analyze image. Please try again.');
      }

      if (!data.success || !data.analysis) {
        console.warn('Machine analysis failed:', data.error);
        return this.getNotRecognizedResult(data.analysis?.reasoning);
      }

      const analysis = data.analysis;
      
      // If AI identified a machine, return it with high confidence
      if (analysis.machineId && analysis.confidence >= 0.6) {
        const machine = MachineRegistryService.getMachineById(analysis.machineId);
        if (machine) {
          const mainResult: RecognitionResult = {
            machineId: analysis.machineId,
            name: analysis.machineName || machine.name,
            confidence: analysis.confidence,
            imageUrl: machine.imageUrl,
            reasoning: analysis.reasoning
          };

          // Add some alternatives with lower confidence
          const alternatives = this.getAlternativeResults(analysis.machineId, analysis.confidence);
          
          return [mainResult, ...alternatives];
        }
      }

      // If AI couldn't identify with good confidence, show what it saw
      console.log('AI analysis uncertain:', analysis.reasoning);
      return this.getNotRecognizedResult(analysis.reasoning);

    } catch (error) {
      console.error('Error in machine recognition:', error);
      return this.getNotRecognizedResult('Unable to analyze image. Please try again.');
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
   * Get machine description for AI analysis
   */
  private static getMachineDescription(machine: Machine): string {
    const descriptions: Record<string, string> = {
      'MCH-CHEST-PRESS': 'Horizontal pressing motion with handles at chest level, slightly reclined seat back (~15-30°)',
      'MCH-INCLINE-CHEST-PRESS': 'Angled pressing motion with significant upward angle, seat back at 30-45° incline',
      'MCH-SHOULDER-PRESS': 'Vertical/overhead pressing motion with handles above shoulder level, upright seat back (~90°)',
      'MCH-PEC-DECK': 'Arm pads that swing together in front of torso, no bar/handles, seated position',
      'MCH-LAT-PULLDOWN': 'Overhead bar pulled down to chest, cable system with lat bar',
      'MCH-SEATED-ROW': 'Horizontal pulling motion, seated with chest pad, cable handles',
      'MCH-LEG-PRESS': 'Angled leg pressing platform, seated with back support',
      'MCH-LEG-EXTENSION': 'Seated position with leg pad that lifts up, targets quadriceps',
      'MCH-TREADMILL': 'Moving belt for walking/running, with handrails and control panel',
      'MCH-ELLIPTICAL': 'Standing position with moving foot pedals and arm handles, elliptical motion',
      'MCH-STATIONARY-BIKE': 'Seated cycling position with pedals and handlebars',
      'MCH-ROWING-MACHINE': 'Seated with sliding seat and pulling handle, mimics rowing motion',
      'MCH-STAIR-CLIMBER': 'Standing position with stepping pedals that move up and down',
      'MCH-BENCH-PRESS': 'Free barbell on J-hooks with adjustable bench; no rails, guide rods, or weight stack',
      'MCH-SMITH-MACHINE': 'Barbell fixed on vertical rails with safety stops and guided linear path'
    };
    
    return descriptions[machine.id] || `${machine.type} machine for ${machine.muscleGroup} training`;
  }

  /**
   * Handle cases where machine is not recognized or not in catalog
   */
  private static getNotRecognizedResult(reasoning?: string): RecognitionResult[] {
    const unknownResult: RecognitionResult = {
      machineId: 'UNKNOWN',
      name: 'Machine Not Recognized',
      confidence: 0,
      imageUrl: '/lovable-uploads/red-robot-clean.png',
      reasoning: reasoning || 'Unable to identify this machine from the available catalog'
    };

    // Add all machines as browseable alternatives
    const allMachines = this.getAllMachinesAsAlternatives();
    
    return [unknownResult, ...allMachines];
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
   * Get all machines as alternatives for browsing (when not recognized)
   */
  static getAllMachinesAsAlternatives(): RecognitionResult[] {
    const machines = MachineRegistryService.getAllMachines();
    return machines.map(machine => ({
      machineId: machine.id,
      name: machine.name,
      confidence: 0,
      imageUrl: machine.imageUrl,
      reasoning: `Browse ${machine.type} machine`
    }));
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