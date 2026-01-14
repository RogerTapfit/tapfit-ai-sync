// Centralized audio utilities for workout sounds
class AudioManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.7;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();

  // Initialize audio context on first user interaction
  async initializeAudio(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (browser policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    }
  }

  // Create oscillator with specified frequency, duration, and wave type
  private createTone(frequency: number, duration: number, waveType: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.isEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = waveType;

    // Volume envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Load MP3 audio file
  async loadAudio(url: string, key: string): Promise<AudioBuffer> {
    if (this.audioBuffers.has(key)) {
      return this.audioBuffers.get(key)!;
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    const loadPromise = this.fetchAndDecodeAudio(url);
    this.loadingPromises.set(key, loadPromise);

    try {
      const buffer = await loadPromise;
      this.audioBuffers.set(key, buffer);
      this.loadingPromises.delete(key);
      return buffer;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  private async fetchAndDecodeAudio(url: string): Promise<AudioBuffer> {
    await this.initializeAudio();
    if (!this.audioContext) throw new Error('AudioContext not available');

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  // Play MP3 audio buffer
  private playAudioBuffer(buffer: AudioBuffer): void {
    if (!this.audioContext || !this.isEnabled) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    source.start(0);
  }

  // Play custom MP3 sound with fallback to synthetic
  async playCustomSound(audioUrl: string, key: string, fallbackFn?: () => void): Promise<void> {
    try {
      const buffer = await this.loadAudio(audioUrl, key);
      this.playAudioBuffer(buffer);
    } catch (error) {
      console.warn(`Failed to play custom sound ${key}:`, error);
      if (fallbackFn) fallbackFn();
    }
  }

  // Play multiple tones in sequence or harmony
  private playTones(tones: Array<{frequency: number, duration: number, delay?: number}>, waveType: OscillatorType = 'sine'): void {
    tones.forEach(({ frequency, duration, delay = 0 }) => {
      setTimeout(() => this.createTone(frequency, duration, waveType), delay);
    });
  }

  // Sound effects
  async playSetComplete(): Promise<void> {
    await this.initializeAudio();
    // Quick success chime
    this.createTone(800, 0.15, 'triangle');
  }

  async playWorkoutComplete(): Promise<void> {
    await this.initializeAudio();
    // Victory fanfare - C major chord with melody
    const chord = [
      { frequency: 523.25, duration: 0.8 }, // C5
      { frequency: 659.25, duration: 0.8 }, // E5
      { frequency: 783.99, duration: 0.8 }, // G5
    ];
    this.playTones(chord, 'triangle');
    
    // Add melody on top
    setTimeout(() => this.createTone(1046.50, 0.3, 'sine'), 200); // C6
    setTimeout(() => this.createTone(1174.66, 0.4, 'sine'), 400); // D6
  }

  async playProgressMilestone(percentage: number): Promise<void> {
    await this.initializeAudio();
    
    if (percentage === 25) {
      this.createTone(440, 0.2, 'triangle'); // A4
    } else if (percentage === 50) {
      this.createTone(554.37, 0.2, 'triangle'); // C#5
    } else if (percentage === 75) {
      this.createTone(659.25, 0.2, 'triangle'); // E5
    } else if (percentage === 100) {
      // Special 100% completion with epic victory sound
      this.playEpicVictory();
    }
  }

  async playEpicVictory(): Promise<void> {
    await this.initializeAudio();
    // Epic victory fanfare - longer and more triumphant than workout complete
    
    // First chord - F major
    const chord1 = [
      { frequency: 349.23, duration: 0.6 }, // F4
      { frequency: 440.00, duration: 0.6 }, // A4
      { frequency: 523.25, duration: 0.6 }, // C5
    ];
    this.playTones(chord1, 'triangle');
    
    // Second chord - G major (higher)
    setTimeout(() => {
      const chord2 = [
        { frequency: 392.00, duration: 0.6 }, // G4
        { frequency: 493.88, duration: 0.6 }, // B4
        { frequency: 587.33, duration: 0.6 }, // D5
      ];
      this.playTones(chord2, 'triangle');
    }, 300);
    
    // Final triumphant chord - C major (highest)
    setTimeout(() => {
      const finalChord = [
        { frequency: 523.25, duration: 1.2 }, // C5
        { frequency: 659.25, duration: 1.2 }, // E5
        { frequency: 783.99, duration: 1.2 }, // G5
        { frequency: 1046.50, duration: 1.2 }, // C6
      ];
      this.playTones(finalChord, 'triangle');
    }, 600);
    
    // Victory melody on top
    setTimeout(() => this.createTone(1046.50, 0.3, 'sine'), 800); // C6
    setTimeout(() => this.createTone(1174.66, 0.3, 'sine'), 1000); // D6
    setTimeout(() => this.createTone(1318.51, 0.4, 'sine'), 1200); // E6
    setTimeout(() => this.createTone(1567.98, 0.6, 'sine'), 1400); // G6
  }

  async playRestTimerBeep(): Promise<void> {
    await this.initializeAudio();
    this.createTone(440, 0.1, 'square');
  }

  async playRestComplete(): Promise<void> {
    await this.initializeAudio();
    // Ascending chime
    this.createTone(523.25, 0.15, 'sine'); // C5
    setTimeout(() => this.createTone(659.25, 0.15, 'sine'), 100); // E5
    setTimeout(() => this.createTone(783.99, 0.2, 'sine'), 200); // G5
  }

  async playButtonClick(): Promise<void> {
    await this.initializeAudio();
    this.createTone(1000, 0.05, 'square');
  }

  async playError(): Promise<void> {
    await this.initializeAudio();
    // Error buzz
    this.createTone(200, 0.3, 'sawtooth');
  }

  async playCountdownBeep(): Promise<void> {
    await this.initializeAudio();
    this.createTone(880, 0.1, 'triangle');
  }

  async playCashPayout(): Promise<void> {
    await this.initializeAudio();
    // Fun cash register cha-ching sound with good vibes
    
    // Main cha-ching sound (classic cash register)
    this.createTone(1200, 0.15, 'triangle');
    setTimeout(() => this.createTone(900, 0.12, 'triangle'), 80);
    setTimeout(() => this.createTone(1100, 0.1, 'triangle'), 140);
    
    // Cash drawer opening sound
    setTimeout(() => this.createTone(300, 0.2, 'square'), 200);
    
    // Coins cascading effect with variation
    setTimeout(() => {
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          const frequency = 350 + Math.random() * 300 + (i * 10);
          this.createTone(frequency, 0.06 + Math.random() * 0.04, 'sine');
        }, i * 45 + Math.random() * 20);
      }
    }, 300);
    
    // Final satisfying ring
    setTimeout(() => this.createTone(1400, 0.3, 'triangle'), 800);
  }

  async playSobrietyCheckIn(): Promise<void> {
    await this.initializeAudio();
    // Bright, happy ascending chime - short and rewarding
    
    // Quick sparkle intro
    this.createTone(1200, 0.08, 'sine');
    
    // Happy ascending notes (like collecting coins in a game)
    setTimeout(() => this.createTone(880, 0.12, 'triangle'), 80);    // A5
    setTimeout(() => this.createTone(988, 0.12, 'triangle'), 160);   // B5
    setTimeout(() => this.createTone(1174.66, 0.15, 'triangle'), 240); // D6
    
    // Final triumphant note with sparkle
    setTimeout(() => {
      this.createTone(1318.51, 0.25, 'triangle'); // E6
      this.createTone(1567.98, 0.25, 'sine');     // G6 harmony
    }, 350);
    
    // Satisfying "ding" finish
    setTimeout(() => this.createTone(2093, 0.15, 'sine'), 500); // High C
  }

  async playWaterPour(): Promise<void> {
    await this.initializeAudio();
    if (!this.audioContext || !this.isEnabled) return;
    
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Create filtered noise for water texture
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.setValueAtTime(800, now);
    lowPass.frequency.linearRampToValueAtTime(400, now + 0.4);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(this.volume * 0.15, now + 0.05);
    noiseGain.gain.linearRampToValueAtTime(this.volume * 0.08, now + 0.3);
    noiseGain.gain.linearRampToValueAtTime(0, now + 0.4);
    
    noiseSource.connect(lowPass);
    lowPass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + 0.4);
    
    // Add bubbling "glug" tones
    const bubbles = [
      { freq: 180, time: 0.05 },
      { freq: 160, time: 0.15 },
      { freq: 200, time: 0.25 },
      { freq: 140, time: 0.35 }
    ];
    
    bubbles.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + time + 0.08);
      
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(this.volume * 0.12, now + time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + 0.1);
    });
  }

  // Settings
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  isAudioEnabled(): boolean {
    return this.isEnabled;
  }
}
export const audioManager = new AudioManager();

// React hook for audio settings
export const useAudioSettings = () => {
  const [isEnabled, setIsEnabled] = React.useState(audioManager.isAudioEnabled());
  const [volume, setVolume] = React.useState(audioManager.getVolume());

  const toggleAudio = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    audioManager.setEnabled(newState);
  };

  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  };

  return {
    isEnabled,
    volume,
    toggleAudio,
    updateVolume,
  };
};

import React from 'react';