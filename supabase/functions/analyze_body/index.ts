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

async function buildSummaryFromOpenAI(metrics: any) {
  if (!OPENAI_API_KEY) return { headlines: {}, recommendations: [], analysis_notes: [], focus_areas: [], disclaimer: "No API key configured." };
  const system = "You write concise, actionable fitness insights from numeric body metrics. Avoid medical claims. Keep advice specific and safe.";
  const userPayload = {
    metrics,
    persona: { goal: "general_fitness", experience: "beginner" }
  };
  const body = JSON.stringify({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Create JSON with:
{
 "headlines": { "body_age": "...", "risks": ["..."] },
 "recommendations": ["...5-7 bullets..."],
 "analysis_notes": ["..."],
 "focus_areas": ["... tags like posture, symmetry ..."],
 "disclaimer": "Wellness only; not medical advice."
}
Metrics:
${JSON.stringify(userPayload, null, 2)}` }
    ]
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body
  });

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    // Fallback to simple structure
    return {
      headlines: {},
      recommendations: (content.split("\n").filter((l: string) => l.trim().startsWith("-"))).slice(0, 7),
      analysis_notes: [],
      focus_areas: [],
      disclaimer: "Wellness only; not medical advice."
    };
  }
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

    // Placeholder: If features are provided from client on-device ML, use them for estimation.
    // Later, replace this block with server-side CV over images in Storage (admin client).
    let metrics: any;
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

      // Map to metrics shape
      const avgBf = Array.isArray(est.bodyFatPctRange) ? (est.bodyFatPctRange[0] + est.bodyFatPctRange[1]) / 2 : 22;
      // Rough derived weight if needed (back-calc from BMR heuristics is unreliable; keep simple)
      const height = user?.heightCm ?? scan.height_cm ?? 170;
      const assumedWeight = Math.round((est.bmr - (user?.sex === "male" ? 5 : -161) - 6.25 * height + 5 * (user?.age ?? 30)) / 10);
      const weightKg = isFinite(assumedWeight) && assumedWeight > 0 ? assumedWeight : 70;
      const fatMassKg = (avgBf / 100) * weightKg;
      const leanMassKg = weightKg - fatMassKg;

      metrics = {
        bf_percent: +avgBf.toFixed(1),
        lean_mass_kg: +leanMassKg.toFixed(1),
        fat_mass_kg: +fatMassKg.toFixed(1),
        bmr_kcal: est.bmr,
        posture: {
          head_tilt_deg: 0, // not available from current landmarks subset
          shoulder_tilt_deg: est.shoulderTiltDeg,
          pelvic_tilt_deg: est.pelvicTiltDeg,
          spinal_curve_score: +Math.round(est.postureScore * 100) / 100
        },
        asymmetry: {
          left_right_delta_shoulder_cm: 0.5, // placeholder small asymmetry
          left_right_delta_hip_cm: 0.3
        },
        circumferences_cm: {
          waist: est.waistCm,
          neck: +Math.max(30, est.chestCm * 0.36).toFixed(1),
          hips: est.hipCm,
          chest: est.chestCm,
          thigh: +Math.max(45, est.hipCm * 0.58 * 0.6).toFixed(1),
          bicep: +Math.max(25, est.chestCm * 0.35 * 0.45).toFixed(1)
        },
        inputs: {
          height_cm: height,
          views: Object.keys(features.widthProfiles || {})
        }
      };
    } else {
      // Future server-side CV placeholder
      metrics = { error: "Server-side CV not yet enabled for this deployment." };
    }

    const summary = await buildSummaryFromOpenAI(metrics);

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
