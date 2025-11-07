import { Badge } from '@/components/ui/badge';
import { Trophy, Sparkles } from 'lucide-react';

interface PRBadgeProps {
  variant?: 'compact' | 'full' | 'celebration';
}

export const PRBadge = ({ variant = 'compact' }: PRBadgeProps) => {
  if (variant === 'celebration') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <Trophy className="h-4 w-4 text-yellow-500" fill="currentColor" />
        <span className="text-sm font-semibold text-yellow-500">New PR!</span>
        <Sparkles className="h-4 w-4 text-yellow-500" />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <Badge variant="outline" className="gap-1 border-yellow-500/30 text-yellow-500 bg-yellow-500/10">
        <Trophy className="h-3 w-3" fill="currentColor" />
        <span>Personal Record</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-yellow-500/30 text-yellow-500 bg-yellow-500/10 h-5 px-1.5">
      <Trophy className="h-2.5 w-2.5" fill="currentColor" />
      <span className="text-xs">PR</span>
    </Badge>
  );
};
