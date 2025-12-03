import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getVoiceForGender } from '@/utils/elevenLabsVoices';

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

// Speech Recognition types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export const useRealtimeChat = (userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isConnected: false,
    isAISpeaking: false,
    error: null,
    voiceName: undefined,
    coachGender: undefined
  });

  const avatarNameRef = useRef<string>('Coach');
  const avatarGenderRef = useRef<string>('neutral');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isProcessingRef = useRef(false);
  const shouldListenRef = useRef(false); // Track if we want continuous listening
  const isAISpeakingRef = useRef(false); // Track AI speaking state without stale closures
  const startRecordingRef = useRef<() => Promise<void>>(); // Ref to avoid stale closure in speakText
  const userIdRef = useRef<string | undefined>(userId); // Track userId for metrics access

  // Keep refs in sync with props/state
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    isAISpeakingRef.current = voiceState.isAISpeaking;
  }, [voiceState.isAISpeaking]);

  // Text-to-speech using ElevenLabs
  const speakText = useCallback(async (text: string) => {
    if (!text) return;
    
    // Pause recognition while AI speaks to prevent echo
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      console.log('🎤 Pausing listening while AI speaks...');
    }
    
    setVoiceState(prev => ({ ...prev, isAISpeaking: true }));
    
    try {
      const voice = getVoiceForGender(avatarGenderRef.current);
      console.log(`🔊 Speaking with ${voice.name} voice (${avatarGenderRef.current}):`, text.substring(0, 50));
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voice: voice.id,
          gender: avatarGenderRef.current
        }
      });

      if (error) {
        console.error('TTS error:', error);
        setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
        // Resume listening after error
        if (shouldListenRef.current) {
          startRecordingRef.current?.();
        }
        return;
      }

      if (data?.audioContent) {
        // Play audio
        const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
        audioRef.current = audio;
        
        audio.onended = () => {
          setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
          // Resume listening after AI finishes speaking
          if (shouldListenRef.current) {
            console.log('🎤 Resuming listening after AI finished...');
            startRecordingRef.current?.();
          }
        };
        
        audio.onerror = () => {
          console.error('Audio playback error');
          setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
          // Resume listening after error
          if (shouldListenRef.current) {
            startRecordingRef.current?.();
          }
        };
        
        try {
          await audio.play();
        } catch (playError) {
          console.error('Audio playback blocked or failed:', playError);
          // If autoplay blocked, still set speaking to false and resume listening
          setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
          if (shouldListenRef.current) {
            setTimeout(() => {
              startRecordingRef.current?.();
            }, 100);
          }
        }
      } else {
        setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
        // Resume listening if no audio
        if (shouldListenRef.current) {
          startRecordingRef.current?.();
        }
      }
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
      // Resume listening after error
      if (shouldListenRef.current) {
        startRecordingRef.current?.();
      }
    }
  }, []);

  // Send message to AI and get response
  const processMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isProcessingRef.current) return;
    
    isProcessingRef.current = true;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userText,
      timestamp: new Date()
    };
    
    setMessages(prev => {
      const updated = [...prev, userMessage];
      
      // Call AI with conversation history and user context for metrics
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke('fitness-chat', {
            body: {
              message: userText,
              avatarName: avatarNameRef.current,
              conversationHistory: updated.slice(-10), // Last 10 messages for context
              userId: userIdRef.current, // Pass userId for metrics access
              includeInjuryContext: true, // Include injury prevention data
              includeMoodContext: true // Include mood/readiness data
            }
          });

          if (error) {
            console.error('Chat error:', error);
            setVoiceState(prev => ({ ...prev, error: 'Failed to get response' }));
            isProcessingRef.current = false;
            return;
          }

          const aiResponse = data?.response || "I couldn't process that. Please try again.";
          
          // Add AI message
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: aiResponse,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
          
          // Speak the response
          await speakText(aiResponse);
          
        } catch (err) {
          console.error('Error processing message:', err);
          setVoiceState(prev => ({ ...prev, error: 'Connection error' }));
        } finally {
          isProcessingRef.current = false;
        }
      })();
      
      return updated;
    });
  }, [speakText]);

  // Connect (initialize voice chat session)
  const connect = useCallback(async (avatarName?: string, avatarId?: string): Promise<void> => {
    try {
      console.log("Initializing voice chat for:", avatarName);
      setVoiceState(prev => ({ ...prev, error: null }));

      // Fetch avatar gender from database if avatarId provided
      let gender = 'neutral';
      if (avatarId) {
        const { data: avatar } = await supabase
          .from('avatars')
          .select('gender, name')
          .eq('id', avatarId)
          .single();
        
        if (avatar) {
          gender = avatar.gender || 'neutral';
          avatarNameRef.current = avatar.name || avatarName || 'Coach';
        }
      } else if (avatarName) {
        const { data: avatar } = await supabase
          .from('avatars')
          .select('gender, name')
          .ilike('name', avatarName)
          .single();
        
        if (avatar) {
          gender = avatar.gender || 'neutral';
        }
        avatarNameRef.current = avatarName;
      }

      avatarGenderRef.current = gender;
      const voice = getVoiceForGender(gender);

      console.log(`🎤 Voice Chat Ready: ${avatarNameRef.current} (${gender}) using ${voice.name} voice`);

      setVoiceState(prev => ({
        ...prev,
        isConnected: true,
        voiceName: voice.name,
        coachGender: gender
      }));

    } catch (error) {
      console.error("Error initializing chat:", error);
      setVoiceState(prev => ({ ...prev, error: 'Failed to initialize chat' }));
      throw error;
    }
  }, []);

  // Start voice recording using Web Speech API
  const startRecording = useCallback(async () => {
    try {
      shouldListenRef.current = true; // Mark that we want continuous listening
      
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Speech recognition not supported in this browser' 
        }));
        return;
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true; // Enable continuous recognition
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          console.log('🎤 Speech recognized:', finalTranscript);
          processMessage(finalTranscript);
        }
      };

      recognition.onerror = (event: { error: string }) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          setVoiceState(prev => ({ ...prev, error: `Speech error: ${event.error}` }));
        }
        setVoiceState(prev => ({ ...prev, isRecording: false }));
      };

      recognition.onend = () => {
        console.log('🎤 Recognition ended, shouldListen:', shouldListenRef.current, 'isAISpeaking:', isAISpeakingRef.current);
        // Auto-restart if chat is connected and not speaking (use ref to avoid stale closure)
        if (shouldListenRef.current && !isAISpeakingRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
              console.log('🎤 Auto-restarted listening...');
            } catch (e) {
              console.log('Could not restart recognition:', e);
              setVoiceState(prev => ({ ...prev, isRecording: false }));
            }
          }, 300); // Small delay before restarting
        } else {
          setVoiceState(prev => ({ ...prev, isRecording: false }));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      
      setVoiceState(prev => ({ ...prev, isRecording: true, error: null }));
      console.log('🎤 Recording started (continuous mode)...');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Failed to start recording',
        isRecording: false 
      }));
    }
  }, [processMessage]);

  // Keep startRecordingRef updated with the latest startRecording function
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    shouldListenRef.current = false; // Mark that we want to stop continuous listening
    if (recognitionRef.current) {
      recognitionRef.current.abort(); // Use abort() to prevent auto-restart
      recognitionRef.current = null;
    }
    setVoiceState(prev => ({ ...prev, isRecording: false }));
    console.log('🎤 Recording stopped');
  }, []);

  // Send text message
  const sendTextMessage = useCallback((text: string) => {
    if (!voiceState.isConnected) {
      console.error("Not connected");
      return;
    }
    processMessage(text);
  }, [voiceState.isConnected, processMessage]);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log("Disconnecting voice chat...");
    
    shouldListenRef.current = false; // Stop continuous listening
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setVoiceState({
      isRecording: false,
      isConnected: false,
      isAISpeaking: false,
      error: null,
      voiceName: undefined,
      coachGender: undefined
    });
    
    setMessages([]);
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
