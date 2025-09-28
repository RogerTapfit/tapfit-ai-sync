import heic2any from 'heic2any';

export const isHEICFile = (file: File): boolean => {
  return file.type === 'image/heic' || file.type === 'image/heif' || 
         file.name.toLowerCase().endsWith('.heic') || 
         file.name.toLowerCase().endsWith('.heif');
};

// Device detection for iOS Safari optimizations
const isIOSSafari = (): boolean => {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
};

// Get optimal quality based on device and file size
const getOptimalQuality = (fileSize: number, isIOS: boolean): number => {
  if (isIOS) {
    // More aggressive compression for iOS Safari due to memory constraints
    if (fileSize > 5 * 1024 * 1024) return 0.4; // 5MB+
    if (fileSize > 2 * 1024 * 1024) return 0.6; // 2MB+
    return 0.7;
  }
  
  // Standard quality for other devices
  if (fileSize > 10 * 1024 * 1024) return 0.5; // 10MB+
  if (fileSize > 5 * 1024 * 1024) return 0.7; // 5MB+
  return 0.8;
};

// Validate converted blob
const validateConvertedBlob = (blob: Blob, originalSize: number): boolean => {
  if (!blob || blob.size === 0) {
    console.error('Converted blob is empty');
    return false;
  }
  
  if (blob.type !== 'image/jpeg') {
    console.error('Converted blob is not JPEG:', blob.type);
    return false;
  }
  
  // Sanity check: converted file shouldn't be larger than 5x original (unless very small)
  if (blob.size > Math.max(originalSize * 5, 1024 * 1024)) {
    console.warn('Converted blob suspiciously large:', blob.size, 'vs original:', originalSize);
  }
  
  return true;
};

export const convertHEICToJPEG = async (file: File): Promise<File> => {
  if (!isHEICFile(file)) {
    return file; // Return original file if not HEIC
  }

  const isIOS = isIOSSafari();
  const originalSize = file.size;
  
  console.debug('Converting HEIC file:', {
    name: file.name,
    size: originalSize,
    type: file.type,
    isIOS
  });

  // Try conversion with multiple quality settings as fallback
  const qualityLevels = [
    getOptimalQuality(originalSize, isIOS),
    0.6, // First fallback
    0.4, // Second fallback
    0.2  // Last resort
  ];

  for (let i = 0; i < qualityLevels.length; i++) {
    const quality = qualityLevels[i];
    
    try {
      console.debug(`HEIC conversion attempt ${i + 1} with quality:`, quality);
      
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: quality
      }) as Blob;

      // Validate the converted blob
      if (!validateConvertedBlob(convertedBlob, originalSize)) {
        throw new Error('Invalid converted blob');
      }

      const convertedFile = new File(
        [convertedBlob], 
        file.name.replace(/\.(heic|heif)$/i, '.jpg'),
        { type: 'image/jpeg' }
      );

      console.debug('HEIC conversion successful:', {
        originalSize,
        convertedSize: convertedFile.size,
        quality,
        compressionRatio: (originalSize / convertedFile.size).toFixed(2)
      });

      return convertedFile;
    } catch (error) {
      console.error(`HEIC conversion attempt ${i + 1} failed:`, error);
      
      // If this is the last attempt, throw the error
      if (i === qualityLevels.length - 1) {
        throw new Error(
          `Failed to convert HEIC image after ${qualityLevels.length} attempts. ` +
          'Please try saving the photo as JPG in your camera settings or use a different image.'
        );
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('HEIC conversion failed unexpectedly');
};

// Enhanced image processing with size optimization
const optimizeImageSize = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If file is already small enough, return as-is
    if (file.size <= 2 * 1024 * 1024) { // 2MB
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 1920x1920 for mobile compatibility)
      const maxDimension = isIOSSafari() ? 1440 : 1920;
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to optimize image size'));
          return;
        }
        
        const optimizedFile = new File([blob], file.name, { type: 'image/jpeg' });
        console.debug('Image size optimized:', {
          originalSize: file.size,
          optimizedSize: optimizedFile.size,
          dimensions: `${width}x${height}`
        });
        
        resolve(optimizedFile);
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => reject(new Error('Failed to load image for optimization'));
    img.src = URL.createObjectURL(file);
  });
};

export const processImageFile = async (file: File): Promise<File> => {
  console.debug('Processing image file:', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  try {
    let processedFile = file;
    
    // Convert HEIC files first
    if (isHEICFile(file)) {
      processedFile = await convertHEICToJPEG(file);
    }
    
    // Optimize file size if needed (especially important for iOS Safari)
    if (processedFile.size > 2 * 1024 * 1024 || isIOSSafari()) { // 2MB threshold
      processedFile = await optimizeImageSize(processedFile);
    }
    
    console.debug('Image processing complete:', {
      originalName: file.name,
      processedName: processedFile.name,
      originalSize: file.size,
      processedSize: processedFile.size,
      originalType: file.type,
      processedType: processedFile.type
    });
    
    return processedFile;
  } catch (error) {
    console.error('Image processing failed:', error);
    
    // If processing fails, try to return the original file as fallback
    if (!isHEICFile(file)) {
      console.warn('Returning original file as fallback');
      return file;
    }
    
    // Re-throw HEIC errors since original file won't work
    throw error;
  }
};