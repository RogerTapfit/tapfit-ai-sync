import { forwardRef, useMemo } from 'react';
import { RunSession } from '@/types/run';
import { formatDistance, formatTime, formatPace } from '@/utils/runFormatters';
import { format } from 'date-fns';

interface RunShareCardProps {
  run: RunSession;
  showLogo?: boolean;
}

/**
 * SVG-based route visualization - avoids CORS issues with map tiles
 */
const RouteVisualization = ({ points }: { points: { lat: number; lon: number }[] }) => {
  const { pathData, startPoint, endPoint } = useMemo(() => {
    if (points.length < 2) {
      return { pathData: '', startPoint: null, endPoint: null };
    }

    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    // Add padding
    const padding = 20;
    const width = 320;
    const height = 180;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    // Handle edge case where route is a single point or straight line
    const latRange = maxLat - minLat || 0.001;
    const lonRange = maxLon - minLon || 0.001;

    // Normalize coordinates to SVG viewport
    const normalizedPoints = points.map(p => ({
      x: padding + ((p.lon - minLon) / lonRange) * innerWidth,
      y: padding + innerHeight - ((p.lat - minLat) / latRange) * innerHeight,
    }));

    const pathData = normalizedPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    return {
      pathData,
      startPoint: normalizedPoints[0],
      endPoint: normalizedPoints[normalizedPoints.length - 1],
    };
  }, [points]);

  if (!pathData) {
    return (
      <div className="w-full h-[200px] rounded-xl bg-zinc-800 flex items-center justify-center">
        <span className="text-zinc-500 text-sm">No route data</span>
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 320 180"
      className="w-full h-[200px] rounded-xl"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
    >
      {/* Grid pattern for visual interest */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Route shadow */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Main route - neon red */}
      <path
        d={pathData}
        fill="none"
        stroke="#FF4D4D"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glow effect */}
      <path
        d={pathData}
        fill="none"
        stroke="#FF4D4D"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.3"
      />

      {/* Start marker (green) */}
      {startPoint && (
        <>
          <circle cx={startPoint.x} cy={startPoint.y} r="8" fill="rgba(34,197,94,0.3)" />
          <circle cx={startPoint.x} cy={startPoint.y} r="5" fill="#22c55e" stroke="#fff" strokeWidth="2" />
        </>
      )}

      {/* End marker (red) */}
      {endPoint && (
        <>
          <circle cx={endPoint.x} cy={endPoint.y} r="8" fill="rgba(255,77,77,0.3)" />
          <circle cx={endPoint.x} cy={endPoint.y} r="5" fill="#FF4D4D" stroke="#fff" strokeWidth="2" />
        </>
      )}
    </svg>
  );
};

const RunShareCard = forwardRef<HTMLDivElement, RunShareCardProps>(
  ({ run, showLogo = true }, ref) => {
    const isWalk = run.avg_pace_sec_per_km > 600; // > 10 min/km is likely a walk

    return (
      <div
        ref={ref}
        className="w-[360px] rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 shadow-2xl"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isWalk ? '🚶' : '🏃'}</span>
            <div>
              <div className="text-white font-semibold text-sm">
                {isWalk ? 'Walk' : 'Run'}
              </div>
              <div className="text-zinc-400 text-xs">
                {format(new Date(run.started_at), "MMM d, yyyy • h:mm a")}
              </div>
            </div>
          </div>
          {showLogo && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <span className="text-zinc-300 text-xs font-medium">TapFit</span>
            </div>
          )}
        </div>

        {/* SVG Route Map - No CORS issues */}
        <div className="px-3 pb-3">
          <RouteVisualization points={run.points} />
        </div>

        {/* Stats */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-white">
                {formatDistance(run.total_distance_m, run.unit)}
              </div>
              <div className="text-zinc-400 text-xs uppercase tracking-wider mt-1">
                Distance
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                {formatTime(run.moving_time_s)}
              </div>
              <div className="text-zinc-400 text-xs uppercase tracking-wider mt-1">
                Time
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">
                {formatPace(run.avg_pace_sec_per_km, run.unit)}
              </div>
              <div className="text-zinc-400 text-xs uppercase tracking-wider mt-1">
                Pace
              </div>
            </div>
          </div>

          {/* Decorative line */}
          <div className="mt-4 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full opacity-80" />
        </div>
      </div>
    );
  }
);

RunShareCard.displayName = 'RunShareCard';

export default RunShareCard;
