import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCoinsForDisplay } from '@/lib/coinUtils';

interface LevelUpAnimationProps {
  newLevel: number;
  rankTitle: string;
  rankIcon: string;
  coinsAwarded: number;
  prestigeUp?: boolean;
  prestigeLevel?: number;
  onComplete: () => void;
}

export const LevelUpAnimation = ({
  newLevel,
  rankTitle,
  rankIcon,
  coinsAwarded,
  prestigeUp,
  prestigeLevel,
  onComplete,
}: LevelUpAnimationProps) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  // Generate confetti particles
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 7)],
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onComplete}
      >
        {/* Confetti */}
        {showConfetti && confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              backgroundColor: piece.color,
              left: `${piece.x}%`,
              top: '-5%',
            }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: '120vh',
              rotate: 720,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'linear',
            }}
          />
        ))}

        {/* Main Content */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl max-w-sm mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-yellow-500/20 to-primary/20 rounded-2xl blur-xl" />
          
          <div className="relative text-center space-y-4">
            {/* Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {prestigeUp ? (
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                  PRESTIGE UP! 🌟
                </h2>
              ) : (
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-500">
                  LEVEL UP! 🎉
                </h2>
              )}
            </motion.div>

            {/* Rank Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-8xl my-6"
            >
              {rankIcon}
            </motion.div>

            {/* Level & Rank */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-1"
            >
              <p className="text-4xl font-bold">Level {newLevel}</p>
              <p className="text-xl text-primary font-semibold">{rankTitle}</p>
              {prestigeUp && (
                <p className="text-amber-500 font-bold flex items-center justify-center gap-1">
                  <Star className="h-5 w-5" />
                  Prestige {prestigeLevel}
                </p>
              )}
            </motion.div>

            {/* Coins Earned */}
            {coinsAwarded > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500/20 rounded-lg"
              >
                <Coins className="h-6 w-6 text-amber-500" />
                <span className="text-xl font-bold text-amber-500">
                  +{formatCoinsForDisplay(coinsAwarded)} Tap Coins!
                </span>
              </motion.div>
            )}

            {/* Dismiss Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                variant="glow"
                size="lg"
                onClick={onComplete}
                className="mt-4 w-full"
              >
                Continue
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
