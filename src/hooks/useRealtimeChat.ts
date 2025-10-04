import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioRecorder, encodeAudioForAPI, playAudioData } from '@/utils/RealtimeAudio';

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
}

export const useRealtimeChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isConnected: false,
    isAISpeaking: false,
    error: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTranscriptRef = useRef<string>('');

  // Get the correct WebSocket URL for the project
  const getWebSocketURL = (avatarName?: string) => {
    // Use the correct Supabase Edge Functions WebSocket URL format
    const url = `wss://pbrayxmqzdxsmhqmzygc.functions.supabase.co/functions/v1/realtime-voice-chat`;
    return avatarName ? `${url}?avatarName=${encodeURIComponent(avatarName)}` : url;
  };
  const connect = useCallback(async (avatarName?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("Connecting to voice chat...");
        
        // Initialize audio context
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }

        // Connect WebSocket
        const wsUrl = getWebSocketURL(avatarName);
        console.log("Connecting to:", wsUrl, "with avatar:", avatarName);
        
        // Set up connection timeout
        const timeout = setTimeout(() => {
          console.error("Connection timeout");
          setVoiceState(prev => ({ 
            ...prev, 
            error: 'Connection timeout. Please check your internet connection.', 
            isConnected: false 
          }));
          reject(new Error('Connection timeout'));
        }, 10000);

        let serverReadyReceived = false;

        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("WebSocket opened, waiting for server.ready...");
          
          // Wait for server.ready with fallback
          setTimeout(() => {
            if (!serverReadyReceived) {
              console.log("server.ready not received, proceeding anyway");
              clearTimeout(timeout);
              setVoiceState(prev => ({ ...prev, isConnected: true, error: null }));
              resolve();
            }
          }, 100);
        };

        wsRef.current.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Received message:", data.type);

            switch (data.type) {
              case 'server.ready':
                console.log("Server ready signal received");
                serverReadyReceived = true;
                clearTimeout(timeout);
                setVoiceState(prev => ({ ...prev, isConnected: true, error: null }));
                resolve();
                break;

              case 'response.audio.delta':
                // Play audio chunk
                if (data.delta && audioContextRef.current) {
                  const binaryString = atob(data.delta);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  await playAudioData(audioContextRef.current, bytes);
                }
                break;

              case 'response.audio.done':
                setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
                break;

              case 'response.audio_transcript.delta':
                if (data.delta) {
                  currentTranscriptRef.current += data.delta;
                }
                break;

              case 'response.audio_transcript.done':
                if (currentTranscriptRef.current.trim()) {
                  const newMessage: Message = {
                    id: Date.now().toString(),
                    type: 'assistant',
                    content: currentTranscriptRef.current.trim(),
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, newMessage]);
                  currentTranscriptRef.current = '';
                }
                break;

              case 'input_audio_buffer.speech_started':
                console.log("User started speaking");
                break;

              case 'input_audio_buffer.speech_stopped':
                console.log("User stopped speaking");
                break;

              case 'response.created':
                setVoiceState(prev => ({ ...prev, isAISpeaking: true }));
                break;

              case 'error':
                console.error("WebSocket error:", data.message);
                setVoiceState(prev => ({ ...prev, error: data.message }));
                break;
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
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
      console.log("Starting recording...");
      
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('Not connected to voice chat');
      }

      // Initialize recorder
      recorderRef.current = new AudioRecorder((audioData) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const encodedAudio = encodeAudioForAPI(audioData);
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encodedAudio
          }));
        }
      });

      await recorderRef.current.start();
      setVoiceState(prev => ({ ...prev, isRecording: true }));
      
    } catch (error) {
      console.error("Error starting recording:", error);
      setVoiceState(prev => ({ ...prev, error: 'Microphone access failed' }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    console.log("Stopping recording...");
    
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
    // Force commit and response when stopping manually
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Sending commit and response.create");
      wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
    
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
    
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    
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
      error: null
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