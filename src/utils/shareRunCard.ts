import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * Capture the run share card as a PNG data URL
 */
export async function captureRunCard(element: HTMLElement): Promise<string> {
  // Wait for map tiles to load
  await new Promise(resolve => setTimeout(resolve, 500));

  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2, // Higher quality for sharing
    cacheBust: true,
    backgroundColor: '#18181b', // zinc-900
  });

  return dataUrl;
}

/**
 * Composite the run card overlay onto a user's photo
 */
export async function compositeOnPhoto(
  photoUri: string,
  cardDataUrl: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const photo = new Image();
    const card = new Image();
    
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        // Set canvas size to photo size
        canvas.width = photo.width;
        canvas.height = photo.height;

        // Draw photo
        ctx.drawImage(photo, 0, 0);

        // Calculate card size (40% of photo width, maintain aspect ratio)
        const cardWidth = photo.width * 0.4;
        const cardHeight = (card.height / card.width) * cardWidth;

        // Position at bottom-right with padding
        const padding = photo.width * 0.03;
        const x = photo.width - cardWidth - padding;
        const y = photo.height - cardHeight - padding;

        // Add subtle shadow behind card
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 5;

        // Draw card
        ctx.drawImage(card, x, y, cardWidth, cardHeight);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        resolve(canvas.toDataURL('image/png', 1));
      }
    };

    photo.crossOrigin = 'anonymous';
    card.crossOrigin = 'anonymous';

    photo.onload = checkLoaded;
    card.onload = checkLoaded;
    
    photo.onerror = () => reject(new Error('Failed to load photo'));
    card.onerror = () => reject(new Error('Failed to load card'));

    photo.src = photoUri;
    card.src = cardDataUrl;
  });
}

/**
 * Share an image using the native share API
 * Returns true if shared successfully, false if not supported
 */
export async function shareImage(dataUrl: string, title: string): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      // For native, we need to save the file first
      const base64Data = dataUrl.split(',')[1];
      const fileName = `tapfit-run-${Date.now()}.png`;
      
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: title,
        url: savedFile.uri,
        dialogTitle: 'Share your run',
      });

      // Clean up
      try {
        await Filesystem.deleteFile({
          path: fileName,
          directory: Directory.Cache,
        });
      } catch (e) {
        // Ignore cleanup errors
      }

      return true;
    } else if (navigator.share && navigator.canShare) {
      // Web Share API
      const blob = await dataUrlToBlob(dataUrl);
      const file = new File([blob], 'tapfit-run.png', { type: 'image/png' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title,
          files: [file],
        });
        return true;
      }
    }
  } catch (error) {
    console.error('Share error:', error);
    // User cancelled or share failed
  }
  
  return false;
}

/**
 * Download an image to the user's device
 */
export async function downloadImage(dataUrl: string, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const base64Data = dataUrl.split(',')[1];
    
    await Filesystem.writeFile({
      path: `Download/${fileName}`,
      data: base64Data,
      directory: Directory.Documents,
      recursive: true,
    });
  } else {
    // Web download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Convert data URL to Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
