import { AnimationAsset } from './firebaseService';

// Animation categories and triggers
export const ANIMATION_CATEGORIES = {
  celebration: {
    name: 'Celebration',
    description: 'Victory and achievement animations',
    triggers: ['workout_complete', 'goal_achieved', 'milestone_reached', 'new_record']
  },
  workout: {
    name: 'Workout',
    description: 'Exercise and training animations',
    triggers: ['exercise_start', 'rep_count', 'set_complete', 'form_correction']
  },
  idle: {
    name: 'Idle',
    description: 'Passive and ambient animations',
    triggers: ['app_open', 'menu_navigation', 'waiting', 'background']
  },
  coaching: {
    name: 'Coaching',
    description: 'Instructional and motivational animations',
    triggers: ['exercise_demo', 'motivation', 'rest_period', 'encouragement']
  },
  expression: {
    name: 'Expression',
    description: 'Emotional and reactive animations',
    triggers: ['happy', 'excited', 'focused', 'tired', 'surprised', 'determined']
  }
};

// Predefined animation library for TapFit
export const TAPFIT_ANIMATIONS = {
  celebration: [
    {
      id: 'victory_dance',
      name: 'Victory Dance',
      type: 'lottie',
      description: 'Energetic celebration dance',
      triggers: ['workout_complete', 'goal_achieved'],
      duration: 3000,
      tags: ['victory', 'dance', 'energetic']
    },
    {
      id: 'trophy_raise',
      name: 'Trophy Raise',
      type: 'lottie',
      description: 'Raising trophy in victory',
      triggers: ['new_record', 'milestone_reached'],
      duration: 2500,
      tags: ['trophy', 'victory', 'achievement']
    },
    {
      id: 'confetti_celebration',
      name: 'Confetti Celebration',
      type: 'rive',
      description: 'Confetti burst with celebration',
      triggers: ['major_milestone', 'level_up'],
      duration: 4000,
      tags: ['confetti', 'celebration', 'milestone']
    },
    {
      id: 'muscle_flex',
      name: 'Muscle Flex',
      type: 'lottie',
      description: 'Proud muscle flexing',
      triggers: ['strength_goal', 'pr_achieved'],
      duration: 2000,
      tags: ['flex', 'strength', 'proud']
    }
  ],
  
  workout: [
    {
      id: 'rep_counter',
      name: 'Rep Counter',
      type: 'rive',
      description: 'Interactive rep counting animation',
      triggers: ['rep_count', 'exercise_active'],
      duration: 1000,
      tags: ['counting', 'reps', 'interactive']
    },
    {
      id: 'form_check',
      name: 'Form Check',
      type: 'lottie',
      description: 'Exercise form demonstration',
      triggers: ['form_correction', 'exercise_demo'],
      duration: 3000,
      tags: ['form', 'technique', 'education']
    },
    {
      id: 'intensity_meter',
      name: 'Intensity Meter',
      type: 'rive',
      description: 'Real-time workout intensity display',
      triggers: ['heart_rate_change', 'intensity_update'],
      duration: 0, // Continuous
      tags: ['intensity', 'heart_rate', 'monitoring']
    },
    {
      id: 'rest_timer',
      name: 'Rest Timer',
      type: 'lottie',
      description: 'Countdown timer for rest periods',
      triggers: ['rest_period', 'set_complete'],
      duration: 60000, // Variable
      tags: ['timer', 'rest', 'countdown']
    }
  ],
  
  idle: [
    {
      id: 'breathing',
      name: 'Gentle Breathing',
      type: 'lottie',
      description: 'Subtle breathing animation',
      triggers: ['idle', 'background'],
      duration: 4000,
      tags: ['breathing', 'calm', 'ambient']
    },
    {
      id: 'floating',
      name: 'Floating',
      type: 'rive',
      description: 'Gentle floating motion',
      triggers: ['menu_navigation', 'waiting'],
      duration: 6000,
      tags: ['floating', 'gentle', 'ambient']
    },
    {
      id: 'pulse_glow',
      name: 'Pulse Glow',
      type: 'lottie',
      description: 'Soft pulsing glow effect',
      triggers: ['notification', 'attention'],
      duration: 2000,
      tags: ['glow', 'pulse', 'attention']
    }
  ],
  
  coaching: [
    {
      id: 'thumbs_up',
      name: 'Thumbs Up',
      type: 'lottie',
      description: 'Encouraging thumbs up gesture',
      triggers: ['encouragement', 'good_form'],
      duration: 1500,
      tags: ['thumbs_up', 'encouragement', 'positive']
    },
    {
      id: 'pointing_instruction',
      name: 'Pointing Instruction',
      type: 'lottie',
      description: 'Pointing to demonstrate technique',
      triggers: ['exercise_demo', 'instruction'],
      duration: 2000,
      tags: ['pointing', 'instruction', 'demo']
    },
    {
      id: 'clapping',
      name: 'Clapping',
      type: 'lottie',
      description: 'Enthusiastic clapping',
      triggers: ['motivation', 'set_complete'],
      duration: 2500,
      tags: ['clapping', 'enthusiasm', 'motivation']
    },
    {
      id: 'coach_whistle',
      name: 'Coach Whistle',
      type: 'rive',
      description: 'Coach blowing whistle',
      triggers: ['workout_start', 'time_up'],
      duration: 1000,
      tags: ['whistle', 'coach', 'start']
    }
  ],
  
  expression: [
    {
      id: 'happy_smile',
      name: 'Happy Smile',
      type: 'lottie',
      description: 'Bright happy smile',
      triggers: ['happy', 'achievement'],
      duration: 2000,
      tags: ['smile', 'happy', 'positive']
    },
    {
      id: 'excited_eyes',
      name: 'Excited Eyes',
      type: 'rive',
      description: 'Wide excited eyes with sparkles',
      triggers: ['excited', 'surprise'],
      duration: 1500,
      tags: ['eyes', 'excited', 'sparkles']
    },
    {
      id: 'focused_concentration',
      name: 'Focused Concentration',
      type: 'lottie',
      description: 'Intense focused expression',
      triggers: ['focused', 'concentration'],
      duration: 3000,
      tags: ['focus', 'concentration', 'intense']
    },
    {
      id: 'determined_face',
      name: 'Determined Face',
      type: 'lottie',
      description: 'Strong determined expression',
      triggers: ['determined', 'challenge'],
      duration: 2500,
      tags: ['determined', 'strong', 'challenge']
    }
  ]
};

// Animation context interface
export interface AnimationContext {
  trigger: string;
  intensity?: number; // 0-100
  duration?: number;
  userData?: {
    fitnessLevel: number;
    currentWorkout?: string;
    achievements: string[];
  };
  environmentData?: {
    heartRate?: number;
    workoutPhase?: 'warmup' | 'active' | 'rest' | 'cooldown';
    timeRemaining?: number;
  };
}

// Animation controller class
export class AnimationController {
  private currentAnimations: Map<string, any> = new Map();
  private animationQueue: Array<{ animation: AnimationAsset; context: AnimationContext }> = [];
  private isPlaying: boolean = false;
  
  // Get animations for specific trigger
  getAnimationsForTrigger(trigger: string, category?: string): AnimationAsset[] {
    const allAnimations = this.getAllAnimations();
    return allAnimations.filter(animation => 
      animation.metadata.triggers.includes(trigger) &&
      (!category || animation.category === category)
    );
  }
  
  // Select best animation for context
  selectAnimationForContext(
    trigger: string, 
    context: AnimationContext,
    preferredType?: 'lottie' | 'rive'
  ): AnimationAsset | null {
    const availableAnimations = this.getAnimationsForTrigger(trigger);
    
    if (availableAnimations.length === 0) return null;
    
    // Filter by type preference
    let filteredAnimations = preferredType 
      ? availableAnimations.filter(anim => anim.type === preferredType)
      : availableAnimations;
    
    if (filteredAnimations.length === 0) {
      filteredAnimations = availableAnimations;
    }
    
    // Select based on context and user data
    const userData = context.userData;
    if (userData) {
      // Prefer animations matching user's fitness level
      const levelBasedAnimations = filteredAnimations.filter(anim => {
        if (userData.fitnessLevel >= 8) return anim.metadata.tags.includes('intense');
        if (userData.fitnessLevel >= 5) return anim.metadata.tags.includes('moderate');
        return anim.metadata.tags.includes('gentle') || !anim.metadata.tags.includes('intense');
      });
      
      if (levelBasedAnimations.length > 0) {
        filteredAnimations = levelBasedAnimations;
      }
    }
    
    // Return random selection from filtered animations
    const randomIndex = Math.floor(Math.random() * filteredAnimations.length);
    return filteredAnimations[randomIndex];
  }
  
  // Queue animation for playback
  queueAnimation(animation: AnimationAsset, context: AnimationContext): void {
    this.animationQueue.push({ animation, context });
    
    if (!this.isPlaying) {
      this.playNextAnimation();
    }
  }
  
  // Play next animation in queue
  private async playNextAnimation(): Promise<void> {
    if (this.animationQueue.length === 0) {
      this.isPlaying = false;
      return;
    }
    
    this.isPlaying = true;
    const { animation, context } = this.animationQueue.shift()!;
    
    try {
      await this.playAnimation(animation, context);
    } catch (error) {
      console.error('Error playing animation:', error);
    }
    
    // Continue with next animation
    setTimeout(() => {
      this.playNextAnimation();
    }, 100); // Small delay between animations
  }
  
  // Play specific animation
  private async playAnimation(animation: AnimationAsset, context: AnimationContext): Promise<void> {
    const animationId = `${animation.id}_${Date.now()}`;
    
    // Store current animation
    this.currentAnimations.set(animationId, {
      animation,
      context,
      startTime: Date.now()
    });
    
    // Simulate animation playback duration
    const duration = context.duration || animation.metadata.duration;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentAnimations.delete(animationId);
        resolve();
      }, duration);
    });
  }
  
  // Stop all animations
  stopAllAnimations(): void {
    this.currentAnimations.clear();
    this.animationQueue.length = 0;
    this.isPlaying = false;
  }
  
  // Get currently playing animations
  getCurrentAnimations(): any[] {
    return Array.from(this.currentAnimations.values());
  }
  
  // Convert TapFit animations to AnimationAsset format
  private getAllAnimations(): AnimationAsset[] {
    const animations: AnimationAsset[] = [];
    
    Object.entries(TAPFIT_ANIMATIONS).forEach(([category, categoryAnimations]) => {
      categoryAnimations.forEach((anim: any) => {
        animations.push({
          id: anim.id,
          name: anim.name,
          type: anim.type as 'lottie' | 'rive',
          category: category as any,
          fileUrl: `/animations/${anim.type}/${anim.id}.${anim.type === 'lottie' ? 'json' : 'riv'}`,
          metadata: {
            duration: anim.duration,
            triggers: anim.triggers,
            tags: anim.tags
          },
          isActive: true,
          createdAt: new Date()
        });
      });
    });
    
    return animations;
  }
  
  // Trigger animation based on fitness event
  triggerFitnessAnimation(
    event: string, 
    userData?: any, 
    environmentData?: any
  ): void {
    const context: AnimationContext = {
      trigger: event,
      userData,
      environmentData
    };
    
    const animation = this.selectAnimationForContext(event, context);
    if (animation) {
      this.queueAnimation(animation, context);
    }
  }
  
  // Get animation preview URL
  getAnimationPreviewUrl(animationId: string): string {
    return `/animations/previews/${animationId}.gif`;
  }
}

// Export singleton instance
export const animationController = new AnimationController();

// Utility functions for animation integration
export const triggerWorkoutAnimation = (event: string, data?: any) => {
  animationController.triggerFitnessAnimation(event, data);
};

export const getAvailableAnimations = () => {
  return animationController['getAllAnimations']();
};