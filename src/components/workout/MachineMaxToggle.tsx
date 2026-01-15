import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Users, Check, Dumbbell, Edit2, AlertTriangle, Camera, Coins } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WeightStackPhotoCapture } from './WeightStackPhotoCapture';
import { useWeightStack } from '@/hooks/useWeightStack';

interface MachineMaxToggleProps {
  machineName: string;
  currentWeight: number;
  specs: {
    max_weight: number | null;
    min_weight: number | null;
    contributions_count: number;
  } | null;
  userMax: {
    is_at_machine_max: boolean;
    is_at_machine_min: boolean;
  } | null;
  onContributeSpec: (maxWeight?: number, minWeight?: number) => Promise<void>;
  onUpdateUserMax: (isMax: boolean, isMin: boolean, weight?: number) => Promise<void>;
  compact?: boolean;
}

// Common weight presets
const WEIGHT_PRESETS = [150, 200, 250, 300, 350, 400, 450, 500];

export const MachineMaxToggle: React.FC<MachineMaxToggleProps> = ({
  machineName,
  currentWeight,
  specs,
  userMax,
  onContributeSpec,
  onUpdateUserMax,
  compact = false,
}) => {
  const [isAtMax, setIsAtMax] = useState(userMax?.is_at_machine_max || false);
  const [isAtMin, setIsAtMin] = useState(userMax?.is_at_machine_min || false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmType, setConfirmType] = useState<'max' | 'min' | null>(null);
  const [customWeight, setCustomWeight] = useState(currentWeight || 200);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWeightStackCapture, setShowWeightStackCapture] = useState(false);

  const { weightStack, stackData } = useWeightStack(machineName);

  const hasMaxWeight = specs?.max_weight && specs.max_weight > 0;
  const isNearMax = hasMaxWeight && currentWeight >= (specs.max_weight! * 0.9);
  const hasWeightStack = weightStack && weightStack.length > 0;

  const handleOpenSetMax = () => {
    setConfirmType('max');
    setCustomWeight(specs?.max_weight || currentWeight || 200);
    setShowConfirmDialog(true);
  };

  const handleOpenSetMin = () => {
    setConfirmType('min');
    setCustomWeight(specs?.min_weight || 10);
    setShowConfirmDialog(true);
  };

  const handleToggleMax = async (checked: boolean) => {
    if (checked) {
      handleOpenSetMax();
    } else {
      setIsAtMax(false);
      try {
        await onUpdateUserMax(false, isAtMin);
      } catch (err) {
        console.error('Error updating max status:', err);
      }
    }
  };

  const handleToggleMin = async (checked: boolean) => {
    if (checked) {
      handleOpenSetMin();
    } else {
      setIsAtMin(false);
      try {
        await onUpdateUserMax(isAtMax, false);
      } catch (err) {
        console.error('Error updating min status:', err);
      }
    }
  };

  const handleConfirmContribution = async () => {
    setIsSubmitting(true);
    try {
      if (confirmType === 'max') {
        await onContributeSpec(customWeight, undefined);
        await onUpdateUserMax(true, isAtMin, customWeight);
        setIsAtMax(true);
        toast.success(`Machine max set: ${customWeight} lbs`, {
          description: 'Thanks for contributing! This helps other users.',
          icon: <Dumbbell className="h-4 w-4" />
        });
      } else if (confirmType === 'min') {
        await onContributeSpec(undefined, customWeight);
        await onUpdateUserMax(isAtMax, true, undefined);
        setIsAtMin(true);
        toast.success(`Machine min set: ${customWeight} lbs`, {
          description: 'Thanks for contributing! This helps other users.',
          icon: <Dumbbell className="h-4 w-4" />
        });
      }
    } catch (err) {
      console.error('Error confirming contribution:', err);
      toast.error('Failed to save machine data');
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
      setConfirmType(null);
    }
  };

  // Compact mode - just show badge with edit button
  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          {hasMaxWeight ? (
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400 px-3 py-1 cursor-pointer hover:bg-orange-500/20 transition-colors"
              onClick={handleOpenSetMax}
            >
              <TrendingUp className="h-3 w-3 mr-1.5" />
              Max: {specs.max_weight} lbs
              <Edit2 className="h-3 w-3 ml-1.5 opacity-60" />
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenSetMax}
              className="h-7 text-xs bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Set Machine Max
            </Button>
          )}
          {specs?.contributions_count && specs.contributions_count > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {specs.contributions_count}
            </span>
          )}
        </div>

        {/* Dialog for compact mode */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {confirmType === 'max' ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Set Machine Maximum
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-blue-500" />
                    Set Machine Minimum
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                Set the {confirmType === 'max' ? 'maximum' : 'minimum'} weight for {machineName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Quick presets */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick Select</Label>
                <div className="grid grid-cols-4 gap-2">
                  {WEIGHT_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant={customWeight === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCustomWeight(preset)}
                      className={customWeight === preset ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom input */}
              <div className="space-y-2">
                <Label htmlFor="weight-input">
                  Or enter custom weight (lbs)
                </Label>
                <Input
                  id="weight-input"
                  type="number"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(Number(e.target.value))}
                  className="text-lg font-bold text-center"
                  step={5}
                  min={0}
                />
              </div>

              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                <Users className="h-4 w-4 inline mr-2" />
                This data helps other TapFit users know this machine's limits.
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmContribution}
                disabled={isSubmitting || customWeight <= 0}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? 'Saving...' : 'Save & Share'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Full mode - prominent display
  return (
    <>
      <div className="space-y-4 p-4 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-xl border border-orange-500/20">
        {/* Prominent Max Weight Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Machine Weight Limits</h3>
              {specs?.contributions_count && specs.contributions_count > 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Verified by {specs.contributions_count} {specs.contributions_count === 1 ? 'user' : 'users'}
                </p>
              ) : (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Be the first to set the limits!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Weight Display Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="p-4 bg-background rounded-lg border border-border cursor-pointer hover:border-orange-500/50 transition-colors group"
            onClick={handleOpenSetMax}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max Weight</span>
              <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {hasMaxWeight ? (
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {specs.max_weight}
                <span className="text-sm font-normal text-muted-foreground ml-1">lbs</span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-orange-600 dark:text-orange-400 p-0 h-auto font-semibold"
              >
                + Set Max
              </Button>
            )}
          </div>

          <div 
            className="p-4 bg-background rounded-lg border border-border cursor-pointer hover:border-blue-500/50 transition-colors group"
            onClick={handleOpenSetMin}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Min Weight</span>
              <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {specs?.min_weight ? (
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {specs.min_weight}
                <span className="text-sm font-normal text-muted-foreground ml-1">lbs</span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-blue-600 dark:text-blue-400 p-0 h-auto font-semibold"
              >
                + Set Min
              </Button>
            )}
          </div>
        </div>

        {/* Near Max Warning */}
        {isNearMax && (
          <div className="flex items-center gap-2 p-3 bg-orange-100 dark:bg-orange-950/30 rounded-lg border border-orange-500/30">
            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span className="text-sm text-orange-700 dark:text-orange-300">
              You're lifting near the machine's max ({Math.round((currentWeight / specs!.max_weight!) * 100)}%)
            </span>
          </div>
        )}

        {/* Photo Weight Stack Section */}
        <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-lg border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Camera className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Photo Weight Stack</span>
              </div>
              {hasWeightStack ? (
                <p className="text-xs text-muted-foreground">
                  {weightStack.length} weights: {weightStack[0]} - {weightStack[weightStack.length - 1]} lbs
                  {stackData?.verification_count && stackData.verification_count > 1 && (
                    <span className="ml-1 text-green-600">
                      • Verified by {stackData.verification_count}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Help us know the exact weights available
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowWeightStackCapture(true)}
              className="bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-300"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" />
              {hasWeightStack ? 'Update' : 'Earn 25'}
              {!hasWeightStack && <Coins className="h-3 w-3 ml-1" />}
            </Button>
          </div>
        </div>

        {/* Personal Status Toggles */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between flex-1 p-2 bg-background rounded-md">
            <Label htmlFor="at-max" className="text-xs flex items-center gap-1.5 cursor-pointer">
              <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
              I've maxed this machine
            </Label>
            <Switch
              id="at-max"
              checked={isAtMax}
              onCheckedChange={handleToggleMax}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>
          
          <div className="flex items-center justify-between flex-1 p-2 bg-background rounded-md">
            <Label htmlFor="at-min" className="text-xs flex items-center gap-1.5 cursor-pointer">
              <TrendingDown className="h-3.5 w-3.5 text-blue-500" />
              At minimum weight
            </Label>
            <Switch
              id="at-min"
              checked={isAtMin}
              onCheckedChange={handleToggleMin}
              className="data-[state=checked]:bg-blue-500"
            />
          </div>
        </div>

        {/* Status indicators */}
        {isAtMax && (
          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-100 dark:bg-orange-950/30 p-2 rounded-md">
            <Check className="h-3 w-3" />
            You've maxed out this machine!
          </div>
        )}
        {isAtMin && (
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-100 dark:bg-blue-950/30 p-2 rounded-md">
            <Check className="h-3 w-3" />
            You're training at minimum weight
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmType === 'max' ? (
                <>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Set Machine Maximum
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-blue-500" />
                  Set Machine Minimum
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              What's the {confirmType === 'max' ? 'highest' : 'lowest'} weight setting on {machineName}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Quick presets */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Quick Select (lbs)</Label>
              <div className="grid grid-cols-4 gap-2">
                {WEIGHT_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant={customWeight === preset ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCustomWeight(preset)}
                    className={customWeight === preset 
                      ? confirmType === 'max' 
                        ? "bg-orange-500 hover:bg-orange-600" 
                        : "bg-blue-500 hover:bg-blue-600"
                      : ""
                    }
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <div className="space-y-2">
              <Label htmlFor="weight-input">
                Or enter exact weight
              </Label>
              <div className="relative">
                <Input
                  id="weight-input"
                  type="number"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(Number(e.target.value))}
                  className="text-2xl font-bold text-center pr-12"
                  step={5}
                  min={0}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  lbs
                </span>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-2" />
              This helps other TapFit users know the weight range of this machine.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmContribution}
              disabled={isSubmitting || customWeight <= 0}
              className={confirmType === 'max' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}
            >
              {isSubmitting ? 'Saving...' : 'Save & Share'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weight Stack Photo Capture Modal */}
      <WeightStackPhotoCapture
        machineName={machineName}
        open={showWeightStackCapture}
        onOpenChange={setShowWeightStackCapture}
        onComplete={(weights, coins) => {
          toast.success(`Weight stack saved! +${coins} Tap Coins`);
        }}
      />
    </>
  );
};
