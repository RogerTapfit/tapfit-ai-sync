import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRunTracker } from '@/hooks/useRunTracker';

// Strava-style colors
const STRAVA_ORANGE = '#FC4C02';
const START_GREEN = '#22c55e';
const CURRENT_BLUE = '#3b82f6';

export const RunMap = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeShadowRef = useRef<L.Polyline | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const pulseRef = useRef<L.CircleMarker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const { metrics } = useRunTracker();

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 16,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Route shadow for depth/visibility
    const routeShadow = L.polyline([], {
      color: '#000',
      weight: 10,
      opacity: 0.2,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Main route line - Strava orange, bold
    const route = L.polyline([], {
      color: STRAVA_ORANGE,
      weight: 6,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Pulse ring for current position
    const pulse = L.circleMarker([37.7749, -122.4194], {
      radius: 16,
      color: CURRENT_BLUE,
      weight: 2,
      fillColor: CURRENT_BLUE,
      fillOpacity: 0.2,
      className: 'pulse-marker',
    }).addTo(map);

    // Current position marker - blue dot
    const marker = L.circleMarker([37.7749, -122.4194], {
      radius: 10,
      color: '#fff',
      weight: 3,
      fillColor: CURRENT_BLUE,
      fillOpacity: 1,
    }).addTo(map);

    mapRef.current = map;
    routeShadowRef.current = routeShadow;
    routeRef.current = route;
    markerRef.current = marker;
    pulseRef.current = pulse;

    // Center to current position initially
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
          map.setView(latlng as L.LatLngExpression, 16);
          marker.setLatLng(latlng as L.LatLngExpression);
          pulse.setLatLng(latlng as L.LatLngExpression);
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
      routeShadowRef.current = null;
      routeRef.current = null;
      markerRef.current = null;
      pulseRef.current = null;
      startMarkerRef.current = null;
    };
  }, []);

  // Update route when metrics change - this triggers on every GPS point update
  useEffect(() => {
    if (!mapRef.current || !routeRef.current || !routeShadowRef.current || !markerRef.current || !pulseRef.current || !metrics) return;

    // Get the current session from the tracker to access all tracked points
    const runTrackerService = (window as any).__runTrackerService;
    if (!runTrackerService) return;

    const state = runTrackerService.getState();
    if (!state || !state.session?.points || state.session.points.length === 0) return;

    const points = state.session.points;
    
    // Update the route with all points
    const latLngs: L.LatLngExpression[] = points.map(p => [p.lat, p.lon]);
    routeRef.current.setLatLngs(latLngs);
    routeShadowRef.current.setLatLngs(latLngs);

    // Add start marker on first point (only once)
    if (points.length >= 1 && !startMarkerRef.current) {
      const firstPoint = points[0];
      const startIcon = L.divIcon({
        className: 'start-marker-icon',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: ${START_GREEN};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      
      startMarkerRef.current = L.marker([firstPoint.lat, firstPoint.lon], { icon: startIcon }).addTo(mapRef.current);
    }

    // Update marker to latest position
    const lastPoint = points[points.length - 1];
    const lastLatLng: L.LatLngExpression = [lastPoint.lat, lastPoint.lon];
    markerRef.current.setLatLng(lastLatLng);
    pulseRef.current.setLatLng(lastLatLng);
    
    // Keep map centered on runner
    mapRef.current.panTo(lastLatLng, { animate: true });
  }, [metrics]);

  return (
    <>
      <style>{`
        .pulse-marker {
          animation: pulse-ring 1.5s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
        .start-marker-icon {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
};
