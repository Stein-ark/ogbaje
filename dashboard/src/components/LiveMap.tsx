import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { AlertDoc, LocationPoint } from '../types';

interface Props {
  alert: AlertDoc;
  locations: LocationPoint[];
}

/**
 * Custom divIcon instead of Leaflet's default marker: avoids the well-known
 * broken-default-icon problem under bundlers, and gives us the pulsing red dot.
 */
const liveIcon = L.divIcon({
  className: 'marker-live',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Keeps the map following the newest location point while the alert is active. */
function FollowLatest({ position, active }: { position: [number, number]; active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) map.panTo(position, { animate: true });
  }, [map, position, active]);
  return null;
}

export default function LiveMap({ alert, locations }: Props) {
  const latest =
    locations.length > 0 ? locations[locations.length - 1] : null;
  const current: [number, number] | null = latest
    ? [latest.lat, latest.lng]
    : alert.lastLocation
      ? [alert.lastLocation.lat, alert.lastLocation.lng]
      : null;

  if (!current) {
    return (
      <div className="centered-note">
        <p>No location received yet — waiting for the first GPS fix.</p>
      </div>
    );
  }

  const trail: [number, number][] = locations.map((p) => [p.lat, p.lng]);
  const accuracy = latest?.accuracy ?? alert.lastLocation?.accuracy ?? 0;

  return (
    <MapContainer center={current} zoom={16} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {trail.length > 1 && (
        <Polyline positions={trail} pathOptions={{ color: '#ef4444', weight: 3, opacity: 0.6 }} />
      )}
      {accuracy > 0 && (
        <Circle
          center={current}
          radius={accuracy}
          pathOptions={{ color: '#ef4444', weight: 1, fillOpacity: 0.08 }}
        />
      )}
      <Marker position={current} icon={liveIcon} />
      <FollowLatest position={current} active={alert.status === 'active'} />
    </MapContainer>
  );
}
