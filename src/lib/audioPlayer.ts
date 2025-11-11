/**
 * Play base64 encoded audio data
 */
export const playBase64Audio = (base64Audio: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};
