import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getVoiceForGender } from '@/utils/elevenLabsVoices';
import { toast } from 'sonner';

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
  const shouldListenRef = useRef(false);
  const isAISpeakingRef = useRef(false);
  const startRecordingRef = useRef<() => Promise<void>>();
  const userIdRef = useRef<string | undefined>(userId);
  const audioUnlockedRef = useRef(false);

  // Keep refs in sync with props/state
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    isAISpeakingRef.current = voiceState.isAISpeaking;
  }, [voiceState.isAISpeaking]);

  // Audio context for reliable playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Unlock audio on user interaction (required for autoplay policy)
  const unlockAudio = useCallback(async () => {
    if (audioUnlockedRef.current) return;
    
    try {
      // Create persistent audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Play a silent buffer to fully unlock
      const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
      
      // Also create and play a silent HTML audio element
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
      silentAudio.volume = 0.01;
      await silentAudio.play().catch(() => {});
      
      audioUnlockedRef.current = true;
      console.log('🔊 Audio fully unlocked');
    } catch (e) {
      console.log('🔊 Audio unlock attempt:', e);
    }
  }, []);

  // Strip markdown formatting for natural speech
  const stripMarkdown = (text: string): string => {
    return text
      // Remove bold/italic: **text**, __text__, *text*, _text_
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove headers: # text, ## text, etc.
      .replace(/^#{1,6}\s+/gm, '')
      // Remove code blocks: ```code```
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code: `code`
      .replace(/`([^`]+)`/g, '$1')
      // Remove links: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove strikethrough: ~~text~~
      .replace(/~~([^~]+)~~/g, '$1')
      // Remove bullet points at start of lines
      .replace(/^[\s]*[-*+]\s+/gm, '')
      // Remove numbered lists
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Text-to-speech using ElevenLabs
  const speakText = useCallback(async (text: string) => {
    if (!text) return;
    
    // Strip markdown for natural speech
    const cleanText = stripMarkdown(text);
    
    // Pause recognition while AI speaks to prevent echo
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      console.log('🎤 Pausing listening while AI speaks...');
    }
    
    setVoiceState(prev => ({ ...prev, isAISpeaking: true }));
    
    try {
      const voice = getVoiceForGender(avatarGenderRef.current);
      console.log(`🔊 Speaking with ${voice.name} voice (${avatarGenderRef.current}):`, cleanText.substring(0, 50));
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: cleanText,  // Use cleaned text without markdown
          voice: voice.name,  // Send voice name (e.g., 'Aria'), not ID
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
        console.log('🔊 TTS audio received, length:', data.audioContent.length);
        
        // Try AudioContext playback first (more reliable)
        let played = false;
        
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          try {
            // Decode and play via AudioContext
            const binaryString = atob(data.audioContent);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            
            // Store source for potential stopping
            currentSourceRef.current = source;
            
            source.onended = () => {
              console.log('🔊 AudioContext playback completed');
              currentSourceRef.current = null;
              setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
              if (shouldListenRef.current) {
                console.log('🎤 Resuming listening after AI finished...');
                setTimeout(() => startRecordingRef.current?.(), 300);
              }
            };
            
            source.start(0);
            console.log('🔊 Playing via AudioContext');
            played = true;
          } catch (ctxError) {
            console.log('🔊 AudioContext playback failed, falling back to Audio element:', ctxError);
          }
        }
        
        // Fallback to HTML Audio element
        if (!played) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
          audio.volume = 1.0;
          audioRef.current = audio;
          
          audio.onended = () => {
            console.log('🔊 Audio playback completed');
            setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
            if (shouldListenRef.current) {
              console.log('🎤 Resuming listening after AI finished...');
              setTimeout(() => startRecordingRef.current?.(), 300);
            }
          };
          
          audio.onerror = (e) => {
            console.error('🔊 Audio playback error:', e);
            setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
            if (shouldListenRef.current) {
              setTimeout(() => startRecordingRef.current?.(), 300);
            }
          };

          try {
            console.log('🔊 Attempting to play audio via Audio element...');
            await audio.play();
            console.log('🔊 Audio started playing');
          } catch (playError) {
            console.error('🔊 Audio play() failed:', playError);
            toast.error('Tap the mic button again to enable audio');
            setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
            if (shouldListenRef.current) {
              setTimeout(() => startRecordingRef.current?.(), 300);
            }
          }
        }
      } else {
        console.log('🔊 No audio content received');
        setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
        if (shouldListenRef.current) {
          setTimeout(() => startRecordingRef.current?.(), 300);
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

  // Stop AI speech mid-playback
  const stopSpeaking = useCallback(() => {
    console.log('🔇 Stopping speech...');
    
    // Stop HTML Audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    // Stop AudioContext source
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      currentSourceRef.current = null;
    }
    
    // Update state
    setVoiceState(prev => ({ ...prev, isAISpeaking: false }));
    
    // ALWAYS start listening after stopping - user wants to talk!
    shouldListenRef.current = true;
    console.log('🎤 Starting listening after stop...');
    setTimeout(() => startRecordingRef.current?.(), 300);
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
  const connect = useCallback(async (avatarName?: string, avatarId?: string, avatarGender?: string): Promise<void> => {
    try {
      console.log("Initializing voice chat for:", avatarName, "gender:", avatarGender);
      setVoiceState(prev => ({ ...prev, error: null }));

      // Use passed gender directly if provided, otherwise fetch from database
      let gender = avatarGender || 'neutral';
      
      if (!avatarGender) {
        // Only fetch from database if gender wasn't provided
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
      } else {
        avatarNameRef.current = avatarName || 'Coach';
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
      console.log('🎤 Starting recording...');
      
      // Unlock audio on user interaction (crucial for autoplay policy)
      unlockAudio();
      
      shouldListenRef.current = true; // Mark that we want continuous listening
      
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        console.error('🎤 Speech recognition not supported');
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Speech recognition not supported in this browser' 
        }));
        return;
      }

      console.log('🎤 Creating speech recognition instance...');
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
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
        // Only log non-aborted errors and avoid spamming
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
          setVoiceState(prev => ({ ...prev, error: `Speech error: ${event.error}` }));
        }
      };

      recognition.onend = () => {
        console.log('🎤 Recognition ended, shouldListen:', shouldListenRef.current, 'isAISpeaking:', isAISpeakingRef.current);
        setVoiceState(prev => ({ ...prev, isRecording: false }));
        
        // Auto-restart if chat is connected and not speaking
        if (shouldListenRef.current && !isAISpeakingRef.current) {
          // Use longer delay to prevent rapid restart loops
          setTimeout(() => {
            if (!shouldListenRef.current || isAISpeakingRef.current) return;
            
            try {
              // Create a new recognition instance to avoid issues
              const newRecognition = new SpeechRecognitionAPI();
              newRecognition.continuous = true;
              newRecognition.interimResults = true;
              newRecognition.lang = 'en-US';
              newRecognition.onresult = recognition.onresult;
              newRecognition.onerror = recognition.onerror;
              newRecognition.onend = recognition.onend;
              
              recognitionRef.current = newRecognition;
              newRecognition.start();
              setVoiceState(prev => ({ ...prev, isRecording: true }));
              console.log('🎤 Auto-restarted listening...');
            } catch (e) {
              console.log('Could not restart recognition:', e);
            }
          }, 500);
        }
      };

      recognitionRef.current = recognition;
      console.log('🎤 Calling recognition.start()...');
      
      try {
        recognition.start();
        console.log('🎤 recognition.start() succeeded');
      } catch (startError) {
        console.error('🎤 recognition.start() failed:', startError);
        throw startError;
      }
      
      setVoiceState(prev => ({ ...prev, isRecording: true, error: null }));
      console.log('🎤 Recording started (continuous mode)...');
      
    } catch (error) {
      console.error('🎤 Error starting recording:', error);
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Failed to start recording',
        isRecording: false 
      }));
      throw error; // Re-throw so FitnessChatbot knows it failed
    }
  }, [processMessage, unlockAudio]);

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
    stopSpeaking,
    clearMessages: () => setMessages([])
  };
};
