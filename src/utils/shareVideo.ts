import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export async function shareVideo(recordedChunks: Blob[]): Promise<void> {
  if (recordedChunks.length === 0) {
    toast.error('No recording available to share');
    return;
  }

  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `tapfit-workout-${timestamp}.webm`;

  try {
    if (Capacitor.isNativePlatform()) {
      // Native platform - use Filesystem and Share plugins
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          // Save to cache directory
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });

          // Share the file
          await Share.share({
            title: 'My TapFit Workout',
            text: 'Check out my workout!',
            url: savedFile.uri,
            dialogTitle: 'Share your workout',
          });

          toast.success('Video shared!');
        } catch (error) {
          console.error('Error sharing video:', error);
          toast.error('Failed to share video');
        }
      };

      reader.readAsDataURL(blob);
    } else {
      // Web platform - use Web Share API
      const file = new File([blob], fileName, { type: 'video/webm' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My TapFit Workout',
          text: 'Check out my workout!',
          files: [file],
        });
        toast.success('Video shared!');
      } else {
        // Fallback to download if sharing not supported
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.info('Sharing not supported - video downloaded instead');
      }
    }
  } catch (error) {
    console.error('Error sharing video:', error);
    toast.error('Failed to share video');
  }
}

export async function saveVideoLocally(recordedChunks: Blob[]): Promise<void> {
  if (recordedChunks.length === 0) {
    toast.error('No recording available to save');
    return;
  }

  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `tapfit-workout-${timestamp}.webm`;

  try {
    if (Capacitor.isNativePlatform()) {
      // Native platform - save to Documents directory
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          
          await Filesystem.writeFile({
            path: `TapFit/${fileName}`,
            data: base64Data,
            directory: Directory.Documents,
          });

          toast.success('Video saved to Documents/TapFit!');
        } catch (error) {
          console.error('Error saving video:', error);
          toast.error('Failed to save video');
        }
      };

      reader.readAsDataURL(blob);
    } else {
      // Web platform - download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Video downloaded!');
    }
  } catch (error) {
    console.error('Error saving video:', error);
    toast.error('Failed to save video');
  }
}
