import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const VISION_MODEL = "gpt-4o"; // fast vision model

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function stripCodeFences(s: string) {
  if (typeof s !== "string") return s as any;
  const fence = s.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
  return fence ? fence[1] : s;
}

interface FeaturesPayload {
  landmarks?: Record<string, any[]>;
  widthProfiles?: Record<string, number[]>;
  dims?: Record<string, { width: number; height: number }>;
  photos?: string[];
}

interface GuestPayload {
  sex: "male" | "female";
  height_cm: number;
  age?: number;
  features?: FeaturesPayload;
  photosData: Partial<Record<"front" | "left" | "right" | "back", string>>; // data URLs
}

function profileHints(widthProfiles?: Record<string, number[]>) {
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

  try {
    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY secret");

    const payload = (await req.json()) as GuestPayload;
    if (!payload?.height_cm || !payload?.sex) {
      return new Response(
        JSON.stringify({ ok: false, error: "height_cm and sex are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build images from incoming data URLs
    const labels: (keyof GuestPayload["photosData"])[] = ["front", "left", "right", "back"];
    const imgs: { label: string; url: string }[] = [];
    for (const label of labels) {
      const dataUrl = payload.photosData?.[label];
      if (typeof dataUrl === "string" && dataUrl.startsWith("data:")) {
        imgs.push({ label, url: dataUrl });
      }
    }
    if (imgs.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "No images provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hints = profileHints(payload.features?.widthProfiles);

    const schema = `{
  "body_fat_pct": number,
  "circumferences_cm": { "waist": number, "hips": number, "chest": number, "shoulders": number, "thighs": number },
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

    const dims = payload.features?.dims || {};
    const dimLines: string[] = [];
    for (const key of ["front", "left", "right", "back"]) {
      const d: any = (dims as any)[key];
      if (d && Number.isFinite(d.width) && Number.isFinite(d.height)) {
        dimLines.push(`${key} dims: width_px=${d.width}, height_px=${d.height}`);
      }
    }
    if (dimLines.length) contextLines.push(...dimLines);

    const hintFront = hints.front ? `front min width frac ${hints.front.minFrac} at row ${hints.front.at}/${hints.front.n}` : undefined;
    const hintLeft = hints.left ? `left min width frac ${hints.left.minFrac} at row ${hints.left.at}/${hints.left.n}` : undefined;
    const hintRight = hints.right ? `right min width frac ${hints.right.minFrac} at row ${hints.right.at}/${hints.right.n}` : undefined;
    const hintBack = hints.back ? `back min width frac ${hints.back.minFrac} at row ${hints.back.at}/${hints.back.n}` : undefined;
    const hintText = [hintFront, hintLeft, hintRight, hintBack].filter(Boolean).join("; ");
    if (hintText) contextLines.push(`Hints: ${hintText}`);

    const messages = [
      {
        role: "system",
        content:
          "You are a fitness CV assistant. Return ONLY valid JSON (no markdown). Use all images plus pixel dims and width-profile hints to produce numeric outputs in centimeters. Scale using height_cm and per-image height_px: width_cm ~= (minFrac * width_px) * (height_cm / height_px). Fill all fields with your best numeric estimate; avoid strings.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Using the following images, estimate the fields in this schema and return ONLY compact JSON matching it. If unsure, make your best numeric estimate (no strings).\nSchema:\n${schema}\n\nContext:\n${contextLines.join("\n")}\nImages:` },
          ...imgs.map((i) => ({ type: "image_url", image_url: { url: i.url } })),
        ],
      },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Vision call failed: ${res.status} ${t}`);
    }

    const visionJson = await res.json();
    let raw = visionJson.choices?.[0]?.message?.content ?? "{}";
    raw = stripCodeFences(raw);

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      const match = typeof raw === "string" ? raw.match(/{[\s\S]*}/) : null;
      if (match) parsed = JSON.parse(match[0]); else throw err;
    }

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

    let shoulderWaist = (isFinite(shoulders!) && isFinite(waist!)) ? (Number(shoulders) / Number(waist)) : undefined;
    if (!isFinite(shoulderWaist as number)) shoulderWaist = 1.3;
    let muscle_mass_kg_est = clamp(30 + ((shoulderWaist as number) - 1.2) * 28, 28, 62);
    if (payload.sex === "female") muscle_mass_kg_est -= 8;
    muscle_mass_kg_est = Math.round(muscle_mass_kg_est * 10) / 10;

    const postureScore = Number(parsed.posture?.score_pct);
    const symmetryScore = Number(parsed.symmetry?.score_pct);

    const metrics = {
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
    } as const;

    return new Response(
      JSON.stringify({ ok: true, metrics, summary: { model: VISION_MODEL, at: new Date().toISOString(), guest: true } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    let errStr = e instanceof Error ? e.message : String(e);
    if (errStr.length > 800) errStr = errStr.slice(0, 800) + "…";
    return new Response(JSON.stringify({ ok: false, error: errStr }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
