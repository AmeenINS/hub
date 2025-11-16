'use client';

import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface DisplayLocation {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  updatedAt?: string;
  timestamp?: string;
  platform?: string;
  label?: string;
  email?: string;
  isCurrentUser?: boolean;
}

interface LiveLocationMapProps {
  currentLocation: DisplayLocation | null;
  otherLocations: DisplayLocation[];
  mapHeight?: number | string;
}

const DEFAULT_CENTER: LatLngExpression = [23.588, 58.3829]; // Muscat, Oman

const createMarkerIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:18px;
      height:18px;
      border-radius:9999px;
      border:2px solid white;
      box-shadow:0 4px 10px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });

interface MapAutoFocusProps {
  focus: LatLngExpression | null;
  zoom: number;
}

function MapAutoFocus({ focus, zoom }: MapAutoFocusProps) {
  const map = useMap();

  useEffect(() => {
    if (focus) {
      map.flyTo(focus, zoom, { duration: 0.75 });
    }
  }, [focus, zoom, map]);

  return null;
}

export function LiveLocationMap({
  currentLocation,
  otherLocations,
  mapHeight = 480,
}: LiveLocationMapProps) {
  const center = useMemo<LatLngExpression>(() => {
    if (currentLocation) {
      return [currentLocation.latitude, currentLocation.longitude];
    }
    if (otherLocations.length > 0) {
      const first = otherLocations[0];
      return [first.latitude, first.longitude];
    }
    return DEFAULT_CENTER;
  }, [currentLocation, otherLocations]);

  const zoomLevel = currentLocation ? 15 : otherLocations.length > 0 ? 13 : 7;

  const currentIcon = useMemo(() => createMarkerIcon('#2563eb'), []);
  const otherIcon = useMemo(() => createMarkerIcon('#ef4444'), []);

  return (
    <div className="relative z-0">
      <MapContainer
        center={center}
        zoom={zoomLevel}
        scrollWheelZoom
        style={{ height: typeof mapHeight === 'number' ? `${mapHeight}px` : mapHeight, width: '100%', position: 'relative', zIndex: 0 }}
        className="rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapAutoFocus focus={center} zoom={zoomLevel} />

      {currentLocation && (
        <>
          <Marker
            key={`current-${currentLocation.userId}`}
            position={[currentLocation.latitude, currentLocation.longitude]}
            icon={currentIcon}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{currentLocation.label ?? 'You'}</p>
                {currentLocation.email && <p className="text-muted-foreground">{currentLocation.email}</p>}
                {currentLocation.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    {`Updated ${new Date(currentLocation.updatedAt).toLocaleTimeString()}`}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>

          {currentLocation.accuracy && currentLocation.accuracy > 0 ? (
            <CircleMarker
              center={[currentLocation.latitude, currentLocation.longitude]}
              radius={Math.min(Math.max(currentLocation.accuracy / 5, 18), 120)}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#2563eb',
                fillOpacity: 0.15,
              }}
            />
          ) : null}
        </>
      )}

      {otherLocations.map((location) => (
        <Marker
          key={location.userId}
          position={[location.latitude, location.longitude]}
          icon={otherIcon}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{location.label ?? location.email ?? location.userId}</p>
              {location.email && <p className="text-muted-foreground">{location.email}</p>}
              {location.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  {`Updated ${new Date(location.updatedAt).toLocaleTimeString()}`}
                </p>
              )}
              {location.platform && (
                <p className="text-xs text-muted-foreground">
                  Platform: {location.platform}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    </div>
  );
}

export default LiveLocationMap;
