// On-device pose detection using MediaPipe Tasks Vision
// Loads the lightweight Pose Landmarker model and returns normalized keypoints

import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
  type Landmark,
} from "@mediapipe/tasks-vision";

export type Keypoint = { x: number; y: number; v?: number };

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
      runningMode: "IMAGE",
      numPoses: 1,
      minPoseDetectionConfidence: 0.3,
      minPosePresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
      outputSegmentationMasks: false,
    });
  })();
  return initPromise;
}

function toHTMLImageElement(src: string | Blob | HTMLImageElement): Promise<HTMLImageElement> {
  if (src instanceof HTMLImageElement) return Promise.resolve(src);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (typeof src === "string") {
      img.src = src;
    } else {
      img.src = URL.createObjectURL(src);
    }
  });
}

export async function detectPose(
  image: HTMLImageElement | Blob | string
): Promise<{ landmarks: Keypoint[]; ok: boolean }>
{
  try {
    await ensureInit();
    if (!landmarker) throw new Error("PoseLandmarker not initialized");
    const img = await toHTMLImageElement(image);
    const result = landmarker.detect(img);
    const lm: Landmark[] | undefined = result?.landmarks?.[0];
    const landmarks: Keypoint[] = (lm || []).map((p) => ({ x: p.x, y: p.y, v: p.visibility }));
    return { landmarks, ok: landmarks.length >= 20 };
  } catch (e) {
    console.warn("detectPose failed", e);
    return { landmarks: [], ok: false };
  }
}
