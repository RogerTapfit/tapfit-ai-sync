/**
 * Play base64 encoded audio data with optional callbacks
 */
export const playBase64Audio = (
  base64Audio: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
  }
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      
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
