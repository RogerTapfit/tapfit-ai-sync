import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, userIntent } = await req.json();

    if (!imageBase64 || !userIntent) {
      throw new Error('Missing required parameters: imageBase64 and userIntent');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Analyzing shelf for intent:', userIntent);

    const systemPrompt = `You are a nutrition coach AI analyzing a shelf of food/drink products. 
Your job is to help users make the healthiest choice based on their specific needs.

Analyze the image and:
1. Identify ALL visible products (aim for at least 3-10 products)
2. Extract visible nutritional information from labels
3. Score each product's healthiness (1-10)
4. Score how well each matches the user's intent (1-10)
5. Recommend the BEST option with detailed reasoning

Focus on:
- Sugar content (lower is better for most goals)
- Artificial ingredients (fewer is better)
- Protein content (important for fitness goals)
- Calorie density
- Sodium levels
- Whole food vs processed

Be critical but helpful. If all options are poor, say so and explain why.`;

    const userPrompt = `User is looking for: "${userIntent}"

Please analyze this shelf photo and provide a JSON response with this EXACT structure:
{
  "total_analyzed": <number of products found>,
  "detected_products": [
    {
      "name": "Product Name",
      "brand": "Brand Name or null",
      "position": "top left/center/right, etc",
      "nutrition": {
        "calories": <number>,
        "protein": <number in grams>,
        "sugar": <number in grams>,
        "sodium": <number in mg or null>,
        "artificial_ingredients": <estimated count or null>
      },
      "health_score": <1-10>,
      "match_score": <1-10 how well it matches user intent>,
      "pros": ["list", "of", "positives"],
      "cons": ["list", "of", "negatives"]
    }
  ],
  "recommendation": {
    "name": "Best Product Name",
    "brand": "Brand or null",
    "position": "location on shelf",
    "nutrition": { same structure },
    "health_score": <1-10>,
    "match_score": <1-10>,
    "pros": ["reasons why it's good"],
    "cons": ["any drawbacks to note"],
    "why_best": "Detailed explanation of why this is the best choice for the user's intent",
    "comparison_to_alternatives": "Explain why other visible options are worse, be specific",
    "warnings": ["any concerns user should know"] or null,
    "better_alternatives_elsewhere": ["suggestions for better options not on this shelf"] or null
  }
}

IMPORTANT: 
- Provide actual nutritional numbers visible on labels
- If you can't see a number clearly, estimate reasonably or use null
- Be honest about limitations of options if all are poor
- Recommend the BEST option from what's visible, even if not ideal
- Be specific in comparisons (mention actual products by name)`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('OpenAI response:', content);

    // Extract JSON from response (handle markdown code blocks)
    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate structure
    if (!analysisResult.recommendation || !analysisResult.detected_products) {
      throw new Error('Invalid analysis result structure');
    }

    console.log('Analysis successful:', {
      total: analysisResult.total_analyzed,
      recommendation: analysisResult.recommendation.name
    });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyzeShelfChoice:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Check function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
