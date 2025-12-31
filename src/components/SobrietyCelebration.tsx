import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sprout, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCoinsForDisplay } from '@/lib/coinUtils';
import { audioManager } from '@/utils/audioUtils';

interface SobrietyCelebrationProps {
  currentDay: number;
  targetDays: number;
  percentComplete: number;
  coinsEarned: number;
  substanceType?: string;
  onComplete: () => void;
}

const AFFIRMATIONS = [
  // Early days (1-3)
  { template: "The hardest step is the first one. You took it!", minDay: 1, maxDay: 3 },
  { template: "Day {day} done! You're already winning.", minDay: 1, maxDay: 3 },
  { template: "One day at a time. Today, you conquered.", minDay: 1, maxDay: 3 },
  
  // Building momentum (4-6)
  { template: "Building momentum! Day {day} is in the books.", minDay: 4, maxDay: 6 },
  { template: "You're proving to yourself what's possible.", minDay: 4, maxDay: 6 },
  { template: "{percent}% closer to your goal. Keep going!", minDay: 4, maxDay: 6 },
  
  // Week milestone
  { template: "ONE WEEK! You're rewriting your story! 🌟", minDay: 7, maxDay: 7, milestone: true },
  
  // Week 2
  { template: "Day {day}! Your discipline is inspiring.", minDay: 8, maxDay: 13 },
  { template: "Almost two weeks! You're unstoppable.", minDay: 8, maxDay: 13 },
  { template: "Every day sober is a victory. Day {day} is yours!", minDay: 8, maxDay: 13 },
  
  // Two week milestone
  { template: "TWO WEEKS of choosing yourself. Incredible! 🌟", minDay: 14, maxDay: 14, milestone: true },
  
  // Weeks 3-4
  { template: "Day {day}: Another step toward the life you deserve.", minDay: 15, maxDay: 29 },
  { template: "You're not just sober, you're thriving.", minDay: 15, maxDay: 29 },
  { template: "{remaining} days to go. You've got this!", minDay: 15, maxDay: 29 },
  { template: "Your future self is thanking you right now.", minDay: 15, maxDay: 29 },
  
  // Month milestone
  { template: "A WHOLE MONTH! You're absolutely unstoppable! 🏆", minDay: 30, maxDay: 30, milestone: true },
  
  // Beyond 30 days
  { template: "Day {day}! Your dedication is legendary.", minDay: 31, maxDay: 59 },
  { template: "Over a month strong! The best is yet to come.", minDay: 31, maxDay: 59 },
  { template: "You've built a new foundation. Day {day} and counting!", minDay: 31, maxDay: 59 },
  
  // Two month milestone
  { template: "60 DAYS! You've transformed your life! 🏆", minDay: 60, maxDay: 60, milestone: true },
  
  // Beyond 60 days
  { template: "Day {day}! You're an inspiration to everyone around you.", minDay: 61, maxDay: 89 },
  { template: "Your strength grows with each passing day.", minDay: 61, maxDay: 89 },
  
  // 90 day milestone
  { template: "90 DAYS! A quarter year of freedom! 🏆", minDay: 90, maxDay: 90, milestone: true },
  
  // Beyond 90 days
  { template: "Day {day}! You've mastered the art of self-control.", minDay: 91 },
  { template: "You're living proof that change is possible.", minDay: 91 },
  { template: "Day {day} of being the best version of yourself!", minDay: 91 },
  
  // General affirmations (can appear any time)
  { template: "You're stronger than any craving.", minDay: 1 },
  { template: "Each day is a gift you give yourself.", minDay: 1 },
  { template: "Your courage today shapes your tomorrow.", minDay: 1 },
  { template: "Freedom feels good, doesn't it? Day {day}!", minDay: 1 },
];

const getAffirmation = (currentDay: number, targetDays: number) => {
  const percent = Math.round((currentDay / targetDays) * 100);
  const remaining = targetDays - currentDay;
  
  // Filter affirmations that apply to current day
  const applicable = AFFIRMATIONS.filter(a => {
    const meetsMin = currentDay >= a.minDay;
    const meetsMax = a.maxDay === undefined || currentDay <= a.maxDay;
    return meetsMin && meetsMax;
  });
  
  // Prefer milestone affirmations if it's a milestone day
  const milestones = applicable.filter(a => a.milestone);
  const pool = milestones.length > 0 ? milestones : applicable;
  
  // Pick a random one
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  
  // Replace placeholders
  return chosen.template
    .replace('{day}', String(currentDay))
    .replace('{percent}', String(percent))
    .replace('{target}', String(targetDays))
    .replace('{remaining}', String(remaining));
};

const isMilestoneDay = (day: number) => {
  return [7, 14, 30, 60, 90, 180, 365].includes(day);
};

export const SobrietyCelebration = ({
  currentDay,
  targetDays,
  percentComplete,
  coinsEarned,
  substanceType,
  onComplete,
}: SobrietyCelebrationProps) => {
  const [affirmation] = useState(() => getAffirmation(currentDay, targetDays));
  const isMilestone = isMilestoneDay(currentDay);

  useEffect(() => {
    // Play celebratory sound immediately
    audioManager.playSobrietyCheckIn();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Generate confetti with emerald theme
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#FFD700', '#FBBF24', '#F59E0B', '#FFFFFF'][Math.floor(Math.random() * 8)],
  }));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={onComplete}
      >
        {/* Main Content - rendered first so confetti appears on top */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="relative z-[101] bg-card border-2 border-emerald-500 rounded-2xl p-8 shadow-2xl max-w-sm mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-green-400/20 to-emerald-500/20 rounded-2xl blur-xl" />
          
          <div className="relative text-center space-y-4">
            {/* Title */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">
                DAY {currentDay} COMPLETE! 🌱
              </h2>
            </motion.div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="text-8xl my-6 flex justify-center"
            >
              {isMilestone ? (
                <Trophy className="h-24 w-24 text-amber-500" />
              ) : (
                <Sprout className="h-24 w-24 text-emerald-500" />
              )}
            </motion.div>

            {/* Affirmation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <p className="text-lg text-foreground font-medium px-2">
                {affirmation}
              </p>
              {percentComplete > 0 && percentComplete < 100 && (
                <p className="text-sm text-muted-foreground">
                  {percentComplete}% to your {targetDays}-day goal
                </p>
              )}
              {percentComplete >= 100 && (
                <p className="text-sm text-emerald-500 font-semibold">
                  Goal achieved! Keep the streak going! 🎉
                </p>
              )}
            </motion.div>

            {/* Coins Earned */}
            {coinsEarned > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500/20 rounded-lg"
              >
                <Coins className="h-6 w-6 text-amber-500" />
                <span className="text-xl font-bold text-amber-500">
                  +{formatCoinsForDisplay(coinsEarned)} Tap Coins!
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
                onClick={onComplete}
                className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold"
                size="lg"
              >
                Keep Going 💪
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Confetti - rendered last to be on top of everything */}
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="fixed w-3 h-3 rounded-sm z-[200] pointer-events-none"
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
      </motion.div>
    </AnimatePresence>
  );
};
