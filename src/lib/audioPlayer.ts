/**
 * Play base64 encoded audio data with optional callbacks
 */
export const playBase64Audio = (
  base64Audio: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    volume?: number;
  }
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      
      // Set volume (0.0 to 1.0)
      if (callbacks?.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, callbacks.volume));
      }
      
      audio.onplay = () => {
        callbacks?.onStart?.();
      };
      
      audio.onended = () => {
        callbacks?.onEnd?.();
        resolve();
      };
      
      audio.onerror = () => {
        callbacks?.onEnd?.();
        reject(new Error('Audio playback failed'));
      };
      
      audio.play().catch((error) => {
        callbacks?.onEnd?.();
        reject(error);
      });
    } catch (error) {
      callbacks?.onEnd?.();
      reject(error);
    }
  });
};
