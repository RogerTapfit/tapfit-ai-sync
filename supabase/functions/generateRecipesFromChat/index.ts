import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    if (!lovableApiKey) {
      throw new Error('Lovable API key not configured');
    }

    if (!messages || messages.length === 0) {
      throw new Error('No messages provided');
    }

    console.log('Chat request with', messages.length, 'messages', context?.mode ? `(${context.mode} mode)` : '');

    // Determine system prompt based on mode
    const systemPrompt = context?.mode === 'recipeContext' 
      ? `You are a helpful cooking assistant specializing in this recipe: "${context.recipe?.name}".

Recipe context:
- Ingredients: ${context.recipe?.ingredients?.map(i => `${i.amount} ${i.name}`).join(', ') || 'N/A'}
- Steps: ${context.recipe?.instructions?.length || 0} steps
- Servings: ${context.recipe?.servings || 1}
- Tags: ${context.recipe?.tags?.join(', ') || 'N/A'}

Your role:
1. Answer questions SPECIFICALLY about THIS recipe
2. Suggest ingredient substitutions with detailed reasoning
3. Explain cooking techniques mentioned in the instructions
4. Help with scaling, prep-ahead, storage, and reheating
5. Troubleshoot common cooking issues
6. Suggest modifications (dietary preferences, flavor adjustments, difficulty)

Guidelines:
- Be concise but thorough
- Reference specific ingredients/steps from the recipe
- Give practical, actionable advice
- If unsure, acknowledge limitations honestly
- NEVER generate new recipes - focus only on helping with THIS recipe
- Format your responses clearly with bullets or numbered lists when appropriate`
      : `You are a friendly, professional chef assistant helping users discover delicious recipes.

Your responsibilities:
1. Have natural conversations about cooking, recipes, and meal planning
2. Understand user preferences: dietary restrictions, cuisine types, time constraints, cooking skills
3. Generate detailed recipe recommendations based on conversation context
4. Suggest creative alternatives and variations
5. Provide cooking tips and ingredient substitutions

When generating recipes, return them in this JSON structure within your response:
{
  "reply": "Your conversational response text",
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "difficulty": "Easy|Medium|Hard",
      "prepTime": 15,
      "cookTime": 20,
      "servings": 1,
      "healthScore": 85,
      "tags": ["tag1", "tag2"],
      "ingredients": [
        {
          "name": "ingredient name",
          "amount": "1/2 cup",
          "available": true,
          "substitutes": ["alternative"]
        }
      ],
      "instructions": ["Step 1", "Step 2"]
    }
  ]
}

Guidelines:
- ALL recipes must be sized for 1 serving (nutrition will be calculated automatically)
- Be conversational and encouraging
- Ask clarifying questions when needed
- Offer 2-3 recipe options when appropriate
- Consider user's dietary restrictions from context: ${context?.dietaryRestrictions || 'none specified'}
- Preferred cuisine: ${context?.preferredCuisine || 'any'}
- Focus on healthy, balanced meals
- If user asks general questions, chat naturally without forcing recipe generation
- Only generate recipes when user explicitly wants recipe suggestions`;

    // In recipe context mode, we don't want recipe generation in the response
    const responseInstructions = context?.mode === 'recipeContext'
      ? 'Respond conversationally with helpful advice. Do NOT return any JSON or recipe structures.'
      : '';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt + (responseInstructions ? '\n\n' + responseInstructions : '') },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI service requires payment. Please contact support.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const aiData = await response.json();
    
    if (!aiData.choices?.[0]?.message?.content) {
      console.error('Invalid AI response:', aiData);
      throw new Error('Invalid response from AI');
    }

    let content = aiData.choices[0].message.content.trim();
    let result: any = { reply: content, recipes: [] };

    // In recipe context mode, return pure text responses
    if (context?.mode === 'recipeContext') {
      console.log('Recipe context response generated');
      return new Response(JSON.stringify({ reply: content, recipes: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try to extract JSON if present (only in discovery mode)
    try {
      // Look for JSON block in markdown
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[1]);
        }
      } else if (content.includes('{') && content.includes('}')) {
        // Try to parse the whole content as JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (parseError) {
      console.log('No JSON found in response, treating as pure text');
      // Keep as text-only response
    }

    console.log('Generated response with', result.recipes?.length || 0, 'recipes');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generateRecipesFromChat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      reply: 'Sorry, I encountered an error. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

