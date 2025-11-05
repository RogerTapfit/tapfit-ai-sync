import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PRCelebrationProps {
  isVisible: boolean;
  machineName: string;
  oldPR: number;
  newPR: number;
  improvement: number;
  coinsEarned: number;
  onClose: () => void;
}

export const PRCelebration: React.FC<PRCelebrationProps> = ({
  isVisible,
  machineName,
  oldPR,
  newPR,
  improvement,
  coinsEarned,
  onClose
}) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; rotation: number; color: string }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        rotation: Math.random() * 360,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'][Math.floor(Math.random() * 5)]
      }));
      setConfetti(particles);

      // Clear confetti after animation
      setTimeout(() => setConfetti([]), 3000);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Confetti */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ x: `${particle.x}vw`, y: '-10vh', rotate: 0 }}
              animate={{
                y: '110vh',
                rotate: particle.rotation,
                x: `${particle.x + (Math.random() - 0.5) * 30}vw`
              }}
              transition={{
                duration: 2 + Math.random(),
                ease: 'linear'
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ backgroundColor: particle.color }}
            />
          ))}

          {/* PR Card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', duration: 0.6 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10"
          >
            <Card className="w-[90vw] max-w-md border-2 border-primary shadow-2xl">
              <CardContent className="p-6 text-center space-y-4">
                {/* Trophy Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="flex justify-center"
                >
                  <div className="relative">
                    <Trophy className="h-20 w-20 text-yellow-500" />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-yellow-500/20 blur-xl"
                    />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-3xl font-bold text-primary mb-2">
                    NEW PERSONAL RECORD! 🎉
                  </h2>
                  <p className="text-lg text-muted-foreground">{machineName}</p>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-2 gap-4 py-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Previous Best</p>
                    <p className="text-2xl font-bold">{oldPR} lbs</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">New Record</p>
                    <p className="text-2xl font-bold text-primary">{newPR} lbs</p>
                  </div>
                </motion.div>

                {/* Improvement Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full"
                >
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-xl font-bold text-primary">+{improvement}%</span>
                </motion.div>

                {/* Coins Earned */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg"
                >
                  <Coins className="h-6 w-6 text-yellow-500" />
                  <span className="text-lg font-bold">+{coinsEarned} TapCoins</span>
                </motion.div>

                {/* Close Button */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button onClick={onClose} className="w-full" size="lg">
                    Continue Crushing It! 💪
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
