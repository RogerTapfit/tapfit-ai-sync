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
    const { photos } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!photos || photos.length === 0) {
      throw new Error('No photos provided for analysis');
    }

    console.log('Analyzing', photos.length, 'ingredient photos for recipes');

    const prompt = `Analyze these ingredient photos and provide detailed recipe recommendations.

Your task:
1. Identify all visible ingredients, food items, and pantry staples in the images
2. Generate 2-3 creative, healthy recipe recommendations using these ingredients
3. For each recipe, provide complete details with ingredient amounts normalized for 1 serving

IMPORTANT: All recipes must be sized for 1 SERVING only. Nutrition calculation will be handled separately.

Return a JSON object with this exact structure:
{
  "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description of the dish",
      "difficulty": "Easy|Medium|Hard",
      "prepTime": 15,
      "cookTime": 20,
      "servings": 1,
      "healthScore": 85,
      "tags": ["healthy", "quick", "vegetarian"],
      "ingredients": [
        {
          "name": "ingredient name",
          "amount": "1/2 cup",
          "available": true,
          "substitutes": ["alternative ingredient"]
        }
      ],
      "instructions": [
        "Step 1: Detailed instruction for 1 serving",
        "Step 2: Next step for 1 serving"
      ]
    }
  ]
}

Guidelines:
- ALL RECIPES MUST BE FOR 1 SERVING ONLY (servings: 1)
- Provide realistic single-serving ingredient amounts (e.g., "1/4 pound ground beef", "1/2 cup pasta", "2 tablespoons sauce")
- Focus on healthy, balanced recipes that maximize the visible ingredients
- Include preparation methods suitable for home cooking
- Suggest reasonable substitutes for missing common ingredients
- Rate difficulty realistically (Easy: <30min, basic techniques; Medium: 30-60min, moderate skills; Hard: >60min, advanced techniques)
- Health score should reflect nutritional balance (vegetables, lean proteins, whole grains = higher scores)
- Be creative but practical with recipe suggestions
- Consider different meal types (breakfast, lunch, dinner, snacks)
- DO NOT include nutrition data - this will be calculated automatically using USDA data`;

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
            content: 'You are a professional chef and nutritionist. Analyze ingredient photos and create detailed, healthy recipe recommendations. Always return valid JSON with complete recipe details.' 
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
        max_tokens: 2000,
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

    let recipeData;
    try {
      let content = aiData.choices[0].message.content;
      
      // Handle markdown-wrapped JSON
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      content = content.trim();
      recipeData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      throw new Error('Failed to parse recipe data from AI');
    }

    console.log('Generated recipe recommendations:', JSON.stringify(recipeData, null, 2));

    return new Response(JSON.stringify(recipeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generateRecipes function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to generate recipe recommendations'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});