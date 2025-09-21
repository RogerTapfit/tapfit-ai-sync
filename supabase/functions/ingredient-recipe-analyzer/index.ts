import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IngredientPhoto {
  base64: string;
  filename: string;
}

interface RecipeRecommendation {
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  healthScore: number;
  tags: string[];
  ingredients: {
    name: string;
    amount: string;
    available: boolean;
    substitutes?: string[];
  }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { photos }: { photos: IngredientPhoto[] } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${photos.length} ingredient photos`);

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `You are a professional chef and nutritionist AI assistant. Analyze ingredient photos and provide:
1. A list of detected ingredients
2. 3-4 healthy recipe recommendations that can be made with those ingredients

For each recipe, include:
- Name and description
- Difficulty level (Easy/Medium/Hard)
- Prep and cook times
- Number of servings
- Health score (0-100, considering nutrition balance)
- Relevant tags (vegetarian, gluten-free, high-protein, etc.)
- Complete ingredient list with amounts and availability status
- Step-by-step instructions
- Detailed nutrition info per serving

Focus on healthy, balanced meals. If missing key ingredients, suggest substitutes.

Return JSON in this exact format:
{
  "ingredients": ["ingredient1", "ingredient2", ...],
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "difficulty": "Easy|Medium|Hard",
      "prepTime": 15,
      "cookTime": 30,
      "servings": 4,
      "healthScore": 85,
      "tags": ["healthy", "high-protein"],
      "ingredients": [
        {
          "name": "ingredient name",
          "amount": "1 cup",
          "available": true,
          "substitutes": ["substitute1", "substitute2"]
        }
      ],
      "instructions": ["Step 1", "Step 2"],
      "nutrition": {
        "calories": 320,
        "protein": 25,
        "carbs": 35,
        "fat": 12,
        "fiber": 8
      }
    }
  ]
}`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze these ingredient photos and recommend healthy recipes I can make:'
          },
          ...photos.map(photo => ({
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${photo.base64}`,
              detail: 'high'
            }
          }))
        ]
      }
    ];

    console.log('Sending request to OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from OpenAI');

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid response format from OpenAI:', data);
      throw new Error('Invalid response from OpenAI');
    }

    let analysisResult;
    try {
      // Try to parse the JSON response
      const content = data.choices[0].message.content;
      console.log('Raw OpenAI response:', content);
      
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      
      analysisResult = JSON.parse(jsonString);
      console.log('Parsed analysis result:', analysisResult);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      
      // Fallback response
      analysisResult = {
        ingredients: ['Mixed ingredients detected'],
        recipes: [
          {
            name: 'Custom Healthy Bowl',
            description: 'A nutritious meal made with your available ingredients',
            difficulty: 'Easy',
            prepTime: 15,
            cookTime: 20,
            servings: 2,
            healthScore: 75,
            tags: ['healthy', 'custom'],
            ingredients: [
              {
                name: 'Your available ingredients',
                amount: 'as needed',
                available: true,
                substitutes: []
              }
            ],
            instructions: [
              'Prepare and clean your ingredients',
              'Cook according to ingredient requirements',
              'Combine in a balanced, nutritious way',
              'Season to taste and serve'
            ],
            nutrition: {
              calories: 350,
              protein: 20,
              carbs: 30,
              fat: 15,
              fiber: 8
            }
          }
        ]
      };
    }

    // Validate the structure
    if (!analysisResult.ingredients || !Array.isArray(analysisResult.ingredients)) {
      analysisResult.ingredients = ['Mixed ingredients'];
    }
    
    if (!analysisResult.recipes || !Array.isArray(analysisResult.recipes)) {
      analysisResult.recipes = [];
    }

    console.log(`Analysis complete: ${analysisResult.ingredients.length} ingredients, ${analysisResult.recipes.length} recipes`);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ingredient-recipe-analyzer function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze ingredients and generate recipes',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});