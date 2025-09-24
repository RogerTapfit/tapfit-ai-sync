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
    const { message, currentAnalysis, foodItems } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `You are an AI nutrition assistant helping a user refine their food analysis. 

Current Analysis:
${JSON.stringify(currentAnalysis, null, 2)}

Current Food Items:
${JSON.stringify(foodItems, null, 2)}

User Message: "${message}"

Based on the user's message, provide a JSON response with:
{
  "response": "Your conversational response to the user",
  "updatedFoodItems": [Updated food items array if quantities/items changed, or null if no changes],
  "followUpQuestions": ["Array of 2-3 follow-up questions to ask", "to get more specific information"],
  "nutritionAdjustments": {
    "reason": "Why adjustments were made",
    "changes": ["List of specific changes made"]
  }
}

Instructions:
- If user mentions quantities (like "2 slices", "large portion", "small bowl"), update the food items proportionally
- If user mentions preparation methods (grilled vs fried), adjust calories and fat accordingly
- If user mentions ingredient substitutions (vegan cheese, plant-based milk), adjust nutrition values
- Ask specific follow-up questions to get more accurate data
- Be conversational and helpful
- Always explain your reasoning for any changes`;

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
            content: 'You are a helpful nutrition assistant that processes user clarifications about their food to provide more accurate nutritional information.' 
          },
          { 
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const aiData = await response.json();
    
    if (!aiData.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    let result;
    try {
      let content = aiData.choices[0].message.content;
      
      // Handle markdown-wrapped JSON
      if (content.includes('```json')) {
        content = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (content.includes('```')) {
        content = content.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      content = content.trim();
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiData.choices[0].message.content);
      // Fallback response
      result = {
        response: "I understand you want to adjust the analysis. Could you be more specific about the quantities or preparation methods?",
        updatedFoodItems: null,
        followUpQuestions: [
          "How many servings did you have?",
          "What size was the portion?",
          "How was it prepared?"
        ]
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-chat-message function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble processing that. Could you try rephrasing your question?",
      followUpQuestions: ["What would you like to clarify about your meal?"]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});