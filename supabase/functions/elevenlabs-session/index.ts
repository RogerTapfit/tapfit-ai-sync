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

    // Agent IDs for each gender - these must be created in ElevenLabs UI
    const AGENT_ID_FEMALE = Deno.env.get('ELEVEN_LABS_AGENT_ID_FEMALE');
    const AGENT_ID_MALE = Deno.env.get('ELEVEN_LABS_AGENT_ID_MALE');
    const AGENT_ID_NEUTRAL = Deno.env.get('ELEVEN_LABS_AGENT_ID_NEUTRAL');

    if (!AGENT_ID_FEMALE || !AGENT_ID_MALE || !AGENT_ID_NEUTRAL) {
      throw new Error('ElevenLabs agent IDs not configured. Please create agents in ElevenLabs UI and add ELEVEN_LABS_AGENT_ID_FEMALE, ELEVEN_LABS_AGENT_ID_MALE, and ELEVEN_LABS_AGENT_ID_NEUTRAL secrets.');
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

    // Get agent ID for gender
    const agentIdMap: Record<string, string> = {
      'female': AGENT_ID_FEMALE,
      'male': AGENT_ID_MALE,
      'neutral': AGENT_ID_NEUTRAL
    };
    
    const agentId = agentIdMap[gender] || AGENT_ID_NEUTRAL;
    const voiceId = VOICE_MAP[gender] || VOICE_MAP['neutral'];
    console.log('Selected agent ID:', agentId, 'voice ID:', voiceId, 'for gender:', gender);

    // Get signed URL from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVEN_LABS_API_KEY,
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('ElevenLabs signed URL retrieved successfully');

    return new Response(JSON.stringify({ 
      signed_url: data.signed_url,
      agent_id: agentId,
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
