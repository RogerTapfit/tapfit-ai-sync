import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

interface RPEMeterProps {
  rpe: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const getRPEColor = (rpe: number) => {
  if (rpe <= 3) return 'text-green-500';
  if (rpe <= 6) return 'text-yellow-500';
  if (rpe <= 8) return 'text-orange-500';
  return 'text-red-500';
};

const getRPEColorClass = (rpe: number) => {
  if (rpe <= 3) return 'bg-green-500';
  if (rpe <= 6) return 'bg-yellow-500';
  if (rpe <= 8) return 'bg-orange-500';
  return 'bg-red-500';
};

const getRPELabel = (rpe: number) => {
  if (rpe <= 3) return 'Light';
  if (rpe <= 6) return 'Moderate';
  if (rpe <= 8) return 'Hard';
  return 'Max';
};

export const RPEMeter = ({ rpe, showLabel = true, size = 'md' }: RPEMeterProps) => {
  const percentage = (rpe / 10) * 100;
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className="flex items-center gap-2">
      <Zap className={`${iconSize} ${getRPEColor(rpe)}`} fill="currentColor" />
      <div className="flex-1 min-w-[60px] relative">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div 
            className={`h-full transition-all ${getRPEColorClass(rpe)}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className={`flex items-center gap-1.5 ${textSize}`}>
        <span className={`font-semibold ${getRPEColor(rpe)}`}>
          {rpe.toFixed(1)}
        </span>
        {showLabel && (
          <span className="text-muted-foreground">
            / 10 ({getRPELabel(rpe)})
          </span>
        )}
      </div>
    </div>
  );
};
