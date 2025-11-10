import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MenuItem {
  name: string;
  calories?: number;
  price?: number;
  description?: string;
  dietaryTags?: string[];
  healthScore?: number;
  confidence?: string;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, mode = 'analyze', message, conversationHistory = [] } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const systemPrompt = `You are a restaurant menu analysis AI assistant.

CORE CAPABILITIES:
1. Extract menu items with ALL visible information (name, price, calories, ingredients)
2. Calculate health scores (0-100) based on nutritional quality
3. Provide personalized recommendations and answer questions about menu items

MENU ANALYSIS INSTRUCTIONS:
- Extract EVERY menu item visible in the image
- For each item, identify:
  * Item name (exactly as shown)
  * Price (if visible, including $ or other currency)
  * Calories (if listed, note if it's per serving or total)
  * Description/ingredients (if provided)
  * Dietary indicators (V=vegan, GF=gluten-free, vegetarian symbols, etc.)
  
CALORIE ESTIMATION (when not listed):
- Use dish type, cooking method, and typical portion sizes
- Mark estimates with confidence level:
  * "confirmed" - calories shown on menu
  * "likely" - strong evidence based on standard recipes
  * "estimated" - educated guess based on similar dishes

HEALTH SCORE CALCULATION (0-100):
- 80-100: Lean protein, vegetables, whole grains, grilled/baked
- 60-79: Moderate calories, balanced macros, some processing
- 40-59: Higher calories, fried foods, refined carbs
- 0-39: Very high calories, heavily processed, poor nutritional balance

Factors:
- Preparation method (grilled/baked +20, fried -20)
- Ingredients quality (whole foods +15, processed -15)
- Portion size (reasonable +10, excessive -10)
- Macronutrient balance (balanced +15, imbalanced -10)
- Added sugars/sodium (minimal +10, high -15)

VALUE SCORE (when prices available):
- Formula: (Health Score / Price) * 10
- Best value = highest score per dollar spent

DIETARY TAGS:
- Identify: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Keto, Low-Carb, High-Protein
- Look for symbols, indicators, or ingredient clues

RESPONSE FORMAT FOR ANALYSIS:
Return JSON matching this structure:
{
  "restaurantName": "Name if visible, otherwise null",
  "menuItems": [
    {
      "name": "Item Name",
      "calories": 450,
      "price": 12.99,
      "description": "Brief description",
      "dietaryTags": ["Gluten-Free", "High-Protein"],
      "healthScore": 75,
      "confidence": "confirmed" | "likely" | "estimated",
      "macros": {
        "protein": 30,
        "carbs": 25,
        "fat": 15
      }
    }
  ],
  "recommendations": {
    "healthiest": [/* top 3 healthiest items */],
    "bestValue": [/* top 3 best value items if prices available */]
  },
  "insights": [
    "This menu offers 5 items under 500 calories",
    "The grilled chicken options provide the best protein-to-calorie ratio",
    "3 vegan options available"
  ]
}

CHATBOT MODE:
- When user asks questions, reference specific menu items
- Compare items when asked ("X vs Y")
- Provide reasoning for recommendations
- Be concise but informative
- Mention calories, macros, and health scores when relevant
- Suggest modifications ("ask for grilled instead of fried")

QUICK ACTION RESPONSES:
- "Healthiest option": Recommend top 3, explain why (prep method, macros, ingredients)
- "Lowest calorie": List top 3 with exact calories
- "Vegan options": List all plant-based items
- "Gluten-free": List GF items or those that can be modified
- "High protein": List items with highest protein, show protein/calorie ratio
- "Low sugar drinks": List beverages with <5g sugar
- "Best value": Show items with best health-to-price ratio`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (mode === 'chat') {
      // Chatbot mode - include conversation history
      messages.push(...conversationHistory);
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ]
      });
    } else {
      // Analysis mode - analyze the menu
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this restaurant menu and extract all items with their details. Return the response in the specified JSON format.' },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ]
      });
    }

    console.log('Calling OpenAI with mode:', mode);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 2500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    if (mode === 'chat') {
      // Return chat response
      return new Response(
        JSON.stringify({ response: content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Parse and return menu analysis
      try {
        // Try to parse JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify(analysis),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // If no JSON found, return a structured error
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing menu analysis:', parseError);
        // Return a fallback structure
        return new Response(
          JSON.stringify({
            restaurantName: null,
            menuItems: [],
            recommendations: { healthiest: [], bestValue: [] },
            insights: ['Unable to parse menu. Please try a clearer image.']
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

  } catch (error) {
    console.error('Error in analyzeMenu function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to analyze menu'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
