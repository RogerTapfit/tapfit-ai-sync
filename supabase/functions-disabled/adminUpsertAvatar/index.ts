import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

function parseDataUrl(dataUrl: string): { mime: string; data: Uint8Array } {
  const match = dataUrl.match(/^data:(.*);base64,(.*)$/);
  if (!match) throw new Error('Invalid data URL');
  const mime = match[1];
  const base64 = match[2];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return { mime, data: bytes };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization') ?? '';

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const {
      id,
      name,
      sort_order,
      imageDataUrl,
      miniImageDataUrl,
    } = await req.json();

    // Verify caller is admin
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { data: isAdminData, error: roleErr } = await supabaseUser.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    if (roleErr || !isAdminData) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    let image_url: string | undefined;
    let mini_image_url: string | undefined;

    // Upload images if present
    if (imageDataUrl) {
      const { mime, data } = parseDataUrl(imageDataUrl);
      const fileExt = mime.split('/')[1] ?? 'jpg';
      const fileName = `${crypto.randomUUID()}-${Date.now()}.${fileExt}`;
      const path = `avatars/${fileName}`;
      const { error: upErr } = await supabaseAdmin
        .storage
        .from('character-images')
        .upload(path, data, { contentType: mime, upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = await supabaseAdmin
        .storage
        .from('character-images')
        .getPublicUrl(path);
      image_url = pub.publicUrl;
    }

    if (miniImageDataUrl) {
      const { mime, data } = parseDataUrl(miniImageDataUrl);
      const fileExt = mime.split('/')[1] ?? 'jpg';
      const fileName = `${crypto.randomUUID()}-${Date.now()}-mini.${fileExt}`;
      const path = `avatars/${fileName}`;
      const { error: upErr } = await supabaseAdmin
        .storage
        .from('character-images')
        .upload(path, data, { contentType: mime, upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = await supabaseAdmin
        .storage
        .from('character-images')
        .getPublicUrl(path);
      mini_image_url = pub.publicUrl;
    }

    // Prepare upsert payload
    const payload: Record<string, unknown> = {};
    if (typeof name === 'string') payload.name = name;
    if (typeof sort_order === 'number') payload.sort_order = sort_order;
    if (image_url) payload.image_url = image_url;
    if (mini_image_url) payload.mini_image_url = mini_image_url;
    payload.is_active = true;

    let dbRes;
    if (id) {
      dbRes = await supabaseAdmin.from('avatars').update(payload).eq('id', id).select().single();
    } else {
      dbRes = await supabaseAdmin.from('avatars').insert(payload).select().single();
    }

    if (dbRes.error) throw dbRes.error;

    return new Response(JSON.stringify({ avatar: dbRes.data }), { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error('adminUpsertAvatar error', e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: corsHeaders });
  }
});
