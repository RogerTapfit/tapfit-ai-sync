import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
}

export const MachineMaxToggle: React.FC<MachineMaxToggleProps> = ({
  machineName,
  currentWeight,
  specs,
  userMax,
  onContributeSpec,
  onUpdateUserMax,
}) => {
  const [isAtMax, setIsAtMax] = useState(userMax?.is_at_machine_max || false);
  const [isAtMin, setIsAtMin] = useState(userMax?.is_at_machine_min || false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmType, setConfirmType] = useState<'max' | 'min' | null>(null);
  const [customWeight, setCustomWeight] = useState(currentWeight);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleMax = async (checked: boolean) => {
    if (checked) {
      setConfirmType('max');
      setCustomWeight(currentWeight);
      setShowConfirmDialog(true);
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
      setConfirmType('min');
      setCustomWeight(currentWeight);
      setShowConfirmDialog(true);
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
      // Contribute to crowdsourced data
      if (confirmType === 'max') {
        await onContributeSpec(customWeight, undefined);
        await onUpdateUserMax(true, isAtMin, customWeight);
        setIsAtMax(true);
        toast.success(`Machine max recorded: ${customWeight} lbs`, {
          description: 'Thanks for contributing! This helps other users.',
          icon: <Users className="h-4 w-4" />
        });
      } else if (confirmType === 'min') {
        await onContributeSpec(undefined, customWeight);
        await onUpdateUserMax(isAtMax, true, undefined);
        setIsAtMin(true);
        toast.success(`Machine min recorded: ${customWeight} lbs`, {
          description: 'Thanks for contributing! This helps other users.',
          icon: <Users className="h-4 w-4" />
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

  return (
    <>
      <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Machine Weight Limits</span>
          {specs?.contributions_count && specs.contributions_count > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              {specs.contributions_count} {specs.contributions_count === 1 ? 'user' : 'users'} verified
            </Badge>
          )}
        </div>

        {/* Crowdsourced specs display */}
        {(specs?.max_weight || specs?.min_weight) && (
          <div className="flex gap-4 text-xs">
            {specs.min_weight && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingDown className="h-3 w-3" />
                Min: {specs.min_weight} lbs
              </div>
            )}
            {specs.max_weight && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Max: {specs.max_weight} lbs
              </div>
            )}
          </div>
        )}

        {/* User toggles */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center justify-between flex-1 p-2 bg-background rounded-md">
            <Label htmlFor="at-max" className="text-xs flex items-center gap-1.5 cursor-pointer">
              <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
              At Machine Max
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
              At Machine Min
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
            You've maxed out this machine at {specs?.max_weight || currentWeight} lbs
          </div>
        )}
        {isAtMin && (
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-100 dark:bg-blue-950/30 p-2 rounded-md">
            <Check className="h-3 w-3" />
            You're at the minimum weight on this machine
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
                  Confirm Machine Maximum
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-blue-500" />
                  Confirm Machine Minimum
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Help other users by confirming the {confirmType === 'max' ? 'maximum' : 'minimum'} weight on {machineName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight-input">
                {confirmType === 'max' ? 'Maximum' : 'Minimum'} Weight (lbs)
              </Label>
              <Input
                id="weight-input"
                type="number"
                value={customWeight}
                onChange={(e) => setCustomWeight(Number(e.target.value))}
                className="text-lg"
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-2" />
              This data will be shared anonymously to help other TapFit users know the weight range of this machine.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmContribution}
              disabled={isSubmitting}
              className={confirmType === 'max' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}
            >
              {isSubmitting ? 'Saving...' : 'Confirm & Share'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
