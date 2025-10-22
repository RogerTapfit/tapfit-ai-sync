// Estimation utilities: derive measurements and posture metrics from landmarks + silhouettes
import type { Keypoint } from "./ml/pose";

export type Estimates = {
  waistCm: number; hipCm: number; chestCm: number;
  shoulderTiltDeg: number; pelvicTiltDeg: number;
  postureScore: number; symmetryScore: number;
  bodyFatPctRange: [number, number]; muscleMassKg: number;
  bmr: number; visceralFatIndex: number; bodyAge: number;
};

export type ConfidenceMap = Record<string, number>;

function deg(a: number) { return (a * 180) / Math.PI; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function getPoint(lms: Keypoint[], idxLeft: number, idxRight: number) {
  const L = lms[idxLeft]; const R = lms[idxRight];
  return { L, R };
}

// Simple heuristic scale using known height and normalized pose height
function estimateScaleCmPerNormUnit(heightCm?: number) {
  if (!heightCm) return null;
  // 1.0 in normalized y roughly equals full image height; use 0.9 to account for margins
  return heightCm / 0.9;
}

// Extract tilt from two symmetric landmarks
function tiltDeg(lms: Keypoint[], li: number, ri: number) {
  const { L, R } = getPoint(lms, li, ri);
  if (!L || !R) return { deg: 0, conf: 0 };
  const angle = Math.atan2((R.y - L.y), (R.x - L.x));
  return { deg: Math.abs(deg(angle)), conf: ((L.v ?? 0.6) + (R.v ?? 0.6)) / 2 };
}

// From front width profile, estimate circumference assuming ellipse
function circumferenceFromProfile(widthFrac: number, scaleCmPerNormUnit: number | null, heightCm?: number) {
  // If no scale, fallback to heuristic using height
  const torsoWidthCm = scaleCmPerNormUnit ? widthFrac * scaleCmPerNormUnit : (heightCm ? widthFrac * (heightCm / 3) : widthFrac * 60);
  const a = torsoWidthCm / 2; // semi-major axis
  const b = a * 0.8; // assume depth 80% of width
  // Ramanujan approximation
  const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
  const C = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  return C;
}

export function estimateAll(params: {
  landmarks: Record<string, Keypoint[]>;
  widthProfiles: Record<string, number[]>;
  user: { sex: 'male' | 'female' | 'unspecified'; age?: number; heightCm?: number; weightKnownKg?: number | null };
}): { estimates: Estimates; confidence: ConfidenceMap } {
  const { landmarks, widthProfiles, user } = params;
  const front = landmarks.front || [];
  const scale = estimateScaleCmPerNormUnit(user.heightCm);

  // Pick rows for chest/waist/hip from profile indices
  const prof = widthProfiles.front || [];
  const idxChest = Math.round(prof.length * 0.28);
  const idxHip = Math.round(prof.length * 0.62);
  // Waist as the minimum width between chest and hip
  const region = prof.slice(Math.round(prof.length * 0.35), Math.round(prof.length * 0.55));
  const waistFrac = region.length ? Math.min(...region) : 0.35;
  const chestFrac = prof[idxChest] ?? 0.5;
  const hipFrac = prof[idxHip] ?? 0.6;

  const chestCm = circumferenceFromProfile(chestFrac, scale, user.heightCm);
  const waistCm = circumferenceFromProfile(waistFrac, scale, user.heightCm);
  const hipCm = circumferenceFromProfile(hipFrac, scale, user.heightCm);

  // Tilts
  // MediaPipe indices: 11 left shoulder, 12 right shoulder, 23 left hip, 24 right hip
  const sh = tiltDeg(front, 11, 12);
  const hp = tiltDeg(front, 23, 24);

  // Posture / symmetry (simple heuristics)
  const postureScore = clamp(100 - (sh.deg + hp.deg) * 1.5, 40, 95);
  const symmetryScore = clamp(95 - Math.abs(hipCm - chestCm) * 0.1, 40, 95);

  // Estimate weight from height and waist/hip if unknown
  let weightKg = user.weightKnownKg ?? null;
  if (!weightKg && user.heightCm) {
    const BMI = 22 + (waistCm - 80) * 0.05; // center near 22 BMI
    weightKg = (BMI * Math.pow(user.heightCm / 100, 2));
  }
  weightKg = weightKg ?? 70;

  // US Navy style body fat estimate (very rough without neck)
  const bf = clamp(((waistCm - (user.sex === 'male' ? 90 : 70)) * 0.4) / 2 + 20, 8, 45);
  const bodyFatPctRange: [number, number] = [Math.max(5, bf - 3), Math.min(50, bf + 3)];

  const ffm = weightKg * (1 - (bf / 100));
  const muscleMassKg = clamp(ffm * 0.7, 20, 70);

  // BMR (Mifflin-St Jeor)
  const s = user.sex === 'male' ? 5 : -161;
  const bmr = Math.round(10 * weightKg + 6.25 * (user.heightCm ?? 170) - 5 * (user.age ?? 30) + s);

  const visceralFatIndex = clamp(Math.round((waistCm - 70) / 4), 1, 15);
  const bodyAge = clamp(Math.round((postureScore + symmetryScore) / 2 < 70 ? (user.age ?? 30) + 4 : (user.age ?? 30) - 2), 18, 80);

  const estimates: Estimates = {
    waistCm: +waistCm.toFixed(1),
    hipCm: +hipCm.toFixed(1),
    chestCm: +chestCm.toFixed(1),
    shoulderTiltDeg: +sh.deg.toFixed(1),
    pelvicTiltDeg: +hp.deg.toFixed(1),
    postureScore: Math.round(postureScore) / 100,
    symmetryScore: Math.round(symmetryScore) / 100,
    bodyFatPctRange,
    muscleMassKg: +muscleMassKg.toFixed(1),
    bmr,
    visceralFatIndex,
    bodyAge,
  };

  const confidence: ConfidenceMap = {
    waistCm: clamp(0.5 + (1 - Math.abs(0.45 - waistFrac)) * 0.4, 0.4, 0.95),
    hipCm: 0.7,
    chestCm: 0.7,
    shoulderTiltDeg: clamp((sh.conf ?? 0.6), 0.3, 0.95),
    pelvicTiltDeg: clamp((hp.conf ?? 0.6), 0.3, 0.95),
    postureScore: 0.7,
    symmetryScore: 0.6,
    bodyFatPctRange: 0.5,
    muscleMassKg: 0.5,
    bmr: 0.9,
    visceralFatIndex: 0.6,
    bodyAge: 0.6,
  } as any;

  return { estimates, confidence };
}
