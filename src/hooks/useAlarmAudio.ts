import { useEffect, useRef, useState } from 'react';

export const useAlarmAudio = (soundType: string = 'classic') => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const play = () => {
    if (audioContextRef.current) return; // Already playing

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound based on type
    switch (soundType) {
      case 'siren':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.8;
        oscillator.type = 'sawtooth';
        break;
      case 'horn':
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.7;
        oscillator.type = 'square';
        break;
      case 'gentle':
        oscillator.frequency.value = 523;
        gainNode.gain.value = 0.3;
        oscillator.type = 'sine';
        break;
      default: // classic
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.5;
        oscillator.type = 'square';
    }

    oscillator.start();
    
    audioContextRef.current = audioContext;
    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;
    setIsPlaying(true);
  };

  const stop = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return { play, stop, isPlaying };
};
