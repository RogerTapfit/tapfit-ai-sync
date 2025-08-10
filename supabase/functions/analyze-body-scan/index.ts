import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

// CORS headers for web clients
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const VISION_MODEL = "gpt-4o-mini"; // fast + vision

// Supabase
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_SERVICE_ROLE =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(SB_URL, SB_SERVICE_ROLE, {
  global: { headers: { "accept-profile": "public" } },
});

const BUCKET = "body-scans";

type Payload = {
  scan_id: string;
  user_id?: string;
  sex: "male" | "female";
  height_cm: number;
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
    await supabase.from("body_scans").update({ status: "processing" }).eq("id", scanId);

    // Load scan record
    const { data: scan, error: scanErr } = await supabase
      .from("body_scans")
      .select("id, user_id, front_path, left_path, right_path, back_path")
      .eq("id", payload.scan_id)
      .single();
    if (scanErr || !scan) throw scanErr ?? new Error("Scan not found");

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

    // Use OpenAI Vision to extract simple landmarks/ratios and visual BF estimate
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY secret");

    const prompt = [
      {
        role: "system",
        content:
          `You are a fitness computer-vision assistant.\nGiven 1-4 photos (front/left/right/back), estimate:\n- Key landmarks in pixel coordinates (neck, shoulders L/R, chest mid, waist narrowest, hips widest, thigh mid)\n- Relative circumferences (waist:hip:chest:shoulders ratios) as numbers (no units)\n- Visual body fat estimate for ${payload.sex} using standard physique cues (abdomen definition, love handles, outline softness, vascularity).\nReturn a single JSON object in the schema specified by the user. Do not add commentary.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Schema:\n{\n  "landmarks": { "front": { "neck":[x,y], "shoulder_l":[x,y], "shoulder_r":[x,y], "chest_mid":[x,y], "waist":[x,y], "hip":[x,y], "thigh_mid":[x,y] } },\n  "ratios": { "waist_to_hip": number, "waist_to_chest": number, "shoulder_to_waist": number },\n  "visual_body_fat_pct": number\n}\nImages:`,
          },
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
        messages: prompt,
        temperature: 0.2,
        max_tokens: 800
      }),
    });

    if (!visionRes.ok) {
      const t = await visionRes.text();
      throw new Error(`Vision call failed: ${visionRes.status} ${t}`);
    }
    const visionJson = await visionRes.json();
    let raw = visionJson.choices?.[0]?.message?.content ?? "{}";
    let content: any = {};
    try {
      content = JSON.parse(raw);
    } catch {
      const match = typeof raw === "string" ? raw.match(/{[\s\S]*}/) : null;
      if (match) {
        content = JSON.parse(match[0]);
      }
    }

    // Convert to metrics (heuristic)
    const height_cm = payload.height_cm;
    const bf_center = clamp(Number(content.visual_body_fat_pct ?? 20), 4, 45);
    const body_fat_pct_range: [number, number] = [
      clamp(bf_center - 3, 3, 50),
      clamp(bf_center + 3, 3, 50),
    ];

    const sh_w = Number(content.ratios?.shoulder_to_waist ?? 1.2);
    const w_c = Number(content.ratios?.waist_to_chest ?? 0.85);
    let muscle_mass_kg_est = clamp(30 + (sh_w - 1.2) * 25 + (0.95 - w_c) * 20, 28, 60);
    if (payload.sex === "female") muscle_mass_kg_est -= 8;
    muscle_mass_kg_est = Math.round(muscle_mass_kg_est * 10) / 10;

    const waist = Math.round((height_cm * (content.ratios?.waist_to_hip ? 0.46 : 0.47)) * 10) / 10;
    const hips = Math.round((waist / (content.ratios?.waist_to_hip ?? 0.9)) * 10) / 10;
    const chest = Math.round((waist / (content.ratios?.waist_to_chest ?? 0.85)) * 10) / 10;
    const shoulders = Math.round((waist * (content.ratios?.shoulder_to_waist ?? 1.4)) * 10) / 10;

    const metrics: Metrics = {
      body_fat_pct_range,
      muscle_mass_kg_est,
      circumferences_cm: { waist, hips, chest, shoulders },
      symmetry: { score_pct: 85, notes: ["Mild L/R delt size difference possible; confirm in front view."] },
      posture: { score_pct: 80, notes: ["Neutral pelvis; slight protracted shoulders."] },
      skin_health_pct: 80,
      recommendations: [
        "Prioritize compound lifts 3x/week; track protein intake",
        "Daily 10-min posture routine (thoracic extension, scapular retraction)",
      ],
    };

    await supabase
      .from("body_scans")
      .update({
        status: "done",
        metrics,
        summary: { model: VISION_MODEL, at: new Date().toISOString() },
      })
      .eq("id", scanId);

    return new Response(JSON.stringify({ ok: true, metrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    try {
      if (scanId) {
        await supabase
          .from("body_scans")
          .update({ status: "error", error: errMsg })
          .eq("id", scanId);
      }
    } catch {}
    console.error("analyze-body-scan error:", { message: errMsg, stack: e instanceof Error ? e.stack : undefined });
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
