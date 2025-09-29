import { useState, useCallback, useRef, useEffect } from 'react';
import { RecognitionResult } from '@/types/machine';
import { MachineRecognitionService } from '@/services/machineRecognitionService';
import { processImageFile, isHEICFile } from '@/utils/heicConverter';

interface UseMachineScanOptions {
  autoStop?: boolean;
  confidenceThreshold?: number;
}

export const useMachineScan = (options: UseMachineScanOptions = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorSource, setErrorSource] = useState<'camera' | 'upload' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { autoStop = true, confidenceThreshold = 0.85 } = options;

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280, min: 640 }, // Reduced for better mobile compatibility
          height: { ideal: 720, min: 480 }
        }
      });

      if (videoRef.current) {
        // Mobile Safari specific setup
        videoRef.current.srcObject = mediaStream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        
        // Wait for video to be ready before starting
        await new Promise((resolve, reject) => {
          const video = videoRef.current!;
          video.onloadedmetadata = () => resolve(void 0);
          video.onerror = reject;
          
          // Fallback timeout
          setTimeout(() => resolve(void 0), 3000);
        });
        
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsScanning(true);

      // Start frame processing with better timing
      intervalRef.current = setInterval(processFrame, 1500);
    } catch (err: any) {
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Camera permission denied. Please allow camera access and try again.'
        : err.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : err.name === 'NotReadableError'
        ? 'Camera is being used by another application.'
        : 'Camera access failed. Please try again.';
      
      setError(errorMessage);
      setErrorSource('camera');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsScanning(false);
    setIsProcessing(false);
    processingRef.current = false;
  }, [stream]);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data for processing
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Run recognition
      const recognitionResults = await MachineRecognitionService.recognizeFromFrame(imageData);
      setResults(recognitionResults);

      // Auto-stop if high confidence match found
      if (autoStop && recognitionResults[0]?.confidence >= confidenceThreshold) {
        stopCamera();
      }
    } catch (err) {
      console.error('Frame processing error:', err);
      setError('Recognition failed');
      setErrorSource('camera');
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [autoStop, confidenceThreshold, stopCamera]);

  const processUploadedImage = useCallback(async (file: File) => {
    console.debug('Starting image upload processing');
    // Ensure we're not in camera mode when uploading
    stopCamera();

    setError(null);
    setErrorSource('upload');
    setIsProcessing(true);
    
    let objectUrl: string | null = null;
    let triedDataUrlFallback = false;
    
    try {
      // Convert HEIC files to JPG if needed with enhanced error handling
      const processedFile = await processImageFile(file);
      console.debug('File processed for HEIC conversion:', {
        originalType: file.type,
        processedType: processedFile.type,
        originalSize: file.size,
        processedSize: processedFile.size
      });
      
      let canvas = canvasRef.current;
      let context: CanvasRenderingContext2D | null = null;
      
      // If no canvas available, create an offscreen canvas
      if (!canvas) {
        canvas = document.createElement('canvas');
        context = canvas.getContext('2d');
      } else {
        context = canvas.getContext('2d');
      }
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Create image element and load the file
      const img = new Image();
      img.decoding = 'async';
      
      const loadFromObjectUrl = (f: File) => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(f);
        img.src = objectUrl;
      };

      const loadFromDataUrl = (f: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = (e.target?.result as string) || '';
        };
        reader.onerror = (e) => {
          console.error('Data URL reader error:', e);
          setError('Failed to read image file.');
          setErrorSource('upload');
          setIsProcessing(false);
        };
        reader.readAsDataURL(f);
      };

      // Enhanced error handling for image loading
      img.onerror = (event) => {
        console.error('Image loading failed:', {
          event,
          src: img.src,
          fileType: processedFile.type,
          fileSize: processedFile.size,
          fileName: processedFile.name
        });

        // Make sure we are not in scanning mode for UI messaging
        stopCamera();

        if (!triedDataUrlFallback) {
          triedDataUrlFallback = true;
          console.warn('Falling back to Data URL for image load');
          loadFromDataUrl(processedFile);
          return;
        }
        
        setError('Failed to load image. Please try a different image format or ensure the image is not corrupted.');
        setErrorSource('upload');
        setIsProcessing(false);

        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
          objectUrl = null;
        }
      };
      
      img.onload = async () => {
        console.debug('Image loaded successfully:', {
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
        
        try {
          // Validate image dimensions
          if (img.width === 0 || img.height === 0) {
            throw new Error('Invalid image dimensions');
          }
          
          // Set canvas size to image size (with reasonable limits)
          const maxDimension = 2048; // Prevent memory issues
          let canvasWidth = img.width;
          let canvasHeight = img.height;
          
          if (img.width > maxDimension || img.height > maxDimension) {
            const ratio = Math.min(maxDimension / img.width, maxDimension / img.height);
            canvasWidth = Math.floor(img.width * ratio);
            canvasHeight = Math.floor(img.height * ratio);
            console.debug('Resizing canvas for processing:', { canvasWidth, canvasHeight });
          }
          
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          // Draw image to canvas
          context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          
          // Get image data for processing
          const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
          
          // Run recognition
          const recognitionResults = await MachineRecognitionService.recognizeFromFrame(imageData);
          setResults(recognitionResults);
          console.debug('Image processing complete', {
            resultsCount: recognitionResults.length,
            bestMatch: recognitionResults[0]?.machineId,
            confidence: recognitionResults[0]?.confidence
          });
          
          // Auto-stop if high confidence match found
          if (autoStop && recognitionResults[0]?.confidence >= confidenceThreshold) {
            console.debug('High confidence match found, auto-stopping');
          }
        } catch (err) {
          console.error('Image recognition error:', err);
          setError('Recognition failed. Please try again with a clearer image.');
          setErrorSource('upload');
        } finally {
          setIsProcessing(false);
          
          // Clean up object URL
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
          }
        }
      };
      
      // Kick off image load via object URL first
      loadFromObjectUrl(processedFile);
      
    } catch (err: any) {
      console.error('Upload processing error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Upload failed';
      if (err.message?.includes('HEIC')) {
        errorMessage = 'Failed to convert HEIC image. Please save the photo as JPG or try a different image.';
      } else if (err.message?.includes('optimize')) {
        errorMessage = 'Failed to process image. Please try a smaller image or different format.';
      } else if (err.message?.includes('convert')) {
        errorMessage = 'Image format not supported. Please use JPG, PNG, or WEBP.';
      }
      
      setError(errorMessage);
      setErrorSource('upload');
      setIsProcessing(false);

      // Clean up object URL on error
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  }, [autoStop, confidenceThreshold, stopCamera]);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
    setErrorSource(null);
    setIsProcessing(false);
    // Auto-stop after successful recognition
  }, []);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const bestMatch = results[0];
  const alternatives = results.slice(0, 3);
  const isHighConfidence = bestMatch && bestMatch.confidence >= confidenceThreshold;

  return {
    // State
    isScanning,
    isProcessing,
    results,
    error,
    errorSource,
    bestMatch,
    alternatives,
    isHighConfidence,
    

    // Actions
    startCamera,
    stopCamera,
    reset,
    processUploadedImage,
    

    // Refs for components
    videoRef,
    canvasRef
  };
};