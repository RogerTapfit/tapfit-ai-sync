// Fitness Age computation based on multi-domain scoring with graceful degradation
// Source: Provided algorithm tailored for TapFit

export type Sex = "male" | "female";

export type FitnessInputs = {
  sex: Sex;
  heightCm?: number;
  // Body comp
  bodyFatPct?: number;   // from scan
  waistCm?: number;      // from scan or tape
  // Cardio
  vo2?: number;          // ml/kg/min
  rhr?: number;          // bpm
  hrv?: number;          // RMSSD ms
  // Strength (any available)
  bench1RM?: number; squat1RM?: number; dead1RM?: number; weightKg?: number;
  pushupsPerMin?: number; plankSec?: number;
  // Mobility / posture
  postureScore?: number; // 0..100
  sitReachCm?: number;   // past toes (+), shortfall (−)
  // Activity / recovery
  mvpaMinWeek?: number; sleepHours?: number;
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function computeFitnessAge(i: FitnessInputs) {
  const whtr = i.waistCm && i.heightCm ? i.waistCm / i.heightCm : undefined;

  // Body composition (30%)
  let bfPen = 0, whtrPen = 0;
  if (typeof i.bodyFatPct === "number") {
    const green = i.sex === "female" ? [18, 28] : [10, 20];
    const below = Math.max(0, green[0] - i.bodyFatPct);
    const above = Math.max(0, i.bodyFatPct - green[1]);
    bfPen = clamp((below + above) * 2.5, 0, 40);
  }
  if (typeof whtr === "number") {
    whtrPen = clamp(Math.max(0, whtr - 0.50) * 200, 0, 30);
  }
  const compAvail = (typeof i.bodyFatPct === "number") || (typeof whtr === "number");
  const comp = compAvail ? clamp(100 - (bfPen + whtrPen)) : undefined;

  // Cardio (25%)
  const base = i.sex === "female" ? 25 : 28;
  const pv = typeof i.vo2 === "number" ? clamp((i.vo2 - base) * 2.5, 0, 75) : 0;
  const pr = typeof i.rhr === "number" ? clamp((70 - i.rhr) * 1.2, -20, 20) : 0;
  const ph = typeof i.hrv === "number" ? clamp((i.hrv - 50) * 0.5, -15, 25) : 0;
  const cardio = (typeof i.vo2 === "number" || typeof i.rhr === "number" || typeof i.hrv === "number")
    ? clamp(30 + pv + pr + ph) : undefined;

  // Strength (25%)
  let strength: number | undefined;
  if (i.weightKg && (i.bench1RM || i.squat1RM || i.dead1RM)) {
    const arr = [
      i.bench1RM ? i.bench1RM / i.weightKg : undefined,
      i.squat1RM ? i.squat1RM / i.weightKg : undefined,
      i.dead1RM ? i.dead1RM / i.weightKg : undefined,
    ].filter((x): x is number => typeof x === "number");
    const SI = arr.reduce((a,b)=>a+b,0) / arr.length;
    strength = clamp(25 + SI * 40);
  } else if (typeof i.pushupsPerMin === "number" || typeof i.plankSec === "number") {
    const pushPts = i.pushupsPerMin ? clamp(i.pushupsPerMin * 1.2, 0, 60) : 0;
    const plankPts = i.plankSec ? clamp((i.plankSec / 180) * 40, 0, 40) : 0;
    strength = clamp(pushPts + plankPts);
  }

  // Mobility / posture (10%)
  const mob = (typeof i.postureScore === "number" || typeof i.sitReachCm === "number")
    ? clamp((i.postureScore ?? 0) * 0.7 + ((i.sitReachCm ?? 0) / 10) * 30)
    : undefined;

  // Activity / recovery (10%)
  const act = i.mvpaMinWeek ? clamp((i.mvpaMinWeek / 150) * 80, 0, 80) : 0;
  const sl = i.sleepHours ? clamp(20 - Math.abs(i.sleepHours - 8) * 8, 0, 20) : 0;
  const activity = (i.mvpaMinWeek || i.sleepHours) ? clamp(act + sl) : undefined;

  // Weighted average over available domains
  const parts: {v?: number; w: number}[] = [
    { v: comp,     w: 0.30 },
    { v: cardio,   w: 0.25 },
    { v: strength, w: 0.25 },
    { v: mob,      w: 0.10 },
    { v: activity, w: 0.10 },
  ];
  const present = parts.filter(p => typeof p.v === "number");
  const wsum = present.reduce((a,p)=>a+p.w,0) || 1;
  const overall = present.reduce((a,p)=>a + (p.v as number) * (p.w/wsum), 0);

  const fitnessAgeRaw = Math.round(80 - 0.62 * overall);
  return {
    scores: { comp, cardio, strength, mobility: mob, activity },
    overall: Math.round(overall),
    fitnessAge: Math.max(18, Math.min(80, fitnessAgeRaw)),
  };
}
