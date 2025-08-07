import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, ArrowUp, ArrowDown, Home, Play, Pause, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RobotAvatarDisplay } from '@/components/RobotAvatarDisplay';
import { useGestures } from '@/hooks/useGestures';
import { RobotAvatarData } from '@/hooks/useRobotAvatar';
import { ImageUploadService } from '@/services/imageUploadService';
import { toast } from 'sonner';

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
  onImageUploaded?: () => void;
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
  onImageUploaded,
}) => {
  const [transform, setTransform] = useState<TransformState>({
    zoom: 1,
    rotationX: 0,
    rotationY: 0,
  });
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [showControlsUI, setShowControlsUI] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    resetHideControlsTimer();
  }, [resetHideControlsTimer]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (!imageFile) {
      toast.error('Please drop an image file');
      return;
    }

    setIsUploading(true);
    
    try {
      const result = await ImageUploadService.uploadCharacterImage(imageFile, avatarData.character_type);
      
      if (result.success && result.url) {
        const updateSuccess = await ImageUploadService.updateCharacterImage(avatarData.character_type, result.url);
        
        if (updateSuccess) {
          toast.success('Character image updated successfully!');
          onImageUploaded?.();
        } else {
          toast.error('Failed to save character image');
        }
      } else {
        toast.error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      toast.error('Error uploading image');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [avatarData.character_type, onImageUploaded]);

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
      className={`relative ${containerSizes[size]} ${className} ${
        isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''
      } transition-all duration-200`}
      onMouseEnter={resetHideControlsTimer}
      onTouchStart={resetHideControlsTimer}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50"
          >
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-primary">Drop image to update character</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Loading Overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-50"
          >
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm font-medium">Uploading image...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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