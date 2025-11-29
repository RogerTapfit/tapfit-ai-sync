import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Droplet, Trash2, GlassWater, Wine } from 'lucide-react';
import { useWaterIntake } from '@/hooks/useWaterIntake';
import { format } from 'date-fns';

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
  const { todaysIntake, todaysEntries, dailyGoal, progressPercent, addWater, deleteEntry, loading } = useWaterIntake();

  const handleQuickAdd = async (oz: number) => {
    await addWater(oz);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Droplet className="h-5 w-5 text-cyan-500" />
            Water Intake
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
            <div className="text-xs text-muted-foreground">
              {progressPercent}% complete
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {QUICK_ADD_OPTIONS.map(({ oz, label, icon: Icon }) => (
              <Button
                key={oz}
                variant="outline"
                className="flex flex-col h-20 gap-1 hover:bg-cyan-500/10 hover:border-cyan-500/50"
                onClick={() => handleQuickAdd(oz)}
              >
                <Icon className="h-5 w-5 text-cyan-500" />
                <span className="text-sm font-medium">+{oz}oz</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </Button>
            ))}
          </div>

          {/* Today's Log */}
          {todaysEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Today's Log</h4>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {todaysEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm text-foreground">
                        {Math.round(entry.amount_ml / ML_PER_OZ)}oz
                      </span>
                      <span className="text-xs text-muted-foreground">
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
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
