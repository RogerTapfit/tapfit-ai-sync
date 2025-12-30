import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
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
  if (!points || points.length < 2) {
    return null;
  }

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

  const routePositions = points.map(p => [p.lat, p.lon] as [number, number]);
  const startPoint = routePositions[0];
  const endPoint = routePositions[routePositions.length - 1];

  return (
    <div className={`rounded-lg overflow-hidden ${className}`}>
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: '#FF4D4D',
            weight: 4,
            opacity: 0.9,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
        {/* Start marker - green */}
        <CircleMarker
          center={startPoint}
          radius={5}
          pathOptions={{
            fillColor: '#22c55e',
            fillOpacity: 1,
            color: '#fff',
            weight: 2,
          }}
        />
        {/* End marker - red */}
        <CircleMarker
          center={endPoint}
          radius={5}
          pathOptions={{
            fillColor: '#ef4444',
            fillOpacity: 1,
            color: '#fff',
            weight: 2,
          }}
        />
      </MapContainer>
    </div>
  );
};