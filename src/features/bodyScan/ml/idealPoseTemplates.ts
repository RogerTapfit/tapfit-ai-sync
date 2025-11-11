import { type ExerciseType } from '@/utils/exerciseDetection';

export interface IdealPoseKeypoint {
  x: number;
  y: number;
  z?: number;
}

export interface IdealPoseTemplate {
  up: IdealPoseKeypoint[];
  down: IdealPoseKeypoint[];
}

// MediaPipe Pose has 33 landmarks - we define key positions for each exercise
// Coordinates are normalized (0-1 range) for center positioning
export const idealPoseTemplates: Record<ExerciseType, IdealPoseTemplate> = {
  pushups: {
    // Up position - plank with straight arms
    up: [
      { x: 0.5, y: 0.15 }, // 0: nose
      { x: 0.505, y: 0.14 }, // 1: left_eye_inner
      { x: 0.51, y: 0.14 }, // 2: left_eye
      { x: 0.515, y: 0.14 }, // 3: left_eye_outer
      { x: 0.495, y: 0.14 }, // 4: right_eye_inner
      { x: 0.49, y: 0.14 }, // 5: right_eye
      { x: 0.485, y: 0.14 }, // 6: right_eye_outer
      { x: 0.52, y: 0.145 }, // 7: left_ear
      { x: 0.48, y: 0.145 }, // 8: right_ear
      { x: 0.525, y: 0.16 }, // 9: mouth_left
      { x: 0.475, y: 0.16 }, // 10: mouth_right
      { x: 0.58, y: 0.22 }, // 11: left_shoulder
      { x: 0.42, y: 0.22 }, // 12: right_shoulder
      { x: 0.65, y: 0.35 }, // 13: left_elbow
      { x: 0.35, y: 0.35 }, // 14: right_elbow
      { x: 0.7, y: 0.48 }, // 15: left_wrist
      { x: 0.3, y: 0.48 }, // 16: right_wrist
      { x: 0.72, y: 0.5 }, // 17: left_pinky
      { x: 0.28, y: 0.5 }, // 18: right_pinky
      { x: 0.71, y: 0.49 }, // 19: left_index
      { x: 0.29, y: 0.49 }, // 20: right_index
      { x: 0.715, y: 0.51 }, // 21: left_thumb
      { x: 0.285, y: 0.51 }, // 22: right_thumb
      { x: 0.56, y: 0.45 }, // 23: left_hip
      { x: 0.44, y: 0.45 }, // 24: right_hip
      { x: 0.57, y: 0.68 }, // 25: left_knee
      { x: 0.43, y: 0.68 }, // 26: right_knee
      { x: 0.58, y: 0.88 }, // 27: left_ankle
      { x: 0.42, y: 0.88 }, // 28: right_ankle
      { x: 0.59, y: 0.92 }, // 29: left_heel
      { x: 0.41, y: 0.92 }, // 30: right_heel
      { x: 0.6, y: 0.9 }, // 31: left_foot_index
      { x: 0.4, y: 0.9 }, // 32: right_foot_index
    ],
    // Down position - chest near floor, elbows bent 90°
    down: [
      { x: 0.5, y: 0.35 }, // 0: nose
      { x: 0.505, y: 0.34 }, // 1: left_eye_inner
      { x: 0.51, y: 0.34 }, // 2: left_eye
      { x: 0.515, y: 0.34 }, // 3: left_eye_outer
      { x: 0.495, y: 0.34 }, // 4: right_eye_inner
      { x: 0.49, y: 0.34 }, // 5: right_eye
      { x: 0.485, y: 0.34 }, // 6: right_eye_outer
      { x: 0.52, y: 0.345 }, // 7: left_ear
      { x: 0.48, y: 0.345 }, // 8: right_ear
      { x: 0.525, y: 0.36 }, // 9: mouth_left
      { x: 0.475, y: 0.36 }, // 10: mouth_right
      { x: 0.58, y: 0.42 }, // 11: left_shoulder
      { x: 0.42, y: 0.42 }, // 12: right_shoulder
      { x: 0.62, y: 0.42 }, // 13: left_elbow - bent 90°
      { x: 0.38, y: 0.42 }, // 14: right_elbow - bent 90°
      { x: 0.7, y: 0.48 }, // 15: left_wrist
      { x: 0.3, y: 0.48 }, // 16: right_wrist
      { x: 0.72, y: 0.5 }, // 17: left_pinky
      { x: 0.28, y: 0.5 }, // 18: right_pinky
      { x: 0.71, y: 0.49 }, // 19: left_index
      { x: 0.29, y: 0.49 }, // 20: right_index
      { x: 0.715, y: 0.51 }, // 21: left_thumb
      { x: 0.285, y: 0.51 }, // 22: right_thumb
      { x: 0.56, y: 0.5 }, // 23: left_hip
      { x: 0.44, y: 0.5 }, // 24: right_hip
      { x: 0.57, y: 0.68 }, // 25: left_knee
      { x: 0.43, y: 0.68 }, // 26: right_knee
      { x: 0.58, y: 0.88 }, // 27: left_ankle
      { x: 0.42, y: 0.88 }, // 28: right_ankle
      { x: 0.59, y: 0.92 }, // 29: left_heel
      { x: 0.41, y: 0.92 }, // 30: right_heel
      { x: 0.6, y: 0.9 }, // 31: left_foot_index
      { x: 0.4, y: 0.9 }, // 32: right_foot_index
    ],
  },
  
  squats: {
    // Up position - standing straight
    up: [
      { x: 0.5, y: 0.12 }, // 0: nose
      { x: 0.505, y: 0.11 }, // 1: left_eye_inner
      { x: 0.51, y: 0.11 }, // 2: left_eye
      { x: 0.515, y: 0.11 }, // 3: left_eye_outer
      { x: 0.495, y: 0.11 }, // 4: right_eye_inner
      { x: 0.49, y: 0.11 }, // 5: right_eye
      { x: 0.485, y: 0.11 }, // 6: right_eye_outer
      { x: 0.52, y: 0.115 }, // 7: left_ear
      { x: 0.48, y: 0.115 }, // 8: right_ear
      { x: 0.525, y: 0.13 }, // 9: mouth_left
      { x: 0.475, y: 0.13 }, // 10: mouth_right
      { x: 0.58, y: 0.22 }, // 11: left_shoulder
      { x: 0.42, y: 0.22 }, // 12: right_shoulder
      { x: 0.6, y: 0.38 }, // 13: left_elbow
      { x: 0.4, y: 0.38 }, // 14: right_elbow
      { x: 0.61, y: 0.52 }, // 15: left_wrist
      { x: 0.39, y: 0.52 }, // 16: right_wrist
      { x: 0.62, y: 0.54 }, // 17: left_pinky
      { x: 0.38, y: 0.54 }, // 18: right_pinky
      { x: 0.615, y: 0.53 }, // 19: left_index
      { x: 0.385, y: 0.53 }, // 20: right_index
      { x: 0.618, y: 0.55 }, // 21: left_thumb
      { x: 0.382, y: 0.55 }, // 22: right_thumb
      { x: 0.56, y: 0.52 }, // 23: left_hip
      { x: 0.44, y: 0.52 }, // 24: right_hip
      { x: 0.56, y: 0.72 }, // 25: left_knee
      { x: 0.44, y: 0.72 }, // 26: right_knee
      { x: 0.56, y: 0.92 }, // 27: left_ankle
      { x: 0.44, y: 0.92 }, // 28: right_ankle
      { x: 0.56, y: 0.96 }, // 29: left_heel
      { x: 0.44, y: 0.96 }, // 30: right_heel
      { x: 0.57, y: 0.94 }, // 31: left_foot_index
      { x: 0.43, y: 0.94 }, // 32: right_foot_index
    ],
    // Down position - knees bent 90°, hips low
    down: [
      { x: 0.5, y: 0.28 }, // 0: nose
      { x: 0.505, y: 0.27 }, // 1: left_eye_inner
      { x: 0.51, y: 0.27 }, // 2: left_eye
      { x: 0.515, y: 0.27 }, // 3: left_eye_outer
      { x: 0.495, y: 0.27 }, // 4: right_eye_inner
      { x: 0.49, y: 0.27 }, // 5: right_eye
      { x: 0.485, y: 0.27 }, // 6: right_eye_outer
      { x: 0.52, y: 0.275 }, // 7: left_ear
      { x: 0.48, y: 0.275 }, // 8: right_ear
      { x: 0.525, y: 0.29 }, // 9: mouth_left
      { x: 0.475, y: 0.29 }, // 10: mouth_right
      { x: 0.58, y: 0.38 }, // 11: left_shoulder
      { x: 0.42, y: 0.38 }, // 12: right_shoulder
      { x: 0.62, y: 0.52 }, // 13: left_elbow
      { x: 0.38, y: 0.52 }, // 14: right_elbow
      { x: 0.64, y: 0.64 }, // 15: left_wrist
      { x: 0.36, y: 0.64 }, // 16: right_wrist
      { x: 0.65, y: 0.66 }, // 17: left_pinky
      { x: 0.35, y: 0.66 }, // 18: right_pinky
      { x: 0.645, y: 0.65 }, // 19: left_index
      { x: 0.355, y: 0.65 }, // 20: right_index
      { x: 0.648, y: 0.67 }, // 21: left_thumb
      { x: 0.352, y: 0.67 }, // 22: right_thumb
      { x: 0.56, y: 0.65 }, // 23: left_hip - lowered
      { x: 0.44, y: 0.65 }, // 24: right_hip - lowered
      { x: 0.58, y: 0.75 }, // 25: left_knee - bent forward
      { x: 0.42, y: 0.75 }, // 26: right_knee - bent forward
      { x: 0.56, y: 0.92 }, // 27: left_ankle
      { x: 0.44, y: 0.92 }, // 28: right_ankle
      { x: 0.56, y: 0.96 }, // 29: left_heel
      { x: 0.44, y: 0.96 }, // 30: right_heel
      { x: 0.57, y: 0.94 }, // 31: left_foot_index
      { x: 0.43, y: 0.94 }, // 32: right_foot_index
    ],
  },
  
  lunges: {
    // Up position - standing
    up: [
      { x: 0.5, y: 0.12 }, // 0: nose
      { x: 0.505, y: 0.11 }, // 1: left_eye_inner
      { x: 0.51, y: 0.11 }, // 2: left_eye
      { x: 0.515, y: 0.11 }, // 3: left_eye_outer
      { x: 0.495, y: 0.11 }, // 4: right_eye_inner
      { x: 0.49, y: 0.11 }, // 5: right_eye
      { x: 0.485, y: 0.11 }, // 6: right_eye_outer
      { x: 0.52, y: 0.115 }, // 7: left_ear
      { x: 0.48, y: 0.115 }, // 8: right_ear
      { x: 0.525, y: 0.13 }, // 9: mouth_left
      { x: 0.475, y: 0.13 }, // 10: mouth_right
      { x: 0.58, y: 0.22 }, // 11: left_shoulder
      { x: 0.42, y: 0.22 }, // 12: right_shoulder
      { x: 0.6, y: 0.38 }, // 13: left_elbow
      { x: 0.4, y: 0.38 }, // 14: right_elbow
      { x: 0.61, y: 0.52 }, // 15: left_wrist
      { x: 0.39, y: 0.52 }, // 16: right_wrist
      { x: 0.62, y: 0.54 }, // 17: left_pinky
      { x: 0.38, y: 0.54 }, // 18: right_pinky
      { x: 0.615, y: 0.53 }, // 19: left_index
      { x: 0.385, y: 0.53 }, // 20: right_index
      { x: 0.618, y: 0.55 }, // 21: left_thumb
      { x: 0.382, y: 0.55 }, // 22: right_thumb
      { x: 0.56, y: 0.52 }, // 23: left_hip
      { x: 0.44, y: 0.52 }, // 24: right_hip
      { x: 0.56, y: 0.72 }, // 25: left_knee
      { x: 0.44, y: 0.72 }, // 26: right_knee
      { x: 0.56, y: 0.92 }, // 27: left_ankle
      { x: 0.44, y: 0.92 }, // 28: right_ankle
      { x: 0.56, y: 0.96 }, // 29: left_heel
      { x: 0.44, y: 0.96 }, // 30: right_heel
      { x: 0.57, y: 0.94 }, // 31: left_foot_index
      { x: 0.43, y: 0.94 }, // 32: right_foot_index
    ],
    // Down position - front knee 90°, back knee near floor
    down: [
      { x: 0.5, y: 0.22 }, // 0: nose
      { x: 0.505, y: 0.21 }, // 1: left_eye_inner
      { x: 0.51, y: 0.21 }, // 2: left_eye
      { x: 0.515, y: 0.21 }, // 3: left_eye_outer
      { x: 0.495, y: 0.21 }, // 4: right_eye_inner
      { x: 0.49, y: 0.21 }, // 5: right_eye
      { x: 0.485, y: 0.21 }, // 6: right_eye_outer
      { x: 0.52, y: 0.215 }, // 7: left_ear
      { x: 0.48, y: 0.215 }, // 8: right_ear
      { x: 0.525, y: 0.23 }, // 9: mouth_left
      { x: 0.475, y: 0.23 }, // 10: mouth_right
      { x: 0.58, y: 0.32 }, // 11: left_shoulder
      { x: 0.42, y: 0.32 }, // 12: right_shoulder
      { x: 0.62, y: 0.46 }, // 13: left_elbow
      { x: 0.38, y: 0.46 }, // 14: right_elbow
      { x: 0.64, y: 0.58 }, // 15: left_wrist
      { x: 0.36, y: 0.58 }, // 16: right_wrist
      { x: 0.65, y: 0.6 }, // 17: left_pinky
      { x: 0.35, y: 0.6 }, // 18: right_pinky
      { x: 0.645, y: 0.59 }, // 19: left_index
      { x: 0.355, y: 0.59 }, // 20: right_index
      { x: 0.648, y: 0.61 }, // 21: left_thumb
      { x: 0.352, y: 0.61 }, // 22: right_thumb
      { x: 0.56, y: 0.58 }, // 23: left_hip
      { x: 0.44, y: 0.58 }, // 24: right_hip
      { x: 0.62, y: 0.75 }, // 25: left_knee - front leg bent
      { x: 0.38, y: 0.82 }, // 26: right_knee - back knee near floor
      { x: 0.64, y: 0.92 }, // 27: left_ankle - front foot flat
      { x: 0.36, y: 0.88 }, // 28: right_ankle - back foot on toes
      { x: 0.63, y: 0.96 }, // 29: left_heel
      { x: 0.35, y: 0.92 }, // 30: right_heel
      { x: 0.65, y: 0.94 }, // 31: left_foot_index
      { x: 0.37, y: 0.9 }, // 32: right_foot_index
    ],
  },
  
  jumping_jacks: {
    // Legs together position
    up: [
      { x: 0.5, y: 0.12 }, // 0: nose
      { x: 0.505, y: 0.11 }, // 1: left_eye_inner
      { x: 0.51, y: 0.11 }, // 2: left_eye
      { x: 0.515, y: 0.11 }, // 3: left_eye_outer
      { x: 0.495, y: 0.11 }, // 4: right_eye_inner
      { x: 0.49, y: 0.11 }, // 5: right_eye
      { x: 0.485, y: 0.11 }, // 6: right_eye_outer
      { x: 0.52, y: 0.115 }, // 7: left_ear
      { x: 0.48, y: 0.115 }, // 8: right_ear
      { x: 0.525, y: 0.13 }, // 9: mouth_left
      { x: 0.475, y: 0.13 }, // 10: mouth_right
      { x: 0.58, y: 0.22 }, // 11: left_shoulder
      { x: 0.42, y: 0.22 }, // 12: right_shoulder
      { x: 0.6, y: 0.42 }, // 13: left_elbow
      { x: 0.4, y: 0.42 }, // 14: right_elbow
      { x: 0.61, y: 0.58 }, // 15: left_wrist - arms down
      { x: 0.39, y: 0.58 }, // 16: right_wrist - arms down
      { x: 0.62, y: 0.6 }, // 17: left_pinky
      { x: 0.38, y: 0.6 }, // 18: right_pinky
      { x: 0.615, y: 0.59 }, // 19: left_index
      { x: 0.385, y: 0.59 }, // 20: right_index
      { x: 0.618, y: 0.61 }, // 21: left_thumb
      { x: 0.382, y: 0.61 }, // 22: right_thumb
      { x: 0.54, y: 0.52 }, // 23: left_hip
      { x: 0.46, y: 0.52 }, // 24: right_hip
      { x: 0.52, y: 0.72 }, // 25: left_knee - legs together
      { x: 0.48, y: 0.72 }, // 26: right_knee - legs together
      { x: 0.51, y: 0.92 }, // 27: left_ankle
      { x: 0.49, y: 0.92 }, // 28: right_ankle
      { x: 0.51, y: 0.96 }, // 29: left_heel
      { x: 0.49, y: 0.96 }, // 30: right_heel
      { x: 0.52, y: 0.94 }, // 31: left_foot_index
      { x: 0.48, y: 0.94 }, // 32: right_foot_index
    ],
    // Legs apart, arms up
    down: [
      { x: 0.5, y: 0.12 }, // 0: nose
      { x: 0.505, y: 0.11 }, // 1: left_eye_inner
      { x: 0.51, y: 0.11 }, // 2: left_eye
      { x: 0.515, y: 0.11 }, // 3: left_eye_outer
      { x: 0.495, y: 0.11 }, // 4: right_eye_inner
      { x: 0.49, y: 0.11 }, // 5: right_eye
      { x: 0.485, y: 0.11 }, // 6: right_eye_outer
      { x: 0.52, y: 0.115 }, // 7: left_ear
      { x: 0.48, y: 0.115 }, // 8: right_ear
      { x: 0.525, y: 0.13 }, // 9: mouth_left
      { x: 0.475, y: 0.13 }, // 10: mouth_right
      { x: 0.58, y: 0.22 }, // 11: left_shoulder
      { x: 0.42, y: 0.22 }, // 12: right_shoulder
      { x: 0.68, y: 0.18 }, // 13: left_elbow - arms raised
      { x: 0.32, y: 0.18 }, // 14: right_elbow - arms raised
      { x: 0.75, y: 0.08 }, // 15: left_wrist - hands above head
      { x: 0.25, y: 0.08 }, // 16: right_wrist - hands above head
      { x: 0.77, y: 0.07 }, // 17: left_pinky
      { x: 0.23, y: 0.07 }, // 18: right_pinky
      { x: 0.76, y: 0.075 }, // 19: left_index
      { x: 0.24, y: 0.075 }, // 20: right_index
      { x: 0.765, y: 0.065 }, // 21: left_thumb
      { x: 0.235, y: 0.065 }, // 22: right_thumb
      { x: 0.56, y: 0.52 }, // 23: left_hip
      { x: 0.44, y: 0.52 }, // 24: right_hip
      { x: 0.62, y: 0.72 }, // 25: left_knee - legs apart
      { x: 0.38, y: 0.72 }, // 26: right_knee - legs apart
      { x: 0.68, y: 0.92 }, // 27: left_ankle
      { x: 0.32, y: 0.92 }, // 28: right_ankle
      { x: 0.69, y: 0.96 }, // 29: left_heel
      { x: 0.31, y: 0.96 }, // 30: right_heel
      { x: 0.7, y: 0.94 }, // 31: left_foot_index
      { x: 0.3, y: 0.94 }, // 32: right_foot_index
    ],
  },
  
  high_knees: {
    // Neutral standing position
    up: [
      { x: 0.5, y: 0.12 }, // 0: nose
      { x: 0.505, y: 0.11 }, // 1: left_eye_inner
      { x: 0.51, y: 0.11 }, // 2: left_eye
      { x: 0.515, y: 0.11 }, // 3: left_eye_outer
      { x: 0.495, y: 0.11 }, // 4: right_eye_inner
      { x: 0.49, y: 0.11 }, // 5: right_eye
      { x: 0.485, y: 0.11 }, // 6: right_eye_outer
      { x: 0.52, y: 0.115 }, // 7: left_ear
      { x: 0.48, y: 0.115 }, // 8: right_ear
      { x: 0.525, y: 0.13 }, // 9: mouth_left
      { x: 0.475, y: 0.13 }, // 10: mouth_right
      { x: 0.58, y: 0.22 }, // 11: left_shoulder
      { x: 0.42, y: 0.22 }, // 12: right_shoulder
      { x: 0.6, y: 0.38 }, // 13: left_elbow
      { x: 0.4, y: 0.38 }, // 14: right_elbow
      { x: 0.61, y: 0.52 }, // 15: left_wrist
      { x: 0.39, y: 0.52 }, // 16: right_wrist
      { x: 0.62, y: 0.54 }, // 17: left_pinky
      { x: 0.38, y: 0.54 }, // 18: right_pinky
      { x: 0.615, y: 0.53 }, // 19: left_index
      { x: 0.385, y: 0.53 }, // 20: right_index
      { x: 0.618, y: 0.55 }, // 21: left_thumb
      { x: 0.382, y: 0.55 }, // 22: right_thumb
      { x: 0.56, y: 0.52 }, // 23: left_hip
      { x: 0.44, y: 0.52 }, // 24: right_hip
      { x: 0.56, y: 0.72 }, // 25: left_knee
      { x: 0.44, y: 0.72 }, // 26: right_knee
      { x: 0.56, y: 0.92 }, // 27: left_ankle
      { x: 0.44, y: 0.92 }, // 28: right_ankle
      { x: 0.56, y: 0.96 }, // 29: left_heel
      { x: 0.44, y: 0.96 }, // 30: right_heel
      { x: 0.57, y: 0.94 }, // 31: left_foot_index
      { x: 0.43, y: 0.94 }, // 32: right_foot_index
    ],
    // Knee raised high
    down: [
      { x: 0.5, y: 0.12 }, // 0: nose
      { x: 0.505, y: 0.11 }, // 1: left_eye_inner
      { x: 0.51, y: 0.11 }, // 2: left_eye
      { x: 0.515, y: 0.11 }, // 3: left_eye_outer
      { x: 0.495, y: 0.11 }, // 4: right_eye_inner
      { x: 0.49, y: 0.11 }, // 5: right_eye
      { x: 0.485, y: 0.11 }, // 6: right_eye_outer
      { x: 0.52, y: 0.115 }, // 7: left_ear
      { x: 0.48, y: 0.115 }, // 8: right_ear
      { x: 0.525, y: 0.13 }, // 9: mouth_left
      { x: 0.475, y: 0.13 }, // 10: mouth_right
      { x: 0.58, y: 0.22 }, // 11: left_shoulder
      { x: 0.42, y: 0.22 }, // 12: right_shoulder
      { x: 0.6, y: 0.38 }, // 13: left_elbow
      { x: 0.4, y: 0.38 }, // 14: right_elbow
      { x: 0.61, y: 0.52 }, // 15: left_wrist
      { x: 0.39, y: 0.52 }, // 16: right_wrist
      { x: 0.62, y: 0.54 }, // 17: left_pinky
      { x: 0.38, y: 0.54 }, // 18: right_pinky
      { x: 0.615, y: 0.53 }, // 19: left_index
      { x: 0.385, y: 0.53 }, // 20: right_index
      { x: 0.618, y: 0.55 }, // 21: left_thumb
      { x: 0.382, y: 0.55 }, // 22: right_thumb
      { x: 0.56, y: 0.52 }, // 23: left_hip
      { x: 0.44, y: 0.52 }, // 24: right_hip
      { x: 0.58, y: 0.42 }, // 25: left_knee - raised high
      { x: 0.44, y: 0.72 }, // 26: right_knee - supporting leg
      { x: 0.59, y: 0.48 }, // 27: left_ankle - foot lifted
      { x: 0.44, y: 0.92 }, // 28: right_ankle - planted
      { x: 0.6, y: 0.5 }, // 29: left_heel
      { x: 0.44, y: 0.96 }, // 30: right_heel
      { x: 0.61, y: 0.49 }, // 31: left_foot_index
      { x: 0.43, y: 0.94 }, // 32: right_foot_index
    ],
  },
};
