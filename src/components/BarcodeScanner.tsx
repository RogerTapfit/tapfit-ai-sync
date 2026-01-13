import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, Camera, X, Check, Package2, Loader2, 
  Zap, Target, AlertCircle, Info, Settings, Store
} from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { motion, AnimatePresence } from 'framer-motion';
import { FoodItem } from '@/hooks/useNutrition';
import { ApiKeyManager } from './ApiKeyManager';
import { ProductNotFoundDialog } from './ProductNotFoundDialog';
import { PriceLookupService, PriceLookupResult } from '@/services/priceLookupService';
import { ProductPriceCard } from './ProductPriceCard';
import { ScannerControls } from './ScannerControls';

interface BarcodeScannerProps {
  onProductFound?: (foodItem: FoodItem) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onProductFound, 
  onClose,
  isOpen = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [servingWeight, setServingWeight] = useState(100);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [showApiManager, setShowApiManager] = useState(false);
  const [showProductNotFound, setShowProductNotFound] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('');
  const [pricing, setPricing] = useState<PriceLookupResult | null>(null);
  
  const {
    isScanning,
    productData,
    loading,
    lastBarcode,
    startScanning,
    stopScanning,
    convertToFoodItem,
    resetScanner,
    fetchProductData,
    torchSupported,
    torchOn,
    toggleTorch,
    zoomSupported,
    currentZoom,
    maxZoom,
    setZoom,
  } = useBarcodeScanner();

  // Fetch pricing when product data is found
  useEffect(() => {
    const fetchPricing = async () => {
      if (productData && (lastBarcode || productData.name)) {
        try {
          const priceData = await PriceLookupService.lookupPrice(
            lastBarcode || '',
            productData.name
          );
          setPricing(priceData);
        } catch (error) {
          console.log('Price lookup unavailable:', error);
        }
      } else {
        setPricing(null);
      }
    };
    fetchPricing();
  }, [productData, lastBarcode]);

  // When a camera scan detects a barcode, immediately lookup the product
  useEffect(() => {
    if (!lastBarcode) return;

    const barcode = lastBarcode.trim();
    if (!barcode) return;

    fetchProductData(barcode).then((product) => {
      if (!product) {
        setLastScannedBarcode(barcode);
        setShowProductNotFound(true);
      }
    });
  }, [lastBarcode, fetchProductData]);

  // Start/stop the camera scanner when the modal opens/closes or the user changes modes
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      // Small delay to ensure the video element is mounted
      await new Promise((r) => setTimeout(r, 100));
      if (!mounted) return;

      if (isOpen && scanMode === 'camera' && videoRef.current) {
        startScanning(videoRef.current);
      }
    };

    if (isOpen && scanMode === 'camera') {
      initCamera();
    }

    return () => {
      mounted = false;
      stopScanning(videoRef.current || undefined);
    };
  }, [isOpen, scanMode, startScanning, stopScanning]);

  const handleManualBarcodeSubmit = async () => {
    const barcode = manualBarcode.trim();
    if (!barcode) return;

    try {
      const product = await fetchProductData(barcode);
      if (!product) {
        setLastScannedBarcode(barcode);
        setShowProductNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const handleAddProduct = () => {
    if (!productData) return;
    
    const foodItem = convertToFoodItem(productData, servingWeight);
    if (foodItem && onProductFound) {
      onProductFound(foodItem);
      resetScanner();
      onClose?.();
    }
  };

  const handleRetry = () => {
    resetScanner();
    setPricing(null);
    if (scanMode === 'camera' && videoRef.current) {
      startScanning(videoRef.current);
    }
  };

  const handleManualProductAdded = (product: any) => {
    const foodItem = convertToFoodItem(product, servingWeight);
    if (foodItem && onProductFound) {
      onProductFound(foodItem);
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 relative">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <QrCode className="h-6 w-6 text-primary" />
                </motion.div>
                Enhanced Barcode Scanner
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiManager(true)}
                  title="Manage API Keys"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">
              Scan any product barcode for comprehensive information across multiple databases
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Scan Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                onClick={() => setScanMode('camera')}
                className="flex-1 gap-2"
              >
                <Camera className="h-4 w-4" />
                Camera Scan
              </Button>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setScanMode('manual')}
                className="flex-1 gap-2"
              >
                <Package2 className="h-4 w-4" />
                Manual Entry
              </Button>
            </div>

            {/* Camera Scanner */}
            {scanMode === 'camera' && (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(1)' }} // Prevent mirroring for barcode scanning
                    autoPlay
                    playsInline
                    muted
                  />
                  
                  {/* Scanner Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2 
                        }}
                        className="w-48 h-32 border-2 border-primary rounded-lg bg-primary/10"
                      >
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Camera Controls */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                    <ScannerControls
                      torchSupported={torchSupported}
                      torchOn={torchOn}
                      onToggleTorch={toggleTorch}
                      zoomSupported={zoomSupported}
                      currentZoom={currentZoom}
                      maxZoom={maxZoom}
                      onSetZoom={setZoom}
                    />
                  </div>

                  {(loading) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Scanning for barcode...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center text-sm text-muted-foreground flex items-center gap-2 justify-center">
                  <Target className="h-4 w-4" />
                  Position the barcode within the scanning area
                </div>
              </div>
            )}

            {/* Manual Entry */}
            {scanMode === 'manual' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="barcode">Barcode Number</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="barcode"
                      placeholder="Enter barcode number (e.g., 3017620422003)"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleManualBarcodeSubmit}
                      disabled={loading || !manualBarcode.trim()}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    You can find the barcode number printed below the barcode lines on product packaging. 
                    It's usually 8-13 digits long.
                  </p>
                </div>
              </div>
            )}

            {/* Product Found */}
            {productData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 border-t pt-4"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Product Found
                  </Badge>
                  <div className="flex items-center gap-2">
                    {productData.data_source && (
                      <Badge variant="outline" className="text-xs">
                        {productData.data_source}
                      </Badge>
                    )}
                    {productData.confidence && (
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(productData.confidence * 100)}% match
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex gap-3">
                    {productData.image_url && (
                      <img
                        src={productData.image_url}
                        alt={productData.name}
                        className="w-16 h-16 object-cover rounded-lg bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{productData.name}</h3>
                      {productData.brand && (
                        <p className="text-muted-foreground">{productData.brand}</p>
                      )}
                      {productData.category && (
                        <p className="text-xs text-muted-foreground">
                          Category: {productData.category}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Store Information */}
                  {productData.store_info && (
                    <div className="flex items-center gap-2 p-2 bg-background rounded border">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        {productData.store_info.stores && productData.store_info.stores.length > 0 && (
                          <p>Available at: {productData.store_info.stores.slice(0, 3).join(', ')}</p>
                        )}
                        {productData.store_info.price_range && (
                          <p>Price: {productData.store_info.price_range}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {productData.nutrition && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Calories: {productData.nutrition.calories_100g || 'N/A'}kcal/100g</div>
                      <div>Protein: {productData.nutrition.proteins_100g || 'N/A'}g/100g</div>
                      <div>Carbs: {productData.nutrition.carbohydrates_100g || 'N/A'}g/100g</div>
                      <div>Fat: {productData.nutrition.fat_100g || 'N/A'}g/100g</div>
                    </div>
                  )}

                  {productData.ingredients && (
                    <div>
                      <p className="text-sm font-medium">Ingredients:</p>
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {productData.ingredients}
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Comparison */}
                {pricing && (
                  <ProductPriceCard 
                    pricing={pricing} 
                    productName={productData.name} 
                  />
                )}

                <div>
                  <Label htmlFor="serving">Serving Size (grams)</Label>
                  <Input
                    id="serving"
                    type="number"
                    value={servingWeight}
                    onChange={(e) => setServingWeight(Number(e.target.value))}
                    className="mt-1"
                    min="1"
                    max="2000"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddProduct} className="flex-1 gap-2">
                    <Zap className="h-4 w-4" />
                    Add to Meal
                  </Button>
                  <Button variant="outline" onClick={handleRetry}>
                    Retry
                  </Button>
                </div>
              </motion.div>
            )}

            {/* No Product Found */}
            {productData === null && !loading && !isScanning && scanMode === 'manual' && manualBarcode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3 border-t pt-4"
              >
                <div className="text-muted-foreground flex items-center gap-2 justify-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>Product not found in any database</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Help us expand our database by adding this product manually
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setLastScannedBarcode(manualBarcode);
                      setShowProductNotFound(true);
                    }}
                    className="flex-1"
                  >
                    Add Product Manually
                  </Button>
                  <Button variant="outline" onClick={handleRetry}>
                    Try Different Barcode
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <ApiKeyManager 
        isOpen={showApiManager} 
        onClose={() => setShowApiManager(false)} 
      />

      <ProductNotFoundDialog
        isOpen={showProductNotFound}
        barcode={lastScannedBarcode}
        onClose={() => setShowProductNotFound(false)}
        onProductAdded={handleManualProductAdded}
      />
    </AnimatePresence>
  );
};