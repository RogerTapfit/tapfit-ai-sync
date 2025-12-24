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

    const { name, theme, accentColor, gender, animalType } = await req.json();
    
    console.log(`🎨 Generating avatar: ${name} (${theme} ${animalType})`);

    // Generate the avatar image using AI - chunky toy-robot action figure style to match existing avatars
    const prompt = `A 3D toy-style robot ${animalType} fitness coach character, chunky action figure proportions with a stylized cute oversized head, clearly recognizable ${animalType} animal features (${animalType}-shaped head with distinctive ears snout or beak and tail), solid metallic robot armor body with ${accentColor} color accents, prominent glowing ${accentColor} energy heart core on chest, bright glowing ${accentColor} LED eyes, mechanical armor plates on arms and legs, ${gender === 'female' ? 'cute feminine' : 'strong masculine'} design, simple heroic standing pose facing forward with no accessories or weapons, ${accentColor} colored solid gradient glow background fading to pure black, no circles no rings no particles no cosmic effects, 3D game character render style like Funko Pop meets mecha anime, centered composition on dark background, ultra high quality render.`;

    console.log(`📝 Prompt: ${prompt}`);

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
            content: prompt
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
    console.log('✅ Image generated successfully');

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

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${imageFormat}`;
    const miniFilename = `${name.toLowerCase().replace(/\s+/g, '-')}-mini-${timestamp}.${imageFormat}`;

    console.log(`📤 Uploading to storage: ${filename}`);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(filename, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Also upload as mini (same image for now, could resize later)
    const { error: miniUploadError } = await supabase.storage
      .from('character-images')
      .upload(miniFilename, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (miniUploadError) {
      console.error('Mini upload error:', miniUploadError);
    }

    // Get public URLs
    const { data: publicUrl } = supabase.storage
      .from('character-images')
      .getPublicUrl(filename);

    const { data: miniPublicUrl } = supabase.storage
      .from('character-images')
      .getPublicUrl(miniFilename);

    console.log(`✅ Uploaded successfully: ${publicUrl.publicUrl}`);

    // Get highest sort order
    const { data: maxSortData } = await supabase
      .from('avatars')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxSortData?.sort_order || 0) + 1;

    // Insert into avatars table
    const { data: avatarData, error: insertError } = await supabase
      .from('avatars')
      .insert({
        name: name,
        image_url: publicUrl.publicUrl,
        mini_image_url: miniPublicUrl.publicUrl,
        accent_hex: accentColor,
        gender: gender,
        is_active: true,
        sort_order: nextSortOrder
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to insert avatar: ${insertError.message}`);
    }

    console.log(`🎉 Avatar created successfully: ${name} (ID: ${avatarData.id})`);

    return new Response(JSON.stringify({ 
      success: true,
      avatar: avatarData,
      imageUrl: publicUrl.publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating avatar:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
