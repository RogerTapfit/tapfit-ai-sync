import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface VoiceCommandCallbacks {
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

interface VoiceCommand {
  patterns: string[];
  action: keyof VoiceCommandCallbacks;
  description: string;
}

const COMMANDS: VoiceCommand[] = [
  {
    patterns: ['start workout', 'begin workout', 'start exercise', 'let\'s go', 'go'],
    action: 'onStart',
    description: 'Start workout'
  },
  {
    patterns: ['pause', 'pause workout', 'hold on', 'wait'],
    action: 'onPause',
    description: 'Pause workout'
  },
  {
    patterns: ['resume', 'resume workout', 'continue', 'keep going'],
    action: 'onResume',
    description: 'Resume workout'
  },
  {
    patterns: ['stop', 'stop workout', 'end workout', 'finish', 'done'],
    action: 'onStop',
    description: 'Stop workout'
  }
];

export const useVoiceCommands = (callbacks: VoiceCommandCallbacks) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const matchCommand = useCallback((transcript: string): VoiceCommand | null => {
    const lowerTranscript = transcript.toLowerCase().trim();
    
    for (const command of COMMANDS) {
      for (const pattern of command.patterns) {
        if (lowerTranscript.includes(pattern)) {
          return command;
        }
      }
    }
    
    return null;
  }, []);

  const processTranscript = useCallback((transcript: string) => {
    console.log('Voice command heard:', transcript);
    const command = matchCommand(transcript);
    
    if (command) {
      setLastCommand(transcript);
      const callback = callbacks[command.action];
      
      if (callback) {
        toast.success(`Voice command: "${transcript}"`, { duration: 2000 });
        callback();
      }
    }
  }, [matchCommand, callbacks]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      toast.error('Voice commands not supported in this browser');
      return;
    }

    if (isActiveRef.current) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
        isActiveRef.current = true;
        toast.success('Voice commands active. Say "Start workout" to begin', { duration: 3000 });
      };

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        processTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          // Ignore no-speech errors, they're common
          return;
        }
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable microphone permissions.');
          stopListening();
        } else {
          toast.error(`Voice recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('Voice recognition ended');
        
        // Auto-restart if still supposed to be listening
        if (isActiveRef.current) {
          setTimeout(() => {
            if (isActiveRef.current) {
              try {
                recognition.start();
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      toast.error('Failed to start voice commands');
    }
  }, [isSupported, processTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      isActiveRef.current = false;
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      toast.info('Voice commands disabled');
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isActiveRef.current = false;
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
    availableCommands: COMMANDS
  };
};
