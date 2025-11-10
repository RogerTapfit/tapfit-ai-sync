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
    
    // Support both single image and multiple images
    const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64];

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

MULTI-IMAGE HANDLING:
- When multiple images provided, they are parts of the same menu
- Combine all items from all images into a single menuItems array
- Avoid duplicates - if same item appears in multiple photos, list it once
- Use the clearest image for extracting each item's details

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
          ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
        ]
      });
    } else {
      // Analysis mode - analyze the menu
      const analysisText = images.length > 1 
        ? `Analyze these ${images.length} restaurant menu photos. They are parts of the same menu. Combine all items from all images into a single comprehensive analysis. Avoid duplicates - if the same item appears in multiple photos, list it once. Return the response in the specified JSON format.`
        : 'Analyze this restaurant menu and extract all items with their details. Return the response in the specified JSON format.';
      
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: analysisText },
          ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
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
      // Parse and return menu analysis with multiple parsing strategies
      let analysis;
      
      try {
        // Strategy 1: Direct JSON parse
        analysis = JSON.parse(content);
      } catch {
        try {
          // Strategy 2: Extract from markdown code blocks
          const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (codeBlockMatch) {
            analysis = JSON.parse(codeBlockMatch[1]);
          } else {
            // Strategy 3: Find JSON objects and try parsing each
            const jsonMatches = content.match(/\{[\s\S]*?\}/g);
            if (jsonMatches) {
              // Try each match, starting from the last (most complete)
              for (let i = jsonMatches.length - 1; i >= 0; i--) {
                try {
                  const parsed = JSON.parse(jsonMatches[i]);
                  if (parsed.menuItems) {
                    analysis = parsed;
                    break;
                  }
                } catch {
                  continue;
                }
              }
            }
          }
        } catch (e) {
          console.error('All parsing strategies failed. Raw response:', content.substring(0, 500));
        }
      }

      if (!analysis || !analysis.menuItems) {
        console.error('Failed to extract menu analysis. Raw response:', content.substring(0, 500));
        return new Response(
          JSON.stringify({
            restaurantName: null,
            menuItems: [],
            recommendations: { healthiest: [], bestValue: [] },
            insights: ['Could not extract menu items from the analysis. The image may need better lighting or focus.']
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(analysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
