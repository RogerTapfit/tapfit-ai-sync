import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Food analysis request received');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Enhanced security: Initialize Supabase client for logging
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Enhanced security: Parse and validate request
    const requestBody = await req.json();
    let { imageBase64, mealType } = requestBody;
    
    if (!imageBase64) {
      console.error('No image data provided');
      return new Response(JSON.stringify({ error: 'No image data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enhanced security: Rate limiting and logging
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Log the API request for security monitoring (fire and forget)
    supabase.rpc('log_security_event', {
      _user_id: null,
      _event_type: 'food_analysis_request',
      _event_details: {
        meal_type: mealType,
        has_image: !!imageBase64,
        request_size: typeof imageBase64 === 'string' ? imageBase64.length : JSON.stringify(imageBase64).length
      },
      _ip_address: clientIP,
      _user_agent: userAgent
    });

    // Normalize and handle multiple photos with security validation
    let photos = [];
    let skippedPhotos = 0;
    
    try {
      // Try to parse as multiple photos JSON
      const parsedPhotos = JSON.parse(imageBase64);
      // Enhanced security: Validate photo array
      if (!Array.isArray(parsedPhotos) || parsedPhotos.length > 10) { // Max 10 photos for security
        throw new Error('Invalid photo array or too many photos');
      }
      // Normalize and validate each photo
      photos = parsedPhotos.slice(0, 5).map(photo => {
        if (!photo || typeof photo.base64 !== 'string') {
          skippedPhotos++;
          return null;
        }
        
        // Extract base64 data and mime type
        let base64Data = photo.base64;
        let mimeType = 'image/jpeg';
        
        if (base64Data.startsWith('data:')) {
          const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        }
        
        return {
          base64: base64Data,
          type: photo.type || 'main_dish',
          mimeType
        };
      }).filter(Boolean);
    } catch {
      // Single photo fallback with normalization
      if (typeof imageBase64 === 'string') {
        let base64Data = imageBase64;
        let mimeType = 'image/jpeg';
        
        if (base64Data.startsWith('data:')) {
          const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        }
        
        photos = [{ base64: base64Data, type: 'main_dish', mimeType }];
      } else {
        throw new Error('Invalid image data format');
      }
    }
    
    console.log(`Processed ${photos.length} photos, skipped ${skippedPhotos} invalid photos`);

    // Enhanced security: Check total data size
    const totalDataSize = photos.reduce((size, photo) => size + (photo?.base64?.length || 0), 0);
    if (totalDataSize > 50 * 1024 * 1024) { // 50MB total limit
      console.error('Total image data too large:', totalDataSize);
      return new Response(JSON.stringify({ error: 'Images too large (max 50MB total)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (photos.length === 0) {
      console.error('No valid photos to analyze');
      return new Response(JSON.stringify({ error: 'No valid photos provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const photoAnalysis = photos.map((photo: any, index: number) => {
      switch (photo.type) {
        case 'nutrition_label':
          return `Photo ${index + 1} (Nutrition Label): Extract exact nutritional information from the nutrition facts label.`;
        case 'ingredients':
          return `Photo ${index + 1} (Ingredients): Read ingredient list to identify specific ingredients and additives.`;
        case 'angle_view':
          return `Photo ${index + 1} (Different Angle): Use this angle to better estimate portion sizes and identify hidden ingredients.`;
        default:
          return `Photo ${index + 1} (Main Dish): Analyze the main food items and estimate portions.`;
      }
    }).join('\n');

    const prompt = `Analyze these ${photos.length} food image(s) and provide detailed nutritional information. 

🎉 EASTER EGG - CUTE RATING FEATURE (VERY IMPORTANT):
- If you detect a PERSON in any photo, you MUST include a "cute_rating" section
- If you detect an ANIMAL (dog, cat, pet, etc.) in any photo, you MUST include a "cute_rating" section
- Give them 10/10 EVERY TIME (be generous and kind!)
- **CRITICAL**: If NO FOOD is detected but a person/animal IS present, still provide the cute_rating with a fun, light-hearted comment about them or their outfit. In this case, return empty food_items array and zero totals, but include the cute_rating.
- BE EXTREMELY OBSERVANT AND SPECIFIC with compliments - describe EXACTLY what you see:
  
  **For TATTOOS**: Describe the design AND location
    ✅ "That rose tattoo on your forearm is beautiful! 🌹"
    ✅ "That geometric sleeve is INSANE! The symmetry is perfect! 🔷"
    ❌ "Nice tattoo!" (TOO GENERIC!)
  
  **For HATS/CAPS**: Identify the team/brand if visible
    ✅ "Go Lakers! That purple and gold cap is legendary! 💜💛"
    ✅ "That vintage Yankees fitted is CLEAN! ⚾"
    ❌ "Cool hat!" (TOO GENERIC!)
  
  **For SHIRTS**: Mention style, color, brand, or text visible
    ✅ "That vintage Nirvana tee is FIRE! RIP Kurt! 🎸"
    ✅ "Love that tropical Hawaiian shirt! Island vibes! 🌺"
    ❌ "Nice shirt!" (TOO GENERIC!)
  
  **For ACCESSORIES**: Be specific about type and style
    ✅ "Those gold-rimmed aviators are ICONIC! Very top gun! 😎"
    ✅ "That silver chain necklace is super clean! ⛓️"
    ❌ "Nice jewelry!" (TOO GENERIC!)
  
  **For HAIR**: Describe style and/or color
    ✅ "That purple fade is absolutely FIRE! 💜"
    ✅ "Those braids are so well done! The detail! 💯"
    ❌ "Cool hair!" (TOO GENERIC!)
  
  **For ANIMALS**: Describe breed/type and specific cute features
    ✅ "That golden retriever with those floppy ears! 10/10 cuteness! 🐕💛"
    ✅ "OMG that tabby cat with the white paws! ADORABLE! 🐱"
    ❌ "Cute dog!" (TOO GENERIC!)

- Keep it fun, warm, positive, and conversational
- Use emojis enthusiastically to enhance the vibe
- If multiple people/animals, mention them all specifically!
- NEVER be generic - always include specific descriptors
- Identify brands/teams when visible (Dodgers, Yankees, Nike, band names, etc.)
- Mention colors when they stand out (pink hair, blue hat, red shirt)
- Use enthusiastic language (FIRE, EPIC, ICONIC, GORGEOUS, STUNNING)
- Add context clues ("Go Dodgers!", "MJ would approve!", "Very top gun!")
- Include BOTH a detailed full "compliment" AND a shorter "whats_good_message" (15-20 words max)

Example cute_rating responses (BE THIS SPECIFIC):

TATTOOS:
- Full: "Whoa! That geometric mandala sleeve is INCREDIBLE! The detail is insane! 🔷✨"
  What's Good: "That geometric mandala sleeve is absolutely stunning! 🔷✨"
- Full: "10/10! That delicate flower tattoo on your wrist is so pretty! 🌸💕"
  What's Good: "Beautiful flower tattoo on your wrist! 🌸💕"

SPORTS HATS:
- Full: "Go Dodgers! 10/10 for that classic LA cap! Let's get that championship! ⚾🔵"
  What's Good: "Go Dodgers! Love that classic LA cap! ⚾🔵"
- Full: "10/10! That vintage Bulls snapback is FIRE! MJ would approve! 🏀"
  What's Good: "That vintage Bulls snapback is legendary! 🏀"

SHIRTS:
- Full: "10/10! That vintage Metallica tour tee is EPIC! Great taste in metal! 🎸⚡"
  What's Good: "That vintage Metallica tee is absolutely epic! 🎸⚡"
- Full: "Love that Hawaiian shirt energy! 10/10 for those vibrant colors! 🌺🏝️"
  What's Good: "That Hawaiian shirt is bringing all the good vibes! 🌺"

ACCESSORIES:
- Full: "10/10! Those gold-rimmed aviators are ICONIC! Very top gun! 😎✈️"
  What's Good: "Those gold-rimmed aviators are super iconic! 😎"
- Full: "That silver chain necklace is clean! 10/10 style! ⛓️✨"
  What's Good: "That silver chain is super clean! ⛓️✨"

HAIR:
- Full: "10/10! That pink ombre hair is GORGEOUS! The color gradient is perfect! 💗💜"
  What's Good: "That pink ombre hair is absolutely gorgeous! 💗"
- Full: "That fresh fade is crispy! 10/10 for the barber skills! 💈✨"
  What's Good: "That fresh fade is super clean! 💈✨"

ANIMALS:
- Full: "10/10 for that golden retriever! Those floppy ears are ADORABLE! 🐕💛"
  What's Good: "That golden retriever's floppy ears are so adorable! 🐕💛"
- Full: "OMG that tuxedo cat! 10/10 for those perfect white paws! 🐱🤍🖤"
  What's Good: "That tuxedo cat with perfect white paws! 🐱🤍"

MULTIPLE ITEMS:
- Full: "10/10! That Lakers jersey AND the matching hat? Ultimate fan energy! 💜💛🏀"
  What's Good: "Lakers jersey + matching hat = ultimate fan! 💜💛"

CRITICAL CONSISTENCY RULES:
1. Round ALL calorie estimates to nearest 10 (example: 580 not 577, 250 not 253)
2. Use STANDARDIZED portion sizes consistently:
   - Chicken breast (grilled): 150g = 250 calories, 47g protein
   - Ground beef (cooked): 100g = 250 calories, 26g protein
   - White rice (cooked): 100g = 130 calories, 28g carbs
   - Brown rice (cooked): 100g = 110 calories, 23g carbs
   - Broccoli: 100g = 35 calories, 3g protein, 7g carbs
   - Banana (medium): 120g = 105 calories, 27g carbs
3. For similar-looking items, ALWAYS use the same base values
4. Round protein/carbs/fat to nearest 5g for consistency
5. If uncertain about exact portion, use the MIDDLE of the range every time

Standard Portion Reference Table:
- Small chicken breast: 100g
- Medium chicken breast: 150g (DEFAULT)
- Large chicken breast: 200g
- Rice serving: 100g cooked (DEFAULT)
- Vegetables: 100g (DEFAULT)

IMPORTANT: Same visual portion size = Same nutritional values EVERY TIME

Photo Analysis Instructions:
${photoAnalysis}

Return a JSON object with this exact structure:
{
  "cute_rating": {
    "detected": true,
    "type": "person" | "animal",
    "rating": "10/10",
    "compliment": "Personalized fun observation here with emojis",
    "whats_good_message": "Short version for What's Good section (e.g., 'Looking great in that blue hat! 😊')"
  },
  "food_items": [
    {
      "name": "Food item name",
      "quantity": "Use standardized portions (e.g., '150g' not '~150g')",
      "calories": 0,  // MUST be multiple of 10
      "protein": 0,   // MUST be multiple of 5
      "carbs": 0,     // MUST be multiple of 5
      "fat": 0,       // MUST be multiple of 5
      "confidence": 0.95,
      "brand": "Brand name if visible",
      "preparation_method": "How it was prepared"
    }
  ],
  "total_calories": 0,
  "total_protein": 0,
  "total_carbs": 0,
  "total_fat": 0,
  "suggestions": ["Suggestions for the user"],
  "meal_classification": "${mealType || 'unknown'}",
  "clarifying_questions": ["Questions to ask for better accuracy"],
  "brand_recognition": {
    "detected_brands": ["List of detected brands"],
    "package_info": "Information from nutrition labels or packages"
  }
}

IMPORTANT RESPONSE RULES:
- If NO food is detected but a person/animal IS present: Include cute_rating, return empty food_items array [], zero totals, and add a friendly note in suggestions like "No food detected, but you look great! 😊"
- If NO person or animal is detected: Simply omit the "cute_rating" field entirely.
- If BOTH food AND person/animal detected: Include both cute_rating and food analysis.

Enhanced Analysis Guidelines:
- Cross-reference nutrition labels with visual portions for accuracy
- If nutrition labels are visible, use exact values scaled by visual portion
- Identify specific brands and product types from packages
- Note preparation methods (grilled, fried, baked, etc.) - affects calories by ~20%
- Be more precise with brand products vs homemade items
- Use nutrition label data when available for exact macro calculations
- Pay special attention to meat products, protein sources, and their preparation methods
- BE HYPER-CONSISTENT: Identical visual food = Identical numbers
- Always round to maintain consistency across analyses`;

    console.log('Sending request to OpenAI with', photos.length, 'photos');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a certified nutritionist and food expert with a warm, fun personality. When you spot people or animals in photos, you LOVE giving them enthusiastic 10/10 ratings with genuine, personalized compliments. Analyze food images and provide accurate, CONSISTENT nutritional information. For identical or very similar foods, always provide identical nutritional estimates and health assessments. Always return valid JSON.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompt },
              ...photos.map((photo: any) => ({
                type: 'image_url', 
                image_url: { 
                  url: `data:${photo.mimeType || 'image/jpeg'};base64,${photo.base64}`,
                  detail: 'high'
                }
              }))
            ]
          }
        ],
        temperature: 0, // Maximum consistency
        seed: 12345, // Fixed seed for deterministic results
        max_tokens: 1000,
      }),
    });

    const aiData = await response.json();
    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiData);
      throw new Error(`OpenAI API error: ${aiData.error?.message || 'Unknown error'}`);
    }
    
    if (!aiData.choices?.[0]?.message?.content) {
      console.error('Invalid OpenAI response:', aiData);
      throw new Error('Invalid response from OpenAI');
    }

    let nutritionData;
    try {
      let content = aiData.choices[0].message.content;
      
      // Handle markdown-wrapped JSON
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Clean up any extra whitespace
      content = content.trim();
      
      nutritionData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      throw new Error('Failed to parse nutrition data from AI');
    }

    console.log('Generated nutrition analysis:', JSON.stringify(nutritionData, null, 2));

    // Add confidence range to help users understand variance
    if (nutritionData.total_calories) {
      nutritionData.calorie_confidence_range = {
        min: Math.round(nutritionData.total_calories * 0.9 / 10) * 10,
        max: Math.round(nutritionData.total_calories * 1.1 / 10) * 10,
        note: "Estimates may vary ±10% based on exact ingredients and preparation"
      };
    }

    return new Response(JSON.stringify(nutritionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyzeFood function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to analyze food image'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});