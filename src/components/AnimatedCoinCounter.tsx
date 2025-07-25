import React, { useState, useEffect } from 'react';
import { audioManager } from '@/utils/audioUtils';

interface AnimatedCoinCounterProps {
  finalAmount: number;
  duration?: number;
  decimals?: number;
  onComplete?: () => void;
}

export const AnimatedCoinCounter: React.FC<AnimatedCoinCounterProps> = ({
  finalAmount,
  duration = 2000,
  decimals = 3,
  onComplete
}) => {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated && finalAmount > 0) {
      setHasAnimated(true);
      setCurrentAmount(0);

      const startTime = Date.now();
      const endTime = startTime + duration;

      const updateCounter = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        
        // Easing function for smooth animation (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = finalAmount * easeOut;
        
        setCurrentAmount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          setCurrentAmount(finalAmount);
          // Play cash payout sound when animation completes
          audioManager.playCashPayout();
          onComplete?.();
        }
      };

      requestAnimationFrame(updateCounter);
    }
  }, [finalAmount, duration, hasAnimated, onComplete]);

  const formatAmount = (amount: number) => {
    return amount.toFixed(decimals);
  };

  return (
    <span className="font-bold text-yellow-600 tabular-nums">
      +{formatAmount(currentAmount)} coins
    </span>
  );
};