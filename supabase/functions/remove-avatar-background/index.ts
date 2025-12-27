import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { avatarId } = await req.json();
    
    if (!avatarId) {
      throw new Error('avatarId is required');
    }

    console.log(`🔄 Removing background for avatar: ${avatarId}`);

    // Fetch the avatar record
    const { data: avatar, error: fetchError } = await supabase
      .from('avatars')
      .select('*')
      .eq('id', avatarId)
      .single();

    if (fetchError || !avatar) {
      throw new Error(`Avatar not found: ${fetchError?.message || 'Unknown error'}`);
    }

    console.log(`📷 Processing avatar: ${avatar.name} - ${avatar.image_url}`);

    // Use AI to remove the background
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Remove the background completely from this image. Make it a clean transparent PNG cutout with ONLY the robot character visible. Remove all background colors, gradients, glows, shadows, and any elements behind the character. The output should be the character isolated on a completely transparent background with crisp clean edges, ready to be placed on any UI."
              },
              {
                type: "image_url",
                image_url: {
                  url: avatar.image_url
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Background removed successfully');

    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      throw new Error('No image data received from AI');
    }

    // Extract base64 data from data URL
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image data format');
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Generate unique filename with -nobg suffix
    const timestamp = Date.now();
    const safeName = avatar.name.toLowerCase().replace(/\s+/g, '-');
    const filename = `${safeName}-nobg-${timestamp}.${imageFormat}`;
    const miniFilename = `${safeName}-nobg-mini-${timestamp}.${imageFormat}`;

    console.log(`📤 Uploading transparent image: ${filename}`);

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(filename, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Also upload as mini (same image for now)
    await supabase.storage
      .from('character-images')
      .upload(miniFilename, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    // Get public URLs
    const { data: publicUrl } = supabase.storage
      .from('character-images')
      .getPublicUrl(filename);

    const { data: miniPublicUrl } = supabase.storage
      .from('character-images')
      .getPublicUrl(miniFilename);

    console.log(`✅ Uploaded: ${publicUrl.publicUrl}`);

    // Update the avatar record with new URLs
    const { error: updateError } = await supabase
      .from('avatars')
      .update({
        image_url: publicUrl.publicUrl,
        mini_image_url: miniPublicUrl.publicUrl
      })
      .eq('id', avatarId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update avatar: ${updateError.message}`);
    }

    console.log(`🎉 Avatar ${avatar.name} background removed successfully!`);

    return new Response(JSON.stringify({ 
      success: true,
      avatarId,
      name: avatar.name,
      newImageUrl: publicUrl.publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error removing avatar background:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
