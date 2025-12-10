import { useState, useCallback, useRef } from 'react';
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
  };
  ingredients?: string;
  serving_size?: string;
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
  const [codeReader] = useState(() => new BrowserMultiFormatReader());
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  const fetchProductData = async (barcode: string): Promise<ProductData | null> => {
    try {
      return await EnhancedBarcodeService.scanBarcode(barcode);
    } catch (error) {
      console.error('Error fetching product data:', error);
      return null;
    }
  };

  const startScanning = useCallback(async (videoElement: HTMLVideoElement) => {
    console.log('📷 Starting barcode scanner...');
    setIsScanning(true);
    setLoading(true);
    activeVideoRef.current = videoElement;
    
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
      
      console.log('📷 Camera access granted, setting up video element...');
      
      // Set up video element
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
      
      // Use decodeFromStream for continuous scanning with the existing stream
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
      
    } catch (error) {
      console.error('📷 Error starting camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setIsScanning(false);
      setLoading(false);
    }
  }, [codeReader]);

  const stopScanning = useCallback((videoElement?: HTMLVideoElement) => {
    codeReader.reset();
    setIsScanning(false);
    
    const videoEl = videoElement || activeVideoRef.current;
    // Also stop any video tracks
    if (videoEl?.srcObject) {
      const stream = videoEl.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoEl.srcObject = null;
    }
    activeVideoRef.current = null;
  }, [codeReader]);

  const handleBarcodeDetected = async (barcode: string) => {
    setLoading(true);
    stopScanning();
    
    try {
      const product = await fetchProductData(barcode);
      
      if (product) {
        setProductData(product);
        toast.success(`Product found: ${product.name}`);
      } else {
        toast.error('Product not found in database. Try manual entry or photo analysis.');
        setProductData(null);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      toast.error('Failed to process barcode. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
    codeReader.reset();
  };

  return {
    isScanning,
    productData,
    loading,
    startScanning,
    stopScanning,
    scanBarcodeFromImage,
    convertToFoodItem,
    resetScanner,
    fetchProductData
  };
};