import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Droplet, Trash2, GlassWater, Wine, ChevronDown, ChevronUp, AlertTriangle, Camera } from 'lucide-react';
import { useWaterIntake } from '@/hooks/useWaterIntake';
import { format } from 'date-fns';
import { BEVERAGE_HYDRATION, getBeveragesByCategory } from '@/lib/beverageHydration';
import { useState } from 'react';
import { BeverageScannerModal } from './BeverageScannerModal';
import { audioManager } from '@/utils/audioUtils';

interface WaterQuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_ADD_OPTIONS = [
  { oz: 8, label: 'Glass', icon: GlassWater },
  { oz: 16, label: 'Bottle', icon: Wine },
  { oz: 32, label: 'Large', icon: Droplet },
];

const ML_PER_OZ = 29.5735;

export const WaterQuickAddModal = ({ open, onOpenChange }: WaterQuickAddModalProps) => {
  const { 
    todaysIntake, 
    totalLiquids,
    dehydrationFromAlcohol,
    todaysEntries, 
    dailyGoal, 
    progressPercent, 
    addBeverage, 
    deleteEntry, 
    loading 
  } = useWaterIntake();
  
  const [showOtherBeverages, setShowOtherBeverages] = useState(false);
  const [showAlcohol, setShowAlcohol] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleQuickAdd = async (oz: number, beverageType: string = 'water') => {
    const success = await addBeverage(oz, beverageType);
    if (success) {
      audioManager.playWaterPour();
    }
  };

  const highHydrationBeverages = getBeveragesByCategory('high');
  const moderateHydrationBeverages = getBeveragesByCategory('moderate');
  const alcoholBeverages = getBeveragesByCategory('alcohol');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Droplet className="h-5 w-5 text-cyan-500" />
            Hydration Tracker
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scan Beverage Button */}
          <Button 
            variant="outline" 
            className="w-full h-14 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
            onClick={() => setShowScanner(true)}
          >
            <Camera className="h-5 w-5 mr-2 text-cyan-500" />
            <span className="text-foreground font-medium">Scan Your Beverage</span>
          </Button>

          {/* Progress Section */}
          <div className="text-center space-y-3">
            <div className="relative inline-flex items-center justify-center">
              <div className="text-4xl font-bold text-foreground">
                {todaysIntake}
                <span className="text-lg text-muted-foreground ml-1">oz</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              of {dailyGoal}oz daily goal
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{progressPercent}% complete</span>
              {totalLiquids > todaysIntake && (
                <span className="text-muted-foreground">
                  {totalLiquids}oz total liquids
                </span>
              )}
            </div>
            
            {/* Dehydration Warning */}
            {dehydrationFromAlcohol > 0 && (
              <div className="flex items-center justify-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-500">
                  Alcohol reduced hydration by {dehydrationFromAlcohol}oz today
                </span>
              </div>
            )}
          </div>

          {/* Quick Add Water Buttons */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Quick Add Water:</h4>
            <div className="grid grid-cols-3 gap-3">
              {QUICK_ADD_OPTIONS.map(({ oz, label, icon: Icon }) => (
                <Button
                  key={oz}
                  variant="outline"
                  className="flex flex-col h-20 gap-1 hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-500 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-200"
                  onClick={() => handleQuickAdd(oz, 'water')}
                >
                  <Icon className="h-5 w-5 text-cyan-500" />
                  <span className="text-sm font-medium">+{oz}oz</span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Other Beverages Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-2 hover:bg-muted"
              onClick={() => setShowOtherBeverages(!showOtherBeverages)}
            >
              <span className="text-sm font-medium text-foreground">Other Beverages</span>
              {showOtherBeverages ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {showOtherBeverages && (
              <div className="space-y-3 p-2 bg-muted/30 rounded-lg">
                {/* High Hydration */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">High Hydration (85-95%)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {highHydrationBeverages.map(({ key, name, icon: Icon, hydrationFactor, color }) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className="flex flex-col h-16 gap-1 text-xs"
                        onClick={() => handleQuickAdd(8, key)}
                      >
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="font-medium">+8oz</span>
                        <span className="text-muted-foreground">{name} ({Math.round(hydrationFactor * 100)}%)</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Moderate Hydration */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Moderate Hydration (65-90%)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {moderateHydrationBeverages.map(({ key, name, icon: Icon, hydrationFactor, color }) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className="flex flex-col h-16 gap-1 text-xs"
                        onClick={() => handleQuickAdd(8, key)}
                      >
                        <Icon className={`h-4 w-4 ${color}`} />
                        <span className="font-medium">+8oz</span>
                        <span className="text-muted-foreground">{name} ({Math.round(hydrationFactor * 100)}%)</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Alcohol Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-2 hover:bg-destructive/10"
              onClick={() => setShowAlcohol(!showAlcohol)}
            >
              <span className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alcohol (Dehydrating)
              </span>
              {showAlcohol ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {showAlcohol && (
              <div className="space-y-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Alcohol has a dehydrating effect. Track your drinks to monitor hydration impact.
                    Tip: Drink 8oz water for each alcoholic beverage.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {alcoholBeverages.map(({ key, name, icon: Icon, hydrationFactor, color, servingOz }) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      className="flex flex-col h-20 gap-0.5 text-xs border-destructive/30 hover:bg-destructive/10 px-1"
                      onClick={() => handleQuickAdd(servingOz, key)}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="font-medium">+{servingOz}oz</span>
                      <span className="text-destructive truncate w-full text-center">{name}</span>
                      <span className="text-[9px] text-muted-foreground">
                        {Math.round(Math.abs(hydrationFactor) * 100)}% dehyd.
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Today's Log */}
          {todaysEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Today's Log</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {todaysEntries.map((entry) => {
                  const beverageType = entry.beverage_type || 'water';
                  const beverage = BEVERAGE_HYDRATION[beverageType];
                  const Icon = beverage?.icon || Droplet;
                  const totalOz = Math.round((entry.total_amount_ml || entry.amount_ml) / ML_PER_OZ);
                  const effectiveOz = Math.round((entry.effective_hydration_ml || entry.amount_ml) / ML_PER_OZ);
                  const isDehydrating = entry.is_dehydrating || false;
                  
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isDehydrating ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${beverage?.color || 'text-cyan-500'}`} />
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground">
                            {totalOz}oz {beverage?.name || 'Water'}
                          </span>
                          {totalOz !== effectiveOz && (
                            <span className={`text-xs ${isDehydrating ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {isDehydrating ? '→ ' : '≈ '}{Math.abs(effectiveOz)}oz {isDehydrating ? 'dehydration' : 'hydration'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(entry.logged_at), 'h:mm a')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Beverage Scanner Modal */}
        <BeverageScannerModal
          open={showScanner}
          onOpenChange={setShowScanner}
          onAddBeverage={handleQuickAdd}
        />
      </DialogContent>
    </Dialog>
  );
};
