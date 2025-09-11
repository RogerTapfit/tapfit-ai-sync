
import { supabase } from "@/integrations/supabase/client";

export type ViewKey = "front" | "left" | "right" | "back";

export type StartScanParams = {
  files: Partial<Record<ViewKey, string>>; // data URLs
  heightCm: number;
  sex: "male" | "female";
  age?: number;
  // Optional features from on-device ML to seed server analysis
  features?: {
    landmarks: Record<string, any[]>;
    widthProfiles: Record<string, number[]>;
    dims?: Record<string, { width: number; height: number }>;
    photos: string[];
  };
};

export type BodyScanRow = {
  id: string;
  user_id: string;
  status: "queued" | "processing" | "done" | "error";
  error: string | null;
  metrics: any | null;
  summary: any | null;
  height_cm: number | null;
  front_path?: string | null;
  left_path?: string | null;
  right_path?: string | null;
  back_path?: string | null;
};

function dataURLtoBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = (meta.match(/data:([^;]+)/) || [])[1] || "image/jpeg";
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function getUserId(): Promise<string> {
  try {
    // First try to get the current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Auth error:", error);
      throw new Error(`Authentication error: ${error.message}`);
    }
    
    if (!user?.id) {
      console.error("No user found in session");
      // Try to refresh the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session refresh error:", sessionError);
        throw new Error("Not authenticated - please log in again");
      }
      
      if (!session?.user?.id) {
        throw new Error("Not authenticated - please log in again");
      }
      
      return session.user.id;
    }
    
    return user.id;
  } catch (error) {
    console.error("getUserId failed:", error);
    throw error;
  }
}

export async function startScan(params: StartScanParams): Promise<BodyScanRow> {
  const userId = await getUserId();

  // 1) Create row (queued)
  const { data: created, error: insErr } = await supabase
    .from("body_scans")
    .insert({
      user_id: userId,
      height_cm: Math.round(params.heightCm),
      sex: params.sex,
      status: "queued"
    })
    .select("*")
    .single();

  if (insErr || !created) throw new Error(insErr?.message || "Failed to create scan row");
  const scanId = created.id as string;

  // 2) Upload any provided views
  const uploadView = async (view: ViewKey, dataUrl?: string | null) => {
    if (!dataUrl) return null;
    const blob = dataURLtoBlob(dataUrl);
    const path = `${userId}/${scanId}/${view}.jpg`;
    const { error: upErr } = await supabase.storage.from("body-scans").upload(path, blob, { upsert: true, contentType: blob.type });
    if (upErr) throw upErr;
    return path;
  };

  const front_path = await uploadView("front", params.files.front);
  const left_path = await uploadView("left", params.files.left);
  const right_path = await uploadView("right", params.files.right);
  const back_path = await uploadView("back", params.files.back);

  // 3) Update row with paths
  const { data: updated, error: updErr } = await supabase
    .from("body_scans")
    .update({ front_path, left_path, right_path, back_path })
    .eq("id", scanId)
    .select("*")
    .single();

  if (updErr || !updated) throw new Error(updErr?.message || "Failed to update scan paths");

  // 4) Kick off server analysis via Edge Function (images stay private; signed URLs only)
  const { data: fnData, error: fnErr } = await supabase.functions.invoke(
    "analyze-body-scan",
    {
      body: {
        scan_id: scanId,
        height_cm: params.heightCm,
        sex: params.sex,
        age: params.age,
        features: params.features,
      },
    }
  );
  if (fnErr) throw new Error((fnErr as any)?.message || String(fnErr));
  if (fnData && (fnData as any).ok === false) {
    // Surface immediate function error instead of waiting for polling
    const msg = (fnData as any).error || "Analysis failed to start";
    throw new Error(msg);
  }

  return updated as BodyScanRow;
}

export async function getScan(scanId: string): Promise<BodyScanRow | null> {
  const { data, error } = await supabase.from("body_scans").select("*").eq("id", scanId).maybeSingle();
  if (error) throw error;
  return data as BodyScanRow | null;
}

export async function pollScanUntilDone(scanId: string, onTick?: (row: BodyScanRow) => void, intervalMs = 2000, timeoutMs = 120000): Promise<BodyScanRow> {
  const start = Date.now();
  while (true) {
    const row = await getScan(scanId);
    if (!row) throw new Error("Scan not found");
    onTick?.(row);
    if (row.status === "done") return row;
    if (row.status === "error") throw new Error(row.error || "Analysis failed");
    if (Date.now() - start > timeoutMs) throw new Error("Timed out while processing scan");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
