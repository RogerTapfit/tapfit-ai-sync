import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { RunSession } from '@/types/run';
import { formatDistance, formatTime, formatPace } from '@/utils/runFormatters';

// Dynamic import for Media plugin (may not be available on all platforms)
let Media: any = null;
const loadMediaPlugin = async () => {
  if (!Media && Capacitor.isNativePlatform()) {
    try {
      const mediaModule = await import('@capacitor-community/media');
      Media = mediaModule.Media;
    } catch (e) {
      console.log('Media plugin not available');
    }
  }
  return Media;
};

/**
 * Capture the run share card as a PNG data URL with timeout
 */
export async function captureRunCard(element: HTMLElement): Promise<string> {
  // Wait briefly for any rendering to complete
  await new Promise(resolve => setTimeout(resolve, 200));

  // Race between capture and timeout
  const timeoutMs = 5000;
  
  const capturePromise = toPng(element, {
    quality: 1,
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#18181b', // zinc-900
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Image capture timed out')), timeoutMs);
  });

  try {
    const dataUrl = await Promise.race([capturePromise, timeoutPromise]);
    return dataUrl;
  } catch (error) {
    console.error('Capture failed:', error);
    throw new Error('Failed to capture image. Please try again.');
  }
}

/**
 * Composite the run card overlay onto a user's photo
 */
export async function compositeOnPhoto(
  photoUri: string,
  cardDataUrl: string
): Promise<string> {
  const timeoutMs = 10000;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Photo compositing timed out')), timeoutMs);
  });

  const compositePromise = (async () => {
    const [photo, card] = await Promise.all([
      loadImage(photoUri),
      loadImage(cardDataUrl),
    ]);

    // Avoid very large canvases on mobile Safari (can hang or crash)
    const maxDim = 2048;
    const photoW = photo.naturalWidth || photo.width;
    const photoH = photo.naturalHeight || photo.height;
    const downscale = Math.min(1, maxDim / Math.max(photoW, photoH));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(photoW * downscale));
    canvas.height = Math.max(1, Math.round(photoH * downscale));

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Draw background photo
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

    // Card size (40% of photo width, maintain aspect ratio)
    const cardW = card.naturalWidth || card.width;
    const cardH = card.naturalHeight || card.height;
    const cardWidth = canvas.width * 0.4;
    const cardHeight = (cardH / Math.max(1, cardW)) * cardWidth;

    // Bottom-right positioning
    const padding = canvas.width * 0.03;
    const x = canvas.width - cardWidth - padding;
    const y = canvas.height - cardHeight - padding;

    // Shadow + draw overlay
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(card, x, y, cardWidth, cardHeight);
    ctx.restore();

    return canvas.toDataURL('image/png');
  })();

  return Promise.race([compositePromise, timeoutPromise]);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Only needed for remote URLs; data: URLs are always same-origin.
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve(img);
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      reject(new Error('Failed to load image'));
    };

    img.onload = done;
    img.onerror = fail;
    img.src = src;

    // Some browsers (Safari) behave better when we await decode().
    // It can resolve before onload; guard with `settled`.
    if (typeof (img as any).decode === 'function') {
      (img as any).decode().then(done).catch(() => {
        // ignore; onload/onerror will handle
      });
    }
  });
}

/**
 * Composite Strava-style stats overlay onto a selfie photo
 * Draws directly on canvas - no html-to-image dependency
 */
export async function compositeSelfieWithStats(
  photoUri: string,
  run: RunSession,
  displayUnit: 'km' | 'mi' = 'km'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const photo = new Image();
    photo.crossOrigin = 'anonymous';

    photo.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Limit canvas size for mobile performance
      const maxDim = 2048;
      const photoW = photo.naturalWidth || photo.width;
      const photoH = photo.naturalHeight || photo.height;
      const downscale = Math.min(1, maxDim / Math.max(photoW, photoH));

      canvas.width = Math.round(photoW * downscale);
      canvas.height = Math.round(photoH * downscale);

      // Draw the photo
      ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;

      // Draw gradient overlay at top for text visibility
      const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.22);
      topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, height * 0.22);

      // Draw gradient overlay at bottom for branding
      const bottomGradient = ctx.createLinearGradient(0, height * 0.8, 0, height);
      bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height * 0.8, width, height * 0.2);

      // Scale factor based on image size (normalized to ~1000px reference)
      const scale = Math.min(width, height) / 500;
      
      // Format stats with the selected unit
      const distanceValue = displayUnit === 'mi' 
        ? (run.total_distance_m / 1609.34).toFixed(2)
        : (run.total_distance_m / 1000).toFixed(2);
      
      const minutes = Math.floor(run.moving_time_s / 60);
      const seconds = Math.round(run.moving_time_s % 60);
      const timeValue = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Calculate pace in the selected unit
      const distanceInUnit = displayUnit === 'mi' 
        ? run.total_distance_m / 1609.34 
        : run.total_distance_m / 1000;
      const paceSeconds = distanceInUnit > 0 ? run.moving_time_s / distanceInUnit : 0;
      const paceMin = Math.floor(paceSeconds / 60);
      const paceSec = Math.round(paceSeconds % 60);
      const paceValue = `${paceMin}:${paceSec.toString().padStart(2, '0')}`;
      
      const isWalk = run.avg_pace_sec_per_km > 600;

      // Column setup - 3 equal columns with padding
      const padding = width * 0.04;
      const usableWidth = width - (padding * 2);
      const colWidth = usableWidth / 3;
      const colCenters = [
        padding + colWidth * 0.5,
        padding + colWidth * 1.5,
        padding + colWidth * 2.5
      ];

      // Calculate font sizes that fit within columns
      const maxValueFontSize = Math.min(36 * scale, colWidth * 0.4);
      const unitFontSize = maxValueFontSize * 0.4;
      const labelFontSize = maxValueFontSize * 0.35;

      // Stats positioning - start from top
      const startY = height * 0.045;
      const valueY = startY + maxValueFontSize;
      const unitY = valueY + unitFontSize + 4 * scale;
      const labelY = unitY + labelFontSize + 2 * scale;

      // Shadow for all text
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 8 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * scale;
      ctx.textAlign = 'center';

      // Stats data
      const stats = [
        { value: distanceValue, unit: displayUnit.toUpperCase(), label: 'DISTANCE' },
        { value: timeValue, unit: 'MIN', label: 'TIME' },
        { value: paceValue, unit: `/${displayUnit.toUpperCase()}`, label: 'PACE' }
      ];

      stats.forEach((stat, i) => {
        const x = colCenters[i];
        
        // Draw value (bold, large)
        ctx.fillStyle = 'white';
        ctx.font = `bold ${maxValueFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(stat.value, x, valueY);
        
        // Draw unit (smaller, slightly muted)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `600 ${unitFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(stat.unit, x, unitY);
        
        // Draw label (smallest, muted)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = `500 ${labelFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(stat.label, x, labelY);
      });

      // Draw small route visualization in bottom right corner
      if (run.points.length > 1) {
        drawRouteInset(ctx, run.points, width, height, scale);
      }

      // Draw TapFit branding at bottom left
      ctx.shadowBlur = 5 * scale;
      const logoSize = 24 * scale;
      const logoX = 20 * scale;
      const logoY = height - 30 * scale;

      // TapFit logo box
      const gradient = ctx.createLinearGradient(logoX, logoY - logoSize, logoX + logoSize, logoY);
      gradient.addColorStop(0, '#ef4444');
      gradient.addColorStop(1, '#f97316');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(logoX, logoY - logoSize, logoSize, logoSize, 4 * scale);
      ctx.fill();

      // T letter
      ctx.fillStyle = 'white';
      ctx.font = `bold ${14 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('T', logoX + logoSize / 2, logoY - logoSize / 2 + 5 * scale);

      // TapFit text
      ctx.textAlign = 'left';
      ctx.font = `600 ${16 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.fillText('TapFit', logoX + logoSize + 8 * scale, logoY - logoSize / 2 + 5 * scale);

      // Activity type badge
      ctx.font = `${12 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(isWalk ? '🚶 Walk' : '🏃 Run', logoX + logoSize + 8 * scale, logoY - logoSize / 2 + 20 * scale);

      resolve(canvas.toDataURL('image/png', 0.95));
    };

    photo.onerror = () => reject(new Error('Failed to load photo'));
    photo.src = photoUri;
  });
}

/**
 * Draw a small route inset in the corner
 */
function drawRouteInset(
  ctx: CanvasRenderingContext2D,
  points: { lat: number; lon: number }[],
  canvasWidth: number,
  canvasHeight: number,
  scale: number
) {
  const insetSize = 80 * scale;
  const padding = 20 * scale;
  const insetX = canvasWidth - insetSize - padding;
  const insetY = canvasHeight - insetSize - padding;

  // Background for route inset
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(insetX - 10 * scale, insetY - 10 * scale, insetSize + 20 * scale, insetSize + 20 * scale, 8 * scale);
  ctx.fill();

  // Calculate bounds
  const lats = points.map(p => p.lat);
  const lons = points.map(p => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latRange = maxLat - minLat || 0.001;
  const lonRange = maxLon - minLon || 0.001;

  // Normalize and draw route
  ctx.strokeStyle = '#FF4D4D';
  ctx.lineWidth = 2 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  points.forEach((p, i) => {
    const x = insetX + ((p.lon - minLon) / lonRange) * insetSize;
    const y = insetY + insetSize - ((p.lat - minLat) / latRange) * insetSize;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Start marker
  const startX = insetX + ((points[0].lon - minLon) / lonRange) * insetSize;
  const startY = insetY + insetSize - ((points[0].lat - minLat) / latRange) * insetSize;
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(startX, startY, 4 * scale, 0, Math.PI * 2);
  ctx.fill();

  // End marker
  const endP = points[points.length - 1];
  const endX = insetX + ((endP.lon - minLon) / lonRange) * insetSize;
  const endY = insetY + insetSize - ((endP.lat - minLat) / latRange) * insetSize;
  ctx.fillStyle = '#FF4D4D';
  ctx.beginPath();
  ctx.arc(endX, endY, 4 * scale, 0, Math.PI * 2);
  ctx.fill();
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

/**
 * Save image to photo album/camera roll
 */
export async function saveToPhotoAlbum(dataUrl: string, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const MediaPlugin = await loadMediaPlugin();
    
    if (MediaPlugin) {
      // Use Media plugin to save to camera roll
      const base64Data = dataUrl.split(',')[1];
      const tempPath = `tapfit_temp_${Date.now()}.png`;
      
      // First save to cache
      const savedFile = await Filesystem.writeFile({
        path: tempPath,
        data: base64Data,
        directory: Directory.Cache,
      });
      
      // Then save to photo album
      await MediaPlugin.savePhoto({
        path: savedFile.uri,
      });
      
      // Clean up temp file
      try {
        await Filesystem.deleteFile({
          path: tempPath,
          directory: Directory.Cache,
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    } else {
      // Fallback: save to Documents and share
      const base64Data = dataUrl.split(',')[1];
      await Filesystem.writeFile({
        path: `Pictures/${fileName}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });
    }
  } else {
    // Web: trigger download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Share a video file
 */
export async function shareVideo(blob: Blob, title: string): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      // Convert blob to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const fileName = `tapfit-run-${Date.now()}.webm`;
      
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      
      await Share.share({
        title: title,
        url: savedFile.uri,
        dialogTitle: 'Share your run video',
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
      const file = new File([blob], 'tapfit-run.webm', { type: 'video/webm' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title,
          files: [file],
        });
        return true;
      }
    }
  } catch (error) {
    console.error('Share video error:', error);
  }
  
  return false;
}

/**
 * Save video to photo album/camera roll
 */
export async function saveVideoToPhotoAlbum(blob: Blob, fileName: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const MediaPlugin = await loadMediaPlugin();
    
    // Convert blob to base64
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    const tempPath = `tapfit_temp_${Date.now()}.webm`;
    
    // Save to cache first
    const savedFile = await Filesystem.writeFile({
      path: tempPath,
      data: base64,
      directory: Directory.Cache,
    });
    
    if (MediaPlugin) {
      // Use Media plugin to save to camera roll
      await MediaPlugin.saveVideo({
        path: savedFile.uri,
      });
      
      // Clean up temp file
      try {
        await Filesystem.deleteFile({
          path: tempPath,
          directory: Directory.Cache,
        });
      } catch (e) {
        // Ignore cleanup errors
      }
    } else {
      // Fallback: move to Documents/Videos
      await Filesystem.copy({
        from: savedFile.uri,
        to: `Videos/${fileName}`,
        toDirectory: Directory.Documents,
      });
    }
  } else {
    // Web: trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
