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

// Detailed anatomically correct exercise form descriptions
const exerciseFormDescriptions: Record<string, string> = {
  'glute-bridges': `
VIEW ANGLE (MUST FOLLOW): STRICT SIDE PROFILE VIEW, like a real side-on photo of a person on the floor.
- Camera is positioned to the SIDE of the body (not overhead, not top-down, not front view).
- You MUST see the side silhouette of the head/torso/hips/knees/feet.
- Floor is a clear horizontal line; mat is seen from the SIDE (thin edge), NOT as a big rectangle from above.
- Person is oriented LEFT→RIGHT: head on the LEFT, feet on the RIGHT.
- Show FULL BODY (head to feet) in BOTH panels (no cropped legs).

START POSITION (LEFT PANEL):
- Person lying FLAT on back on the mat
- Knees bent about ~90 degrees, shins roughly vertical
- Feet flat on the floor, hip-width apart
- Arms resting long at sides, palms down
- Hips/buttocks on the floor, spine mostly flat

END POSITION (RIGHT PANEL):
- SAME person, SAME side view, SAME knee bend (~90°)
- Drive through heels and LIFT HIPS upward into a GLUTE BRIDGE (hip raise)
- Shoulder blades + upper back + head stay on the mat
- Hips are lifted so that SHOULDERS → HIPS → KNEES form ONE STRAIGHT DIAGONAL LINE
- Lower back/pelvis clearly elevated off the floor (visible gap) compared to START

DO NOT (CRITICAL):
- Do NOT lift the legs straight up
- Do NOT straighten the knees
- Do NOT show a shoulder-stand/inverted pose
- Do NOT use a top-down view

MOVEMENT ARROWS: One upward curved arrow showing hips lifting from START to END.`,

  'single-leg-glute-bridges': `
START POSITION: Lying flat on back, one knee bent with foot on floor, OTHER leg extended straight up toward ceiling, arms at sides.
END POSITION: Hips raised while balancing on one foot, extended leg still pointing straight up toward ceiling.
CRITICAL: Person stays lying on back throughout. One leg points up the whole time.`,

  'hip-thrusts': `
START POSITION: Upper back and shoulders resting against a bench or elevated surface (shown clearly), hips dropped toward ground, knees bent, feet flat on floor.
END POSITION: Hips thrust upward creating straight line from shoulders to knees, upper back still leaning on the bench.
CRITICAL: Must show a bench/surface supporting upper back.`,

  'squats': `
START POSITION: Standing upright, feet shoulder-width apart, arms extended forward for balance, back straight.
END POSITION: Knees bent to 90 degrees, hips back as if sitting in chair, thighs parallel to ground, arms forward.
CRITICAL: Both positions are STANDING. Movement is up and down.`,

  'push-ups': `
START POSITION: High plank - arms straight, hands under shoulders, body straight from head to heels.
END POSITION: Arms bent, chest 2 inches from floor, elbows at 45 degrees, body still straight.
CRITICAL: Body stays rigid as a plank throughout.`,

  'plank': `
HOLD POSITION: Body straight supported on FOREARMS (not hands) and toes. Elbows directly under shoulders. Back flat, not sagging or piked. Looking at ground.
CRITICAL: On forearms, not hands. Body perfectly straight.`,

  'dead-bug': `
START POSITION: Lying on BACK, arms extended straight up toward ceiling, legs raised with knees bent 90 degrees.
END POSITION: Opposite arm and leg extending away (arm toward floor overhead, leg extending straight out).
CRITICAL: Lying on BACK, not face down.`,

  'bird-dog': `
START POSITION: On hands and knees (all fours), back flat like a tabletop.
END POSITION: Opposite arm extended forward and opposite leg extended back, both parallel to ground.
CRITICAL: On hands and KNEES, not standing.`,

  'donkey-kicks': `
START POSITION: On all fours (hands and knees), back flat.
END POSITION: One bent leg kicked BACK and UP toward ceiling, sole of foot facing up.
CRITICAL: Must be on hands and knees. Leg kicks BACKWARD, not sideways.`,

  'fire-hydrants': `
VIEW ANGLE: SIDE PROFILE VIEW (camera positioned to the side of the person, NOT from the front).
START POSITION: On all fours in tabletop position - hands directly under shoulders, knees under hips, back flat and parallel to ground, head neutral looking at floor. BOTH knees on the ground.
END POSITION: SAME tabletop position but ONE leg (keeping knee bent at 90 degrees) is lifted OUT TO THE SIDE laterally - thigh raises to be parallel with the ground/hip height while knee stays bent. The foot of the lifted leg points behind. Other knee stays on ground.
MOVEMENT ARROWS: Curved arrow showing the bent leg lifting laterally outward from the hip.
CRITICAL: This MUST be shown from a SIDE VIEW angle so you can clearly see the leg lifting sideways. The knee stays BENT 90 degrees throughout - the leg does NOT straighten. Person stays on hands and knees. Like a dog lifting its leg at a fire hydrant.`,

  'burpees': `
START POSITION: Standing upright.
END POSITION: In plank/push-up position OR jumping with arms overhead.
CRITICAL: Show the explosive movement between standing and plank.`,

  'mountain-climbers': `
START POSITION: High plank position, body straight.
END POSITION: One knee driven forward toward chest while staying in plank.
CRITICAL: Rapid alternating knee drives while maintaining plank.`,

  'superman-pulls': `
START POSITION: Lying FACE DOWN (prone), arms extended forward overhead.
END POSITION: Arms, chest, and legs all lifted off ground, back arched.
CRITICAL: Face DOWN, not on back. Everything lifts up off the floor.`,

  'crunches': `
START POSITION: Lying on back, knees bent, feet flat, hands behind head.
END POSITION: Only shoulders/upper back curled up, lower back stays on ground.
CRITICAL: Small movement - NOT a full sit-up.`,

  'leg-raises': `
START POSITION: Lying on back, legs straight on ground.
END POSITION: Legs raised straight up toward ceiling (perpendicular to ground).
CRITICAL: Legs stay STRAIGHT. Back stays on ground.`,

  'hollow-body-hold': `
HOLD POSITION: Lying on back, lower back pressed into ground, arms overhead, legs and shoulders lifted creating banana shape.
CRITICAL: On BACK, curved like a banana.`,

  'side-plank': `
HOLD POSITION: Body supported on one forearm and side of stacked feet, facing sideways, hips lifted, other arm on hip or up.
CRITICAL: SIDE-facing position, hips lifted.`,

  'russian-twists': `
START POSITION: Seated on ground, knees bent, torso leaned back 45 degrees, hands together.
END POSITION: Rotating torso to touch hands to floor on alternating sides.
CRITICAL: Seated, not lying down. Twisting side to side.`,

  'v-ups': `
START POSITION: Lying flat on back, arms overhead, legs straight.
END POSITION: Arms and legs raised to meet in middle, body forms V shape.
CRITICAL: Both arms and legs lift simultaneously.`,

  'bicycle-crunches': `
START POSITION: Lying on back, hands behind head, legs raised.
END POSITION: Elbow rotating toward opposite bent knee while other leg extends.
CRITICAL: Twisting crunch with pedaling leg motion.`,

  'jumping-jacks': `
START POSITION: Standing, feet together, arms at sides.
END POSITION: Feet spread wide, arms raised overhead in V.
CRITICAL: Classic jumping jack spread.`,

  'high-knees': `
START POSITION: Standing upright.
END POSITION: Running in place with knees driving HIGH (hip level).
CRITICAL: Exaggerated knee lift.`,

  'wall-sit': `
HOLD POSITION: Back flat against wall, thighs parallel to ground (90-degree knees), feet flat on floor.
CRITICAL: MUST show wall behind person.`,

  'forward-lunges': `
START POSITION: Standing upright, feet together.
END POSITION: One leg stepped FORWARD, front knee 90 degrees, back knee near ground.
CRITICAL: Stepping FORWARD.`,

  'reverse-lunges': `
START POSITION: Standing upright, feet together.
END POSITION: One leg stepped BACKWARD, back knee near ground.
CRITICAL: Stepping BACKWARD.`,

  'calf-raises': `
START POSITION: Standing flat-footed.
END POSITION: Raised up on balls of feet, heels high off ground.
CRITICAL: Simple toe raise while standing.`,

  'jump-squats': `
START POSITION: Deep squat - knees bent to 90 degrees, hips back, thighs parallel to ground, arms in front of body for balance, back straight, torso slightly leaned forward.
END POSITION: Explosive jump in the air - body fully extended, legs straight, feet off the ground, arms reaching up or back for momentum.
MOVEMENT ARROWS: Downward arrow near START panel showing lowering into squat, upward arrow near END panel showing explosive upward jump.
CRITICAL: START is the LOW squat position (not standing). END is the HIGH jumping position with feet clearly off the ground. This is a PLYOMETRIC exercise.`,

  'pistol-squats': `
START POSITION: Standing UPRIGHT on ONE LEG (right leg), left leg extended straight FORWARD and parallel to floor, arms extended straight forward at shoulder height for balance, body TALL and VERTICAL, standing leg completely straight.
END POSITION: DEEP single-leg squat on the standing leg - knee bent fully (past 90 degrees), sitting back with hips near ankle level, NON-WORKING LEG still extended STRAIGHT FORWARD (parallel to ground, hovering above floor), arms still extended forward for counterbalance, torso leaning slightly forward to maintain balance.
MOVEMENT ARROWS: Downward curved arrow from START to END showing the descent into the single-leg squat.
CRITICAL: This is a SINGLE-LEG exercise. One leg stays extended STRAIGHT FORWARD the entire time, hovering parallel to ground. The working leg goes from STANDING STRAIGHT to DEEP SQUAT. START shows tall standing on one leg, END shows deep squat on one leg with other leg forward.`,
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

    // Get detailed form description if available
    const detailedFormDescription = exerciseFormDescriptions[exerciseId] || '';

    // Create a detailed prompt for consistent, instructional exercise images
    const movementType = isHold ? 'HOLD position' : 'movement with START and END positions';
    const prompt = `Create a PRECISE, ANATOMICALLY CORRECT fitness instruction illustration for the exercise "${exerciseName}".

CRITICAL - EXERCISE FORM (READ CAREFULLY AND FOLLOW EXACTLY):
${detailedFormDescription || instructions || 'Standard proper form for this exercise.'}

STYLE: Modern 3D rendered fitness app illustration. Premium quality like a high-end fitness game.

CRITICAL CHARACTER REQUIREMENTS - MUST FOLLOW EXACTLY:
- CHROME METALLIC ROBOT/MANNEQUIN with SHINY REFLECTIVE SILVER/CHROME SKIN - like liquid metal or polished chrome - NOT human skin tone
- The ENTIRE BODY must be METALLIC SILVER/CHROME color - arms, legs, torso, head - all chrome/silver metal
- COMPLETELY SMOOTH, FEATURELESS FACE - NO eyes, NO nose, NO mouth - just smooth chrome oval head like a robot or store mannequin
- COMPLETE FULL BODY with FULL ARMS (biceps, forearms, hands with fingers) and FULL LEGS (thighs, calves, feet)
- Athletic proportions with visible muscle definition visible through the chrome metallic surface
- Wearing dark athletic wear (black/charcoal compression shorts and tank top) with coral/red accent stripes and "TapFit" logo
- DO NOT use human skin color - the mannequin MUST be SILVER CHROME METALLIC like a robot or C-3PO

COMPOSITION: ${isHold ? 
  'Single panel showing the EXACT hold position described above with body alignment markers' : 
  'Two-panel side-by-side layout: LEFT panel labeled "START", RIGHT panel labeled "END" - MUST match the positions described above EXACTLY'}

ARROWS: Bold coral-red directional arrows showing the ${movementType}.

BACKGROUND: Clean light gray to white gradient with subtle floor reflections showing chrome reflections.

LABELS: Clear "START" and "END" text labels.

QUALITY: Ultra high resolution, anatomically perfect form demonstration. The mannequin must have COMPLETE arms with hands and COMPLETE legs with feet - no missing limbs. SILVER CHROME METALLIC SKIN - NOT human skin tone.`;

    console.log(`📝 Generating with prompt length: ${prompt.length}`);

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
