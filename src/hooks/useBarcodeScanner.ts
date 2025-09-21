import { useState, useCallback } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { toast } from 'sonner';

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
}

export const useBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeReader] = useState(() => new BrowserMultiFormatReader());

  const fetchProductData = async (barcode: string): Promise<ProductData | null> => {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (!data.product) {
        return null;
      }
      
      const product = data.product;
      return {
        id: barcode,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || '',
        image_url: product.image_url,
        nutrition: {
          calories_100g: product.nutriments?.['energy-kcal_100g'],
          proteins_100g: product.nutriments?.proteins_100g,
          carbohydrates_100g: product.nutriments?.carbohydrates_100g,
          fat_100g: product.nutriments?.fat_100g,
          fiber_100g: product.nutriments?.fiber_100g,
          sugars_100g: product.nutriments?.sugars_100g,
          salt_100g: product.nutriments?.salt_100g,
        },
        ingredients: product.ingredients_text,
        serving_size: product.serving_size,
      };
    } catch (error) {
      console.error('Error fetching product data:', error);
      return null;
    }
  };

  const startScanning = useCallback(async (videoElement: HTMLVideoElement) => {
    setIsScanning(true);
    setLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          // Disable mirroring for barcode scanning
          advanced: [{
            facingMode: 'environment'
          }]
        } 
      });
      
      videoElement.srcObject = stream;
      videoElement.play();
      
      const result = await codeReader.decodeFromVideoDevice(
        undefined, 
        videoElement, 
        (result: Result | null, error?: Error) => {
          if (result) {
            handleBarcodeDetected(result.getText());
          }
        }
      );
      
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setIsScanning(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    codeReader.reset();
    setIsScanning(false);
  }, []);

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