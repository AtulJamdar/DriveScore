import { useState, useEffect, useRef } from 'react';

export interface DrivePoint {
  lat: number;
  lng: number;
  speed: number;
  timestamp: number;
  bearing: number;
}

export const useDriveTracker = (tripId: string | null, isMock: boolean = false) => {
  const [points, setPoints] = useState<DrivePoint[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const mockCoordRef = useRef({ lat: 12.9716, lng: 77.5946 });

  // Reset points and speed when a new trip starts
  useEffect(() => {
    if (tripId) {
      setPoints([]);
      setCurrentSpeed(0);
      mockCoordRef.current = { lat: 12.9716, lng: 77.5946 };
    } else {
      setCurrentSpeed(0);
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;

    const sendPoint = async (point: DrivePoint) => {
      try {
        await fetch(`http://localhost:3000/trips/${tripId}/point`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point),
        });
      } catch (err) {
        console.error('Failed to post drive point:', err);
      }
    };

    if (isMock) {
      // Mock mode: simulate moving points every 2 seconds
      const intervalId = setInterval(() => {
        const nextLat = mockCoordRef.current.lat + (Math.random() * 0.0004 + 0.0001);
        const nextLng = mockCoordRef.current.lng + (Math.random() * 0.0004 + 0.0001);
        mockCoordRef.current = { lat: nextLat, lng: nextLng };

        const simulatedSpeed = Math.floor(Math.random() * 25) + 40; // 40 - 65 km/h
        const point: DrivePoint = {
          lat: nextLat,
          lng: nextLng,
          speed: simulatedSpeed,
          timestamp: Date.now(),
          bearing: 45,
        };

        setCurrentSpeed(simulatedSpeed);
        setPoints((prev) => [...prev, point]);
        void sendPoint(point);
      }, 2000);

      return () => clearInterval(intervalId);
    } else {
      // Real GPS mode: navigator.geolocation
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        console.warn('Geolocation is not supported by your browser');
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          const speedKmph = Math.max(0, (speed || 0) * 3.6);

          const point: DrivePoint = {
            lat: latitude,
            lng: longitude,
            speed: speedKmph,
            timestamp: Date.now(),
            bearing: pos.coords.heading || 0,
          };

          setCurrentSpeed(speedKmph);
          setPoints((prev) => [...prev, point]);
          void sendPoint(point);
        },
        (err) => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [tripId, isMock]);

  return { points, currentSpeed };
};
