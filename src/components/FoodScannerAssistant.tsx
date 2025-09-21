import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RobotAvatarDisplay } from './RobotAvatarDisplay';
import { useRobotAvatar } from '@/hooks/useRobotAvatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MessageCircle } from 'lucide-react';

interface AssistantMessage {
  id: string;
  text: string;
  emotion: 'happy' | 'excited' | 'focused' | 'celebrating' | 'scanning';
  pose: 'idle' | 'scan_mode' | 'victory' | 'workout';
  duration?: number;
}

interface FoodScannerAssistantProps {
  currentState: 'initial' | 'photos_added' | 'analyzing' | 'results' | 'recipe_mode' | 'ingredient_analysis';
  photoCount?: number;
  hasResults?: boolean;
  recipeCount?: number;
}

export const FoodScannerAssistant: React.FC<FoodScannerAssistantProps> = ({
  currentState,
  photoCount = 0,
  hasResults = false,
  recipeCount = 0
}) => {
  const { avatarData } = useRobotAvatar();
  const [currentMessage, setCurrentMessage] = useState<AssistantMessage | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Define contextual messages based on state
  const getContextualMessage = (state: string): AssistantMessage => {
    const messages: { [key: string]: AssistantMessage } = {
      initial: {
        id: 'welcome',
        text: "Hi! I'm here to help you analyze your food and discover amazing recipes! 🍽️",
        emotion: 'happy',
        pose: 'idle',
        duration: 5000
      },
      photos_added: {
        id: 'photos',
        text: `Great photos! I can see ${photoCount} image${photoCount !== 1 ? 's' : ''}. Ready to analyze them with AI? 📸`,
        emotion: 'excited',
        pose: 'scan_mode',
        duration: 4000
      },
      analyzing: {
        id: 'analyzing',
        text: "Analyzing your food with advanced AI vision... This is exciting! 🤖✨",
        emotion: 'scanning',
        pose: 'scan_mode',
        duration: 0
      },
      results: {
        id: 'results',
        text: "Amazing! I've analyzed your food and provided detailed nutrition info! 🎉",
        emotion: 'celebrating',
        pose: 'victory',
        duration: 4000
      },
      recipe_mode: {
        id: 'recipe',
        text: "Let's find some delicious recipes you can make with your ingredients! 👨‍🍳",
        emotion: 'excited',
        pose: 'workout',
        duration: 4000
      },
      ingredient_analysis: {
        id: 'ingredients',
        text: `Fantastic! I found ingredients and ${recipeCount} healthy recipe${recipeCount !== 1 ? 's' : ''} for you! 🥗`,
        emotion: 'celebrating',
        pose: 'victory',
        duration: 5000
      }
    };

    return messages[state] || messages.initial;
  };

  // Auto-update messages based on state changes
  useEffect(() => {
    const newMessage = getContextualMessage(currentState);
    setCurrentMessage(newMessage);

    // Auto-hide temporary messages
    if (newMessage.duration && newMessage.duration > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage(null);
      }, newMessage.duration);

      return () => clearTimeout(timer);
    }
  }, [currentState, photoCount, recipeCount]);

  // Additional helpful tips that rotate
  const helpfulTips = [
    "💡 Tip: Take photos from different angles for better analysis!",
    "🔍 Try scanning nutrition labels for more accurate data!",
    "🥗 The Recipe Builder can suggest healthy meals from your ingredients!",
    "📱 Multiple photos help me understand portion sizes better!",
    "⚡ I can analyze both home-cooked meals and packaged foods!"
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  // Rotate tips every 10 seconds when no specific message is showing
  useEffect(() => {
    if (!currentMessage) {
      const interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % helpfulTips.length);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [currentMessage, helpfulTips.length]);

  if (!isVisible || !avatarData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
    >
      <div className="relative">
        {/* Speech Bubble */}
        <AnimatePresence mode="wait">
          {!isMinimized && (currentMessage || !currentMessage) && (
            <motion.div
              key={currentMessage?.id || 'tip'}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="absolute bottom-16 sm:bottom-20 right-0 mb-2 max-w-[280px] sm:max-w-xs"
            >
              <Card className="p-2 sm:p-3 bg-gradient-to-r from-primary/90 to-primary/80 border-primary/30 shadow-xl backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-primary-foreground font-medium leading-relaxed">
                    {currentMessage?.text || helpfulTips[currentTipIndex]}
                  </p>
                </div>
                {/* Speech bubble pointer */}
                <div className="absolute bottom-0 right-6 sm:right-8 transform translate-y-1/2 rotate-45 w-2 sm:w-3 h-2 sm:h-3 bg-primary border-r border-b border-primary/30" />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Avatar Container */}
        <motion.div
          animate={isMinimized ? { scale: 0.6 } : { scale: 1 }}
          className="relative"
        >
          <div className="w-20 h-28 sm:w-24 sm:h-32">
            <RobotAvatarDisplay
              avatarData={avatarData}
              size="small"
              showAnimation={true}
              emotion={currentMessage?.emotion || 'happy'}
              pose={currentMessage?.pose || 'idle'}
              className="shadow-2xl border-primary/50 hover:shadow-primary/20 transition-all duration-300"
            />
          </div>

          {/* Control Buttons */}
          <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0 rounded-full border-primary/30 bg-background/80 hover:bg-primary/10 touch-manipulation"
            >
              <MessageCircle className="h-2 w-2 sm:h-3 sm:w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsVisible(false)}
              className="h-5 w-5 sm:h-6 sm:w-6 p-0 rounded-full border-destructive/30 bg-background/80 hover:bg-destructive/10 touch-manipulation"
            >
              <X className="h-2 w-2 sm:h-3 sm:w-3" />
            </Button>
          </div>

          {/* Status Indicator */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -bottom-1 -left-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-background shadow-lg"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};