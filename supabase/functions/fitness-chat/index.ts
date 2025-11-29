import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { message, avatarName, conversationHistory } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const coachName = avatarName || 'Coach';
    
    // Build system prompt with coach personality
    const systemPrompt = `You are ${coachName}, an expert AI fitness coach for TapFit, a smart gym platform. You're knowledgeable, motivating, and personalized.

Key traits:
- Expert in exercise form, programming, nutrition, and injury prevention
- Motivational but realistic tone
- Give specific, actionable advice
- Keep responses concise (2-3 sentences max for conversational flow)
- Always prioritize safety
- Be encouraging and supportive

Specialties:
- Workout programming and exercise selection
- Form corrections and technique tips
- Nutrition and meal planning
- Recovery and injury prevention
- Goal setting and progress tracking
- Motivation and habit building

Always provide practical, evidence-based fitness advice. Keep your responses brief and conversational - you're having a voice chat, not writing an essay.`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log(`Fitness chat request from ${coachName}:`, message.substring(0, 50));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
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
          error: 'AI credits depleted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm having trouble responding. Please try again.";

    console.log('Fitness chat response generated:', aiResponse.substring(0, 50));

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fitness-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
