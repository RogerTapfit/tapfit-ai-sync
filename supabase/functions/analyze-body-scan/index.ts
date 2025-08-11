import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

// CORS headers for web clients
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const VISION_MODEL = "gpt-4o-mini"; // fast + vision, supports image inputs

// Supabase
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE_ROLE =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE);

const BUCKET = "body-scans";

type FeaturesPayload = {
  landmarks?: Record<string, any[]>;
  widthProfiles?: Record<string, number[]>;
  photos?: string[];
};

type Payload = {
  scan_id: string;
  user_id?: string;
  sex: "male" | "female";
  height_cm: number;
  age?: number;
  features?: FeaturesPayload;
};

type Metrics = {
  body_fat_pct_range: [number, number];
  muscle_mass_kg_est: number;
  circumferences_cm?: {
    chest?: number; waist?: number; hips?: number; shoulders?: number; thighs?: number;
  };
  posture?: { score_pct: number; notes?: string[] };
  symmetry?: { score_pct: number; notes?: string[] };
  skin_health_pct?: number;
  recommendations?: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

async function signed(path: string, minutes = 10) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, minutes * 60);
  if (error) throw error;
  return data.signedUrl;
}

function stripCodeFences(s: string) {
  if (typeof s !== "string") return s;
  // Remove ```json ... ``` wrappers if present
  const fence = s.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  if (fence) return fence[1];
  return s;
}

function profileHints(widthProfiles?: Record<string, number[]>) {
  // Summarize width profiles into simple hints we can feed to the model
  const hints: Record<string, { minFrac: number; at: number; n: number } | undefined> = {};
  if (!widthProfiles) return hints;
  for (const [k, arr] of Object.entries(widthProfiles)) {
    if (!Array.isArray(arr) || arr.length === 0) { hints[k] = undefined; continue; }
    let minFrac = Infinity; let idx = -1;
    arr.forEach((v, i) => { if (typeof v === 'number' && v < minFrac) { minFrac = v; idx = i; } });
    if (!isFinite(minFrac) || idx < 0) { hints[k] = undefined; continue; }
    hints[k] = { minFrac: +minFrac.toFixed(4), at: idx, n: arr.length };
  }
  return hints;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  let scanId = "";

  try {
    const payload = (await req.json()) as Payload;
    scanId = payload?.scan_id ?? "";
    if (!scanId || !payload?.height_cm || !payload?.sex) {
      return new Response(
        JSON.stringify({ error: "scan_id, height_cm, sex required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark as processing (best-effort)
    try {
      console.log("analyze-body-scan: setting status=processing", { scanId });
      await supabase.from("body_scans").update({ status: "processing" }).eq("id", scanId);
    } catch (setErr) {
      console.warn("analyze-body-scan: failed to set processing", { scanId, setErr });
    }

    // Load scan record
    const { data: scan, error: scanErr } = await supabase
      .from("body_scans")
      .select("id, user_id, front_path, left_path, right_path, back_path")
      .eq("id", payload.scan_id)
      .maybeSingle();
    if (scanErr) {
      console.error("analyze-body-scan: select scan failed", { scanId, scanErr });
      throw scanErr;
    }
    if (!scan) {
      console.error("analyze-body-scan: scan not found", { scanId });
      throw new Error("Scan not found");
    }

    // Build signed URLs for available images
    const imgs: { label: string; url: string }[] = [];
    const views: Record<string, string | null> = {
      front: scan.front_path,
      left: scan.left_path,
      right: scan.right_path,
      back: scan.back_path,
    };
    for (const [label, path] of Object.entries(views)) {
      if (path) imgs.push({ label, url: await signed(path) });
    }
    if (imgs.length === 0) throw new Error("No images present for this scan");

    const hints = profileHints(payload.features?.widthProfiles);

    // Use OpenAI Vision to extract numeric metrics; include hints to anchor scaling
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY secret");

    const schema = `{
  "body_fat_pct": number,              // visual estimate for ${payload.sex}
  "circumferences_cm": {               // use height_cm scaling and image perspective
    "waist": number, "hips": number, "chest": number, "shoulders": number, "thighs": number
  },
  "posture": { "score_pct": number, "notes": string[] },
  "symmetry": { "score_pct": number, "notes": string[] },
  "skin_health_pct": number,
  "analysis_notes": string[]
}`;

    const contextLines: string[] = [
      `Sex: ${payload.sex}`,
      `Height: ${payload.height_cm} cm`,
    ];
    if (typeof payload.age === 'number') contextLines.push(`Age: ${payload.age}`);
    const hintFront = hints.front ? `front min width frac ${hints.front.minFrac} at row ${hints.front.at}/${hints.front.n}` : undefined;
    const hintLeft = hints.left ? `left min width frac ${hints.left.minFrac} at row ${hints.left.at}/${hints.left.n}` : undefined;
    const hintRight = hints.right ? `right min width frac ${hints.right.minFrac} at row ${hints.right.at}/${hints.right.n}` : undefined;
    const hintText = [hintFront, hintLeft, hintRight].filter(Boolean).join("; ");
    if (hintText) contextLines.push(`Hints: ${hintText}`);

    const messages = [
      {
        role: "system",
        content:
          "You are a fitness CV assistant. Return ONLY valid JSON, no markdown, no code fences.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Using the following images, estimate the fields in this schema and return ONLY compact JSON matching it. If unsure, make your best numeric estimate (no strings).\nSchema:\n${schema}\n\nContext:\n${contextLines.join("\n")}\nImages:` },
          ...imgs.map((i) => ({ type: "image_url", image_url: { url: i.url } })),
        ],
      },
    ];

    const visionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 700,
        response_format: { type: "json_object" }, // encourage JSON only
      }),
    });

    if (!visionRes.ok) {
      const t = await visionRes.text();
      throw new Error(`Vision call failed: ${visionRes.status} ${t}`);
    }
    const visionJson = await visionRes.json();
    let raw = visionJson.choices?.[0]?.message?.content ?? "{}";
    raw = stripCodeFences(raw);

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // last resort: try to extract JSON substring
      const match = typeof raw === "string" ? raw.match(/{[\s\S]*}/) : null;
      if (match) parsed = JSON.parse(match[0]);
      else throw err;
    }

    // Build metrics preferring model outputs; gracefully degrade
    const bf = Number(parsed.body_fat_pct);
    const bf_c = isFinite(bf) ? clamp(bf, 3, 60) : undefined;
    const body_fat_pct_range: [number, number] = [
      clamp((bf_c ?? 22) - 2, 3, 60),
      clamp((bf_c ?? 22) + 2, 3, 60),
    ];

    const circ = parsed.circumferences_cm || {};
    const waist = isFinite(Number(circ.waist)) ? Number(circ.waist) : undefined;
    const hips = isFinite(Number(circ.hips)) ? Number(circ.hips) : undefined;
    const chest = isFinite(Number(circ.chest)) ? Number(circ.chest) : undefined;
    const shoulders = isFinite(Number(circ.shoulders)) ? Number(circ.shoulders) : undefined;
    const thighs = isFinite(Number(circ.thighs)) ? Number(circ.thighs) : undefined;

    // Estimate muscle mass from shoulder-to-waist ratio as a simple proxy
    let shoulderWaist = (isFinite(shoulders!) && isFinite(waist!)) ? (Number(shoulders) / Number(waist)) : undefined;
    if (!isFinite(shoulderWaist as number)) shoulderWaist = 1.3; // neutral default
    let muscle_mass_kg_est = clamp(30 + ((shoulderWaist as number) - 1.2) * 28, 28, 62);
    if (payload.sex === "female") muscle_mass_kg_est -= 8;
    muscle_mass_kg_est = Math.round(muscle_mass_kg_est * 10) / 10;

    const postureScore = Number(parsed.posture?.score_pct);
    const symmetryScore = Number(parsed.symmetry?.score_pct);

    const metrics: Metrics = {
      body_fat_pct_range,
      muscle_mass_kg_est,
      circumferences_cm: {
        ...(isFinite(chest as number) ? { chest: Number(chest) } : {}),
        ...(isFinite(waist as number) ? { waist: Number(waist) } : {}),
        ...(isFinite(hips as number) ? { hips: Number(hips) } : {}),
        ...(isFinite(shoulders as number) ? { shoulders: Number(shoulders) } : {}),
        ...(isFinite(thighs as number) ? { thighs: Number(thighs) } : {}),
      },
      posture: isFinite(postureScore) ? { score_pct: clamp(postureScore, 0, 100), notes: parsed.posture?.notes ?? [] } : undefined,
      symmetry: isFinite(symmetryScore) ? { score_pct: clamp(symmetryScore, 0, 100), notes: parsed.symmetry?.notes ?? [] } : undefined,
      skin_health_pct: isFinite(Number(parsed.skin_health_pct)) ? clamp(Number(parsed.skin_health_pct), 0, 100) : undefined,
      recommendations: Array.isArray(parsed.analysis_notes) ? parsed.analysis_notes.slice(0, 6) : undefined,
    };

    await supabase
      .from("body_scans")
      .update({
        status: "done",
        metrics,
        summary: {
          model: VISION_MODEL,
          at: new Date().toISOString(),
          used_hints: Object.keys(hints).length > 0,
        },
      })
      .eq("id", scanId);

    return new Response(JSON.stringify({ ok: true, metrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    // Normalize error to a readable string (avoid "[object Object]")
    let errStr = "Unknown error";
    if (e instanceof Error) {
      errStr = e.message || String(e);
    } else if (typeof e === "string") {
      errStr = e;
    } else if (e && typeof e === "object") {
      const anyErr: any = e as any;
      errStr = anyErr?.message || anyErr?.msg || anyErr?.error?.message || anyErr?.error?.toString?.() || undefined;
      if (!errStr) {
        try { errStr = JSON.stringify(anyErr); } catch { errStr = String(anyErr); }
      }
    }
    if (errStr.length > 800) errStr = errStr.slice(0, 800) + "…";

    try {
      if (scanId) {
        await supabase
          .from("body_scans")
          .update({ status: "error", error: errStr })
          .eq("id", scanId);
      }
    } catch {}
    console.error("analyze-body-scan error:", { scanId, error: errStr, original: e });
    return new Response(JSON.stringify({ ok: false, error: errStr, scan_id: scanId || null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
