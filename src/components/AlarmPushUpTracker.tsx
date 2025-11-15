import { useEffect, useRef } from 'react';
import { drawPose } from '@/features/bodyScan/ml/poseVideo';
import { type Keypoint } from '@/features/bodyScan/ml/poseVideo';

interface AlarmPushUpTrackerProps {
  landmarks: Keypoint[];
  reps: number;
  targetReps: number;
  formScore: number;
  hideHud?: boolean;
  showReferenceLine?: boolean;
}

export const AlarmPushUpTracker = ({ landmarks, reps, targetReps, formScore, hideHud = false, showReferenceLine = true }: AlarmPushUpTrackerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    console.log(`✅ Drawing pose with ${landmarks.length} landmarks`);
    
    // Draw pose
    drawPose(ctx, landmarks, canvas.width, canvas.height, undefined, undefined, undefined, showReferenceLine);
  }, [landmarks, showReferenceLine]);

  const progress = (reps / targetReps) * 100;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-20">
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full h-full object-cover"
        style={{ border: landmarks.length > 0 ? '2px solid lime' : '2px solid red' }}
      />
      
      {/* Overlay UI - only show if hideHud is false */}
      {!hideHud && (
        <>
          {/* Rep Counter Overlay */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm px-8 py-4 rounded-2xl">
            <div className="text-center">
              <div className="text-6xl font-black text-white mb-2">
                {reps} / {targetReps}
              </div>
              <div className="text-sm text-white/80">Push-ups</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Form Score */}
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg">
            <div className="text-white text-sm">
              Form: <span className="font-bold">{formScore}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
