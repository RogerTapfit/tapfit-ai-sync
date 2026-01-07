import { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { toast } from 'sonner';
import { EnhancedBarcodeService } from '../services/enhancedBarcodeService';

interface ProductData {
  id: string;
  name: string;
  brand?: string;
  image_url?: string;
  nutrition?: {
    calories_100g?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    sugars_100g?: number;
    salt_100g?: number;
    alcohol_100g?: number;
    // Per-serving values (direct from label)
    calories_serving?: number;
    proteins_serving?: number;
    carbohydrates_serving?: number;
    fat_serving?: number;
    sugars_serving?: number;
    alcohol_serving?: number;
  };
  ingredients?: string;
  serving_size?: string;
  serving_quantity_ml?: number;
  product_quantity_ml?: number;
  servings_per_container?: number;
  category?: string;
  store_info?: {
    stores?: string[];
    price_range?: string;
  };
  data_source?: string;
  confidence?: number;
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeReader] = useState(() => new BrowserMultiFormatReader());
  const activeStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const fetchProductData = async (barcode: string): Promise<ProductData | null> => {
    try {
      return await EnhancedBarcodeService.scanBarcode(barcode);
    } catch (error) {
      console.error('Error fetching product data:', error);
      return null;
    }
  };

  // When barcode is detected, just set it and stop scanning - let consumer handle the lookup
  const handleBarcodeDetected = (barcode: string) => {
    console.log('📷 Barcode detected in hook:', barcode);
    setError(null);
    setLastBarcode(barcode);
    stopScanning();
    setLoading(false);
  };

  const getPreferredCameraStream = useCallback(async (): Promise<MediaStream> => {
    // Keep this simple for reliability on mobile (iOS can expose multiple “rear” cameras where
    // picking a specific deviceId may land on an ultra‑wide lens that won’t focus on barcodes).
    const baseConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    } as const;

    try {
      // Prefer a rear camera explicitly when supported.
      return await navigator.mediaDevices.getUserMedia({
        video: {
          ...baseConstraints,
          facingMode: { exact: 'environment' },
        },
      });
    } catch {
      // Fallback for browsers that don't support exact facingMode.
      return await navigator.mediaDevices.getUserMedia({
        video: {
          ...baseConstraints,
          facingMode: { ideal: 'environment' },
        },
      });
    }
  }, []);

  // Start scanning - sets isScanning true first, then gets camera
  const startScanning = useCallback(async (videoElement?: HTMLVideoElement) => {
    console.log('📷 Starting barcode scanner...');

    // Clear previous scan so scanning the same code again still triggers
    setLastBarcode(null);
    setProductData(null);
    setError(null);

    // Surface unsupported environments early
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Camera is not supported in this browser.';
      console.error('📷 getUserMedia not available');
      toast.error(msg);
      setError(msg);
      setIsScanning(false);
      setLoading(false);
      return;
    }

    setIsScanning(true);
    setLoading(true);

    try {
      // First, stop any existing scanning
      codeReader.reset();

      console.log('📷 Requesting camera access...');
      const stream = await getPreferredCameraStream();

      console.log('📷 Camera access granted');
      activeStreamRef.current = stream;

      // Attach immediately if we already have a mounted video element (prevents race where
      // component calls attachToVideoElement before the stream is ready).
      const targetVideo = videoElement ?? videoElementRef.current;
      if (targetVideo) {
        videoElementRef.current = targetVideo;
        await attachStreamToVideo(targetVideo, stream);
      } else {
        console.log('📷 Video element not ready yet; will attach when available');
      }
    } catch (e) {
      const err = e as any;
      const name = String(err?.name || 'Error');
      const rawMessage = String(err?.message || '');

      let msg = 'Failed to access camera. Please check permissions.';
      if (name === 'NotAllowedError') {
        msg = 'Camera permission denied. Allow camera access and try again.';
      } else if (name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (name === 'NotReadableError') {
        msg = 'Camera is busy or unavailable. Close other apps using the camera and try again.';
      } else if (name === 'SecurityError') {
        msg = 'Camera is blocked in this embedded view. Open the app in a new tab to scan.';
      }

      console.error('📷 Error starting camera:', name, rawMessage);
      setError(msg);
      toast.error(msg);
      setIsScanning(false);
      setLoading(false);
    }
  }, [codeReader, getPreferredCameraStream]);

  // Attach stream to a video element (called when video element becomes available)
  const attachToVideoElement = useCallback(async (videoElement: HTMLVideoElement) => {
    console.log('📷 Attaching to video element...');
    videoElementRef.current = videoElement;
    
    if (activeStreamRef.current) {
      await attachStreamToVideo(videoElement, activeStreamRef.current);
    }
  }, []);

  // Internal function to attach stream and start decoding
  const attachStreamToVideo = async (videoElement: HTMLVideoElement, stream: MediaStream) => {
    console.log('📷 Setting up video element...');

    // Set attributes BEFORE srcObject
    videoElement.playsInline = true;
    videoElement.autoplay = true;
    videoElement.muted = true;

    // Create promise BEFORE setting srcObject so we don't miss the event
    const videoReadyPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error('Video load timeout'));
      }, 10000);

      const onReady = async () => {
        try {
          console.log('📷 Video metadata loaded, readyState:', videoElement.readyState);
          if (videoElement.paused) {
            await videoElement.play();
          }
          console.log('📷 Video playing');
          cleanup();
          resolve();
        } catch (err) {
          console.error('📷 Video play error:', err);
          cleanup();
          reject(err);
        }
      };

      const onError = (e: Event) => {
        console.error('📷 Video element error:', e);
        cleanup();
        reject(new Error('Video element error'));
      };

      const cleanup = () => {
        window.clearTimeout(timeoutId);
        videoElement.removeEventListener('loadedmetadata', onReady);
        videoElement.removeEventListener('canplay', onReady);
        videoElement.removeEventListener('error', onError);
      };

      // Listen to both loadedmetadata and canplay for maximum compatibility
      videoElement.addEventListener('loadedmetadata', onReady, { once: true });
      videoElement.addEventListener('canplay', onReady, { once: true });
      videoElement.addEventListener('error', onError, { once: true });

      // If already ready, resolve immediately (handles rescans / fast attaches)
      if (videoElement.readyState >= 2) {
        console.log('📷 Video already ready, readyState:', videoElement.readyState);
        queueMicrotask(() => onReady());
      }
    });

    // NOW set srcObject - after listeners are attached
    videoElement.srcObject = stream;
    console.log('📷 srcObject set, waiting for video ready...');

    await videoReadyPromise;

    setLoading(false);
    console.log('📷 Starting barcode detection with decodeFromStream...');

    // Debounce the barcode detection
    let lastScanTime = 0;
    const scanCooldown = 2000;

    try {
      await codeReader.decodeFromStream(stream, videoElement, (result: Result | null) => {
        if (!result) return;

        const now = Date.now();
        if (now - lastScanTime <= scanCooldown) return;

        lastScanTime = now;
        console.log('📷 Barcode detected:', result.getText());
        handleBarcodeDetected(result.getText());
      });
    } catch (err) {
      console.error('📷 Decode stream error:', err);
      const msg = 'Barcode scanner failed to start. Try again or use manual entry.';
      setError(msg);
      toast.error(msg);
      setIsScanning(false);
      setLoading(false);
    }
  };

  const stopScanning = useCallback((videoElement?: HTMLVideoElement) => {
    codeReader.reset();
    setIsScanning(false);
    setLoading(false);

    // Stop active stream
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }

    // Also stop any video tracks from the passed element
    const videoEl = videoElement || videoElementRef.current;
    if (videoEl?.srcObject) {
      const stream = videoEl.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoEl.srcObject = null;
    }
    videoElementRef.current = null;
  }, [codeReader]);

  const scanBarcodeFromImage = async (imageFile: File): Promise<ProductData | null> => {
    setLoading(true);
    
    try {
      const result = await codeReader.decodeFromInputVideoDevice();
      
      if (result) {
        const product = await fetchProductData(result.getText());
        setProductData(product);
        return product;
      } else {
        toast.error('No barcode detected in image');
        return null;
      }
    } catch (error) {
      console.error('Error scanning barcode from image:', error);
      toast.error('Failed to scan barcode from image');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const convertToFoodItem = (product: ProductData, servingWeight: number = 100) => {
    if (!product.nutrition) {
      return null;
    }

    const multiplier = servingWeight / 100;
    
    return {
      name: `${product.brand ? product.brand + ' ' : ''}${product.name}`,
      quantity: `${servingWeight}g`,
      calories: Math.round((product.nutrition.calories_100g || 0) * multiplier),
      protein: Math.round((product.nutrition.proteins_100g || 0) * multiplier * 10) / 10,
      carbs: Math.round((product.nutrition.carbohydrates_100g || 0) * multiplier * 10) / 10,
      fat: Math.round((product.nutrition.fat_100g || 0) * multiplier * 10) / 10,
      confidence: 1.0
    };
  };

  const resetScanner = () => {
    setProductData(null);
    setIsScanning(false);
    setLoading(false);
    setLastBarcode(null);
    codeReader.reset();
  };

  return {
    isScanning,
    productData,
    loading,
    error,
    lastBarcode,
    startScanning,
    stopScanning,
    attachToVideoElement,
    scanBarcodeFromImage,
    convertToFoodItem,
    resetScanner,
    fetchProductData
  };
};
