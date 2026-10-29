"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Point {
  lat: number;
  lng: number;
  speed?: number;
  timestamp?: number;
  bearing?: number;
}

interface LiveMapProps {
  points: Point[];
}

export default function LiveMap({ points }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = points.length > 0 ? points[0].lat : 12.9716;
    const initialLng = points.length > 0 ? points[0].lng : 77.5946;

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const polyline = L.polyline([], { color: "#3b82f6", weight: 5 }).addTo(map);
    polylineRef.current = polyline;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (points.length === 0) {
      if (polylineRef.current) polylineRef.current.setLatLngs([]);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const latLngs: [number, number][] = points.map((p) => [p.lat, p.lng]);
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latLngs);
    }

    const lastPoint = points[points.length - 1];

    if (!markerRef.current) {
      markerRef.current = L.circleMarker([lastPoint.lat, lastPoint.lng], {
        radius: 8,
        color: "#22c55e",
        fillColor: "#10b981",
        fillOpacity: 0.9,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng([lastPoint.lat, lastPoint.lng]);
    }

    map.panTo([lastPoint.lat, lastPoint.lng]);
  }, [points]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[400px]" />;
}

