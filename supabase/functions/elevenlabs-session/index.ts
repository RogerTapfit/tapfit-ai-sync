import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice ID mapping by gender
const VOICE_MAP: Record<string, string> = {
  'female': '9BWtsMINqrJLrRacOk9x', // Aria
  'male': 'CwhRBWXzGAHq8TQ4Fs17',   // Roger
  'neutral': 'SAz9YHcvj6GT2YYXdXww' // River
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY is not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { avatarId, avatarName } = await req.json();
    console.log('Creating ElevenLabs session for avatar:', avatarName, avatarId);

    // Fetch avatar gender from database
    let gender = 'neutral';
    let coachName = avatarName || 'Coach';
    
    if (avatarId) {
      const { data: avatar, error } = await supabase
        .from('avatars')
        .select('gender, name')
        .eq('id', avatarId)
        .single();
      
      if (!error && avatar) {
        gender = avatar.gender || 'neutral';
        coachName = avatar.name || coachName;
        console.log('Found avatar with gender:', gender, 'name:', coachName);
      }
    } else if (avatarName) {
      // Fallback: try to fetch by name
      const { data: avatar, error } = await supabase
        .from('avatars')
        .select('gender, name')
        .ilike('name', avatarName)
        .single();
      
      if (!error && avatar) {
        gender = avatar.gender || 'neutral';
        coachName = avatar.name || coachName;
        console.log('Found avatar by name with gender:', gender);
      }
    }

    // Get voice ID for gender
    const voiceId = VOICE_MAP[gender] || VOICE_MAP['neutral'];
    console.log('Selected voice ID:', voiceId, 'for gender:', gender);

    // Create ElevenLabs agent configuration
    const agentConfig = {
      name: `${coachName} - TapFit AI Coach`,
      first_message: `Hi! I'm ${coachName}, your AI fitness companion. Ready to help with workouts, nutrition, and motivation!`,
      prompt: {
        prompt: `You are ${coachName}, an expert AI fitness coach for TapFit. You're knowledgeable, motivating, and personalized.
        
Key traits:
- Expert in exercise form, programming, nutrition, and injury prevention
- Motivational but realistic tone
- Give specific, actionable advice
- Reference TapFit features (smart pin data, tap coins, power levels)
- Keep responses concise but comprehensive (2-3 sentences typically)
- Always prioritize safety
        
Specialties:
- Workout programming and exercise selection
- Form corrections and technique tips
- Nutrition and meal planning
- Recovery and injury prevention
- Goal setting and progress tracking
- Motivation and habit building
        
Always provide practical, evidence-based fitness advice tailored to the user's goals and experience level.`
      },
      language: "en",
      model: "eleven_turbo_v2_5",
      voice: {
        voice_id: voiceId
      },
      conversation_config: {
        asr: {
          quality: "high",
          user_input_audio_format: "pcm_16000"
        },
        tts: {
          voice_id: voiceId,
          model_id: "eleven_turbo_v2_5",
          optimize_streaming_latency: 3,
          output_format: "pcm_16000"
        }
      }
    };

    console.log('Creating ElevenLabs conversation with agent config');

    // Get signed URL from ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/convai/conversation', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent: agentConfig })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('ElevenLabs conversation created successfully');

    return new Response(JSON.stringify({ 
      conversation_id: data.conversation_id,
      agent_id: data.agent_id,
      voice_name: Object.entries(VOICE_MAP).find(([_, v]) => v === voiceId)?.[0] || 'River',
      coach_name: coachName,
      gender: gender
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating ElevenLabs session:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
