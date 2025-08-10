import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-route",
};

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const route = req.headers.get("x-route") || "estimate";
  const sb = createClient(supabaseUrl!, supabaseAnonKey!);

  try {
    const body = await req.json();

    if (route === "estimate") {
      // Expect { photos: [..], landmarks: {front:[]...}, widthProfiles: {front:[]...}, user: {...} }
      const { landmarks, widthProfiles, user } = body;

      // Simple estimation replicated on backend for consistency
      const estimates = computeEstimates({ landmarks, widthProfiles, user });

      // Persist scan summary (features only)
      const { data: { user: authUser } } = await sb.auth.getUser();
      const userId = authUser?.id || user?.userId || null;

      let scanId: string | null = null;
      if (userId) {
        const { data: scan } = await sb.from("body_scans").insert({ user_id: userId, sex: user?.sex || null, height_cm: user?.heightCm || null, weight_known_kg: user?.weightKnownKg || null }).select("id").single();
        scanId = scan?.id ?? null;
        if (scanId) {
          // store per-view features
          const imagesPayload = Object.keys(widthProfiles || {}).map((k) => ({
            scan_id: scanId,
            view: k,
            landmarks: (landmarks?.[k] ?? []),
            width_profile: (widthProfiles?.[k] ?? []),
          }));
          if (imagesPayload.length) await sb.from("body_scan_images").insert(imagesPayload);

          await sb.from("body_scan_metrics").insert({
            scan_id: scanId,
            estimates,
          });
        }
      }

      return new Response(JSON.stringify({ estimates: estimates.estimates, confidence: estimates.confidence, scanId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (route === "report") {
      const { estimates, user } = body;
      if (!openAIApiKey) {
        return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const prompt = buildPrompt(estimates, user);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful assistant generating concise wellness reports." },
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
        }),
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      // Split into sections heuristically
      const recommendations = text.split(/\n/).filter((l: string) => l.trim().startsWith("-") || l.trim().match(/^\d+\./));
      const analysisNotes = text.split(/\n/).filter((l: string) => l.toLowerCase().includes("confidence") || l.toLowerCase().includes("approx"));

      return new Response(JSON.stringify({ recommendations, analysisNotes, raw: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown route" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("body-scan error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

// --- Helpers ---

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function deg(a: number) { return (a * 180) / Math.PI; }

function computeEstimates({ landmarks, widthProfiles, user }: any) {
  const front = landmarks?.front || [];
  const prof = widthProfiles?.front || [];
  const idxChest = Math.round(prof.length * 0.28);
  const idxHip = Math.round(prof.length * 0.62);
  const region = prof.slice(Math.round(prof.length * 0.35), Math.round(prof.length * 0.55));
  const waistFrac = region.length ? Math.min(...region) : 0.35;
  const chestFrac = prof[idxChest] ?? 0.5;
  const hipFrac = prof[idxHip] ?? 0.6;

  const scale = user?.heightCm ? user.heightCm / 0.9 : null;
  const circ = (frac: number) => {
    const a = (scale ? frac * scale : (user?.heightCm ? frac * (user.heightCm / 3) : frac * 60)) / 2;
    const b = a * 0.8; const h = ((a - b) ** 2) / ((a + b) ** 2);
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  };

  const chestCm = circ(chestFrac);
  const waistCm = circ(waistFrac);
  const hipCm = circ(hipFrac);

  const L = front[11]; const R = front[12];
  const LH = front[23]; const RH = front[24];
  const shoulderTiltDeg = (L && R) ? Math.abs(deg(Math.atan2(R.y - L.y, R.x - L.x))) : 0;
  const pelvicTiltDeg = (LH && RH) ? Math.abs(deg(Math.atan2(RH.y - LH.y, RH.x - LH.x))) : 0;

  const postureScore = clamp(100 - (shoulderTiltDeg + pelvicTiltDeg) * 1.5, 40, 95) / 100;
  const symmetryScore = clamp(95 - Math.abs(hipCm - chestCm) * 0.1, 40, 95) / 100;

  let weightKg = user?.weightKnownKg ?? null;
  if (!weightKg && user?.heightCm) {
    const BMI = 22 + (waistCm - 80) * 0.05;
    weightKg = BMI * ((user.heightCm / 100) ** 2);
  }
  weightKg = weightKg ?? 70;

  const bf = clamp(((waistCm - (user?.sex === 'male' ? 90 : 70)) * 0.4) / 2 + 20, 8, 45);
  const bodyFatPctRange = [Math.max(5, bf - 3), Math.min(50, bf + 3)];
  const ffm = weightKg * (1 - (bf / 100));
  const muscleMassKg = clamp(ffm * 0.7, 20, 70);
  const s = user?.sex === 'male' ? 5 : -161;
  const bmr = Math.round(10 * weightKg + 6.25 * (user?.heightCm ?? 170) - 5 * (user?.age ?? 30) + s);
  const visceralFatIndex = clamp(Math.round((waistCm - 70) / 4), 1, 15);
  const bodyAge = clamp(Math.round(((postureScore + symmetryScore) / 2) < 0.7 ? (user?.age ?? 30) + 4 : (user?.age ?? 30) - 2), 18, 80);

  const estimates = { waistCm: +waistCm.toFixed(1), hipCm: +hipCm.toFixed(1), chestCm: +chestCm.toFixed(1), shoulderTiltDeg: +shoulderTiltDeg.toFixed(1), pelvicTiltDeg: +pelvicTiltDeg.toFixed(1), postureScore, symmetryScore, bodyFatPctRange, muscleMassKg: +muscleMassKg.toFixed(1), bmr, visceralFatIndex, bodyAge };
  const confidence = { waistCm: 0.7, hipCm: 0.7, chestCm: 0.7, shoulderTiltDeg: 0.8, pelvicTiltDeg: 0.8, postureScore: 0.7, symmetryScore: 0.6, bodyFatPctRange: 0.5, muscleMassKg: 0.5, bmr: 0.9, visceralFatIndex: 0.6, bodyAge: 0.6 };
  return { estimates, confidence };
}

function buildPrompt(estimates: any, user: any) {
  return `Act as a certified strength & conditioning coach. Given JSON with measured body metrics, posture angles, and confidence scores, generate:\nA concise Results Summary (no medical claims).\n3–5 Recommendations tailored to goal (${user?.goal ?? 'general_fitness'}).\nAnalysis Notes calling out asymmetries or low-confidence metrics and how to retake photos.\nRules: Don’t invent numbers. Reference only provided metrics. If confidence <0.6 for a metric, mark it ‘approximate’. Keep tone supportive. Maximum 180 words total.\n\nMetrics JSON:\n${JSON.stringify(estimates)}`;
}
