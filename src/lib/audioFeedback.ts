/**
 * Generate and play audio feedback sounds using Web Audio API
 */

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a quick beep sound for rep counting feedback
 */
export const playRepBeep = (volume: number = 0.3) => {
  try {
    const ctx = getAudioContext();
    
    // Create oscillator for the beep
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure beep sound - short, pleasant tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime); // 800Hz tone
    
    // Quick fade in/out for smooth sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
    
    // Play the beep
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  } catch (error) {
    console.log('Audio feedback not available:', error);
  }
};

/**
 * Play a success sound for milestone achievements
 */
export const playSuccessBeep = (volume: number = 0.4) => {
  try {
    const ctx = getAudioContext();
    
    // Create two oscillators for a chord
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Connect nodes
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Configure pleasant chord
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    
    // Smooth envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    // Play
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.log('Audio feedback not available:', error);
  }
};

/**
 * Play a warning tone for bad/acidic pH levels
 */
const playWarningTone = (volume: number = 0.3) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    // Descending tone from 400Hz to 250Hz
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.35);
  } catch (error) {
    console.log('Audio feedback not available:', error);
  }
};

/**
 * Play a pleasant ascending chord for good/neutral pH levels
 */
const playGoodTone = (volume: number = 0.3) => {
  try {
    const ctx = getAudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc3.type = 'sine';
    
    // Ascending major chord: C5 -> E5 -> G5
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc3.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(volume * 0.8, ctx.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    
    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.08);
    osc3.start(ctx.currentTime + 0.16);
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
    osc3.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.log('Audio feedback not available:', error);
  }
};

/**
 * Play a neutral mid-range tone for alkaline pH levels
 */
const playMediumTone = (volume: number = 0.3) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4 - neutral tone
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.log('Audio feedback not available:', error);
  }
};

/**
 * Play sound effect based on pH level
 * - Acidic (< 6.5): Warning descending tone
 * - Neutral (6.5-8.0): Pleasant ascending chord
 * - Alkaline (> 8.0): Neutral mid-range tone
 */
export const playPHSound = (phLevel: number, volume: number = 0.3) => {
  if (phLevel < 6.5) {
    playWarningTone(volume);
  } else if (phLevel <= 8.0) {
    playGoodTone(volume);
  } else {
    playMediumTone(volume);
  }
};
