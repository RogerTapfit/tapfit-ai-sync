import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, X, Loader2, Barcode, Droplet, Plus, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { WaterQualityCard } from './WaterQualityCard';
import { BeverageNutritionCard } from './BeverageNutritionCard';
import { findWaterByBarcode, findWaterByName, WaterProduct } from '@/services/waterQualityDatabase';
import { BEVERAGE_HYDRATION, BeverageType } from '@/lib/beverageHydration';
import { PriceLookupService, PriceLookupResult } from '@/services/priceLookupService';
import { ProductPriceCard } from './ProductPriceCard';
import { ScannerControls } from './ScannerControls';
import { toast } from 'sonner';

interface BeverageScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBeverage: (oz: number, beverageType: string) => void;
}

type ScanMode = 'camera' | 'manual' | 'result';

interface ServingData {
  servingSizeLabel: string;
  servingOz: number;
  maxServings: number;
  perServingNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar: number;
    alcoholContent?: number;
    // Micronutrients
    sodium_mg?: number;
    caffeine_mg?: number;
    calcium_mg?: number;
    potassium_mg?: number;
    iron_mg?: number;
    // Vitamins
    vitamin_a_mcg?: number;
    vitamin_c_mg?: number;
    vitamin_d_mcg?: number;
    vitamin_b6_mg?: number;
    vitamin_b12_mcg?: number;
    niacin_mg?: number;
    riboflavin_mg?: number;
    thiamin_mg?: number;
    biotin_mcg?: number;
    pantothenic_acid_mg?: number;
    // Minerals
    magnesium_mg?: number;
    zinc_mg?: number;
    chromium_mcg?: number;
  };
}

interface ScanResult {
  isWater: boolean;
  waterProduct?: WaterProduct;
  beverageType?: string;
  beverageInfo?: BeverageType;
  productName?: string;
  servingOz?: number;
  barcode?: string;
  servingData?: ServingData;
  productImage?: string;
}

export const BeverageScannerModal = ({ open, onOpenChange, onAddBeverage }: BeverageScannerModalProps) => {
  const [mode, setMode] = useState<ScanMode>('camera');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pricing, setPricing] = useState<PriceLookupResult | null>(null);
  const [isManualScanning, setIsManualScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleScanNow = async () => {
    setIsManualScanning(true);
    await scanNow(videoRef.current || undefined);
    setTimeout(() => setIsManualScanning(false), 1000);
  };
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    isScanning,
    loading,
    error,
    scannerStatus,
    startScanning,
    stopScanning,
    scanNow,
    productData,
    lastBarcode,
    fetchProductData,
    torchSupported,
    torchOn,
    toggleTorch,
    zoomSupported,
    currentZoom,
    maxZoom,
    setZoom,
  } = useBarcodeScanner();

  // Start camera when modal opens in camera mode
  useEffect(() => {
    let mounted = true;

    const initCamera = async () => {
      // Small delay to ensure video element is mounted
      await new Promise((r) => setTimeout(r, 100));

      if (!mounted) return;

      // Only start scanning when the modal opens (or when user switches back to camera mode).
      // Do NOT depend on isScanning here, otherwise the scanner can auto-restart right after a detection
      // and clear lastBarcode before the processing effect runs.
      if (open && mode === 'camera' && videoRef.current) {
        console.log('📷 BeverageScannerModal: Initializing camera...');
        startScanning(videoRef.current);
      }
    };

    if (open && mode === 'camera') {
      initCamera();
    }

    return () => {
      mounted = false;
      stopScanning(videoRef.current || undefined);
    };
  }, [open, mode]);

  // Process barcode when detected
  useEffect(() => {
    if (!lastBarcode) return;
    
    const process = async () => {
      // Capture image from video for Deep Seek
      let imageData: string | null = null;
      if (videoRef.current) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            imageData = canvas.toDataURL('image/jpeg', 0.8);
            setCapturedImage(imageData);
          }
        } catch (e) {
          console.warn('Could not capture video frame:', e);
        }
      }
      
      const product = await fetchProductData(lastBarcode);
      processProduct(lastBarcode, product?.name || '', product, imageData);
    };
    
    process();
  }, [lastBarcode]);

  const processProduct = async (barcode: string, productName: string, product?: typeof productData | null, productImage?: string | null) => {
    const resolvedProduct = product ?? productData;

    setIsAnalyzing(true);
    setPricing(null);
    stopScanning(videoRef.current || undefined);

    try {
      // First check our water database by barcode
      let waterProduct = findWaterByBarcode(barcode);

      // If not found by barcode, try by name
      if (!waterProduct && productName) {
        waterProduct = findWaterByName(productName);
      }

      // Check if product name indicates water
      const isWaterProduct =
        waterProduct ||
        productName.toLowerCase().includes('water') ||
        productName.toLowerCase().includes('spring') ||
        productName.toLowerCase().includes('mineral');

      // Fetch pricing data
      const pricingData = await PriceLookupService.lookupPrice(barcode, productName);
      if (pricingData) {
        setPricing(pricingData);
      }

      if (waterProduct) {
        setScanResult({
          isWater: true,
          waterProduct,
          servingOz: waterProduct.serving_size_oz || 16.9,
          barcode,
          productImage: productImage || capturedImage || undefined,
        });
      } else if (isWaterProduct) {
        // Generic water product not in database
        setScanResult({
          isWater: true,
          productName,
          servingOz: 16.9,
          barcode,
          productImage: productImage || capturedImage || undefined,
        });
      } else {
        // Check if it's a known beverage type
        const matchedBeverage = findMatchingBeverage(productName);
        const nutrition = resolvedProduct?.nutrition;

        // Helper to parse container size from product name
        const parseContainerMlFromName = (name: string): number | null => {
          const literMatch = name.match(/([\d.]+)\s*l(?:iter)?s?\b/i);
          if (literMatch) return parseFloat(literMatch[1]) * 1000;
          const mlMatch = name.match(/([\d.]+)\s*ml/i);
          if (mlMatch) return parseFloat(mlMatch[1]);
          const ozMatch = name.match(/([\d.]+)\s*(?:fl\.?\s*)?oz/i);
          if (ozMatch) return parseFloat(ozMatch[1]) * 29.57;
          return null;
        };

        // Get container size from product data OR parse from name
        let containerMl = resolvedProduct?.product_quantity_ml || 0;
        if (!containerMl && productName) {
          containerMl = parseContainerMlFromName(productName) || 0;
        }

        // If matched beverage found, use its known nutrition values
        if (matchedBeverage) {
          const knownServingOz = matchedBeverage.servingOz;
          const knownServingMl = knownServingOz * 29.57;

          // Calculate max servings from container size
          let maxServings = 1;
          if (containerMl > 0) {
            maxServings = Math.round(containerMl / knownServingMl);
          } else if (resolvedProduct?.servings_per_container) {
            maxServings = resolvedProduct.servings_per_container;
          }
          maxServings = Math.max(1, maxServings);

          const servingSizeLabel = `${knownServingOz}oz glass`;

          const perServingNutrition = {
            calories: matchedBeverage.calories,
            protein: matchedBeverage.protein,
            carbs: matchedBeverage.carbs,
            fat: matchedBeverage.fat,
            sugar: matchedBeverage.sugar,
            alcoholContent: matchedBeverage.alcoholContent,
          };

          const servingData: ServingData = {
            servingSizeLabel,
            servingOz: knownServingOz,
            maxServings,
            perServingNutrition,
          };

          setScanResult({
            isWater: false,
            beverageType: matchedBeverage.key,
            beverageInfo: matchedBeverage,
            productName,
            servingOz: knownServingOz,
            barcode,
            servingData,
            productImage: productImage || capturedImage || undefined,
          });
        } else {
          // Unknown beverage - use API data or defaults
          const servingMl = resolvedProduct?.serving_quantity_ml;
          const servingOz = servingMl ? Math.round((servingMl / 29.57) * 10) / 10 : 12;
          const maxServings = resolvedProduct?.servings_per_container || 1;
          const servingSizeLabel = resolvedProduct?.serving_size || `${servingOz}oz`;

          // Prioritize per-serving values, then scale from 100g
          const scaleFactor = servingMl ? servingMl / 100 : (servingOz * 29.57) / 100;

          const perServingNutrition = {
            calories:
              nutrition?.calories_serving ??
              (nutrition?.calories_100g ? Math.round(nutrition.calories_100g * scaleFactor) : 0),
            protein:
              nutrition?.proteins_serving ??
              (nutrition?.proteins_100g ? Math.round(nutrition.proteins_100g * scaleFactor * 10) / 10 : 0),
            carbs:
              nutrition?.carbohydrates_serving ??
              (nutrition?.carbohydrates_100g ? Math.round(nutrition.carbohydrates_100g * scaleFactor) : 0),
            fat:
              nutrition?.fat_serving ??
              (nutrition?.fat_100g ? Math.round(nutrition.fat_100g * scaleFactor * 10) / 10 : 0),
            sugar:
              nutrition?.sugars_serving ??
              (nutrition?.sugars_100g ? Math.round(nutrition.sugars_100g * scaleFactor) : 0),
            alcoholContent: nutrition?.alcohol_serving ?? nutrition?.alcohol_100g,
            // Micronutrients - pass through from API data
            sodium_mg: nutrition?.sodium_mg,
            caffeine_mg: nutrition?.caffeine_mg,
            calcium_mg: nutrition?.calcium_mg,
            potassium_mg: nutrition?.potassium_mg,
            iron_mg: nutrition?.iron_mg,
            // Vitamins
            vitamin_a_mcg: nutrition?.vitamin_a_mcg,
            vitamin_c_mg: nutrition?.vitamin_c_mg,
            vitamin_d_mcg: nutrition?.vitamin_d_mcg,
            vitamin_b6_mg: nutrition?.vitamin_b6_mg,
            vitamin_b12_mcg: nutrition?.vitamin_b12_mcg,
            niacin_mg: nutrition?.niacin_mg,
            riboflavin_mg: nutrition?.riboflavin_mg,
            thiamin_mg: nutrition?.thiamin_mg,
            biotin_mcg: nutrition?.biotin_mcg,
            pantothenic_acid_mg: nutrition?.pantothenic_acid_mg,
            // Minerals
            magnesium_mg: nutrition?.magnesium_mg,
            zinc_mg: nutrition?.zinc_mg,
            chromium_mcg: nutrition?.chromium_mcg,
          };

          const beverageInfo: BeverageType = {
            name: productName || 'Beverage',
            icon: Droplet,
            hydrationFactor: 0.7,
            color: 'text-cyan-500',
            category: 'moderate',
            calories: perServingNutrition.calories,
            carbs: perServingNutrition.carbs,
            protein: perServingNutrition.protein,
            fat: perServingNutrition.fat,
            sugar: perServingNutrition.sugar,
            servingOz,
          };

          const servingData: ServingData = {
            servingSizeLabel,
            servingOz,
            maxServings,
            perServingNutrition,
          };

          setScanResult({
            isWater: false,
            beverageType: 'other',
            beverageInfo,
            productName,
            servingOz: beverageInfo.servingOz,
            barcode,
            servingData,
            productImage: productImage || capturedImage || undefined,
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

    // Wine detection by grape varieties and wine terms
    const wineGrapes = ['sauvignon', 'chardonnay', 'pinot', 'merlot', 'cabernet', 'riesling', 
      'moscato', 'malbec', 'zinfandel', 'shiraz', 'syrah', 'grenache', 'tempranillo', 
      'sangiovese', 'nebbiolo', 'viognier', 'gewurztraminer', 'prosecco', 'champagne'];
    const wineTerms = ['blanc', 'noir', 'grigio', 'gris', 'rosé', 'rose', 'bordeaux', 
      'burgundy', 'chianti', 'rioja', 'barolo', 'chablis', 'sancerre', 'beaujolais'];
    
    if (wineGrapes.some(grape => nameLower.includes(grape)) || 
        wineTerms.some(term => nameLower.includes(term)) ||
        nameLower.includes('wine')) {
      return { ...BEVERAGE_HYDRATION.wine, key: 'wine' };
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
    setPricing(null);
    setManualBarcode('');
    onOpenChange(false);
  };

  const handleRescan = () => {
    setScanResult(null);
    setPricing(null);
    setMode('camera');
    if (videoRef.current) {
      startScanning(videoRef.current);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md bg-card border-border max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Camera className="h-5 w-5 text-cyan-500" />
            Scan Beverage
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 w-full overflow-x-hidden">
          {/* Camera/Scanning Mode */}
          {mode === 'camera' && (
            <>
              <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(1)' }}
                  autoPlay
                  playsInline
                  muted
                />
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    animate={isManualScanning ? {
                      scale: [1, 1.1, 1],
                      borderColor: ['rgb(6, 182, 212)', 'rgb(34, 197, 94)', 'rgb(6, 182, 212)'],
                    } : {}}
                    transition={{ repeat: isManualScanning ? 3 : 0, duration: 0.3 }}
                    className="w-64 h-32 border-2 border-cyan-500 rounded-lg relative"
                  >
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500" />
                    
                    {/* Scanning laser line */}
                    {isManualScanning ? (
                      <motion.div
                        initial={{ top: '10%' }}
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ repeat: Infinity, duration: 0.6, ease: 'easeInOut' }}
                        className="absolute left-2 right-2 h-0.5 bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]"
                      />
                    ) : (
                      <div className="absolute inset-x-2 h-0.5 bg-cyan-500 animate-pulse top-1/2" />
                    )}
                  </motion.div>
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

               <div className="flex justify-center">
                 <Button
                   variant="secondary"
                   onClick={handleScanNow}
                   disabled={!isScanning || loading || isAnalyzing || isManualScanning || scannerStatus === 'blocked'}
                   className="gap-2"
                 >
                   {isManualScanning ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                   ) : (
                     <Target className="h-4 w-4" />
                   )}
                   {isManualScanning ? 'Scanning...' : 'Scan now'}
                 </Button>
               </div>

               {error && (
                 <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground">
                   <p>{error}</p>
                   {scannerStatus === 'blocked' && (
                     <Button
                       variant="secondary"
                       size="sm"
                       className="mt-2"
                       onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
                     >
                       Open scanner in new tab
                     </Button>
                   )}
                 </div>
               )}
               
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

              {/* Non-water beverage - Full Nutrition Card */}
              {!scanResult.isWater && scanResult.beverageInfo && (
                <BeverageNutritionCard 
                  beverageInfo={scanResult.beverageInfo}
                  productName={scanResult.productName}
                  servingOz={scanResult.servingOz}
                  servingData={scanResult.servingData}
                  barcode={scanResult.barcode}
                  productImage={scanResult.productImage}
                />
              )}

              {/* Non-water beverage without detailed info - fallback (should rarely show now) */}
              {!scanResult.isWater && !scanResult.beverageInfo && (
                <BeverageNutritionCard 
                  beverageInfo={{
                    name: scanResult.productName || 'Beverage',
                    icon: Droplet,
                    hydrationFactor: 0.7,
                    color: 'text-cyan-500',
                    category: 'moderate',
                    calories: 100,
                    carbs: 15,
                    protein: 2,
                    fat: 2,
                    sugar: 10,
                    servingOz: scanResult.servingOz || 12
                  }}
                  productName={scanResult.productName}
                  servingOz={scanResult.servingOz}
                  barcode={scanResult.barcode}
                  productImage={scanResult.productImage}
                />
              )}

              {/* Price Comparison Card */}
              {pricing && (
                <ProductPriceCard 
                  pricing={pricing} 
                  productName={scanResult.productName || scanResult.waterProduct?.name || scanResult.beverageInfo?.name || 'Product'} 
                />
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
