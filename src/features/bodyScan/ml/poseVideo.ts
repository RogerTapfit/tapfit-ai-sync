// Real-time pose detection using MediaPipe Tasks Vision in VIDEO mode
import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export type Keypoint = { x: number; y: number; z?: number; visibility?: number };

export type AlignmentResult = {
  score: number; // 0-100 percentage
  misalignedJoints: number[]; // indices of joints that are off
};

let landmarker: PoseLandmarker | null = null;
let initPromise: Promise<void> | null = null;

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";

async function ensureInit() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
    landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  })();
  return initPromise;
}

export async function initializePoseVideo(): Promise<void> {
  await ensureInit();
}

export async function detectPoseVideo(
  video: HTMLVideoElement,
  timestamp: number
): Promise<{ landmarks: Keypoint[]; worldLandmarks: Keypoint[]; ok: boolean }> {
  try {
    await ensureInit();
    if (!landmarker) throw new Error("PoseLandmarker not initialized");
    
    const result: PoseLandmarkerResult = landmarker.detectForVideo(video, timestamp);
    const lm = result?.landmarks?.[0];
    const wlm = result?.worldLandmarks?.[0];
    
    const landmarks: Keypoint[] = (lm || []).map((p) => ({ 
      x: p.x, 
      y: p.y, 
      z: p.z,
      visibility: p.visibility 
    }));
    
    const worldLandmarks: Keypoint[] = (wlm || []).map((p) => ({ 
      x: p.x, 
      y: p.y, 
      z: p.z,
      visibility: p.visibility 
    }));
    
    return { landmarks, worldLandmarks, ok: landmarks.length >= 20 };
  } catch (e) {
    console.warn("detectPoseVideo failed", e);
    return { landmarks: [], worldLandmarks: [], ok: false };
  }
}

/**
 * Calculate alignment score between user pose and ideal pose
 * Returns a score (0-100) and list of misaligned joint indices
 */
export function calculateAlignment(
  userLandmarks: Keypoint[],
  idealLandmarks: Keypoint[],
  threshold: number = 0.08 // Distance threshold for "aligned"
): AlignmentResult {
  if (userLandmarks.length < 33 || idealLandmarks.length < 33) {
    return { score: 0, misalignedJoints: [] };
  }

  // Key joints to evaluate (focusing on major body parts, excluding face/hands)
  const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  
  let totalScore = 0;
  const misaligned: number[] = [];

  keyJoints.forEach(idx => {
    const user = userLandmarks[idx];
    const ideal = idealLandmarks[idx];
    
    if (!user || !ideal || (user.visibility || 0) < 0.5) return;
    
    // Calculate Euclidean distance (normalized coordinates)
    const dx = user.x - ideal.x;
    const dy = user.y - ideal.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Convert distance to score (closer = better)
    const jointScore = Math.max(0, 1 - (distance / threshold));
    totalScore += jointScore;
    
    // Mark as misaligned if distance exceeds threshold
    if (distance > threshold) {
      misaligned.push(idx);
    }
  });

  const score = Math.round((totalScore / keyJoints.length) * 100);
  return { score, misalignedJoints: misaligned };
}

/**
 * Draws the ideal pose guide (semi-transparent, background layer)
 */
export function drawIdealPose(
  ctx: CanvasRenderingContext2D,
  landmarks: Keypoint[],
  width: number,
  height: number
): void {
  if (!landmarks || landmarks.length === 0) return;

  // Define connections between landmarks (same as MediaPipe Pose)
  const connections = [
    [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21],
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [27, 29], [27, 31],
    [24, 26], [26, 28], [28, 30], [28, 32],
  ];

  // Draw connections with a distinct style
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)'; // Light blue with transparency
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(96, 165, 250, 0.5)';

  connections.forEach(([start, end]) => {
    const startPoint = landmarks[start];
    const endPoint = landmarks[end];
    
    if (startPoint && endPoint) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    }
  });

  // Draw joints
  ctx.shadowBlur = 10;
  landmarks.forEach((landmark) => {
    if (landmark) {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      // Outer glow
      ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Inner circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // Reset shadow
  ctx.shadowBlur = 0;
}

/**
 * Draws the detected pose skeleton on a canvas with form correction highlights
 */
export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: Keypoint[],
  width: number,
  height: number,
  formIssues?: Array<{
    type: 'joint' | 'connection' | 'alignment';
    landmarkIndices: number[];
    severity: 'error' | 'warning' | 'perfect';
    message: string;
  }>,
  misalignedJoints?: number[],
  isRepFlashing?: boolean,
  showReferenceLine?: boolean
): void {
  // Draw reference line FIRST (before landmark check so it's always visible)
  if (showReferenceLine) {
    const referenceY = height * 0.33; // 33% from top (shoulder height for push-up depth)
    ctx.save();
    ctx.strokeStyle = '#EF4444'; // red-500
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]); // dashed line (15px dash, 10px gap)
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, referenceY);
    ctx.lineTo(width, referenceY);
    ctx.stroke();
    ctx.setLineDash([]); // reset to solid
    ctx.restore();
  }
  
  // Early return if not enough landmarks (after drawing reference line)
  if (landmarks.length < 33) return;
  
  // Create sets of landmarks for each severity level for efficient lookup
  const errorLandmarks = new Set<number>();
  const warningLandmarks = new Set<number>();
  const perfectLandmarks = new Set<number>();
  const errorConnections = new Set<string>();
  const perfectConnections = new Set<string>();
  
  if (formIssues) {
    formIssues.forEach(issue => {
      if (issue.type === 'joint') {
        issue.landmarkIndices.forEach(idx => {
          if (issue.severity === 'error') errorLandmarks.add(idx);
          else if (issue.severity === 'warning') warningLandmarks.add(idx);
          else if (issue.severity === 'perfect') perfectLandmarks.add(idx);
        });
      } else if (issue.type === 'connection' || issue.type === 'alignment') {
        // Store connections for special rendering
        for (let i = 0; i < issue.landmarkIndices.length - 1; i++) {
          const key = `${issue.landmarkIndices[i]}-${issue.landmarkIndices[i + 1]}`;
          if (issue.severity === 'error') errorConnections.add(key);
          else if (issue.severity === 'perfect') perfectConnections.add(key);
        }
      }
    });
  }

  // Connections for pose skeleton (renamed from connections)
  const POSE_CONNECTIONS = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
    [15, 17], [15, 19], [15, 21], [16, 18], [16, 20], [16, 22], // Hands
    [11, 23], [12, 24], [23, 24], // Torso
    [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
    [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
    [27, 31], [28, 32], // Feet
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], // Face
  ];

  // Draw connections with color-coded feedback (thicker for better visibility)
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.shadowBlur = 12;

  POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    if (!start || !end) return;
    if ((start.visibility || 0) < 0.5 || (end.visibility || 0) < 0.5) return;
    
    const connKey = `${startIdx}-${endIdx}`;
    const connKeyReverse = `${endIdx}-${startIdx}`;
    
    // Determine connection color based on form issues
    let strokeColor = isRepFlashing ? '#22c55e' : '#dc2626'; // Green when flashing, else red
    let shadowColor = isRepFlashing ? 'rgba(34, 197, 94, 0.8)' : 'rgba(220, 38, 38, 0.5)';
    
    if (errorConnections.has(connKey) || errorConnections.has(connKeyReverse)) {
      strokeColor = '#ef4444'; // Red for errors
      shadowColor = 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = 7;
    } else if (perfectConnections.has(connKey) || perfectConnections.has(connKeyReverse)) {
      strokeColor = '#22c55e'; // Green for perfect
      shadowColor = 'rgba(34, 197, 94, 0.7)';
      ctx.lineWidth = 7;
    }
    
    ctx.strokeStyle = strokeColor;
    ctx.shadowColor = shadowColor;
    ctx.beginPath();
    ctx.moveTo(start.x * width, start.y * height);
    ctx.lineTo(end.x * width, end.y * height);
    ctx.stroke();
    
    // Reset line width
    ctx.lineWidth = 5;
  });

  // Draw keypoints with color-coded form feedback
  ctx.shadowBlur = 12;
  landmarks.forEach((point, idx) => {
    if ((point.visibility || 0) < 0.5) return;
    const x = point.x * width;
    const y = point.y * height;
    
    // Determine color based on form issues and alignment (larger for better visibility)
    let outerColor = isRepFlashing ? '#22c55e' : '#dc2626'; // Green when flashing, else red
    let innerColor = isRepFlashing ? '#c9ffc9' : '#ffffff';
    let glowColor = isRepFlashing ? 'rgba(34, 197, 94, 0.8)' : 'rgba(220, 38, 38, 0.5)';
    let radius = isRepFlashing ? 14 : 10; // Bigger joints for visibility
    
    // Only apply flash if no specific form issues - errors/warnings override
    if (!isRepFlashing || errorLandmarks.has(idx) || warningLandmarks.has(idx) || perfectLandmarks.has(idx) || misalignedJoints?.includes(idx)) {
      // Misaligned joints take priority over default styling
      if (misalignedJoints?.includes(idx) && !errorLandmarks.has(idx) && !perfectLandmarks.has(idx)) {
      outerColor = '#f59e0b'; // Amber for misalignment
      innerColor = '#fef3c7';
      glowColor = 'rgba(245, 158, 11, 0.7)';
      radius = 13;
    } else if (errorLandmarks.has(idx)) {
      // Red for errors - more prominent
      outerColor = '#ef4444';
      innerColor = '#ffc9c9';
      glowColor = 'rgba(239, 68, 68, 0.7)';
      radius = 14;
    } else if (warningLandmarks.has(idx)) {
      // Yellow for warnings
      outerColor = '#facc15';
      innerColor = '#ffffc9';
      glowColor = 'rgba(250, 204, 21, 0.7)';
      radius = 12;
    } else if (perfectLandmarks.has(idx)) {
      // Green for perfect form
      outerColor = '#22c55e';
      innerColor = '#c9ffc9';
      glowColor = 'rgba(34, 197, 94, 0.7)';
      radius = 12;
    }
    }
    
    // Outer glow circle
    ctx.fillStyle = outerColor;
    ctx.shadowColor = glowColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Inner white/colored center
    ctx.fillStyle = innerColor;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 12;
  });

  // Reset shadow
  ctx.shadowBlur = 0;
}
