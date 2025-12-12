import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Clock, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistance, formatTime, formatPace } from '@/utils/runFormatters';

interface RunCompletionCelebrationProps {
  distance_m: number;
  moving_time_s: number;
  avg_pace_sec_per_km: number;
  calories: number;
  activityType: 'run' | 'walk';
  unit: 'km' | 'mi';
  onComplete: () => void;
}

export const RunCompletionCelebration = ({
  distance_m,
  moving_time_s,
  avg_pace_sec_per_km,
  calories,
  activityType,
  unit,
  onComplete,
}: RunCompletionCelebrationProps) => {
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    // Show stats after initial celebration
    const statsTimer = setTimeout(() => {
      setShowStats(true);
    }, 800);

    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(statsTimer);
      clearTimeout(dismissTimer);
    };
  }, [onComplete]);

  // Generate confetti particles
  const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['#FF4D4D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFD700', '#FF6B6B'][Math.floor(Math.random() * 8)],
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  const isWalk = activityType === 'walk';
  const activityEmoji = isWalk ? '🚶' : '🏃';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
        onClick={onComplete}
      >
        {/* Confetti */}
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute rounded-sm"
            style={{
              backgroundColor: piece.color,
              left: `${piece.x}%`,
              top: '-5%',
              width: piece.size,
              height: piece.size,
            }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{
              y: '120vh',
              rotate: piece.rotation + 720,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: 'linear',
            }}
          />
        ))}

        {/* Burst effect behind trophy */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.3, 0] }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`absolute w-64 h-64 rounded-full ${isWalk ? 'bg-green-500' : 'bg-blue-500'}`}
        />

        {/* Main Content */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="relative bg-card border-2 border-primary rounded-3xl p-8 shadow-2xl max-w-sm mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow Effect */}
          <div className={`absolute inset-0 rounded-3xl blur-xl ${isWalk ? 'bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20' : 'bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20'}`} />
          
          <div className="relative text-center space-y-5">
            {/* Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className={`text-3xl font-black text-transparent bg-clip-text ${isWalk ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-blue-400 to-cyan-500'}`}>
                {isWalk ? 'WALK COMPLETE!' : 'RUN COMPLETE!'} {activityEmoji}
              </h2>
            </motion.div>

            {/* Trophy Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.3, type: 'spring', damping: 10 }}
              className="flex justify-center"
            >
              <div className={`p-5 rounded-full ${isWalk ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-cyan-600'} shadow-lg`}>
                <Trophy className="h-16 w-16 text-white" />
              </div>
            </motion.div>

            {/* Stats Grid */}
            <AnimatePresence>
              {showStats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {/* Distance */}
                  <div className="p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-xl font-bold">
                      {formatDistance(distance_m, unit)}
                    </div>
                    <div className="text-xs text-muted-foreground">Distance</div>
                  </div>

                  {/* Time */}
                  <div className="p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-xl font-bold">
                      {formatTime(moving_time_s)}
                    </div>
                    <div className="text-xs text-muted-foreground">Time</div>
                  </div>

                  {/* Pace */}
                  <div className="p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-xl font-bold">
                      {formatPace(avg_pace_sec_per_km, unit)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Pace</div>
                  </div>

                  {/* Calories */}
                  <div className="p-3 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-sm">🔥</span>
                    </div>
                    <div className="text-xl font-bold">
                      {calories}
                    </div>
                    <div className="text-xs text-muted-foreground">Calories</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <Button
                size="lg"
                onClick={onComplete}
                className={`w-full ${isWalk ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' : 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700'}`}
              >
                View Summary
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
