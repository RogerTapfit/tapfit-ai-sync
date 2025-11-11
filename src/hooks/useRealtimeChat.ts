import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface VoiceState {
  isRecording: boolean;
  isConnected: boolean;
  isAISpeaking: boolean;
  error: string | null;
  voiceName?: string;
  coachGender?: string;
}

export const useRealtimeChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isConnected: false,
    isAISpeaking: false,
    error: null,
    voiceName: undefined,
    coachGender: undefined
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTranscriptRef = useRef<string>('');

  const connect = useCallback(async (avatarName?: string, avatarId?: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Getting ElevenLabs session for avatar:", avatarName, avatarId);
        setVoiceState(prev => ({ ...prev, error: null }));

        // Get ElevenLabs session from edge function
        const { data: sessionData, error: sessionError } = await supabase.functions.invoke('elevenlabs-session', {
          body: { avatarName, avatarId }
        });

        if (sessionError || !sessionData) {
          throw new Error(`Failed to create ElevenLabs session: ${sessionError?.message || 'Unknown error'}`);
        }

        console.log("ElevenLabs session created:", sessionData);

        // Update voice state with coach details
        setVoiceState(prev => ({
          ...prev,
          voiceName: sessionData.voice_name,
          coachGender: sessionData.gender
        }));

        // Initialize audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        }

        // Connect to ElevenLabs WebSocket
        const wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=${sessionData.conversation_id}`;
        console.log("Connecting to ElevenLabs WebSocket");
        
        const timeout = setTimeout(() => {
          console.error("Connection timeout");
          setVoiceState(prev => ({ 
            ...prev, 
            error: 'Connection timeout', 
            isConnected: false 
          }));
          reject(new Error('Connection timeout'));
        }, 10000);

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("ElevenLabs WebSocket opened");
          clearTimeout(timeout);
          setVoiceState(prev => ({ ...prev, isConnected: true, error: null }));
          resolve();
        };

        wsRef.current.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("ElevenLabs message:", data.type);

            // Handle ElevenLabs conversation events
            if (data.type === 'conversation_initiation_metadata') {
              console.log("ElevenLabs conversation ready");
            } else if (data.type === 'audio') {
              // AI is speaking - ElevenLabs sends PCM audio
              setVoiceState(prev => ({ ...prev, isAISpeaking: true }));
              
              if (data.audio_event?.audio_base_64 && audioContextRef.current) {
                // Decode base64 PCM audio
                const binaryString = atob(data.audio_event.audio_base_64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Play audio (16-bit PCM at 16kHz)
                const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start(0);
              }
            } else if (data.type === 'agent_response') {
              // AI finished speaking
              setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
            } else if (data.type === 'user_transcript') {
              // Update transcript in real-time
              if (data.user_transcription_event?.user_transcript) {
                currentTranscriptRef.current = data.user_transcription_event.user_transcript;
              }
            } else if (data.type === 'agent_response_correction' || data.type === 'agent_response') {
              // Update AI response
              if (data.agent_response_event?.agent_response) {
                currentTranscriptRef.current = data.agent_response_event.agent_response;
              }
            } else if (data.type === 'user_transcript_done') {
              // Finalize user message
              const userText = currentTranscriptRef.current;
              if (userText) {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  type: 'user',
                  content: userText,
                  timestamp: new Date()
                }]);
                currentTranscriptRef.current = '';
              }
            } else if (data.type === 'agent_response_done') {
              // Finalize AI message
              const aiText = currentTranscriptRef.current;
              if (aiText) {
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  type: 'assistant',
                  content: aiText,
                  timestamp: new Date()
                }]);
                currentTranscriptRef.current = '';
              }
            } else if (data.type === 'error') {
              console.error("ElevenLabs error event:", data);
              setVoiceState(prev => ({ ...prev, error: data.message || 'Unknown error' }));
            }
          } catch (error) {
            console.error("Error parsing ElevenLabs message:", error);
          }
        };

        wsRef.current.onerror = (error) => {
          clearTimeout(timeout);
          console.error("WebSocket connection error:", error);
          setVoiceState(prev => ({ 
            ...prev, 
            error: 'Failed to connect to voice chat. Please try again.', 
            isConnected: false 
          }));
          reject(new Error('WebSocket connection failed'));
        };

        wsRef.current.onclose = () => {
          clearTimeout(timeout);
          console.log("WebSocket closed");
          setVoiceState(prev => ({ ...prev, isConnected: false, isRecording: false }));
        };

      } catch (error) {
        console.error("Error connecting:", error);
        setVoiceState(prev => ({ ...prev, error: 'Failed to connect' }));
        reject(error);
      }
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log("Starting microphone for ElevenLabs...");
      
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('Not connected to voice chat');
      }

      // Request microphone access with proper constraints for ElevenLabs
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log("Microphone access granted");
      setVoiceState(prev => ({ ...prev, isRecording: true }));
      
      // ElevenLabs handles audio streaming automatically via WebRTC
      // No need to manually send audio chunks
      
    } catch (error) {
      console.error("Error starting recording:", error);
      setVoiceState(prev => ({ ...prev, error: 'Microphone access failed' }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log("Stopping recording...");
    setVoiceState(prev => ({ ...prev, isRecording: false }));
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user', 
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text
          }
        ]
      }
    };

    wsRef.current.send(JSON.stringify(event));
    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  }, []);

  const disconnect = useCallback(() => {
    console.log("Disconnecting...");
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setVoiceState({
      isRecording: false,
      isConnected: false,
      isAISpeaking: false,
      error: null,
      voiceName: undefined,
      coachGender: undefined
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    voiceState,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
    clearMessages: () => setMessages([])
  };
};