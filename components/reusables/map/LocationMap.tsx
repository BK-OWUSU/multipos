"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useFormContext } from "react-hook-form";
import L from "leaflet";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
}

interface LocationMapProps {
  latitude?: number | string;
  longitude?: number | string;
  onChange?: (lat: string, lng: string) => void;
  readOnly?: boolean;
}

export default function LocationMap({ latitude, longitude, onChange, readOnly = false }: LocationMapProps) {
  // Try to safely grab a form context if it exists
  const formContext = useFormContext();

  // 1. Determine Coordinates (Priority: Hook Form -> Explicit Props -> Default Kumasi)
  const watchLat = formContext ? formContext.watch("latitude") : latitude;
  const watchLng = formContext ? formContext.watch("longitude") : longitude;

  const position = useMemo(() => {
    const lat = parseFloat(String(watchLat));
    const lng = parseFloat(String(watchLng));
    return {
      lat: isNaN(lat) ? 6.6889 : lat,
      lng: isNaN(lng) ? -1.6244 : lng,
    };
  }, [watchLat, watchLng]);

  const markerRef = useRef<L.Marker>(null);

  // 2. Handle Marker Dragging
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          const computedLat = latLng.lat.toFixed(6);
          const computedLng = latLng.lng.toFixed(6);

          // If inside a form, update form values
          if (formContext) {
            formContext.setValue("latitude", computedLat, { shouldValidate: true });
            formContext.setValue("longitude", computedLng, { shouldValidate: true });
          }

          // If standalone change callback is provided, invoke it
          if (onChange) {
            onChange(computedLat, computedLng);
          }
        }
      },
    }),
    [formContext, onChange]
  );

  return (
    <div className="w-full h-full min-h-55 rounded-lg overflow-hidden border border-slate-200 relative z-0">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        />
        <Marker
          draggable={!readOnly} // Locks or unlocks pin dragging based on readOnly status
          eventHandlers={readOnly ? {} : eventHandlers}
          position={[position.lat, position.lng]}
          icon={defaultIcon}
          ref={markerRef}
        />
        <RecenterMap lat={position.lat} lng={position.lng} />
      </MapContainer>
    </div>
  );
}