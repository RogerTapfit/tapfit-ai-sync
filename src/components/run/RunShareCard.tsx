import { useEffect, useRef, forwardRef } from 'react';
import { RunSession } from '@/types/run';
import { formatDistance, formatTime, formatPace } from '@/utils/runFormatters';
import { format } from 'date-fns';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RunShareCardProps {
  run: RunSession;
  showLogo?: boolean;
}

const RunShareCard = forwardRef<HTMLDivElement, RunShareCardProps>(
  ({ run, showLogo = true }, ref) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    useEffect(() => {
      if (!mapRef.current || run.points.length === 0) return;
      if (mapInstanceRef.current) return; // Already initialized

      // Create map with dark tiles
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      });

      // Dark map tiles for better contrast
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '',
      }).addTo(map);

      // Route shadow
      const latLngs: L.LatLngExpression[] = run.points.map(p => [p.lat, p.lon]);
      L.polyline(latLngs, {
        color: '#000',
        weight: 8,
        opacity: 0.5,
      }).addTo(map);

      // Main route - neon red
      L.polyline(latLngs, {
        color: '#FF4D4D',
        weight: 5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Start marker (green)
      L.circleMarker(latLngs[0] as L.LatLngExpression, {
        radius: 6,
        color: '#fff',
        weight: 2,
        fillColor: '#22c55e',
        fillOpacity: 1,
      }).addTo(map);

      // End marker (red)
      L.circleMarker(latLngs[latLngs.length - 1] as L.LatLngExpression, {
        radius: 6,
        color: '#fff',
        weight: 2,
        fillColor: '#FF4D4D',
        fillOpacity: 1,
      }).addTo(map);

      // Fit to route
      const bounds = L.latLngBounds(latLngs as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [30, 30] });

      mapInstanceRef.current = map;

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, [run.points]);

    const activityType = run.source === 'gps' ? 'Activity' : 'Activity';
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

        {/* Map */}
        <div className="px-3 pb-3">
          <div
            ref={mapRef}
            className="w-full h-[200px] rounded-xl overflow-hidden"
            style={{ background: '#1a1a2e' }}
          />
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
