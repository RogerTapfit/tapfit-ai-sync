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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let { imageBase64, mealType } = await req.json();
    
    // Handle multiple photos
    let photos = [];
    try {
      // Try to parse as multiple photos JSON
      photos = JSON.parse(imageBase64);
    } catch {
      // Single photo fallback
      photos = [{ base64: imageBase64, type: 'main_dish' }];
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

IMPORTANT: Be extremely consistent in your analysis. Use standardized portion sizes and nutritional values for identical foods.

Photo Analysis Instructions:
${photoAnalysis}

Return a JSON object with this exact structure:
{
  "food_items": [
    {
      "name": "Food item name",
      "quantity": "Estimated serving size",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
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

Enhanced Analysis Guidelines:
- Use standardized portion estimates for consistency (e.g., always use 100g for similar meat portions)
- Cross-reference nutrition labels with visual portions for accuracy
- If nutrition labels are visible, use exact values and scale by visual portion
- Identify specific brands and product types from packages
- Note preparation methods (grilled, fried, baked, etc.)
- Be more precise with brand products vs homemade items
- Use nutrition label data when available for exact macro calculations
- Pay special attention to meat products, protein sources, and their preparation methods
- BE CONSISTENT: Always use the same nutritional values for visually identical foods`;

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
            content: 'You are a certified nutritionist and food expert. Analyze food images and provide accurate, CONSISTENT nutritional information. For identical or very similar foods, always provide identical nutritional estimates and health assessments. Always return valid JSON.' 
          },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: prompt },
              ...photos.map((photo: any) => ({
                type: 'image_url', 
                image_url: { 
                  url: `data:image/jpeg;base64,${photo.base64}`,
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