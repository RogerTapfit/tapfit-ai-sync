import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface XPGainToastProps {
  amount: number;
  source: string;
  currentXP: number;
  maxXP: number;
  onComplete: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  workout: 'Workout Complete!',
  meal: 'Meal Logged!',
  water: 'Water Goal Hit!',
  streak: 'Streak Bonus!',
  achievement: 'Achievement!',
  challenge: 'Challenge Complete!',
  pr: 'Personal Record!',
  body_scan: 'Body Scan!',
  action: 'Action Complete!',
};

export const XPGainToast = ({
  amount,
  source,
  currentXP,
  maxXP,
  onComplete,
}: XPGainToastProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const progress = Math.min(100, (currentXP / maxXP) * 100);
  const sourceLabel = SOURCE_LABELS[source] || source;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -30, x: '-50%' }}
          className="fixed top-4 left-1/2 z-50 pointer-events-none"
        >
          <div className="bg-card border border-primary/50 rounded-xl px-4 py-3 shadow-2xl shadow-primary/20 min-w-[200px]">
            {/* XP Amount */}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <Zap className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-2xl font-black text-primary">
                +{amount} XP
              </span>
            </motion.div>

            {/* Source */}
            <p className="text-center text-sm text-muted-foreground mb-2">
              {sourceLabel}
            </p>

            {/* Progress Bar */}
            <div className="relative">
              <Progress value={progress} className="h-2" />
              <motion.div
                initial={{ width: `${Math.max(0, progress - (amount / maxXP) * 100)}%` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-0 h-2 rounded-full bg-gradient-to-r from-primary to-yellow-500"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">
              {currentXP.toLocaleString()} / {maxXP.toLocaleString()}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
