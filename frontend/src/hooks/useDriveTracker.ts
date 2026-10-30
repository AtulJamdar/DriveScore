import { useState, useEffect, useRef } from 'react';

export interface DrivePoint {
  lat: number; lng: number; speed: number; timestamp: number; bearing: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const useDriveTracker = (tripId: string | null, isMock: boolean = false, mockSpeed: number = 45) => {
  const [points, setPoints] = useState<DrivePoint[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [liveScore, setLiveScore] = useState<number>(100); // backend ka live score
  const [lastEvent, setLastEvent] = useState<any>(null);
  const mockCoordRef = useRef({ lat: 12.9716, lng: 77.5946 });
  const mockSpeedRef = useRef(mockSpeed);

  useEffect(() => { mockSpeedRef.current = mockSpeed; }, [mockSpeed]);

  useEffect(() => {
    if (tripId) {
      setPoints([]); setCurrentSpeed(0); setLiveScore(100);
      mockCoordRef.current = { lat: 12.9716, lng: 77.5946 };
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;

    const sendPoint = async (point: DrivePoint) => {
      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}/point`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point),
        });
        const data = await res.json();
        // FIX: Backend ka live score padho, ignore mat karo
        if (data.currentScore !== undefined) setLiveScore(data.currentScore);
        if (data.lastEvent) setLastEvent(data.lastEvent);
      } catch (err) { console.error(err); }
    };

    if (isMock) {
      const intervalId = setInterval(() => {
        const nextLat = mockCoordRef.current.lat + (Math.random() * 0.0002 + 0.00005);
        const nextLng = mockCoordRef.current.lng + (Math.random() * 0.0002 + 0.00005);
        mockCoordRef.current = { lat: nextLat, lng: nextLng };
        // FIX: Ab random nahi, slider wala mockSpeed use hoga + thoda variation
        const simulatedSpeed = mockSpeedRef.current + (Math.random() * 2 - 1);
        const point: DrivePoint = { lat: nextLat, lng: nextLng, speed: simulatedSpeed, timestamp: Date.now(), bearing: 45 };
        setCurrentSpeed(simulatedSpeed);
        setPoints((prev) => [...prev, point]);
        void sendPoint(point);
      }, 2000);
      return () => clearInterval(intervalId);
    } else {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          const speedKmph = Math.max(0, (speed || 0) * 3.6);
          const point: DrivePoint = { lat: latitude, lng: longitude, speed: speedKmph, timestamp: Date.now(), bearing: pos.coords.heading || 0 };
          setCurrentSpeed(speedKmph); setPoints((prev) => [...prev, point]); void sendPoint(point);
        },
        (err) => console.error(err), { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [tripId, isMock]);

  return { points, currentSpeed, liveScore, lastEvent };
};