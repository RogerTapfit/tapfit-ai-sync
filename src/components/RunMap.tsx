import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRunTracker } from '@/hooks/useRunTracker';

// Component to auto-center map on user position
const MapController = ({ position }: { position: LatLngExpression | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, map]);
  
  return null;
};

export const RunMap = () => {
  const { metrics } = useRunTracker();
  const [center, setCenter] = useState<LatLngExpression>([37.7749, -122.4194]); // Default SF
  const [routePoints, setRoutePoints] = useState<LatLngExpression[]>([]);

  useEffect(() => {
    // Get user's current location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: LatLngExpression = [position.coords.latitude, position.coords.longitude];
          setCenter(pos);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (metrics) {
      // Update route from metrics (points are stored in the session)
      // For now, we'll track based on current position
      // In a full implementation, we'd access the session points directly
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const newPoint: LatLngExpression = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setCenter(newPoint);
          setRoutePoints((prev) => [...prev, newPoint]);
        });
      }
    }
  }, [metrics]);

  return (
    <MapContainer
      center={center}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
    >
      <>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController position={center} />
        
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: 'hsl(0, 84%, 60%)',
              weight: 4,
              opacity: 0.8,
            }}
          />
        )}
        
        {center && (
          <CircleMarker
            center={center}
            radius={8}
            pathOptions={{
              fillColor: 'hsl(217, 91%, 60%)',
              fillOpacity: 1,
              color: 'white',
              weight: 3,
            }}
          />
        )}
      </>
    </MapContainer>
  );
};
