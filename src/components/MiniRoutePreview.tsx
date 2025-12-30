import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RoutePoint {
  lat: number;
  lon: number;
}

interface MiniRoutePreviewProps {
  points: RoutePoint[];
  className?: string;
}

export const MiniRoutePreview = ({ points, className = '' }: MiniRoutePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || !points || points.length < 2) return;
    if (mapRef.current) return; // Already initialized

    // Get bounds for the route
    const lats = points.map(p => p.lat);
    const lons = points.map(p => p.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    
    // Calculate zoom based on bounds
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);
    let zoom = 15;
    if (maxDiff > 0.05) zoom = 13;
    else if (maxDiff > 0.02) zoom = 14;
    else if (maxDiff > 0.01) zoom = 15;
    else zoom = 16;

    // Create map
    const map = L.map(containerRef.current, {
      center: [centerLat, centerLon],
      zoom,
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      attributionControl: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    // Add route
    const latLngs: L.LatLngExpression[] = points.map(p => [p.lat, p.lon]);
    L.polyline(latLngs, {
      color: '#FF4D4D',
      weight: 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Start marker - green
    L.circleMarker(latLngs[0], {
      radius: 5,
      color: '#fff',
      weight: 2,
      fillColor: '#22c55e',
      fillOpacity: 1,
    }).addTo(map);

    // End marker - red
    L.circleMarker(latLngs[latLngs.length - 1], {
      radius: 5,
      color: '#fff',
      weight: 2,
      fillColor: '#ef4444',
      fillOpacity: 1,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  if (!points || points.length < 2) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '128px' }}
    />
  );
};