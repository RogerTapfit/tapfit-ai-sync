import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseDataUrl(dataUrl: string): { mime: string; data: Uint8Array } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  const [, mime, b64] = match;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return { mime, data: bytes };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader! } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: hasRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !hasRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { id, name, sort_order, imageDataUrl, miniImageDataUrl, gender } = body;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let image_url: string | undefined;
    let mini_image_url: string | undefined;

    // Upload full image if provided
    if (imageDataUrl) {
      const { mime, data } = parseDataUrl(imageDataUrl);
      const ext = mime.split('/')[1] || 'jpg';
      const fileName = `avatar-${id || Date.now()}-${Date.now()}.${ext}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('character-images')
        .upload(fileName, data, { contentType: mime, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('character-images')
        .getPublicUrl(uploadData.path);
      
      image_url = publicUrl;
    }

    // Upload mini image if provided
    if (miniImageDataUrl) {
      const { mime, data } = parseDataUrl(miniImageDataUrl);
      const ext = mime.split('/')[1] || 'jpg';
      const fileName = `avatar-mini-${id || Date.now()}-${Date.now()}.${ext}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('character-images')
        .upload(fileName, data, { contentType: mime, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('character-images')
        .getPublicUrl(uploadData.path);
      
      mini_image_url = publicUrl;
    }

    // Build update payload
    const payload: any = {};
    if (name !== undefined) payload.name = name;
    if (sort_order !== undefined) payload.sort_order = sort_order;
    if (image_url) payload.image_url = image_url;
    if (mini_image_url) payload.mini_image_url = mini_image_url;
    if (gender !== undefined) payload.gender = gender;

    // Update or insert
    let result;
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('avatars')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('avatars')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify({ avatar: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in adminUpsertAvatar:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
