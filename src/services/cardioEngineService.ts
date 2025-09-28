import { CardioMachineType, MachineSettings, CardioUserProfile, MachineCalibration } from '@/types/cardio';

export class CardioEngineService {
  // Machine calibration constants (default values, refined over time)
  private static machineConstants = {
    bike: 0.071, // Default power-to-METs conversion
    stair_stepper: 0.1, // Steps/min to METs multiplier
    elliptical: 1.2, // Level to METs multiplier
    rower: 1.5 // Resistance to METs multiplier
  };

  /**
   * Calculate METs for treadmill based on speed and incline
   */
  static calculateTreadmillMETs(speed_kmh: number, incline_pct: number): number {
    const speed_mpm = (speed_kmh * 1000) / 60; // meters per minute
    const grade = incline_pct / 100;

    if (speed_kmh <= 7) {
      // Walking formula
      const vo2 = 3.5 + 0.1 * speed_mpm + 1.8 * speed_mpm * grade;
      return vo2 / 3.5;
    } else {
      // Running formula
      const vo2 = 3.5 + 0.2 * speed_mpm + 0.9 * speed_mpm * grade;
      return vo2 / 3.5;
    }
  }

  /**
   * Calculate METs for bike based on power or resistance level
   */
  static calculateBikeMETs(
    settings: MachineSettings, 
    userProfile: CardioUserProfile,
    calibration?: MachineCalibration
  ): number {
    const k_machine = calibration?.calibration_constant || this.machineConstants.bike;

    if (settings.watts) {
      // Power-based calculation (most accurate)
      return (settings.watts / userProfile.weight_kg) / k_machine;
    } else if (settings.resistance_level) {
      // Virtual watts estimation
      const cadence_rpm = 80; // Assume moderate cadence
      const virtual_watts = k_machine * settings.resistance_level * cadence_rpm;
      return (virtual_watts / userProfile.weight_kg) / k_machine;
    }
    
    return 5; // Default moderate intensity
  }

  /**
   * Calculate METs for stair stepper
   */
  static calculateStepperMETs(
    settings: MachineSettings,
    calibration?: MachineCalibration
  ): number {
    const k_machine = calibration?.calibration_constant || this.machineConstants.stair_stepper;

    if (settings.steps_per_min) {
      return k_machine * settings.steps_per_min + 3;
    } else if (settings.level) {
      // Level-based estimation
      const metsTable = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10 };
      return metsTable[settings.level as keyof typeof metsTable] || 5;
    }
    
    return 5; // Default
  }

  /**
   * Calculate METs for elliptical
   */
  static calculateEllipticalMETs(
    settings: MachineSettings,
    calibration?: MachineCalibration
  ): number {
    const k_machine = calibration?.calibration_constant || this.machineConstants.elliptical;
    
    if (settings.resistance) {
      return 4 + (settings.resistance * k_machine);
    }
    
    return 6; // Default moderate intensity
  }

  /**
   * Calculate METs for rower
   */
  static calculateRowerMETs(
    settings: MachineSettings,
    calibration?: MachineCalibration
  ): number {
    const k_machine = calibration?.calibration_constant || this.machineConstants.rower;
    
    if (settings.resistance && settings.stroke_rate) {
      return 3 + (settings.resistance * settings.stroke_rate * k_machine) / 100;
    }
    
    return 7; // Default rowing intensity
  }

  /**
   * Universal METs calculation for any cardio machine
   */
  static calculateMETs(
    machineType: CardioMachineType,
    settings: MachineSettings,
    userProfile: CardioUserProfile,
    calibration?: MachineCalibration
  ): number {
    switch (machineType) {
      case 'treadmill':
        return this.calculateTreadmillMETs(
          settings.speed_kmh || 5,
          settings.incline_pct || 0
        );
      case 'bike':
        return this.calculateBikeMETs(settings, userProfile, calibration);
      case 'stair_stepper':
        return this.calculateStepperMETs(settings, calibration);
      case 'elliptical':
        return this.calculateEllipticalMETs(settings, calibration);
      case 'rower':
        return this.calculateRowerMETs(settings, calibration);
      default:
        return 5; // Default moderate intensity
    }
  }

  /**
   * Convert target METs to machine settings
   */
  static translateMETsToSettings(
    machineType: CardioMachineType,
    targetMETs: number,
    userProfile: CardioUserProfile,
    calibration?: MachineCalibration
  ): MachineSettings {
    switch (machineType) {
      case 'treadmill':
        return this.treadmillSettingsFromMETs(targetMETs);
      case 'bike':
        return this.bikeSettingsFromMETs(targetMETs, userProfile, calibration);
      case 'stair_stepper':
        return this.stepperSettingsFromMETs(targetMETs, calibration);
      case 'elliptical':
        return this.ellipticalSettingsFromMETs(targetMETs, calibration);
      case 'rower':
        return this.rowerSettingsFromMETs(targetMETs, calibration);
      default:
        return {};
    }
  }

  private static treadmillSettingsFromMETs(targetMETs: number): MachineSettings {
    // Start with walking, then adjust
    if (targetMETs <= 4) {
      return { speed_kmh: 4, incline_pct: 0 };
    } else if (targetMETs <= 6) {
      return { speed_kmh: 5.5, incline_pct: 2 };
    } else if (targetMETs <= 8) {
      return { speed_kmh: 8, incline_pct: 0 };
    } else if (targetMETs <= 10) {
      return { speed_kmh: 9.5, incline_pct: 1 };
    } else {
      return { speed_kmh: 11, incline_pct: 2 };
    }
  }

  private static bikeSettingsFromMETs(
    targetMETs: number,
    userProfile: CardioUserProfile,
    calibration?: MachineCalibration
  ): MachineSettings {
    const k_machine = calibration?.calibration_constant || this.machineConstants.bike;
    const targetWatts = targetMETs * userProfile.weight_kg * k_machine;
    
    return {
      watts: Math.round(targetWatts),
      resistance_level: Math.min(20, Math.max(1, Math.round(targetWatts / 20)))
    };
  }

  private static stepperSettingsFromMETs(
    targetMETs: number,
    calibration?: MachineCalibration
  ): MachineSettings {
    const k_machine = calibration?.calibration_constant || this.machineConstants.stair_stepper;
    const steps_per_min = Math.round((targetMETs - 3) / k_machine);
    
    return {
      steps_per_min: Math.min(120, Math.max(40, steps_per_min)),
      level: Math.min(8, Math.max(1, Math.round(targetMETs - 2)))
    };
  }

  private static ellipticalSettingsFromMETs(
    targetMETs: number,
    calibration?: MachineCalibration
  ): MachineSettings {
    const k_machine = calibration?.calibration_constant || this.machineConstants.elliptical;
    const resistance = Math.round((targetMETs - 4) / k_machine);
    
    return {
      resistance: Math.min(20, Math.max(1, resistance))
    };
  }

  private static rowerSettingsFromMETs(
    targetMETs: number,
    calibration?: MachineCalibration
  ): MachineSettings {
    const k_machine = calibration?.calibration_constant || this.machineConstants.rower;
    const baseResistance = Math.round((targetMETs - 3) / 2);
    
    return {
      resistance: Math.min(10, Math.max(1, baseResistance)),
      stroke_rate: 24 // Standard stroke rate
    };
  }

  /**
   * Calculate calories per minute based on METs
   */
  static calculateCaloriesPerMinute(mets: number, weightKg: number): number {
    return (mets * 3.5 * weightKg) / 200;
  }

  /**
   * Estimate METs from heart rate (for calibration)
   */
  static estimateMETsFromHeartRate(hrr_percent: number): number {
    return 1 + 8 * hrr_percent;
  }

  /**
   * Calibrate machine constants based on session data
   */
  static calibrateMachine(
    machineType: CardioMachineType,
    predictedMETs: number,
    actualHRR: number,
    currentConstant: number
  ): number {
    const hrDerivedMETs = this.estimateMETsFromHeartRate(actualHRR);
    const error = predictedMETs - hrDerivedMETs;
    const learningRate = 0.1;
    
    // Adjust constant to minimize error
    return currentConstant * (1 - learningRate * (error / predictedMETs));
  }

  /**
   * Get machine adjustment for real-time adaptive control
   */
  static getMachineAdjustment(
    machineType: CardioMachineType,
    currentHRR: number,
    targetHRR: number,
    currentSettings: MachineSettings
  ): MachineSettings {
    const hrrDiff = currentHRR - targetHRR;
    const adjustmentFactor = Math.abs(hrrDiff) > 0.03 ? (hrrDiff > 0 ? -1 : 1) : 0;
    
    if (adjustmentFactor === 0) return currentSettings;
    
    switch (machineType) {
      case 'treadmill':
        return {
          ...currentSettings,
          speed_kmh: Math.max(1, (currentSettings.speed_kmh || 5) + adjustmentFactor * 0.2),
          incline_pct: Math.max(0, (currentSettings.incline_pct || 0) + adjustmentFactor * 0.5)
        };
      case 'bike':
        return {
          ...currentSettings,
          watts: Math.max(50, (currentSettings.watts || 100) + adjustmentFactor * 10),
          resistance_level: Math.max(1, Math.min(20, (currentSettings.resistance_level || 5) + adjustmentFactor))
        };
      case 'stair_stepper':
        return {
          ...currentSettings,
          steps_per_min: Math.max(40, Math.min(120, (currentSettings.steps_per_min || 80) + adjustmentFactor * 2)),
          level: Math.max(1, Math.min(8, (currentSettings.level || 4) + adjustmentFactor))
        };
      case 'elliptical':
        return {
          ...currentSettings,
          resistance: Math.max(1, Math.min(20, (currentSettings.resistance || 5) + adjustmentFactor))
        };
      case 'rower':
        return {
          ...currentSettings,
          resistance: Math.max(1, Math.min(10, (currentSettings.resistance || 5) + adjustmentFactor))
        };
      default:
        return currentSettings;
    }
  }
}