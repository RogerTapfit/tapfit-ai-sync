import React from 'react';
import { Button } from '@/components/ui/button';
import { Flashlight, FlashlightOff, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScannerControlsProps {
  torchSupported: boolean;
  torchOn: boolean;
  onToggleTorch: () => void;
  zoomSupported: boolean;
  currentZoom: number;
  maxZoom: number;
  onSetZoom: (zoom: number) => void;
  className?: string;
}

export const ScannerControls: React.FC<ScannerControlsProps> = ({
  torchSupported,
  torchOn,
  onToggleTorch,
  zoomSupported,
  currentZoom,
  maxZoom,
  onSetZoom,
  className,
}) => {
  const hasControls = torchSupported || zoomSupported;
  
  if (!hasControls) return null;

  const handleZoomToggle = () => {
    // Cycle through zoom levels: 1x -> 2x -> 3x -> 1x
    const zoomSteps = [1, 2, Math.min(3, maxZoom)].filter((z, i, arr) => z <= maxZoom && arr.indexOf(z) === i);
    const currentIndex = zoomSteps.findIndex(z => Math.abs(z - currentZoom) < 0.5);
    const nextIndex = (currentIndex + 1) % zoomSteps.length;
    onSetZoom(zoomSteps[nextIndex]);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {torchSupported && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onToggleTorch}
          className={cn(
            "rounded-full w-10 h-10 p-0",
            torchOn && "bg-yellow-500 hover:bg-yellow-600 text-black"
          )}
          title={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
        >
          {torchOn ? (
            <Flashlight className="h-5 w-5" />
          ) : (
            <FlashlightOff className="h-5 w-5" />
          )}
        </Button>
      )}
      
      {zoomSupported && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleZoomToggle}
          className="rounded-full min-w-10 h-10 px-3"
          title={`Zoom: ${currentZoom.toFixed(1)}x`}
        >
          <ZoomIn className="h-4 w-4 mr-1" />
          <span className="text-xs font-bold">{currentZoom.toFixed(0)}x</span>
        </Button>
      )}
    </div>
  );
};
