import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Client to read the authenticated user from the incoming JWT
  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  // Service client for privileged operations (storage write, role checks)
  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: userResult, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userResult.user;

    // Ensure caller is admin
    const { data: isAdmin, error: roleError } = await supabaseService.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError) {
      console.error("Role check error", roleError);
      return new Response(JSON.stringify({ error: "Role check failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sourceUrl, destPath } = await req.json();

    if (!sourceUrl) {
      return new Response(JSON.stringify({ error: "sourceUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default to Nova Hawk asset path if not provided
    const targetPath: string = destPath && typeof destPath === "string" ? destPath : "avatars/nova-hawk.png";

    // Basic path validation
    if (targetPath.includes("..") || !/^avatars\//.test(targetPath)) {
      return new Response(JSON.stringify({ error: "Invalid destPath" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the source image
    const resp = await fetch(sourceUrl);
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch source image (${resp.status})` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = resp.headers.get("content-type") ?? "image/png";
    const arrayBuffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Upload with upsert
    const { error: uploadError } = await supabaseService
      .storage
      .from("character-images")
      .upload(targetPath, bytes, {
        contentType,
        upsert: true,
        cacheControl: "0",
      });

    if (uploadError) {
      console.error("Upload error", uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabaseService
      .storage
      .from("character-images")
      .getPublicUrl(targetPath);

    return new Response(JSON.stringify({ success: true, publicUrl: publicUrlData.publicUrl, path: targetPath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("replaceAvatarImage error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});