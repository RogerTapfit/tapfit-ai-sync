// Real-time pose detection using MediaPipe Tasks Vision in VIDEO mode
import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";

export type Keypoint = { x: number; y: number; z?: number; visibility?: number };

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

export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: Keypoint[],
  width: number,
  height: number
): void {
  if (landmarks.length < 33) return;

  // Connections for pose skeleton
  const connections = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
    [11, 23], [12, 24], [23, 24], // Torso
    [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
    [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
  ];

  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';

  // Draw connections
  connections.forEach(([start, end]) => {
    const startPoint = landmarks[start];
    const endPoint = landmarks[end];
    if (startPoint && endPoint && 
        (startPoint.visibility || 0) > 0.5 && 
        (endPoint.visibility || 0) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    }
  });

  // Draw landmarks
  landmarks.forEach((point) => {
    if ((point.visibility || 0) > 0.5) {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}
