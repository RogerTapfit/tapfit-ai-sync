import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, ArrowUp, ArrowDown, Home, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RobotAvatarDisplay } from '@/components/RobotAvatarDisplay';
import { useGestures } from '@/hooks/useGestures';
import { RobotAvatarData } from '@/hooks/useRobotAvatar';

interface TransformState {
  zoom: number;
  rotationX: number;
  rotationY: number;
}

interface InteractiveAvatarPreviewProps {
  avatarData: RobotAvatarData;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showControls?: boolean;
  showStatusIndicators?: boolean;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ROTATION_X_MIN = -45;
const ROTATION_X_MAX = 45;

export const InteractiveAvatarPreview: React.FC<InteractiveAvatarPreviewProps> = ({
  avatarData,
  size = 'md',
  className = '',
  showControls = true,
  showStatusIndicators = true,
}) => {
  const [transform, setTransform] = useState<TransformState>({
    zoom: 1,
    rotationX: 0,
    rotationY: 0,
  });
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [showControlsUI, setShowControlsUI] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-hide controls on mobile after inactivity
  const resetHideControlsTimer = useCallback(() => {
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    setShowControlsUI(true);
    
    const timeout = setTimeout(() => {
      setShowControlsUI(false);
    }, 3000);
    setHideControlsTimeout(timeout);
  }, [hideControlsTimeout]);

  const handleZoom = useCallback((delta: number) => {
    setTransform(prev => ({
      ...prev,
      zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev.zoom + delta)),
    }));
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  const handleRotate = useCallback((deltaX: number, deltaY: number) => {
    setTransform(prev => ({
      ...prev,
      rotationY: (prev.rotationY + deltaX) % 360,
      rotationX: Math.max(ROTATION_X_MIN, Math.min(ROTATION_X_MAX, prev.rotationX + deltaY)),
    }));
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  const handleReset = useCallback(() => {
    setTransform({ zoom: 1, rotationX: 0, rotationY: 0 });
    setIsAutoRotating(false);
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  // Memoize gesture handlers to prevent hook dependency changes
  const gestureHandlers = useMemo(() => ({
    onZoom: handleZoom,
    onRotate: handleRotate,
    onReset: handleReset,
  }), [handleZoom, handleRotate, handleReset]);

  const gestureRef = useGestures(gestureHandlers);

  // Size-based styling
  const containerSizes = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
  };

  const buttonSizes = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2',
  };

  // Memoized transform style
  const transformStyle = useMemo(() => ({
    transform: `
      scale(${transform.zoom}) 
      rotateX(${transform.rotationX}deg) 
      rotateY(${transform.rotationY + (isAutoRotating ? 0 : 0)}deg)
    `,
    transformStyle: 'preserve-3d',
    willChange: 'transform',
  }), [transform.zoom, transform.rotationX, transform.rotationY, isAutoRotating]);

  // Auto-rotation effect
  React.useEffect(() => {
    if (!isAutoRotating) return;

    const interval = setInterval(() => {
      setTransform(prev => ({
        ...prev,
        rotationY: (prev.rotationY + 1) % 360,
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [isAutoRotating]);

  const zoomPercentage = Math.round(transform.zoom * 100);

  return (
    <div 
      className={`relative ${containerSizes[size]} ${className}`}
      onMouseEnter={resetHideControlsTimer}
      onTouchStart={resetHideControlsTimer}
    >
      {/* Main Avatar Container */}
      <div
      ref={gestureRef as React.RefObject<HTMLDivElement>}
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="w-full h-full"
        style={{
          transform: `scale(${transform.zoom}) rotateX(${transform.rotationX}deg) rotateY(${transform.rotationY}deg)`,
          transformStyle: 'preserve-3d' as const,
          willChange: 'transform',
        }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        animate={{
          rotateY: isAutoRotating ? [transform.rotationY, transform.rotationY + 360] : transform.rotationY,
        }}
        whileTap={{ scale: 0.98 }}
      >
          <RobotAvatarDisplay
            avatarData={avatarData}
            size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'medium'}
            showAnimation={!isAutoRotating}
            className="w-full h-full"
          />
        </motion.div>
      </div>

      {/* Status Indicators */}
      <AnimatePresence>
        {showStatusIndicators && showControlsUI && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-2 flex gap-1"
          >
            <Badge variant="secondary" className="text-xs bg-card/80 backdrop-blur-sm">
              {zoomPercentage}%
            </Badge>
            {(transform.rotationX !== 0 || transform.rotationY !== 0) && (
              <Badge variant="secondary" className="text-xs bg-card/80 backdrop-blur-sm">
                {Math.round(transform.rotationY)}°
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel */}
      <AnimatePresence>
        {showControls && showControlsUI && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-2 right-2 flex flex-col gap-1 bg-card/80 backdrop-blur-sm rounded-lg p-1 border border-border/50"
          >
            {/* Zoom Controls */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={buttonSizes[size]}
                onClick={() => handleZoom(0.1)}
                disabled={transform.zoom >= ZOOM_MAX}
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSizes[size]}
                onClick={() => handleZoom(-0.1)}
                disabled={transform.zoom <= ZOOM_MIN}
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </Button>
            </div>

            {/* Rotation Controls */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={buttonSizes[size]}
                onClick={() => handleRotate(-15, 0)}
                title="Rotate Left"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSizes[size]}
                onClick={() => handleRotate(15, 0)}
                title="Rotate Right"
              >
                <RotateCw className="w-3 h-3" />
              </Button>
            </div>

            {/* Tilt Controls */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={buttonSizes[size]}
                onClick={() => handleRotate(0, -10)}
                disabled={transform.rotationX <= ROTATION_X_MIN}
                title="Tilt Up"
              >
                <ArrowUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSizes[size]}
                onClick={() => handleRotate(0, 10)}
                disabled={transform.rotationX >= ROTATION_X_MAX}
                title="Tilt Down"
              >
                <ArrowDown className="w-3 h-3" />
              </Button>
            </div>

            {/* Utility Controls */}
            <div className="flex gap-1 border-t border-border/50 pt-1">
              <Button
                variant="ghost"
                size="icon"
                className={buttonSizes[size]}
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                title={isAutoRotating ? "Stop Auto-Rotate" : "Start Auto-Rotate"}
              >
                {isAutoRotating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={buttonSizes[size]}
                onClick={handleReset}
                title="Reset View"
              >
                <Home className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Hints for First-Time Users */}
      <AnimatePresence>
        {size === 'lg' && transform.zoom === 1 && transform.rotationY === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 text-xs text-muted-foreground text-center max-w-40">
              <div className="mb-1">💡 Try:</div>
              <div>• Drag to rotate</div>
              <div>• Scroll to zoom</div>
              <div>• Double-click to reset</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};