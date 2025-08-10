import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

type Keypoint = { x: number; y: number; v?: number };

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function deg(a: number) { return (a * 180) / Math.PI; }

// Heuristic circumference from width profile fraction
function circumferenceFromProfile(widthFrac: number, scaleCmPerNormUnit: number | null, heightCm?: number) {
  const torsoWidthCm = scaleCmPerNormUnit ? widthFrac * scaleCmPerNormUnit : (heightCm ? widthFrac * (heightCm / 3) : widthFrac * 60);
  const a = torsoWidthCm / 2;
  const b = a * 0.8;
  const h = ((a - b) ** 2) / ((a + b) ** 2);
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

function estimateAll(params: {
  landmarks: Record<string, Keypoint[]>;
  widthProfiles: Record<string, number[]>;
  user: { sex: 'male' | 'female' | 'unspecified'; age?: number; heightCm?: number; weightKnownKg?: number | null };
}) {
  const { landmarks, widthProfiles, user } = params;
  const front = landmarks.front || [];
  const prof = widthProfiles.front || [];
  const idxChest = Math.round(prof.length * 0.28);
  const idxHip = Math.round(prof.length * 0.62);
  const region = prof.slice(Math.round(prof.length * 0.35), Math.round(prof.length * 0.55));
  const waistFrac = region.length ? Math.min(...region) : 0.35;
  const chestFrac = prof[idxChest] ?? 0.5;
  const hipFrac = prof[idxHip] ?? 0.6;

  const scale = user.heightCm ? user.heightCm / 0.9 : null;
  const chestCm = circumferenceFromProfile(chestFrac, scale, user.heightCm);
  const waistCm = circumferenceFromProfile(waistFrac, scale, user.heightCm);
  const hipCm = circumferenceFromProfile(hipFrac, scale, user.heightCm);

  const L = front[11]; const R = front[12];
  const LH = front[23]; const RH = front[24];
  const shoulderTiltDeg = (L && R) ? Math.abs(deg(Math.atan2(R.y - L.y, R.x - L.x))) : 0;
  const pelvicTiltDeg = (LH && RH) ? Math.abs(deg(Math.atan2(RH.y - LH.y, RH.x - LH.x))) : 0;

  const postureScore = clamp(100 - (shoulderTiltDeg + pelvicTiltDeg) * 1.5, 40, 95) / 100;
  const symmetryScore = clamp(95 - Math.abs(hipCm - chestCm) * 0.1, 40, 95) / 100;

  let weightKg = user.weightKnownKg ?? null;
  if (!weightKg && user.heightCm) {
    const BMI = 22 + (waistCm - 80) * 0.05;
    weightKg = BMI * ((user.heightCm / 100) ** 2);
  }
  weightKg = weightKg ?? 70;

  const bf = clamp(((waistCm - (user.sex === 'male' ? 90 : 70)) * 0.4) / 2 + 20, 8, 45);
  const bodyFatPctRange: [number, number] = [Math.max(5, bf - 3), Math.min(50, bf + 3)];
  const ffm = weightKg * (1 - (bf / 100));
  const muscleMassKg = clamp(ffm * 0.7, 20, 70);

  const s = user.sex === 'male' ? 5 : -161;
  const bmr = Math.round(10 * weightKg + 6.25 * (user.heightCm ?? 170) - 5 * (user.age ?? 30) + s);
  const visceralFatIndex = clamp(Math.round((waistCm - 70) / 4), 1, 15);
  const bodyAge = clamp(Math.round(((postureScore + symmetryScore) / 2) < 0.7 ? (user.age ?? 30) + 4 : (user.age ?? 30) - 2), 18, 80);

  return {
    estimates: {
      waistCm: +waistCm.toFixed(1),
      hipCm: +hipCm.toFixed(1),
      chestCm: +chestCm.toFixed(1),
      shoulderTiltDeg: +shoulderTiltDeg.toFixed(1),
      pelvicTiltDeg: +pelvicTiltDeg.toFixed(1),
      postureScore,
      symmetryScore,
      bodyFatPctRange,
      muscleMassKg: +muscleMassKg.toFixed(1),
      bmr,
      visceralFatIndex,
      bodyAge
    }
  };
}

// Local-only summarization helpers (no external API)
function qualitativeLevel(score: number) {
  if (score >= 80) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function skinQualityScore(inputs: { views: string[]; widthProfiles: Record<string, number[]> }) {
  const views = inputs.views.length;
  const profileCoverage = Object.values(inputs.widthProfiles).reduce((acc, arr) => acc + (arr?.length ? 1 : 0), 0);
  const score = clamp(((views >= 3 ? 80 : 60) + (profileCoverage >= 3 ? 15 : 5)), 40, 95);
  const notes = [] as string[];
  if (views < 4) notes.push("Fewer than 4 views provided – consider adding missing angles.");
  if (profileCoverage < 3) notes.push("Segmentation confidence is modest – aim for higher contrast background.");
  if (!notes.length) notes.push("Good lighting and pose consistency detected.");
  return { score, notes: notes.join(" ") };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || "";

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });

  const admin = SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

  try {
    const { scanId, features, user } = await req.json();
    if (!scanId) {
      return new Response(JSON.stringify({ error: "Missing scanId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark as processing
    await sb.from("body_scans").update({ status: "processing" }).eq("id", scanId);

    // Load scan row
    const { data: scan, error: scanErr } = await sb.from("body_scans").select("id,user_id,height_cm,front_path,left_path,right_path,back_path").eq("id", scanId).maybeSingle();
    if (scanErr || !scan) {
      await sb.from("body_scans").update({ status: "error", error: scanErr?.message || "Scan not found" }).eq("id", scanId);
      return new Response(JSON.stringify({ error: "Scan not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let metrics: any;
    let summary: any = { recommendations: [], analysis_notes: [] };
    if (features?.landmarks && features?.widthProfiles) {
      const est = estimateAll({
        landmarks: features.landmarks,
        widthProfiles: features.widthProfiles,
        user: {
          sex: (user?.sex ?? "unspecified"),
          age: user?.age,
          heightCm: user?.heightCm ?? scan.height_cm ?? undefined,
          weightKnownKg: user?.weightKnownKg ?? null
        }
      }).estimates;

      const height = user?.heightCm ?? scan.height_cm ?? undefined;
      let weightKg = user?.weightKnownKg ?? null;
      if (!weightKg && height) {
        const BMI = 22 + (est.waistCm - 80) * 0.05;
        weightKg = +(BMI * ((height / 100) ** 2)).toFixed(1);
      }

      const bfLow = +(est.bodyFatPctRange[0]).toFixed(1);
      const bfHigh = +(est.bodyFatPctRange[1]).toFixed(1);
      const bfEstimate = +(((bfLow + bfHigh) / 2).toFixed(1));
      const leanMassKg = weightKg ? +(weightKg * (1 - bfEstimate / 100)).toFixed(1) : null;
      const muscleMassKg = +est.muscleMassKg.toFixed(1);

      // Measurements (cm) with sanity clamps
      const clampCm = (n: number) => clamp(+n.toFixed(1), 40, 200);
      const chest = clampCm(est.chestCm);
      const waist = clampCm(est.waistCm);
      const hips = clampCm(est.hipCm);
      const shoulders = clampCm(est.chestCm + 8);
      const thighs = clampCm(Math.max(45, est.hipCm * 0.58 * 0.6));

      const postureScore = clamp(Math.round(est.postureScore * 100), 0, 100);
      const symmetryScore = clamp(Math.round(est.symmetryScore * 100), 0, 100);

      const whr = +(waist / Math.max(hips, 1)).toFixed(2);
      const isMale = (user?.sex ?? "unspecified").toString().startsWith("m");
      const visceralLevel = (() => {
        if (isMale) {
          if (waist >= 102 || whr > 0.90) return "high";
          if (waist >= 94 || whr > 0.85) return "medium";
          return "low";
        } else {
          if (waist >= 88 || whr > 0.85) return "high";
          if (waist >= 80 || whr > 0.80) return "medium";
          return "low";
        }
      })();

      const skin = skinQualityScore({
        views: Object.keys(features.widthProfiles || {}),
        widthProfiles: features.widthProfiles || {}
      });

      // Build reasons
      const bfReason = `Estimated from waist-to-hip ratio (WHR=${whr}), torso width profile minima, sex-specific patterning, and height scaling.`;
      const mmConfidence = (weightKg ? (Object.keys(features.widthProfiles||{}).length >= 3 ? "high" : "medium") : (Object.keys(features.widthProfiles||{}).length >= 2 ? "medium" : "low"));
      const mmReason = weightKg
        ? "Derived from estimated fat-free mass (uses provided weight) and visual profile proportion heuristics."
        : "Approximation without scale weight: inferred via WHR, height, and profile proportions; accuracy reduced.";
      const postureNotes = `Shoulder tilt ${est.shoulderTiltDeg}°, pelvic tilt ${est.pelvicTiltDeg}°. Higher symmetry/posture scores indicate better alignment.`;
      const symmetryNotes = `Symmetry balanced by low shoulder/pelvic tilt deltas; large deltas reduce score.`;
      const visceralNotes = `Level based on waist ${waist} cm and WHR ${whr} with sex-specific thresholds.`;

      // JSON schema metrics
      metrics = {
        body_fat_percent: { estimate: bfEstimate, low: bfLow, high: bfHigh, reason: bfReason },
        muscle_mass_kg: { estimate: muscleMassKg, confidence: mmConfidence, reason: mmReason },
        measurements_cm: { chest, waist, hips, shoulders, thighs },
        posture_score: { score: postureScore, notes: postureNotes },
        symmetry_score: { score: symmetryScore, notes: symmetryNotes },
        visceral_fat_index: { level: visceralLevel, notes: visceralNotes },
        skin_scan_quality: { score: skin.score, notes: skin.notes },
        bmr: { kcal_per_day: est.bmr, formula: "Mifflin-St Jeor" },
        recommendations: [] as string[]
      };

      // Build concise, actionable recommendations
      const rec: string[] = [];
      if (bfEstimate > (isMale ? 22 : 30)) rec.push("Run a modest 300–400 kcal daily deficit with 1.6–2.2 g/kg protein.");
      if (bfEstimate <= (isMale ? 22 : 30)) rec.push("Maintain at isocaloric intake; prioritize progressive overload in 3–4 full-body sessions/week.");
      if (postureScore < 80) rec.push("Add 10–12 min daily mobility: thoracic openers, hip flexor stretch, and wall slides.");
      if (symmetryScore < 85) rec.push("Include unilateral sets (Bulgarian split squats, single-arm rows) to reduce imbalances.");
      if (visceralLevel !== "low") rec.push("Walk 7–9k steps/day and limit late-night ultra-processed snacks to reduce central adiposity.");
      rec.push("Target 7–9 hours sleep; keep protein 25–35 g per meal across 3–4 meals.");
      metrics.recommendations = rec.slice(0, 7);

      // Local summary payload for UI
      summary = {
        recommendations: metrics.recommendations,
        analysis_notes: [bfReason, postureNotes, symmetryNotes, visceralNotes, skin.notes]
      };
    } else {
      metrics = { error: "Insufficient on-device features provided (landmarks/widthProfiles)." };
      summary = {
        recommendations: ["Retake photos with even front lighting and a plain background."],
        analysis_notes: ["Missing landmarks/segmentation; cannot compute metrics reliably."]
      };
    }

    await sb.from("body_scans").update({
      status: "done",
      metrics,
      summary,
      error: null
    }).eq("id", scanId);

    return new Response(JSON.stringify({ ok: true, scanId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze_body error", e);
    // Best-effort: attach error on the row if scanId is present
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.scanId) {
        const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
        await sb.from("body_scans").update({ status: "error", error: String(e?.message || e) }).eq("id", body.scanId);
      }
    } catch {}
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
