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
  // ==================== LOWER BODY ====================
  'squats': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright, feet shoulder-width apart
- Arms extended forward at shoulder height for balance
- Back straight, chest up, looking forward
END POSITION (RIGHT PANEL):
- Knees bent to 90 degrees, hips pushed back
- Thighs parallel to the ground (like sitting in invisible chair)
- Arms still extended forward, back straight
- Knees tracking over toes
MOVEMENT ARROW: Downward curved arrow showing the descent.
CRITICAL: Both panels show STANDING positions (not lying down). Movement is vertical up/down.`,

  'half-squats': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright, feet shoulder-width apart
- Arms at sides or on hips
END POSITION (RIGHT PANEL):
- Knees bent to approximately 45-60 degrees (HALF depth)
- Thighs NOT parallel to ground - only partial squat
- Back straight, slight forward lean
MOVEMENT ARROW: Short downward arrow showing partial descent.
CRITICAL: This is a PARTIAL squat - only halfway down, NOT full depth.`,

  'wall-sit': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
MUST SHOW: A wall behind the mannequin.
HOLD POSITION (SINGLE PANEL):
- Back flat against a wall (wall clearly visible)
- Thighs parallel to the ground (90-degree knee bend)
- Shins vertical, feet flat on floor
- Arms at sides or crossed on chest
CRITICAL: MUST show the wall. Back pressed flat against wall. This is an ISOMETRIC HOLD - single panel, no movement.`,

  'forward-lunges': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright, feet together
- Arms at sides or on hips
END POSITION (RIGHT PANEL):
- One leg stepped FORWARD
- Front knee bent to 90 degrees, front thigh parallel to ground
- Back knee hovering just above the floor
- Torso upright, not leaning
MOVEMENT ARROW: Forward arrow showing the step forward.
CRITICAL: Stepping FORWARD (front foot moves ahead of body).`,

  'reverse-lunges': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright, feet together
- Arms at sides or on hips
END POSITION (RIGHT PANEL):
- One leg stepped BACKWARD
- Front knee at 90 degrees over the ankle
- Back knee hovering just above the floor
- Torso upright
MOVEMENT ARROW: Backward arrow showing the step back.
CRITICAL: Stepping BACKWARD (one foot moves behind the body).`,

  'walking-lunges': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright, one foot slightly ahead
END POSITION (RIGHT PANEL):
- Deep lunge with front knee at 90 degrees
- Back knee hovering near ground
- Torso upright, looking forward
MOVEMENT ARROW: Forward arrow showing walking motion.
CRITICAL: Continuous forward walking motion with lunges.`,

  'split-squats': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Staggered stance - one foot forward, one foot back
- Standing upright on balls of back foot
- Feet stay in fixed positions throughout
END POSITION (RIGHT PANEL):
- VERTICAL descent - both knees bent to 90 degrees
- Back knee hovering just above floor
- Torso stays completely upright
MOVEMENT ARROW: Straight down arrow showing vertical descent.
CRITICAL: Feet stay FIXED in place. Movement is only UP and DOWN, not forward/backward.`,

  'bulgarian-split-squats': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
MUST SHOW: A bench or elevated surface behind.
START POSITION (LEFT PANEL):
- Rear foot elevated on bench behind (top of foot on bench)
- Front foot forward, standing tall
- Torso upright
END POSITION (RIGHT PANEL):
- Deep lunge - front thigh parallel to floor
- Back knee dropped toward ground
- Torso stays upright, core engaged
MOVEMENT ARROW: Downward arrow showing the descent.
CRITICAL: Rear foot MUST be elevated on a visible bench/box.`,

  'step-backs': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright, feet together
END POSITION (RIGHT PANEL):
- One leg stepped straight back
- Slight bend in both knees
- Torso upright
MOVEMENT ARROW: Backward arrow showing step back.
CRITICAL: Simple step backward movement.`,

  'jump-squats': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Deep squat - thighs parallel to ground
- Arms pulled back for momentum
- Torso slightly forward
END POSITION (RIGHT PANEL):
- Explosive jump - FEET OFF THE GROUND
- Body fully extended in air
- Arms reaching up or back
MOVEMENT ARROW: Strong upward arrow showing explosive jump.
CRITICAL: START is the LOW squat. END shows body IN THE AIR with feet clearly off ground.`,

  'pulse-squats': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Bottom of squat position - thighs parallel to ground
- Arms forward for balance
END POSITION (RIGHT PANEL):
- Slightly raised from bottom (2-3 inches higher)
- Still in squat, NOT standing up fully
- Small pulsing movement
MOVEMENT ARROW: Small up-down arrow showing pulse motion.
CRITICAL: Never fully standing - staying in bottom squat range with small pulses.`,

  'sumo-squats': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- VERY WIDE stance - feet wider than shoulder width
- Toes pointed outward at 45 degrees
- Standing tall, hands clasped at chest
END POSITION (RIGHT PANEL):
- Deep squat with wide stance maintained
- Thighs parallel to ground
- Knees tracking over toes (pointing outward)
- Torso upright
MOVEMENT ARROW: Downward arrow showing descent.
CRITICAL: WIDE stance with toes pointed OUT. Knees push outward, not forward.`,

  'cossack-squats': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- VERY WIDE stance - feet much wider than shoulders
- Standing tall, arms forward for balance
END POSITION (RIGHT PANEL):
- Weight shifted entirely to ONE side
- One leg in deep squat (thigh against calf)
- OTHER leg stays STRAIGHT with toes pointed UP toward ceiling
- Arms forward for balance
MOVEMENT ARROW: Lateral arrow showing weight shift to one side.
CRITICAL: One leg deep squat, other leg STRAIGHT with toes UP. Side-to-side movement.`,

  'pistol-squats': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing on ONE LEG only
- Other leg extended STRAIGHT FORWARD, parallel to floor
- Arms extended forward for balance
- Standing leg completely straight
END POSITION (RIGHT PANEL):
- DEEP single-leg squat on standing leg
- Sitting back with hips near ankle level
- Non-working leg STILL extended straight forward (hovering)
- Arms still forward for counterbalance
MOVEMENT ARROW: Downward arrow showing single-leg descent.
CRITICAL: ONE LEG exercise. Non-working leg stays extended FORWARD the entire time.`,

  'glute-bridges': `
SCENE RULE: ONE chrome mannequin only. No duplicates.
CAMERA: STRICT SIDE PROFILE / PROFILE VIEW ONLY (like a true side-on photo).
ORIENTATION: HEAD on LEFT side of image, FEET on RIGHT side. Full body visible.
MUST BE LYING DOWN: The mannequin is lying on its back on a HORIZONTAL mat. Head is resting on the mat. NOT standing.

START POSITION (LEFT PANEL):
- Lying flat on back on the mat
- Shoulders and spine on the mat, hips DOWN on the mat
- Knees bent ~90 degrees
- Feet flat, hip-width apart, heels under knees
- Arms long at sides, palms down

END POSITION (RIGHT PANEL) - HIGH BRIDGE SHAPE:
- Push through HEELS and squeeze glutes to lift hips
- Hips lift until SHOULDERS → HIPS → KNEES form a STRAIGHT LINE (like a ramp/tabletop)
- Pelvis/hips are clearly HIGH OFF THE MAT creating a BIG VISIBLE GAP under the mid/lower back
- Upper back/shoulders and head stay on the mat (do NOT roll onto neck)
- NO low-back hyperextension (no "banana" spine) — the line is straight from shoulders to knees

THE KEY DIFFERENCE (CRITICAL):
- START: hips DOWN touching mat
- END: hips UP HIGH (bridge) with clear gap under hips

ARROW: EXACTLY ONE bold coral-red UP arrow at the hips/pelvis.

FORBIDDEN:
- DO NOT show a standing figure
- DO NOT show a front view
- DO NOT show hips barely lifted
- Panels must NOT look similar`,
  'single-leg-glute-bridges': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying on back on mat
- ONE knee bent, foot flat on floor
- OTHER leg extended straight UP toward ceiling
- Arms at sides
END POSITION (RIGHT PANEL):
- Hips raised into bridge (balancing on one foot)
- Extended leg STILL pointing straight up
- Upper back stays on mat
MOVEMENT ARROW: Upward arrow at hips.
CRITICAL: One leg points UP toward ceiling the entire time.`,

  'hip-thrusts': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
MUST SHOW: A bench or elevated surface.
START POSITION (LEFT PANEL):
- Upper back/shoulders resting against bench
- Hips dropped toward ground (below bench level)
- Knees bent, feet flat on floor
END POSITION (RIGHT PANEL):
- Hips thrust UPWARD
- Straight horizontal line from shoulders to knees
- Upper back still on bench
MOVEMENT ARROW: Upward arrow at hips.
CRITICAL: MUST show bench supporting upper back.`,

  'calf-raises': `
SCENE RULE: ONE chrome metallic mannequin only (featureless oval head). No duplicates.
OUTFIT: Dark athletic wear with coral/red accents.
CAMERA: TRUE SIDE PROFILE VIEW (not front, not 3/4). Full body visible, feet clearly visible.
BACKGROUND: Clean white studio.

START POSITION (LEFT PANEL):
- Standing tall, neutral spine, looking forward
- Feet hip-width apart, toes pointing forward
- BOTH feet fully FLAT on the floor: heels DOWN + balls of feet DOWN + toes DOWN
- Weight evenly distributed across both feet
- Knees straight but not locked

END POSITION (RIGHT PANEL) — BILATERAL TIP-TOE:
- Rise straight UP by pushing through the BALLS OF BOTH FEET
- BOTH heels lift HIGH at the SAME TIME (clear visible AIR GAP under BOTH heels)
- Ankles fully plantarflexed (standing on tip-toes); toes remain on floor
- Knees stay straight (no knee bend), hips stacked over ankles (no leaning)

THE KEY DIFFERENCE:
- START: feet flat, heels down
- END: both heels high up (tip-toes)

ARROW: EXACTLY ONE bold coral-red UP arrow near the heels/ankles.

FORBIDDEN:
- Single-leg / one heel up only
- Knee lift, marching, stepping, jumping
- Bent knees or leaning forward/back
- Feet leaving the floor (ONLY heels lift; toes stay down)`,

  'single-leg-calf-raises': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing on ONE leg only
- Other foot lifted slightly off ground (bent at knee)
- Standing foot flat on floor
END POSITION (RIGHT PANEL):
- Rising onto tiptoes on ONE foot
- Heel of standing foot lifted high
- Other foot still off ground
MOVEMENT ARROW: Upward arrow at ankle.
CRITICAL: Single leg balance throughout.`,

  'donkey-kicks': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- On all fours (hands and knees)
- Back flat like tabletop
- Both knees on ground
END POSITION (RIGHT PANEL):
- One leg kicked BACK and UP toward ceiling
- Knee stays bent at 90 degrees
- Sole of foot faces ceiling
- Other knee stays on ground
MOVEMENT ARROW: Curved arrow showing leg kicking back/up.
CRITICAL: Leg kicks BACKWARD and UP, not sideways.`,

  'fire-hydrants': `
CAMERA: SIDE PROFILE VIEW showing body from side. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- On all fours (tabletop position)
- Hands under shoulders, knees under hips
- Back flat, both knees on ground
END POSITION (RIGHT PANEL):
- SAME tabletop position
- One leg (keeping 90-degree knee bend) lifted OUT TO THE SIDE
- Thigh parallel to ground, foot pointing behind
- Other knee stays on ground
MOVEMENT ARROW: Curved arrow showing leg lifting laterally outward.
CRITICAL: Knee stays BENT 90 degrees. Leg lifts SIDEWAYS like dog at fire hydrant.`,

  // ==================== UPPER BODY PUSH ====================
  'push-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- High plank position
- Arms straight, hands under shoulders
- Body forms straight line from head to heels
END POSITION (RIGHT PANEL):
- Arms bent, chest 2 inches from floor
- Elbows at 45-degree angle to body
- Body STILL straight (no sagging hips)
MOVEMENT ARROW: Downward curved arrow showing descent.
CRITICAL: Body stays rigid as plank throughout.`,

  'knee-push-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Modified plank with KNEES on ground
- Arms straight, hands under shoulders
- Straight line from head to KNEES (not feet)
END POSITION (RIGHT PANEL):
- Arms bent, chest near floor
- Elbows at 45 degrees
- Knees still on ground
MOVEMENT ARROW: Downward arrow showing descent.
CRITICAL: KNEES on ground, not toes. Straight line head to knees.`,

  'wide-push-ups': `
CAMERA: FRONT VIEW slightly angled. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Plank position with hands WIDE (2.5-3 feet apart)
- Hands placed well outside shoulders
- Body straight
END POSITION (RIGHT PANEL):
- Chest lowered toward floor
- Arms bent wide
MOVEMENT ARROW: Downward arrow.
CRITICAL: Hands placed MUCH wider than shoulder width.`,

  'diamond-push-ups': `
CAMERA: FRONT VIEW slightly angled. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Plank position
- Hands together under chest forming DIAMOND shape
- Index fingers and thumbs touching to make triangle/diamond
END POSITION (RIGHT PANEL):
- Chest lowered toward hands
- Elbows tucked close to ribs
MOVEMENT ARROW: Downward arrow.
CRITICAL: Hands form DIAMOND/TRIANGLE shape under chest.`,

  'incline-push-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
MUST SHOW: Elevated surface (bench/step).
START POSITION (LEFT PANEL):
- Hands on ELEVATED surface (bench, step)
- Feet on floor
- Body at angle (easier than regular push-up)
END POSITION (RIGHT PANEL):
- Arms bent, chest toward elevated surface
MOVEMENT ARROW: Downward arrow.
CRITICAL: Hands HIGHER than feet. Elevated surface clearly visible.`,

  'decline-push-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
MUST SHOW: Elevated surface behind.
START POSITION (LEFT PANEL):
- Hands on floor
- FEET elevated on bench/step behind
- Body at downward angle
END POSITION (RIGHT PANEL):
- Arms bent, chest toward floor
MOVEMENT ARROW: Downward arrow.
CRITICAL: FEET higher than hands. More challenging than regular push-up.`,

  'archer-push-ups': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Wide push-up position
- Hands placed very wide
END POSITION (RIGHT PANEL):
- Lowered toward ONE side
- One arm bent (working arm)
- Other arm stays STRAIGHT extended to side
MOVEMENT ARROW: Diagonal arrow toward bent arm side.
CRITICAL: One arm bends, other arm stays COMPLETELY STRAIGHT.`,

  'hindu-push-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Downward dog position
- Hips HIGH (inverted V shape)
- Arms and legs straight
END POSITION (RIGHT PANEL):
- Upward dog/cobra position
- Hips NEAR floor
- Chest lifted, back arched
- Arms straight
MOVEMENT ARROW: Swooping curved arrow showing dive motion.
CRITICAL: Flowing movement from downward dog through low swoop to upward dog.`,

  'pike-push-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Downward dog/pike position
- Hips HIGH (inverted V shape)
- Arms straight, legs straight
END POSITION (RIGHT PANEL):
- Head lowered toward floor between hands
- Elbows bent
- Hips STAY HIGH (V-shape maintained)
MOVEMENT ARROW: Downward arrow at head.
CRITICAL: Hips stay HIGH throughout. Movement targets shoulders.`,

  'handstand-push-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
MUST SHOW: Wall behind for support.
START POSITION (LEFT PANEL):
- VERTICAL handstand against wall
- Arms fully extended
- Body completely upside down and straight
END POSITION (RIGHT PANEL):
- Head lowered toward floor
- Arms bent
- Body still vertical against wall
MOVEMENT ARROW: Downward arrow at head.
CRITICAL: Fully inverted handstand position. Wall clearly visible.`,

  'shoulder-taps': `
CAMERA: FRONT VIEW slightly angled. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- High plank position
- Both hands on floor
- Body straight
END POSITION (RIGHT PANEL):
- One hand lifted to tap OPPOSITE shoulder
- Hips stay SQUARE (no rotation)
- Three points of contact (one hand, two feet)
MOVEMENT ARROW: Arrow from hand to shoulder.
CRITICAL: Hips stay LEVEL and SQUARE - no rotating or swaying.`,

  // ==================== UPPER BODY PULL ====================
  'superman-pulls': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying FACE DOWN (prone) on mat
- Arms extended forward overhead
- Legs straight
END POSITION (RIGHT PANEL):
- Arms, chest, and legs ALL lifted off ground
- Back arched
- Only hips/lower belly on mat
MOVEMENT ARROW: Upward arrows at arms and legs.
CRITICAL: Lying FACE DOWN. Everything lifts UP off floor.`,

  'reverse-snow-angels': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying FACE DOWN (prone) on mat
- Arms at sides, palms down
- Head slightly lifted
END POSITION (RIGHT PANEL):
- Arms sweep out and UP toward overhead
- Arms hovering off floor throughout
- Squeeze shoulder blades
MOVEMENT ARROW: Curved arrows showing arm sweep motion.
CRITICAL: Face DOWN. Arms sweep like making snow angel but elevated.`,

  'ytw-raises': `
CAMERA: FRONT VIEW (or slightly angled). ONE chrome mannequin only.
Lying FACE DOWN or standing bent over at hips.
SHOW THREE POSITIONS:
Y - Arms raised overhead forming Y shape with body
T - Arms raised straight out to sides (T shape)
W - Elbows bent, squeezed back (W shape)
CRITICAL: Face DOWN or bent over. Arms form Y, T, W letter shapes.`,

  'floor-pull-backs': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying FACE DOWN on mat
- Arms extended forward overhead
END POSITION (RIGHT PANEL):
- Arms pull back toward hips (elbows bend)
- Chest slightly lifted
- Squeezing shoulder blades together
MOVEMENT ARROW: Arrows showing arms pulling back.
CRITICAL: Face DOWN. Arms pull back like rowing motion.`,

  'towel-rows': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
MUST SHOW: Towel wrapped around something stable.
START POSITION (LEFT PANEL):
- Standing or seated, gripping towel with both hands
- Arms extended forward
END POSITION (RIGHT PANEL):
- Pulling towel toward chest
- Elbows bent and pulled back
- Shoulder blades squeezed
MOVEMENT ARROW: Arrow showing pulling motion toward body.`,

  'isometric-towel-pulls': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
MUST SHOW: Towel gripped in both hands.
HOLD POSITION (SINGLE PANEL):
- Standing with towel gripped in both hands
- Arms bent, pulling towel apart
- Visible tension in arms/back
- Isometric hold (no movement)
CRITICAL: Static hold - pulling towel with constant tension.`,

  // ==================== CORE AND ABS ====================
  'plank': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Body supported on FOREARMS (not hands) and toes
- Elbows directly under shoulders
- Body forms perfectly STRAIGHT line from head to heels
- Back flat - not sagging or piked up
- Looking at ground
CRITICAL: On FOREARMS, not hands. Perfectly straight body.`,

  'side-plank': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Body supported on ONE forearm and side of stacked feet
- Body facing sideways to camera
- Hips lifted (straight line from head to feet)
- Top arm on hip or extended toward ceiling
CRITICAL: SIDE-facing position. Hips lifted, not sagging.`,

  'plank-shoulder-taps': `
CAMERA: FRONT VIEW slightly angled. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- High plank on hands
- Both hands on floor
END POSITION (RIGHT PANEL):
- One hand tapping opposite shoulder
- Body steady, hips square
MOVEMENT ARROW: Arrow from hand to shoulder.
CRITICAL: High plank position. Hips stay level.`,

  'hollow-body-hold': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Lying on BACK
- Lower back pressed firmly into ground
- Arms extended overhead
- Legs extended and lifted off ground
- Shoulders lifted off ground
- Body forms banana/curved shape
CRITICAL: On BACK. Curved like a banana. Lower back pressed down.`,

  'dead-bug': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying on BACK
- Arms extended straight up toward ceiling
- Legs raised with knees bent at 90 degrees (tabletop)
END POSITION (RIGHT PANEL):
- OPPOSITE arm and leg extending away
- One arm toward floor overhead
- Opposite leg extending straight out (hovering above floor)
- Lower back stays pressed to ground
MOVEMENT ARROW: Arrows showing opposite limbs extending.
CRITICAL: Lying on BACK (not face down).`,

  'bird-dog': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- On hands and KNEES (all fours)
- Back flat like tabletop
- Looking at ground
END POSITION (RIGHT PANEL):
- OPPOSITE arm extended forward (parallel to ground)
- OPPOSITE leg extended back (parallel to ground)
- Back stays flat
MOVEMENT ARROW: Arrows showing arm forward and leg back.
CRITICAL: On hands and KNEES. Opposite arm and leg extend.`,

  'crunches': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying on back
- Knees bent, feet flat on floor
- Hands behind head or crossed on chest
END POSITION (RIGHT PANEL):
- Only shoulders and upper back curled up
- Lower back stays on ground
- Small movement - chin toward ceiling
MOVEMENT ARROW: Small upward curve at shoulders.
CRITICAL: Small movement - NOT a full sit-up. Lower back stays down.`,

  'bicycle-crunches': `
CAMERA: SIDE PROFILE VIEW slightly angled. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying on back
- Hands behind head
- Legs raised in tabletop (knees bent)
END POSITION (RIGHT PANEL):
- Elbow rotating toward OPPOSITE bent knee
- Other leg extending straight out
- Twisting crunch motion
MOVEMENT ARROW: Rotating arrow showing twist.
CRITICAL: Twisting motion - elbow to OPPOSITE knee while other leg extends.`,

  'reverse-crunches': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying on back
- Knees bent, feet lifted off floor
- Arms at sides or holding something stable
END POSITION (RIGHT PANEL):
- Knees pulled toward chest
- Hips curl UP off the floor
- Lower back lifts off ground
MOVEMENT ARROW: Upward curving arrow at hips.
CRITICAL: HIPS lift off ground - not just knees moving.`,

  'leg-raises': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying on back
- Legs straight, on or just above ground
- Arms at sides
END POSITION (RIGHT PANEL):
- Legs raised straight up toward ceiling
- Legs perpendicular to ground (90 degrees)
- Back stays on ground
MOVEMENT ARROW: Upward arrow showing legs rising.
CRITICAL: Legs stay STRAIGHT throughout. Back stays on ground.`,

  'flutter-kicks': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
CONTINUOUS MOTION (TWO PANELS showing alternating):
- Lying on back
- Legs straight, hovering 6 inches off floor
- Small alternating up/down movements
- Lower back pressed to ground
MOVEMENT ARROWS: Small alternating up/down arrows at legs.
CRITICAL: Legs stay STRAIGHT. Small rapid alternating movements.`,

  'scissor-kicks': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
CONTINUOUS MOTION (TWO PANELS showing alternating):
- Lying on back
- Legs straight, hovering off floor
- Legs cross over each other alternating (scissors motion)
- Lower back pressed to ground
MOVEMENT ARROWS: Crossing arrows showing scissor motion.
CRITICAL: Legs STRAIGHT. Crossing side-to-side like scissors.`,

  'v-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying flat on back
- Arms extended overhead on floor
- Legs straight on floor
END POSITION (RIGHT PANEL):
- Arms AND legs raised simultaneously
- Meet in middle, body forms V shape
- Balancing on tailbone
MOVEMENT ARROW: Two arrows converging to show V formation.
CRITICAL: Both arms AND legs lift at same time to form V.`,

  'sit-ups': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying flat on back
- Knees bent, feet flat on floor
- Arms crossed on chest or behind head
END POSITION (RIGHT PANEL):
- FULL sit up - torso upright
- Chest toward knees
- Full range of motion (unlike crunch)
MOVEMENT ARROW: Large curved arrow showing full sit-up motion.
CRITICAL: FULL sit-up to upright position (not just a crunch).`,

  'russian-twists': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- SEATED on ground (not lying)
- Knees bent, feet slightly off floor
- Torso leaned back 45 degrees
- Hands together at chest
END POSITION (RIGHT PANEL):
- Torso rotated to one side
- Hands touch floor beside hip
- Feet stay lifted
MOVEMENT ARROW: Rotating arrows showing side-to-side twist.
CRITICAL: SEATED position, not lying. Twisting side to side.`,

  'mountain-climbers': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- High plank position
- Arms straight, body straight
END POSITION (RIGHT PANEL):
- One knee driven forward toward chest
- Other leg extended back
- Plank position maintained
MOVEMENT ARROW: Arrow showing knee driving forward.
CRITICAL: Rapid alternating knee drives while in plank.`,

  'heel-taps': `
CAMERA: SIDE PROFILE VIEW slightly angled. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Lying on back
- Knees bent, feet flat on floor
- Arms at sides
END POSITION (RIGHT PANEL):
- Crunching up slightly
- Reaching one hand to touch same-side heel
- Small side-to-side reaching motion
MOVEMENT ARROW: Side arrow showing reach to heel.`,

  // ==================== CARDIO/FULL BODY ====================
  'jumping-jacks': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright
- Feet together
- Arms at sides
END POSITION (RIGHT PANEL):
- Feet jumped out WIDE apart
- Arms raised overhead in V shape
MOVEMENT ARROW: Outward arrows at arms and legs.
CRITICAL: Classic jumping jack - arms up AND feet out simultaneously.`,

  'high-knees': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright
- Running stance
END POSITION (RIGHT PANEL):
- Running in place
- One knee driven HIGH (to hip level)
- Opposite arm forward
MOVEMENT ARROW: Upward arrow at knee.
CRITICAL: Exaggerated high knee lift to HIP LEVEL.`,

  'butt-kicks': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing/light jogging position
END POSITION (RIGHT PANEL):
- Running in place
- One heel kicked back to touch GLUTE (buttock)
- Thigh stays vertical
MOVEMENT ARROW: Backward curved arrow at foot.
CRITICAL: Heel kicks back to touch buttock - thigh stays DOWN.`,

  'skaters': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing on one leg, slightly crouched
- Weight on one side
END POSITION (RIGHT PANEL):
- Lateral hop/jump to other leg
- Landing leg bent
- Trailing leg crosses behind (curtsy-style)
- Arms swinging for balance
MOVEMENT ARROW: Large lateral arrow showing side-to-side jump.
CRITICAL: Lateral (side-to-side) jumping motion.`,

  'burpees': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
Show SEQUENCE or START/END:
START POSITION (LEFT PANEL):
- Standing upright
END POSITION (RIGHT PANEL):
- High plank position OR jumping with arms overhead
MOVEMENT ARROW: Arrow showing squat down, jump back to plank.
CRITICAL: Full movement: stand → squat → plank → push-up → squat → jump.`,

  'half-burpees': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright
END POSITION (RIGHT PANEL):
- Squat position with hands on floor
- (No push-up, no jump)
MOVEMENT ARROW: Downward arrow.
CRITICAL: NO push-up and NO jump - just squat down to hands on floor.`,

  'squat-thrusts': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- High plank position
END POSITION (RIGHT PANEL):
- Feet jumped forward to squat position
- Hands still on floor
MOVEMENT ARROW: Arrow showing feet jumping forward.
CRITICAL: Plank to squat position (no standing up, no jump).`,

  'bear-crawl': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- On all fours
- Knees HOVERING 2 inches off ground
- Back flat
END POSITION (RIGHT PANEL):
- Opposite hand and foot moving forward
- Knees still hovering
- Low crawling position maintained
MOVEMENT ARROW: Forward arrows showing crawl motion.
CRITICAL: Knees HOVER off ground - not touching.`,

  'crab-walk': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Sitting position, knees bent, feet flat
- Hands behind hips, fingers forward
- Hips lifted into reverse tabletop
END POSITION (RIGHT PANEL):
- Moving forward/backward
- Alternating hand/foot steps
- Hips stay lifted
MOVEMENT ARROW: Arrows showing walking motion.
CRITICAL: Reverse tabletop - face UP, belly UP.`,

  'inchworms': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
Show SEQUENCE or START/END:
START POSITION (LEFT PANEL):
- Standing, hinged forward, hands touching floor
- Legs straight
END POSITION (RIGHT PANEL):
- High plank position (hands walked out)
- OR hands walking back toward feet
MOVEMENT ARROW: Forward arrows showing hands walking out.
CRITICAL: Walking hands out to plank, then walking feet to hands.`,

  'shadow-boxing': `
CAMERA: FRONT VIEW at angle. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Boxing stance - one foot forward
- Hands up guarding face
- Knees slightly bent
END POSITION (RIGHT PANEL):
- Arm extended in punch (jab or cross)
- Torso rotated slightly
- Other hand still at guard position
MOVEMENT ARROW: Forward arrow showing punch direction.
CRITICAL: Athletic boxing stance with punching motion.`,

  'fast-feet': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
CONTINUOUS MOTION:
- Athletic stance, knees bent
- Rapid alternating foot movements
- Staying in place (pitter-patter motion)
- On balls of feet
MOVEMENT ARROWS: Small rapid up/down arrows at feet.
CRITICAL: Rapid small steps in place - like running but stationary.`,

  'stair-running': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
MUST SHOW: Stairs/steps.
START POSITION (LEFT PANEL):
- At bottom of stairs
- Running position
END POSITION (RIGHT PANEL):
- Mid-stride on stairs
- High knee drive upward
MOVEMENT ARROW: Upward diagonal arrow.
CRITICAL: Running UP stairs with high knees.`,

  // ==================== MOBILITY AND FLEXIBILITY ====================
  'arm-circles': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
POSITION:
- Standing tall
- Arms extended straight out to sides at shoulder height
MOVEMENT:
- Circular motion with both arms (forward or backward)
MOVEMENT ARROWS: Circular arrows around arms showing rotation.
CRITICAL: Arms stay STRAIGHT at shoulder height. Circular motion.`,

  'leg-swings': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START/END POSITIONS:
- Standing on one leg (can use wall for balance)
- Other leg swinging in arc front to back
- Torso stays upright
MOVEMENT ARROW: Curved arc arrow showing swing motion.
CRITICAL: Smooth swinging motion, torso STAYS UPRIGHT.`,

  'hip-circles': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
POSITION:
- Standing with feet shoulder-width apart
- Hands on hips
MOVEMENT:
- Large circular motion with hips
- Like hula hooping
MOVEMENT ARROWS: Circular arrow around hips.
CRITICAL: Large circular hip rotation while standing.`,

  'cat-cow-stretch': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
TWO POSITIONS:
COW (LEFT PANEL):
- On all fours (tabletop)
- Belly dropped DOWN toward floor
- Head and tailbone lifted UP
- Back curved downward (concave)
CAT (RIGHT PANEL):
- On all fours (tabletop)
- Back arched UP toward ceiling (rounded)
- Head and tailbone tucked DOWN
- Back curved upward (convex)
MOVEMENT ARROW: Up/down arrows showing spine movement.
CRITICAL: On hands and knees. Alternating spine curves.`,

  'childs-pose': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Kneeling on mat
- Sitting back on heels
- Torso folded forward over thighs
- Forehead on floor
- Arms extended forward on floor OR at sides
CRITICAL: Kneeling position, folded over. Restful stretch pose.`,

  'downward-dog': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Inverted V shape
- Hands and feet on floor
- Hips pushed HIGH toward ceiling
- Arms and legs straight
- Heels reaching toward ground
- Head between arms, looking at feet
CRITICAL: Inverted V - hips are highest point.`,

  'cobra-stretch': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Lying FACE DOWN
- Hands under shoulders
- Chest LIFTED by straightening arms
- Hips and legs remain on floor
- Back arched, looking slightly up
CRITICAL: Hips stay ON THE FLOOR. Only upper body lifts.`,

  'hip-flexor-stretch': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Low lunge position
- BACK knee on the floor
- FRONT knee bent at 90 degrees, foot flat
- Hips pushed gently forward
- Torso upright
- Stretch felt in front of back hip
CRITICAL: Back knee DOWN on ground. Front knee at 90 degrees.`,

  'hamstring-stretch': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Standing with one foot forward
- Front leg STRAIGHT
- Hinging forward at hips
- Reaching toward front toes
- Back leg slightly bent for balance
CRITICAL: Front leg stays STRAIGHT. Hinge at hips.`,

  'calf-stretch': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Standing with one foot forward, one back
- Back leg STRAIGHT with heel pressed to floor
- Front knee slightly bent
- Leaning into wall or forward
- Stretch felt in back calf
CRITICAL: Back heel stays on ground. Back leg straight.`,

  'shoulder-stretch': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Standing upright
- One arm across chest (horizontal)
- Other arm pulling it closer to body
- Stretch felt in shoulder
CRITICAL: Arm held across chest, pulled with other arm.`,

  'thoracic-rotation': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- On all fours OR seated
- One hand behind head
END POSITION (RIGHT PANEL):
- Upper back/elbow rotated toward ceiling
- Hips stay square to floor
- Opening up the chest
MOVEMENT ARROW: Rotating arrow showing spine twist.
CRITICAL: Only UPPER back rotates. Hips stay square.`,

  // ==================== BALANCE AND STABILITY ====================
  'single-leg-balance': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Standing on ONE leg only
- Other foot lifted slightly off ground
- Arms out to sides for balance OR hands on hips
- Standing tall
CRITICAL: Balancing on ONE leg. Simple stance.`,

  'single-leg-reach': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing on one leg
END POSITION (RIGHT PANEL):
- Reaching one hand toward ground
- Other leg may extend back for balance
- Single-leg balance maintained
MOVEMENT ARROW: Downward arrow showing reach.`,

  'airplane-pose': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Standing on ONE leg
- Torso hinged forward, parallel to floor
- One leg extended straight BACK (also parallel to floor)
- Arms extended out to sides like airplane wings
- T-shape from head to extended foot
CRITICAL: Torso and back leg PARALLEL to ground. Arms out like wings.`,

  'single-leg-rdl': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing on one leg
- Other foot slightly off ground
END POSITION (RIGHT PANEL):
- Hinging forward at hips
- Back leg extending behind (counterbalance)
- Reaching toward ground
- Straight line from head to back foot
MOVEMENT ARROW: Forward/down curved arrow.
CRITICAL: Hip hinge movement on ONE leg. Back leg extends behind.`,

  'standing-knee-raises': `
CAMERA: SIDE PROFILE VIEW. ONE chrome mannequin only.
START POSITION (LEFT PANEL):
- Standing upright on both feet
END POSITION (RIGHT PANEL):
- One knee lifted toward chest
- Hip and knee at 90 degrees
- Standing tall on other leg
MOVEMENT ARROW: Upward arrow at knee.
CRITICAL: Knee lifts UP toward chest.`,

  'tree-pose': `
CAMERA: FRONT VIEW. ONE chrome mannequin only.
HOLD POSITION (SINGLE PANEL):
- Standing on ONE leg
- Other foot placed on inner CALF or inner THIGH
- (NEVER on the knee)
- Hands in prayer at chest OR overhead
- Standing tall and balanced
CRITICAL: Foot on inner leg, NEVER on knee joint. Classic yoga pose.`,
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

    const generateImageDataUrl = async (promptText: string): Promise<string> => {
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
              content: promptText,
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);

        await supabase
          .from('exercise_images')
          .update({
            generation_status: 'failed',
            generation_error: `AI Gateway error: ${response.status}`,
            updated_at: new Date().toISOString(),
          })
          .eq('exercise_id', exerciseId);

        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Image generated successfully');

      const generated = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!generated) {
        await supabase
          .from('exercise_images')
          .update({
            generation_status: 'failed',
            generation_error: 'No image data received from AI',
            updated_at: new Date().toISOString(),
          })
          .eq('exercise_id', exerciseId);

        throw new Error('No image data received from AI');
      }

      return generated;
    };

    const validateGluteBridgesImage = async (
      dataUrl: string,
    ): Promise<{ pass: boolean; reasons: string[] }> => {
      try {
        const validationPrompt = `You are a STRICT fitness illustration validator.
Return ONLY valid JSON: {"pass": boolean, "reasons": string[]}.

PASS ONLY IF ALL are true:
1) The illustration shows a glute bridge (lying on back) in SIDE PROFILE view.
2) Two panels labeled START (left) and END (right).
3) END shows hips lifted HIGH with a straight line from shoulders to hips to knees (table-top/ramp), with a clear visible gap under the hips.
4) NO standing figure and NO front view.
5) Only ONE coral/red UP arrow at the hips (no extra arrows).`;

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: validationPrompt },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
            modalities: ["text"],
          }),
        });

        if (!resp.ok) {
          return { pass: false, reasons: [`validator_http_${resp.status}`] };
        }

        const json = await resp.json();
        const raw = json.choices?.[0]?.message?.content;
        const text = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '');

        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        const jsonStr = firstBrace !== -1 && lastBrace !== -1 ? text.slice(firstBrace, lastBrace + 1) : text;

        const parsed = JSON.parse(jsonStr);
        return {
          pass: Boolean(parsed?.pass),
          reasons: Array.isArray(parsed?.reasons)
            ? parsed.reasons.map((r: unknown) => String(r))
            : ['validator_unparseable_reasons'],
        };
      } catch (e) {
        console.error('Validator error:', e);
        return { pass: false, reasons: ['validator_exception'] };
      }
    };

    const validateCalfRaisesImage = async (
      dataUrl: string,
    ): Promise<{ pass: boolean; reasons: string[] }> => {
      try {
        const validationPrompt = `You are a STRICT fitness illustration validator.
Return ONLY valid JSON: {"pass": boolean, "reasons": string[]}.

PASS ONLY IF ALL are true:
1) The illustration shows a STANDING BILATERAL CALF RAISE (both feet) in SIDE PROFILE view.
2) Two panels labeled START (left) and END (right).
3) START shows BOTH feet flat with BOTH heels DOWN on the floor.
4) END shows BOTH heels lifted HIGH at the same time (tip-toes), with a clear visible air gap under BOTH heels.
5) NO single-leg raise, NO knee drive/march/step, NO jumping.`;

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: validationPrompt },
                  { type: "image_url", image_url: { url: dataUrl } },
                ],
              },
            ],
            modalities: ["text"],
          }),
        });

        if (!resp.ok) {
          return { pass: false, reasons: [`validator_http_${resp.status}`] };
        }

        const json = await resp.json();
        const raw = json.choices?.[0]?.message?.content;
        const text = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '');

        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        const jsonStr = firstBrace !== -1 && lastBrace !== -1 ? text.slice(firstBrace, lastBrace + 1) : text;

        const parsed = JSON.parse(jsonStr);
        return {
          pass: Boolean(parsed?.pass),
          reasons: Array.isArray(parsed?.reasons)
            ? parsed.reasons.map((r: unknown) => String(r))
            : ['validator_unparseable_reasons'],
        };
      } catch (e) {
        console.error('Validator error:', e);
        return { pass: false, reasons: ['validator_exception'] };
      }
    };

    // Generate (with validation+retry for specific exercises)
    let imageData: string | null = null;
    const maxAttempts =
      exerciseId === 'glute-bridges' || exerciseId === 'calf-raises' ? 3 : 1;
    let lastReasons: string[] = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const exerciseSpecificFix =
        exerciseId === 'glute-bridges'
          ? 'DO NOT output a standing/front-view figure. Must be lying on back, side profile, with hips clearly lifted high in END.'
          : exerciseId === 'calf-raises'
            ? 'BILATERAL TIP-TOE REQUIRED: BOTH heels must be clearly lifted HIGH at the same time. No single-leg. No knee drive/march/step. End must show a clear air gap under BOTH heels.'
            : '';

      const attemptPrompt =
        attempt === 1
          ? prompt
          : `${prompt}\n\nCRITICAL FIX (attempt ${attempt}/${maxAttempts}): The previous image was WRONG. Fix these issues: ${lastReasons.join('; ') || 'incorrect pose/view'}.\n\n${exerciseSpecificFix}`;

      imageData = await generateImageDataUrl(attemptPrompt);

      const needsValidation = exerciseId === 'glute-bridges' || exerciseId === 'calf-raises';
      if (!needsValidation) break;

      const verdict =
        exerciseId === 'glute-bridges'
          ? await validateGluteBridgesImage(imageData)
          : await validateCalfRaisesImage(imageData);

      if (verdict.pass) {
        console.log(`✅ Validator PASS (${exerciseId})`);
        break;
      }

      console.log(`❌ Validator FAIL (${exerciseId}):`, verdict.reasons);
      lastReasons = verdict.reasons;

      if (attempt === maxAttempts) {
        await supabase
          .from('exercise_images')
          .update({
            generation_status: 'failed',
            generation_error: `Failed validation: ${lastReasons.slice(0, 5).join(' | ')}`,
            updated_at: new Date().toISOString(),
          })
          .eq('exercise_id', exerciseId);

        throw new Error('Generated image failed form validation; please retry.');
      }
    }

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
