import { useEffect, useRef } from 'react';
import { drawPose } from '@/features/bodyScan/ml/poseVideo';
import { type Keypoint } from '@/features/bodyScan/ml/poseVideo';

interface AlarmPushUpTrackerProps {
  landmarks: Keypoint[];
  reps: number;
  targetReps: number;
  formScore: number;
  hideHud?: boolean;
}

export const AlarmPushUpTracker = ({ landmarks, reps, targetReps, formScore, hideHud = false }: AlarmPushUpTrackerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !landmarks.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pose
    drawPose(ctx, landmarks, canvas.width, canvas.height);
  }, [landmarks]);

  const progress = (reps / targetReps) * 100;

  return (
    <div className="relative w-full h-full max-w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full h-full object-cover rounded-lg max-w-full"
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
