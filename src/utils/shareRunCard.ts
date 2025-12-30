import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { RunSession } from '@/types/run';
import { formatDistance, formatTime, formatPace } from '@/utils/runFormatters';

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
  run: RunSession
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

      // Set canvas to photo dimensions
      canvas.width = photo.width;
      canvas.height = photo.height;

      // Draw the photo
      ctx.drawImage(photo, 0, 0);

      const width = canvas.width;
      const height = canvas.height;

      // Draw gradient overlay at top for text visibility
      const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.25);
      topGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, height * 0.25);

      // Draw gradient overlay at bottom for branding
      const bottomGradient = ctx.createLinearGradient(0, height * 0.75, 0, height);
      bottomGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      bottomGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height * 0.75, width, height * 0.25);

      // Scale factor based on image size
      const scale = Math.min(width, height) / 400;
      
      // Format stats
      const distance = formatDistance(run.total_distance_m, run.unit);
      const time = formatTime(run.moving_time_s);
      const pace = formatPace(run.avg_pace_sec_per_km, run.unit);
      const isWalk = run.avg_pace_sec_per_km > 600;
      const unit = run.unit === 'mi' ? 'mi' : 'km';
      const paceUnit = run.unit === 'mi' ? '/mi' : '/km';

      // Draw main stats
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * scale;

      // Stats positioning
      const statsY = height * 0.08;
      const statSpacing = width / 3;

      // Distance
      ctx.font = `bold ${48 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(distance, statSpacing * 0.5, statsY);
      ctx.font = `${14 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('DISTANCE', statSpacing * 0.5, statsY + 24 * scale);

      // Time
      ctx.fillStyle = 'white';
      ctx.font = `bold ${48 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(time, statSpacing * 1.5, statsY);
      ctx.font = `${14 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('TIME', statSpacing * 1.5, statsY + 24 * scale);

      // Pace
      ctx.fillStyle = 'white';
      ctx.font = `bold ${48 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(pace, statSpacing * 2.5, statsY);
      ctx.font = `${14 * scale}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`PACE ${paceUnit}`, statSpacing * 2.5, statsY + 24 * scale);

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
