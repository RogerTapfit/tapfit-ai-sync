import { useRef, useCallback, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AudioQueueItem {
  text: string;
  priority: 'high' | 'normal';
}

export type ElevenLabsVoice = 'Aria' | 'Roger' | 'Sarah' | 'Laura' | 'Charlie' | 'George';

export const useWorkoutAudio = () => {
  const audioQueue = useRef<AudioQueueItem[]>([]);
  const isPlaying = useRef(false);
  const audioContext = useRef<AudioContext | null>(null);
  const currentSource = useRef<AudioBufferSourceNode | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice>('Aria');

  // Load voice preference from localStorage
  useEffect(() => {
    const savedVoice = localStorage.getItem('ttsVoice') as ElevenLabsVoice;
    if (savedVoice) {
      setSelectedVoice(savedVoice);
    }
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
  }, []);

  const playAudio = useCallback(async (base64Audio: string) => {
    try {
      initAudioContext();
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await audioContext.current!.decodeAudioData(bytes.buffer);
      const source = audioContext.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current!.destination);
      
      currentSource.current = source;

      return new Promise<void>((resolve) => {
        source.onended = () => {
          currentSource.current = null;
          resolve();
        };
        source.start(0);
      });
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }, [initAudioContext]);

  const processQueue = useCallback(async () => {
    if (isPlaying.current || audioQueue.current.length === 0) {
      return;
    }

    isPlaying.current = true;
    const item = audioQueue.current.shift()!;

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: item.text, voice: selectedVoice }
      });

      if (error) throw error;
      if (data?.audioContent) {
        await playAudio(data.audioContent);
      }
    } catch (error) {
      console.error('Error processing audio queue:', error);
    } finally {
      isPlaying.current = false;
      processQueue();
    }
  }, [playAudio, selectedVoice]);

  const speak = useCallback((text: string, priority: 'high' | 'normal' = 'normal') => {
    // Stop current audio if high priority
    if (priority === 'high' && currentSource.current) {
      currentSource.current.stop();
      currentSource.current = null;
      audioQueue.current = [];
      isPlaying.current = false;
    }

    if (priority === 'high') {
      audioQueue.current.unshift({ text, priority });
    } else {
      audioQueue.current.push({ text, priority });
    }

    processQueue();
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    audioQueue.current = [];
    if (currentSource.current) {
      currentSource.current.stop();
      currentSource.current = null;
    }
    isPlaying.current = false;
  }, []);

  const changeVoice = useCallback((voice: ElevenLabsVoice) => {
    setSelectedVoice(voice);
    localStorage.setItem('ttsVoice', voice);
  }, []);

  return {
    speak,
    clearQueue,
    selectedVoice,
    changeVoice,
  };
};
