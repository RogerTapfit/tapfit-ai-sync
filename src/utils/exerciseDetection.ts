// Exercise detection algorithms using pose landmarks
import type { Keypoint } from '@/features/bodyScan/ml/poseVideo';

export type ExerciseType = 'pushups' | 'squats' | 'lunges' | 'jumping_jacks' | 'high_knees';

export interface FormIssue {
  type: 'joint' | 'connection' | 'alignment';
  landmarkIndices: number[]; // Which landmarks to highlight
  severity: 'error' | 'warning' | 'perfect'; // red, yellow, green
  message: string;
}

export interface ExerciseState {
  repCount: number;
  phase: 'up' | 'down' | 'transition';
  formScore: number;
  feedback: string[];
  formIssues?: FormIssue[]; // Detailed visual feedback
}

// Calculate angle between three points
function calculateAngle(a: Keypoint, b: Keypoint, c: Keypoint): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

// Calculate distance between two points
function distance(a: Keypoint, b: Keypoint): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// Push-up detection
export function detectPushup(
  landmarks: Keypoint[],
  previousPhase: 'up' | 'down' | 'transition'
): { phase: 'up' | 'down' | 'transition'; formScore: number; feedback: string[]; formIssues: FormIssue[]; avgElbowAngle: number } {
  const feedback: string[] = [];
  const formIssues: FormIssue[] = [];
  let formScore = 100;

  // Key landmarks
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  // Calculate elbow angles
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  // Check body alignment (plank position)
  const shoulderMid = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
  const hipMid = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
  const bodyAngle = Math.abs(Math.atan2(hipMid.y - shoulderMid.y, hipMid.x - shoulderMid.x) * 180 / Math.PI);

  // Body should be relatively straight (within 20 degrees of horizontal)
  if (bodyAngle > 20 && bodyAngle < 160) {
    if (hipMid.y > shoulderMid.y + 0.1) {
      feedback.push("Lower your hips");
      formScore -= 15;
      // Highlight sagging hips
      formIssues.push({
        type: 'joint',
        landmarkIndices: [23, 24], // Left and right hips
        severity: 'error',
        message: 'Hips sagging - engage core'
      });
      formIssues.push({
        type: 'alignment',
        landmarkIndices: [11, 12, 23, 24], // Shoulders to hips
        severity: 'error',
        message: 'Body alignment off'
      });
    } else if (hipMid.y < shoulderMid.y - 0.1) {
      feedback.push("Raise your hips");
      formScore -= 15;
      // Highlight raised hips
      formIssues.push({
        type: 'joint',
        landmarkIndices: [23, 24],
        severity: 'error',
        message: 'Hips too high'
      });
    }
  }

  // Determine phase based on elbow angle (more lenient thresholds)
  let phase: 'up' | 'down' | 'transition' = previousPhase;
  
  if (avgElbowAngle < 105) {
    phase = 'down';
  } else if (avgElbowAngle > 150) {
    phase = 'up';
  } else {
    phase = 'transition';
  }

  // Check form quality
  const elbowDiff = Math.abs(leftElbowAngle - rightElbowAngle);
  if (elbowDiff > 15) {
    feedback.push("Keep elbows even");
    formScore -= 10;
    // Highlight uneven elbows
    if (leftElbowAngle < rightElbowAngle) {
      formIssues.push({
        type: 'connection',
        landmarkIndices: [11, 13, 15], // Left arm
        severity: 'warning',
        message: 'Left elbow lower'
      });
    } else {
      formIssues.push({
        type: 'connection',
        landmarkIndices: [12, 14, 16], // Right arm
        severity: 'warning',
        message: 'Right elbow lower'
      });
    }
  }

  // Show perfect form indicators
  if (formScore >= 90) {
    feedback.push("Perfect form!");
    // Highlight good body alignment in green
    formIssues.push({
      type: 'alignment',
      landmarkIndices: [11, 12, 23, 24, 27, 28], // Shoulders, hips, ankles
      severity: 'perfect',
      message: 'Perfect alignment'
    });
    // Highlight good elbow position
    formIssues.push({
      type: 'connection',
      landmarkIndices: [11, 13, 15, 12, 14, 16], // Both arms
      severity: 'perfect',
      message: 'Great arm position'
    });
  } else if (formScore >= 75) {
    feedback.push("Good form");
  }

  return { phase, formScore: Math.max(0, formScore), feedback, formIssues, avgElbowAngle };
}

// Squat detection
export function detectSquat(
  landmarks: Keypoint[],
  previousPhase: 'up' | 'down' | 'transition'
): { phase: 'up' | 'down' | 'transition'; formScore: number; feedback: string[]; formIssues: FormIssue[] } {
  const feedback: string[] = [];
  const formIssues: FormIssue[] = [];
  let formScore = 100;

  // Key landmarks
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // Calculate knee angles
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  // Check depth - hip should go below knee level
  const hipMid = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
  const kneeMid = { x: (leftKnee.x + rightKnee.x) / 2, y: (leftKnee.y + rightKnee.y) / 2 };
  
  // Determine phase
  let phase: 'up' | 'down' | 'transition' = previousPhase;
  
  if (avgKneeAngle < 100) {
    phase = 'down';
    if (hipMid.y < kneeMid.y) {
      feedback.push("Great depth!");
    } else {
      feedback.push("Go deeper");
      formScore -= 15;
    }
  } else if (avgKneeAngle > 160) {
    phase = 'up';
  } else {
    phase = 'transition';
  }

  // Check knee alignment
  const kneeDiff = Math.abs(leftKneeAngle - rightKneeAngle);
  if (kneeDiff > 15) {
    feedback.push("Balance your knees");
    formScore -= 10;
    formIssues.push({
      type: 'joint',
      landmarkIndices: [25, 26], // Both knees
      severity: 'warning',
      message: 'Uneven knee angles'
    });
  }

  // Check if knees go past toes
  if (leftKnee.x > leftAnkle.x + 0.05 || rightKnee.x > rightAnkle.x + 0.05) {
    feedback.push("Keep knees behind toes");
    formScore -= 10;
    formIssues.push({
      type: 'connection',
      landmarkIndices: [25, 27, 26, 28], // Knees to ankles
      severity: 'error',
      message: 'Knees past toes'
    });
  }

  if (formScore >= 90) {
    feedback.push("Perfect squat!");
    // Highlight perfect leg alignment
    formIssues.push({
      type: 'connection',
      landmarkIndices: [23, 25, 27, 24, 26, 28], // Both legs
      severity: 'perfect',
      message: 'Perfect leg alignment'
    });
  } else if (formScore >= 75) {
    feedback.push("Good form");
  }

  return { phase, formScore: Math.max(0, formScore), feedback, formIssues };
}

// Lunge detection
export function detectLunge(
  landmarks: Keypoint[],
  previousPhase: 'up' | 'down' | 'transition'
): { phase: 'up' | 'down' | 'transition'; formScore: number; feedback: string[]; formIssues: FormIssue[] } {
  const feedback: string[] = [];
  const formIssues: FormIssue[] = [];
  let formScore = 100;

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // Calculate both knee angles
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);

  // Determine which leg is forward (lower knee angle = bent more)
  const frontKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);
  
  let phase: 'up' | 'down' | 'transition' = previousPhase;
  
  if (frontKneeAngle < 100) {
    phase = 'down';
    if (frontKneeAngle < 90) {
      feedback.push("Good depth!");
    }
  } else if (frontKneeAngle > 150) {
    phase = 'up';
  } else {
    phase = 'transition';
  }

  // Check form
  if (leftKnee.y > leftAnkle.y + 0.2 || rightKnee.y > rightAnkle.y + 0.2) {
    feedback.push("Don't let back knee touch ground");
    formScore -= 10;
    formIssues.push({
      type: 'joint',
      landmarkIndices: leftKnee.y > rightKnee.y ? [25] : [26],
      severity: 'warning',
      message: 'Back knee too low'
    });
  }

  if (formScore >= 90) {
    feedback.push("Perfect lunge!");
    formIssues.push({
      type: 'connection',
      landmarkIndices: [23, 25, 27, 24, 26, 28],
      severity: 'perfect',
      message: 'Perfect lunge form'
    });
  } else if (formScore >= 75) {
    feedback.push("Good form");
  }

  return { phase, formScore: Math.max(0, formScore), feedback, formIssues };
}

// Jumping jack detection
export function detectJumpingJack(
  landmarks: Keypoint[],
  previousPhase: 'up' | 'down' | 'transition'
): { phase: 'up' | 'down' | 'transition'; formScore: number; feedback: string[]; formIssues: FormIssue[] } {
  const feedback: string[] = [];
  const formIssues: FormIssue[] = [];
  let formScore = 100;

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // Calculate arm spread and leg spread
  const armSpread = distance(leftWrist, rightWrist);
  const legSpread = distance(leftAnkle, rightAnkle);
  const shoulderWidth = distance(leftShoulder, rightShoulder);

  let phase: 'up' | 'down' | 'transition' = previousPhase;
  
  // Arms up and legs apart = up position
  if (armSpread > shoulderWidth * 1.5 && legSpread > shoulderWidth * 0.8) {
    phase = 'up';
    feedback.push("Nice extension!");
  } 
  // Arms down and legs together = down position
  else if (armSpread < shoulderWidth * 1.2 && legSpread < shoulderWidth * 0.5) {
    phase = 'down';
  } else {
    phase = 'transition';
  }

  if (formScore >= 90) {
    feedback.push("Great jumping jacks!");
    if (phase === 'up') {
      formIssues.push({
        type: 'connection',
        landmarkIndices: [11, 15, 12, 16, 27, 28], // Arms and legs
        severity: 'perfect',
        message: 'Perfect extension'
      });
    }
  }

  return { phase, formScore: Math.max(0, formScore), feedback, formIssues };
}

// High knees detection
export function detectHighKnees(
  landmarks: Keypoint[],
  previousPhase: 'up' | 'down' | 'transition'
): { phase: 'up' | 'down' | 'transition'; formScore: number; feedback: string[]; formIssues: FormIssue[] } {
  const feedback: string[] = [];
  const formIssues: FormIssue[] = [];
  let formScore = 100;

  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];

  // Check if either knee is raised high
  const leftKneeRaised = leftKnee.y < leftHip.y - 0.1;
  const rightKneeRaised = rightKnee.y < rightHip.y - 0.1;

  let phase: 'up' | 'down' | 'transition' = previousPhase;
  
  if (leftKneeRaised || rightKneeRaised) {
    phase = 'up';
    if (leftKnee.y < leftHip.y - 0.15 || rightKnee.y < rightHip.y - 0.15) {
      feedback.push("Excellent knee height!");
    } else {
      feedback.push("Lift knees higher");
      formScore -= 10;
    }
  } else {
    phase = 'down';
  }

  if (formScore >= 90) {
    feedback.push("Perfect high knees!");
    if (leftKneeRaised) {
      formIssues.push({
        type: 'joint',
        landmarkIndices: [25], // Left knee
        severity: 'perfect',
        message: 'Perfect knee height'
      });
    }
    if (rightKneeRaised) {
      formIssues.push({
        type: 'joint',
        landmarkIndices: [26], // Right knee
        severity: 'perfect',
        message: 'Perfect knee height'
      });
    }
  }

  return { phase, formScore: Math.max(0, formScore), feedback, formIssues };
}

export function detectExercise(
  exerciseType: ExerciseType,
  landmarks: Keypoint[],
  previousPhase: 'up' | 'down' | 'transition'
): { phase: 'up' | 'down' | 'transition'; formScore: number; feedback: string[]; formIssues: FormIssue[]; avgElbowAngle?: number } {
  switch (exerciseType) {
    case 'pushups':
      return detectPushup(landmarks, previousPhase);
    case 'squats':
      return detectSquat(landmarks, previousPhase);
    case 'lunges':
      return detectLunge(landmarks, previousPhase);
    case 'jumping_jacks':
      return detectJumpingJack(landmarks, previousPhase);
    case 'high_knees':
      return detectHighKnees(landmarks, previousPhase);
    default:
      return { phase: previousPhase, formScore: 0, feedback: [], formIssues: [] };
  }
}
