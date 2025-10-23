import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRunTracker } from '@/hooks/useRunTracker';

export const RunMap = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const { metrics } = useRunTracker();

  // Initialize Leaflet map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.7749, -122.4194],
      zoom: 15,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const route = L.polyline([], {
      color: 'hsl(0, 84%, 60%)',
      weight: 4,
      opacity: 0.8,
    }).addTo(map);

    const marker = L.circleMarker([37.7749, -122.4194], {
      radius: 8,
      color: '#fff',
      weight: 3,
      fillColor: 'hsl(217, 91%, 60%)',
      fillOpacity: 1,
    }).addTo(map);

    mapRef.current = map;
    routeRef.current = route;
    markerRef.current = marker;

    // Center to current position initially
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
          map.setView(latlng as L.LatLngExpression, 15);
          marker.setLatLng(latlng as L.LatLngExpression);
        },
        (err) => {
          console.warn('Geolocation error:', err);
        }
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
      routeRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update position/route when metrics change
  useEffect(() => {
    if (!mapRef.current || !routeRef.current || !markerRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
          markerRef.current!.setLatLng(latlng as L.LatLngExpression);
          routeRef.current!.addLatLng(latlng as any);
          // Keep map centered on runner
          mapRef.current!.panTo(latlng as L.LatLngExpression, { animate: true });
        },
        (err) => {
          console.warn('Geolocation update error:', err);
        }
      );
    }
  }, [metrics]);

  return <div ref={containerRef} className="h-full w-full" />;
};
