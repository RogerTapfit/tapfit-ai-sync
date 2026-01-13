import { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, Result, DecodeHintType, BarcodeFormat, NotFoundException, ChecksumException, FormatException } from '@zxing/library';
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

// Check if native BarcodeDetector API is available
const isBarcodeDetectorSupported = (): boolean => {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
};

// Debug mode - enable with ?debugScanner=1 or localStorage
const isDebugMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('debugScanner') === '1' || localStorage.getItem('debugScanner') === '1';
};

const debugLog = (...args: any[]) => {
  if (isDebugMode()) {
    console.log('🔍 [Scanner Debug]', ...args);
  }
};

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Camera capabilities
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  
  // Scanner state
  const [scannerStatus, setScannerStatus] = useState<string>('idle');
  
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  
  // Lazy init ZXing reader
  const getCodeReader = useCallback(() => {
    if (!codeReaderRef.current) {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      codeReaderRef.current = new BrowserMultiFormatReader(hints);
    }
    return codeReaderRef.current;
  }, []);
  
  const activeStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const isStoppingRef = useRef(false);
  const isAttachingRef = useRef(false);
  const nativeDetectorRef = useRef<any>(null);
  const nativeDetectorLoopRef = useRef<number | null>(null);
  const zxingActiveRef = useRef(false);
  const errorCountRef = useRef({ notFound: 0, checksum: 0, format: 0 });
  const barcodeDetectedRef = useRef(false);

  const fetchProductData = useCallback(async (barcode: string): Promise<ProductData | null> => {
    try {
      const product = await EnhancedBarcodeService.scanBarcode(barcode);
      setProductData(product);
      return product;
    } catch (error) {
      console.error('Error fetching product data:', error);
      setProductData(null);
      return null;
    }
  }, []);

  // Stop native BarcodeDetector loop
  const stopNativeDetector = useCallback(() => {
    if (nativeDetectorLoopRef.current) {
      cancelAnimationFrame(nativeDetectorLoopRef.current);
      nativeDetectorLoopRef.current = null;
    }
    nativeDetectorRef.current = null;
  }, []);

  // Stop all scanning
  const stopScanning = useCallback((videoElement?: HTMLVideoElement) => {
    debugLog('stopScanning called');
    isStoppingRef.current = true;
    barcodeDetectedRef.current = false;
    zxingActiveRef.current = false;
    setScannerStatus('stopped');

    // Stop native detector
    stopNativeDetector();

    // Stop ZXing
    try {
      codeReaderRef.current?.reset();
    } catch {
      // no-op
    }

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
    
    // Reset camera controls
    setTorchOn(false);
  }, [stopNativeDetector]);

  // When barcode is detected, just set it and stop scanning
  const handleBarcodeDetected = useCallback((barcode: string) => {
    if (barcodeDetectedRef.current) return; // Prevent duplicate detections
    barcodeDetectedRef.current = true;
    
    console.log('📷 Barcode detected in hook:', barcode);
    debugLog('Barcode detected:', barcode);
    setError(null);
    setLastBarcode(barcode);
    setLoading(false);
    setScannerStatus('detected');
    
    // Stop everything
    stopScanning();
  }, [stopScanning]);

  // Start native BarcodeDetector (preferred on supported browsers)
  const startNativeDetector = useCallback((videoElement: HTMLVideoElement): boolean => {
    if (!isBarcodeDetectorSupported()) {
      debugLog('Native BarcodeDetector not supported');
      return false;
    }

    try {
      // @ts-ignore - BarcodeDetector is not in TypeScript types yet
      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf']
      });
      nativeDetectorRef.current = detector;

      debugLog('Native BarcodeDetector initialized');
      setScannerStatus('native-active');

      let lastScanTime = 0;
      const scanInterval = 100; // Scan every 100ms for faster response
      let frameCount = 0;

      const detectLoop = async () => {
        if (isStoppingRef.current || !nativeDetectorRef.current || barcodeDetectedRef.current) {
          return;
        }

        const now = Date.now();
        if (now - lastScanTime >= scanInterval) {
          lastScanTime = now;
          frameCount++;

          try {
            if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
              const barcodes = await detector.detect(videoElement);
              
              if (barcodes.length > 0 && !barcodeDetectedRef.current) {
                const barcode = barcodes[0];
                debugLog('Native detector found barcode:', barcode.rawValue);
                handleBarcodeDetected(barcode.rawValue);
                return; // Stop loop after detection
              }
            }

            // Log heartbeat every 30 frames (~3 seconds)
            if (frameCount % 30 === 0) {
              debugLog(`Native detector heartbeat: ${frameCount} frames, video: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
            }
          } catch (err) {
            // Detection errors are expected when no barcode is visible
          }
        }

        if (!barcodeDetectedRef.current && !isStoppingRef.current) {
          nativeDetectorLoopRef.current = requestAnimationFrame(detectLoop);
        }
      };

      nativeDetectorLoopRef.current = requestAnimationFrame(detectLoop);
      return true;
    } catch (err) {
      console.error('Failed to initialize native BarcodeDetector:', err);
      debugLog('Native BarcodeDetector init failed:', err);
      return false;
    }
  }, [handleBarcodeDetected]);

  // Start ZXing fallback decoder
  const startZXingDecoder = useCallback((videoElement: HTMLVideoElement, stream: MediaStream) => {
    if (zxingActiveRef.current || barcodeDetectedRef.current) {
      debugLog('ZXing already active or barcode detected, skipping');
      return;
    }
    
    zxingActiveRef.current = true;
    debugLog('Starting ZXing fallback decoder');
    setScannerStatus('zxing-active');
    
    let lastScanTime = 0;
    const scanCooldown = 1500;
    errorCountRef.current = { notFound: 0, checksum: 0, format: 0 };
    let lastHintTime = 0;

    const codeReader = getCodeReader();
    
    codeReader
      .decodeFromStream(stream, videoElement, (result: Result | null, err?: any) => {
        if (isStoppingRef.current || barcodeDetectedRef.current) return;

        if (result) {
          const now = Date.now();
          if (now - lastScanTime <= scanCooldown) return;

          lastScanTime = now;
          const barcodeText = result.getText();
          debugLog('ZXing detected barcode:', barcodeText);
          handleBarcodeDetected(barcodeText);
          return;
        }

        // Track errors for user feedback
        if (err) {
          const now = Date.now();
          
          if (err instanceof NotFoundException) {
            errorCountRef.current.notFound++;
          } else if (err instanceof ChecksumException) {
            errorCountRef.current.checksum++;
            if (errorCountRef.current.checksum > 15 && now - lastHintTime > 6000) {
              lastHintTime = now;
              debugLog('Many checksum errors - focus/lighting issue');
              toast.info('📸 Try moving closer or improving lighting', { duration: 3000 });
            }
          } else if (err instanceof FormatException) {
            errorCountRef.current.format++;
            if (errorCountRef.current.format > 15 && now - lastHintTime > 6000) {
              lastHintTime = now;
              debugLog('Many format errors - barcode partially visible');
              toast.info('📸 Hold steady and center the barcode', { duration: 3000 });
            }
          }

          // Log error counts periodically in debug mode
          const totalErrors = errorCountRef.current.notFound + errorCountRef.current.checksum + errorCountRef.current.format;
          if (totalErrors % 100 === 0 && totalErrors > 0) {
            debugLog('Error counts:', errorCountRef.current);
          }
        }
      })
      .catch((err) => {
        zxingActiveRef.current = false;
        if (isStoppingRef.current || barcodeDetectedRef.current) return;

        console.error('📷 Decode stream error:', err);
        const msg = 'Barcode scanner failed. Try manual entry.';
        setError(msg);
        toast.error(msg);
        setIsScanning(false);
        setLoading(false);
        setScannerStatus('error');
      });
  }, [getCodeReader, handleBarcodeDetected]);

  const getPreferredCameraStream = useCallback(async (): Promise<MediaStream> => {
    const baseConstraints = {
      width: { ideal: 1280, min: 640 },
      height: { ideal: 720, min: 480 },
    } as const;

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          ...baseConstraints,
          facingMode: { exact: 'environment' },
        },
      });
    } catch {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          ...baseConstraints,
          facingMode: { ideal: 'environment' },
        },
      });
    }
  }, []);

  // Apply camera track settings
  const applyCameraSettings = useCallback(async (stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const capabilities = videoTrack.getCapabilities?.() as any;
      
      debugLog('Camera capabilities:', capabilities);

      // Check torch support
      if (capabilities?.torch) {
        setTorchSupported(true);
        debugLog('Torch is supported');
      }

      // Check zoom support
      if (capabilities?.zoom) {
        const minZoom = capabilities.zoom.min || 1;
        const maxZoomVal = capabilities.zoom.max || 1;
        setZoomSupported(true);
        setMaxZoom(maxZoomVal);
        
        // Apply default zoom (2x) to help with focus
        const targetZoom = Math.min(2, maxZoomVal);
        if (targetZoom > minZoom) {
          try {
            await videoTrack.applyConstraints({ advanced: [{ zoom: targetZoom }] } as any);
            setCurrentZoom(targetZoom);
            debugLog(`Applied default zoom: ${targetZoom}x`);
          } catch (zoomErr) {
            debugLog('Failed to apply zoom:', zoomErr);
          }
        }
      }

      // Try continuous focus
      if (capabilities?.focusMode?.includes('continuous')) {
        try {
          await videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
          debugLog('Enabled continuous focus');
        } catch (focusErr) {
          debugLog('Failed to set focus mode:', focusErr);
        }
      }
    } catch (err) {
      debugLog('Error getting camera capabilities:', err);
    }
  }, []);

  // Toggle torch
  const toggleTorch = useCallback(async () => {
    const stream = activeStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const newTorchState = !torchOn;
      await videoTrack.applyConstraints({ advanced: [{ torch: newTorchState }] } as any);
      setTorchOn(newTorchState);
      debugLog(`Torch ${newTorchState ? 'ON' : 'OFF'}`);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
      toast.error('Could not toggle flashlight');
    }
  }, [torchOn]);

  // Set zoom level
  const setZoom = useCallback(async (zoom: number) => {
    const stream = activeStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      await videoTrack.applyConstraints({ advanced: [{ zoom }] } as any);
      setCurrentZoom(zoom);
      debugLog(`Zoom set to: ${zoom}x`);
    } catch (err) {
      console.error('Failed to set zoom:', err);
    }
  }, []);

  // Internal function to attach stream and start decoding
  const attachStreamToVideo = useCallback(async (videoElement: HTMLVideoElement, stream: MediaStream) => {
    if (isAttachingRef.current || barcodeDetectedRef.current) return;
    isAttachingRef.current = true;

    try {
      debugLog('Attaching stream to video');

      // Set video attributes
      videoElement.playsInline = true;
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.setAttribute('playsinline', 'true');
      videoElement.setAttribute('webkit-playsinline', 'true');
      videoElement.setAttribute('autoplay', 'true');
      videoElement.setAttribute('muted', 'true');

      // Wait for video to be ready
      const videoReadyPromise = new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          cleanup();
          reject(new Error('Video load timeout'));
        }, 10000);

        const onReady = async () => {
          try {
            debugLog('Video ready, dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
            if (videoElement.paused) {
              await videoElement.play();
            }
            cleanup();
            resolve();
          } catch (err) {
            cleanup();
            reject(err);
          }
        };

        const onError = (e: Event) => {
          cleanup();
          reject(new Error('Video element error'));
        };

        const cleanup = () => {
          window.clearTimeout(timeoutId);
          videoElement.removeEventListener('loadedmetadata', onReady);
          videoElement.removeEventListener('canplay', onReady);
          videoElement.removeEventListener('error', onError);
        };

        videoElement.addEventListener('loadedmetadata', onReady, { once: true });
        videoElement.addEventListener('canplay', onReady, { once: true });
        videoElement.addEventListener('error', onError, { once: true });

        if (videoElement.readyState >= 2) {
          queueMicrotask(() => onReady());
        }
      });

      videoElement.srcObject = stream;

      try {
        await videoReadyPromise;
      } catch (err) {
        if (isStoppingRef.current) return;
        throw err;
      }

      setLoading(false);

      // Don't start if already detected
      if (barcodeDetectedRef.current) return;

      // Try native BarcodeDetector first, fall back to ZXing
      const nativeStarted = startNativeDetector(videoElement);
      
      if (!nativeStarted) {
        console.log('📷 Using ZXing decoder');
        startZXingDecoder(videoElement, stream);
      } else {
        console.log('📷 Using native BarcodeDetector');
      }
    } finally {
      isAttachingRef.current = false;
    }
  }, [startNativeDetector, startZXingDecoder]);

  // Start scanning
  const startScanning = useCallback(async (videoElement?: HTMLVideoElement) => {
    console.log('📷 Starting barcode scanner...');
    debugLog('startScanning called');
    
    // Reset flags
    isStoppingRef.current = false;
    barcodeDetectedRef.current = false;
    zxingActiveRef.current = false;
    errorCountRef.current = { notFound: 0, checksum: 0, format: 0 };

    // Reset state
    setLastBarcode(null);
    setProductData(null);
    setError(null);
    setTorchOn(false);
    setTorchSupported(false);
    setZoomSupported(false);
    setCurrentZoom(1);
    setScannerStatus('initializing');

    // Check camera support
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Camera is not supported in this browser.';
      toast.error(msg);
      setError(msg);
      setIsScanning(false);
      setLoading(false);
      setScannerStatus('error');
      return;
    }

    // Detect iframe
    const isInIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();

    if (isInIframe) {
      const msg = 'Camera is blocked in preview. Open app in new tab to scan.';
      toast.error(msg);
      setError(msg);
      setIsScanning(false);
      setLoading(false);
      setScannerStatus('blocked');
      return;
    }

    setIsScanning(true);
    setLoading(true);

    try {
      // Reset previous decoder
      try {
        codeReaderRef.current?.reset();
      } catch {}
      stopNativeDetector();

      console.log('📷 Requesting camera access...');
      const stream = await getPreferredCameraStream();

      console.log('📷 Camera access granted');
      activeStreamRef.current = stream;

      // Apply camera settings
      await applyCameraSettings(stream);

      // Attach to video element
      const targetVideo = videoElement ?? videoElementRef.current;
      if (targetVideo) {
        videoElementRef.current = targetVideo;
        await attachStreamToVideo(targetVideo, stream);
      }
    } catch (e) {
      const err = e as any;
      const name = String(err?.name || 'Error');

      let msg = 'Failed to access camera. Please check permissions.';
      if (name === 'NotAllowedError') {
        msg = 'Camera permission denied. Allow camera access and try again.';
      } else if (name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (name === 'NotReadableError') {
        msg = 'Camera is busy. Close other apps using the camera.';
      } else if (name === 'SecurityError') {
        msg = 'Camera blocked. Open app in new tab to scan.';
      }

      console.error('📷 Error starting camera:', name);
      setError(msg);
      toast.error(msg);
      setIsScanning(false);
      setLoading(false);
      setScannerStatus('error');
    }
  }, [getPreferredCameraStream, applyCameraSettings, stopNativeDetector, attachStreamToVideo]);

  // Attach to video element (called when video element becomes available)
  const attachToVideoElement = useCallback(async (videoElement: HTMLVideoElement) => {
    console.log('📷 Attaching to video element...');
    videoElementRef.current = videoElement;
    
    if (activeStreamRef.current && !barcodeDetectedRef.current) {
      await attachStreamToVideo(videoElement, activeStreamRef.current);
    }
  }, [attachStreamToVideo]);

  const scanBarcodeFromImage = async (imageFile: File): Promise<ProductData | null> => {
    setLoading(true);

    try {
      const url = URL.createObjectURL(imageFile);
      try {
        const codeReader = getCodeReader();
        const result = await codeReader.decodeFromImageUrl(url);
        const product = await fetchProductData(result.getText());
        return product;
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error scanning barcode from image:', error);
      toast.error('No barcode detected in image');
      setProductData(null);
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

  const resetScanner = useCallback(() => {
    setProductData(null);
    setIsScanning(false);
    setLoading(false);
    setLastBarcode(null);
    setScannerStatus('idle');
    barcodeDetectedRef.current = false;
    zxingActiveRef.current = false;
    try {
      codeReaderRef.current?.reset();
    } catch {}
    stopNativeDetector();
  }, [stopNativeDetector]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      stopNativeDetector();
      try {
        codeReaderRef.current?.reset();
      } catch {}
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopNativeDetector]);

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
    fetchProductData,
    // Camera controls
    torchSupported,
    torchOn,
    toggleTorch,
    zoomSupported,
    currentZoom,
    maxZoom,
    setZoom,
    // Debug info
    scannerStatus,
  };
};
