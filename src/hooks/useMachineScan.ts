import { useState, useCallback, useRef, useEffect } from 'react';
import { RecognitionResult } from '@/types/machine';
import { MachineRecognitionService } from '@/services/machineRecognitionService';

interface UseMachineScanOptions {
  autoStop?: boolean;
  confidenceThreshold?: number;
}

export const useMachineScan = (options: UseMachineScanOptions = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<RecognitionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { autoStop = true, confidenceThreshold = 0.75 } = options;

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsScanning(true);

      // Start frame processing
      intervalRef.current = setInterval(processFrame, 1000); // Process every second
    } catch (err) {
      setError('Camera access denied or not available');
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
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [autoStop, confidenceThreshold, stopCamera]);

  const processUploadedImage = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Create image element and load the file
      const img = new Image();
      img.onload = async () => {
        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        context.drawImage(img, 0, 0);
        
        // Get image data for processing
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        try {
          // Run recognition
          const recognitionResults = await MachineRecognitionService.recognizeFromFrame(imageData);
          setResults(recognitionResults);
          
          // Auto-stop if high confidence match found
          if (autoStop && recognitionResults[0]?.confidence >= confidenceThreshold) {
            // Auto-stop after successful recognition
          }
        } catch (err) {
          console.error('Image processing error:', err);
          setError('Recognition failed');
        } finally {
          setIsProcessing(false);
        }
      };
      
      img.onerror = () => {
        setError('Failed to load image');
        setIsProcessing(false);
      };
      
      // Convert file to data URL and load
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload processing error:', err);
      setError('Upload failed');
      setIsProcessing(false);
    }
  }, [autoStop, confidenceThreshold]);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
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