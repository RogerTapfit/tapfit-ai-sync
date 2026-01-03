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
    setLastBarcode(barcode);
    stopScanning();
    setLoading(false);
  };

  // Start scanning - sets isScanning true first, then gets camera
  const startScanning = useCallback(async (videoElement?: HTMLVideoElement) => {
    console.log('📷 Starting barcode scanner...');
    setIsScanning(true);
    setLoading(true);
    
    try {
      // First, stop any existing scanning
      codeReader.reset();
      
      console.log('📷 Requesting camera access...');
      // Request camera permission and get stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

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
      
    } catch (error) {
      console.error('📷 Error starting camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setIsScanning(false);
      setLoading(false);
    }
  }, [codeReader]);

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
    
    videoElement.srcObject = stream;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('autoplay', 'true');
    videoElement.muted = true;
    
    // Wait for video to be ready
    await new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Video load timeout'));
      }, 10000);
      
      videoElement.onloadedmetadata = () => {
        console.log('📷 Video metadata loaded');
        clearTimeout(timeoutId);
        videoElement.play()
          .then(() => {
            console.log('📷 Video playing');
            resolve();
          })
          .catch((err) => {
            console.error('📷 Video play error:', err);
            reject(err);
          });
      };
      
      videoElement.onerror = (e) => {
        console.error('📷 Video element error:', e);
        clearTimeout(timeoutId);
        reject(new Error('Video element error'));
      };
    });
    
    setLoading(false);
    console.log('📷 Starting barcode detection...');
    
    // Debounce the barcode detection
    let lastScanTime = 0;
    const scanCooldown = 2000;
    
    // Use decodeFromStream for continuous scanning
    codeReader.decodeFromStream(
      stream,
      videoElement,
      (result: Result | null, error?: Error) => {
        if (result) {
          const now = Date.now();
          if (now - lastScanTime > scanCooldown) {
            lastScanTime = now;
            console.log('📷 Barcode detected:', result.getText());
            handleBarcodeDetected(result.getText());
          }
        }
      }
    ).catch((err) => {
      console.error('📷 Decode stream error:', err);
    });
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
