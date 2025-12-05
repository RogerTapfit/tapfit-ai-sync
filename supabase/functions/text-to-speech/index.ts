import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OpenAI voice mapping
const openaiVoices: Record<string, string> = {
  'Aria': 'nova',
  'Roger': 'onyx',
  'River': 'alloy',
  'Sarah': 'shimmer',
  'Laura': 'fable',
};

// Try ElevenLabs first, fallback to OpenAI
async function generateSpeechElevenLabs(text: string, voiceId: string, apiKey: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ElevenLabs API error:', error);
      // Check for quota exceeded or payment required
      if (response.status === 401 || response.status === 402 || error.includes('quota') || error.includes('exceeded')) {
        console.log('ElevenLabs quota exceeded, will try OpenAI fallback');
        return null;
      }
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('ElevenLabs request failed:', error);
    return null;
  }
}

async function generateSpeechOpenAI(text: string, voice: string, apiKey: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`Trying OpenAI TTS with voice: ${voice}`);
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS API error:', error);
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('OpenAI TTS request failed:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice, gender } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const ELEVEN_LABS_API_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    // Get voice ID for ElevenLabs
    const voiceIds: Record<string, string> = {
      'Aria': '9BWtsMINqrJLrRacOk9x',
      'Roger': 'CwhRBWXzGAHq8TQ4Fs17',
      'River': 'SAz9YHcvj6GT2YYXdXww',
      'Sarah': 'EXAVITQu4vr4xnSDxMaL',
      'Laura': 'FGY2WhTYpPnrIDTdsKH5',
    };

    // Map gender to voice if provided
    const genderVoiceMap: Record<string, string> = {
      'female': 'Aria',
      'male': 'Roger',
      'neutral': 'River'
    };

    const selectedVoice = gender ? (genderVoiceMap[gender] || 'River') : (voice || 'Aria');
    const elevenLabsVoiceId = voiceIds[selectedVoice] || voiceIds['Aria'];
    const openaiVoice = openaiVoices[selectedVoice] || 'alloy';

    console.log(`Generating speech for text: "${text.substring(0, 50)}..." with voice: ${selectedVoice}`);

    let arrayBuffer: ArrayBuffer | null = null;

    // Try ElevenLabs first if API key is available
    if (ELEVEN_LABS_API_KEY) {
      arrayBuffer = await generateSpeechElevenLabs(text, elevenLabsVoiceId, ELEVEN_LABS_API_KEY);
    }

    // Fallback to OpenAI if ElevenLabs failed or not available
    if (!arrayBuffer && OPENAI_API_KEY) {
      console.log('Falling back to OpenAI TTS...');
      arrayBuffer = await generateSpeechOpenAI(text, openaiVoice, OPENAI_API_KEY);
    }

    if (!arrayBuffer) {
      throw new Error('Failed to generate speech with any available provider. Please check API keys and quotas.');
    }

    // Convert ArrayBuffer to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(arrayBuffer);
    const chunkSize = 8192;
    let binaryString = '';

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }

    const base64Audio = btoa(binaryString);

    console.log(`Speech generated successfully, size: ${arrayBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in text-to-speech function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
