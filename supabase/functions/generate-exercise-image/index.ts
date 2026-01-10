import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExerciseRequest {
  exerciseId: string;
  exerciseName: string;
  category: string;
  instructions?: string;
  isHold?: boolean;
}

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

    const { exerciseId, exerciseName, category, instructions, isHold } = await req.json() as ExerciseRequest;
    
    console.log(`🎨 Generating exercise image: ${exerciseName} (${category})`);

    // Update status to generating
    await supabase
      .from('exercise_images')
      .upsert({
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        category: category,
        generation_status: 'generating',
        updated_at: new Date().toISOString()
      }, { onConflict: 'exercise_id' });

    // Create a detailed prompt for consistent, instructional exercise images
    const movementType = isHold ? 'HOLD position' : 'movement with START and END positions';
    const prompt = `Create a clean, professional fitness instruction illustration for the exercise "${exerciseName}".

STYLE: Modern 3D rendered fitness app illustration style, similar to a high-quality fitness game or premium workout app. The character should be a stylized, friendly fitness coach figure with athletic proportions - NOT cartoonish or Funko Pop style, but more like a realistic fitness avatar with smooth, clean rendering.

CHARACTER: A fit athletic figure in modern workout attire (coral/red accent colors matching TapFit brand), gender-neutral design, clean anatomical accuracy showing proper muscle engagement.

COMPOSITION: ${isHold ? 
  'Single panel showing the correct HOLD position with clear body alignment markers' : 
  'Two-panel side-by-side layout: LEFT panel shows START position, RIGHT panel shows END position'}

ARROWS: Include bold, coral-red directional arrows showing the exact ${movementType}. Arrows should clearly indicate the direction of movement between positions.

INSTRUCTIONS CONTEXT: ${instructions || 'Standard form for this exercise'}

BACKGROUND: Clean, minimal gradient background (light gray to white) that doesn't distract from the form instruction.

LABELS: Small "START" and "END" text labels in each panel for clarity (if two panels).

QUALITY: Ultra high resolution, professional fitness app quality, anatomically accurate for teaching proper form, clear and educational.`;

    console.log(`📝 Generating with prompt length: ${prompt.length}`);

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
      
      // Update status to failed
      await supabase
        .from('exercise_images')
        .update({
          generation_status: 'failed',
          generation_error: `AI Gateway error: ${response.status}`,
          updated_at: new Date().toISOString()
        })
        .eq('exercise_id', exerciseId);
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Image generated successfully');

    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      await supabase
        .from('exercise_images')
        .update({
          generation_status: 'failed',
          generation_error: 'No image data received from AI',
          updated_at: new Date().toISOString()
        })
        .eq('exercise_id', exerciseId);
      
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
    const safeId = exerciseId.replace(/[^a-z0-9-]/g, '-');
    const filename = `${safeId}-${timestamp}.${imageFormat}`;
    const miniFilename = `${safeId}-mini-${timestamp}.${imageFormat}`;

    console.log(`📤 Uploading to storage: ${filename}`);

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('exercise-images')
      .upload(filename, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      await supabase
        .from('exercise_images')
        .update({
          generation_status: 'failed',
          generation_error: `Upload failed: ${uploadError.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('exercise_id', exerciseId);
      
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Also upload as mini (same image for now)
    await supabase.storage
      .from('exercise-images')
      .upload(miniFilename, bytes, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    // Get public URLs
    const { data: publicUrl } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(filename);

    const { data: miniPublicUrl } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(miniFilename);

    console.log(`✅ Uploaded successfully: ${publicUrl.publicUrl}`);

    // Update database with completed status and URLs
    const { error: updateError } = await supabase
      .from('exercise_images')
      .update({
        image_url: publicUrl.publicUrl,
        mini_image_url: miniPublicUrl.publicUrl,
        generation_status: 'complete',
        generation_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('exercise_id', exerciseId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    console.log(`🎉 Exercise image created successfully: ${exerciseName}`);

    return new Response(JSON.stringify({ 
      success: true,
      exerciseId,
      exerciseName,
      imageUrl: publicUrl.publicUrl,
      miniImageUrl: miniPublicUrl.publicUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating exercise image:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
