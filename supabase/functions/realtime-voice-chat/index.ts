import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  // Get OpenAI API key
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  // Get avatar name from URL query parameter
  const url = new URL(req.url);
  const avatarName = url.searchParams.get('avatarName') || 'Tappy';
  console.log("Avatar name:", avatarName);

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let sessionActive = false;

  socket.onopen = async () => {
    try {
      console.log("Client WebSocket connected");
      
      // Connect to OpenAI Realtime API
      openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", {
        headers: {
          "Authorization": `Bearer ${openAIApiKey}`,
          "OpenAI-Beta": "realtime=v1"
        }
      });

      openAISocket.onopen = () => {
        console.log("Connected to OpenAI Realtime API");
        sessionActive = true;
      };

      openAISocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("OpenAI message:", data.type);

        // Send session.update after receiving session.created
        if (data.type === 'session.created') {
          const sessionUpdate = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: `You are ${avatarName}, an expert AI fitness coach for TapFit. You're knowledgeable, motivating, and personalized. Always refer to yourself as ${avatarName}.
              
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
              
              Always provide practical, evidence-based fitness advice tailored to the user's goals and experience level.`,
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              tools: [
                {
                  type: 'function',
                  name: 'get_nutrition_info',
                  description: 'Get nutrition information and advice for foods',
                  parameters: {
                    type: 'object',
                    properties: {
                      food_item: { type: 'string' }
                    },
                    required: ['food_item']
                  }
                }
              ],
              tool_choice: 'auto',
              temperature: 0.8,
              max_response_output_tokens: 'inf'
            }
          };
          
          openAISocket?.send(JSON.stringify(sessionUpdate));
        }

        // Forward all messages to client
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      openAISocket.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'error', message: 'OpenAI connection error' }));
        }
      };

      openAISocket.onclose = () => {
        console.log("OpenAI WebSocket closed");
        sessionActive = false;
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };

    } catch (error) {
      console.error("Error connecting to OpenAI:", error);
      socket.send(JSON.stringify({ type: 'error', message: 'Failed to connect to OpenAI' }));
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Client message:", data.type);
      
      // Forward client messages to OpenAI
      if (openAISocket && sessionActive && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      }
    } catch (error) {
      console.error("Error processing client message:", error);
    }
  };

  socket.onclose = () => {
    console.log("Client WebSocket closed");
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
  };

  return response;
});