// Centralized audio utilities for workout sounds
class AudioManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.7;

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
      // Special 100% completion
      this.playWorkoutComplete();
    }
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

// Export singleton instance
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