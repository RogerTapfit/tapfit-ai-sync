import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile and recent workout data for context
    let userContext = "";
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('primary_goal, experience_level, weight_kg, height_cm')
        .eq('id', userId)
        .single();

      const { data: recentWorkouts } = await supabase
        .from('smart_pin_data')
        .select('muscle_group, weight, reps, sets, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (profile) {
        userContext = `\nUser Profile: Goal: ${profile.primary_goal}, Experience: ${profile.experience_level}, Weight: ${profile.weight_kg}kg, Height: ${profile.height_cm}cm`;
      }

      if (recentWorkouts && recentWorkouts.length > 0) {
        userContext += `\nRecent Workouts: ${recentWorkouts.map(w => 
          `${w.muscle_group}: ${w.weight}kg x ${w.reps} reps x ${w.sets} sets`
        ).join(', ')}`;
      }
    }

    const systemPrompt = `You are FitBot, an expert AI fitness coach for TapFit, a smart gym platform. You're knowledgeable, motivating, and personalized.

Key traits:
- Expert in exercise form, programming, nutrition, and injury prevention
- Motivational but realistic tone
- Give specific, actionable advice
- Reference TapFit features (smart pin data, tap coins, power levels)
- Keep responses concise but comprehensive
- Always prioritize safety

Specialties:
- Workout programming and exercise selection
- Form corrections and technique tips
- Nutrition and meal planning
- Recovery and injury prevention
- Goal setting and progress tracking
- Motivation and habit building

${userContext}

Always provide practical, evidence-based fitness advice tailored to the user's goals and experience level.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Fitness chat response generated successfully');

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
      response: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});