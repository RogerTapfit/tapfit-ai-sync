import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, X, Loader2, Barcode, Droplet, Plus } from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { WaterQualityCard } from './WaterQualityCard';
import { findWaterByBarcode, findWaterByName, WaterProduct } from '@/services/waterQualityDatabase';
import { BEVERAGE_HYDRATION, BeverageType } from '@/lib/beverageHydration';
import { toast } from 'sonner';

interface BeverageScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBeverage: (oz: number, beverageType: string) => void;
}

type ScanMode = 'camera' | 'manual' | 'result';

interface ScanResult {
  isWater: boolean;
  waterProduct?: WaterProduct;
  beverageType?: string;
  beverageInfo?: BeverageType;
  productName?: string;
  servingOz?: number;
}

export const BeverageScannerModal = ({ open, onOpenChange, onAddBeverage }: BeverageScannerModalProps) => {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isScanning, loading, startScanning, stopScanning, productData } = useBarcodeScanner();

  // Start camera when modal opens in camera mode
  useEffect(() => {
    if (open && mode === 'camera' && videoRef.current && !isScanning) {
      startScanning(videoRef.current);
    }
    
    return () => {
      if (isScanning) {
        stopScanning(videoRef.current || undefined);
      }
    };
  }, [open, mode, isScanning, startScanning, stopScanning]);

  // Process barcode when product data is received
  useEffect(() => {
    if (productData) {
      processProduct('', productData.name || '');
    }
  }, [productData]);

  const processProduct = async (barcode: string, productName: string) => {
    setIsAnalyzing(true);
    stopScanning(videoRef.current || undefined);
    
    try {
      // First check our water database by barcode
      let waterProduct = findWaterByBarcode(barcode);
      
      // If not found by barcode, try by name
      if (!waterProduct && productName) {
        waterProduct = findWaterByName(productName);
      }

      // Check if product name indicates water
      const isWaterProduct = waterProduct || 
        productName.toLowerCase().includes('water') ||
        productName.toLowerCase().includes('spring') ||
        productName.toLowerCase().includes('mineral');

      if (waterProduct) {
        setScanResult({
          isWater: true,
          waterProduct,
          servingOz: waterProduct.serving_size_oz || 16.9
        });
      } else if (isWaterProduct) {
        // Generic water product not in database
        setScanResult({
          isWater: true,
          productName,
          servingOz: 16.9
        });
      } else {
        // Check if it's a known beverage type
        const matchedBeverage = findMatchingBeverage(productName);
        if (matchedBeverage) {
          setScanResult({
            isWater: false,
            beverageType: matchedBeverage.key,
            beverageInfo: matchedBeverage,
            productName,
            servingOz: matchedBeverage.servingOz
          });
        } else {
          // Default to generic beverage
          setScanResult({
            isWater: false,
            productName,
            servingOz: 12
          });
        }
      }
      
      setMode('result');
    } catch (error) {
      console.error('Error processing product:', error);
      toast.error('Could not analyze product');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const findMatchingBeverage = (name: string): (BeverageType & { key: string }) | null => {
    const nameLower = name.toLowerCase();
    
    for (const [key, beverage] of Object.entries(BEVERAGE_HYDRATION)) {
      if (nameLower.includes(beverage.name.toLowerCase()) || 
          beverage.name.toLowerCase().includes(nameLower)) {
        return { ...beverage, key };
      }
    }

    // Check for common beverage keywords
    if (nameLower.includes('coffee')) return { ...BEVERAGE_HYDRATION.coffee, key: 'coffee' };
    if (nameLower.includes('tea')) return { ...BEVERAGE_HYDRATION.tea, key: 'tea' };
    if (nameLower.includes('juice')) return { ...BEVERAGE_HYDRATION.juice, key: 'juice' };
    if (nameLower.includes('soda') || nameLower.includes('cola') || nameLower.includes('pepsi')) 
      return { ...BEVERAGE_HYDRATION.soda, key: 'soda' };
    if (nameLower.includes('energy') || nameLower.includes('monster') || nameLower.includes('red bull')) 
      return { ...BEVERAGE_HYDRATION.energy_drink, key: 'energy_drink' };
    if (nameLower.includes('beer') || nameLower.includes('lager') || nameLower.includes('ale')) 
      return { ...BEVERAGE_HYDRATION.beer, key: 'beer' };
    if (nameLower.includes('wine')) 
      return { ...BEVERAGE_HYDRATION.wine, key: 'wine' };
    if (nameLower.includes('milk')) 
      return { ...BEVERAGE_HYDRATION.milk, key: 'milk' };
    if (nameLower.includes('smoothie')) 
      return { ...BEVERAGE_HYDRATION.smoothie, key: 'smoothie' };
    if (nameLower.includes('sports') || nameLower.includes('gatorade') || nameLower.includes('powerade')) 
      return { ...BEVERAGE_HYDRATION.sports_drink, key: 'sports_drink' };

    return null;
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      processProduct(manualBarcode.trim(), '');
    }
  };

  const handleAddToLog = () => {
    if (!scanResult) return;

    const oz = scanResult.servingOz || 16;
    const beverageType = scanResult.isWater ? 'water' : (scanResult.beverageType || 'water');
    
    onAddBeverage(oz, beverageType);
    toast.success(`Added ${oz}oz ${scanResult.isWater ? 'water' : scanResult.beverageInfo?.name || 'beverage'} to log`);
    handleClose();
  };

  const handleClose = () => {
    stopScanning(videoRef.current || undefined);
    setMode('camera');
    setScanResult(null);
    setManualBarcode('');
    onOpenChange(false);
  };

  const handleRescan = () => {
    setScanResult(null);
    setMode('camera');
    if (videoRef.current) {
      startScanning(videoRef.current);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Camera className="h-5 w-5 text-cyan-500" />
            Scan Beverage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera/Scanning Mode */}
          {mode === 'camera' && (
            <>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-32 border-2 border-cyan-500 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500" />
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-2 h-0.5 bg-cyan-500 animate-pulse top-1/2" />
                  </div>
                </div>
                {(loading || isAnalyzing) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto" />
                      <p className="text-sm text-white">
                        {isAnalyzing ? 'Analyzing product...' : 'Scanning barcode...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Point camera at barcode on bottle or can
              </p>

              {/* Manual entry option */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Or enter barcode manually:</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter barcode number"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleManualSubmit} disabled={!manualBarcode.trim()}>
                    <Barcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Result Mode */}
          {mode === 'result' && scanResult && (
            <div className="space-y-4">
              {/* Water Product - Show Quality Card */}
              {scanResult.isWater && scanResult.waterProduct && (
                <WaterQualityCard water={scanResult.waterProduct} />
              )}

              {/* Water but not in database */}
              {scanResult.isWater && !scanResult.waterProduct && (
                <div className="text-center space-y-3 p-4 rounded-lg bg-muted/30">
                  <Droplet className="h-12 w-12 text-cyan-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {scanResult.productName || 'Water'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Water product detected. Detailed quality data not available for this brand.
                    </p>
                  </div>
                </div>
              )}

              {/* Non-water beverage */}
              {!scanResult.isWater && (
                <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                  {scanResult.beverageInfo && (
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${scanResult.beverageInfo.color} bg-opacity-20`}>
                        <scanResult.beverageInfo.icon className={`h-6 w-6 ${scanResult.beverageInfo.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {scanResult.productName || scanResult.beverageInfo.name}
                        </h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {scanResult.beverageInfo.category} beverage
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {scanResult.beverageInfo && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Hydration Factor</p>
                        <p className="font-semibold text-foreground">
                          {Math.round(scanResult.beverageInfo.hydrationFactor * 100)}%
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Calories</p>
                        <p className="font-semibold text-foreground">
                          {scanResult.beverageInfo.calories} per serving
                        </p>
                      </div>
                      {scanResult.beverageInfo.sugar !== undefined && (
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-muted-foreground">Sugar</p>
                          <p className="font-semibold text-foreground">
                            {scanResult.beverageInfo.sugar}g
                          </p>
                        </div>
                      )}
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground">Serving Size</p>
                        <p className="font-semibold text-foreground">
                          {scanResult.servingOz}oz
                        </p>
                      </div>
                    </div>
                  )}

                  {!scanResult.beverageInfo && (
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">
                        {scanResult.productName || 'Beverage'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Beverage detected - will be logged with estimated hydration
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleRescan}>
                  Scan Again
                </Button>
                <Button className="flex-1" onClick={handleAddToLog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {scanResult.servingOz}oz
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
