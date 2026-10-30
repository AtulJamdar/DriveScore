import { useState, useEffect, useRef } from 'react';

export interface DrivePoint {
  lat: number; lng: number; speed: number; timestamp: number; bearing: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://drivescore.onrender.com";

// Bearing nikalna 2 GPS points se
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

export const useDriveTracker = (tripId: string | null, isMock: boolean = false, mockSpeed: number = 45) => {
  const [points, setPoints] = useState<DrivePoint[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [liveScore, setLiveScore] = useState<number>(100);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const mockCoordRef = useRef({ lat: 12.9716, lng: 77.5946 });
  const mockSpeedRef = useRef(mockSpeed);
  const lastGyro = useRef<number>(0);
  const lastBearingRef = useRef<number>(45);
  const lastEventTime = useRef<number>(0); // Cooldown ke liye

  useEffect(() => { mockSpeedRef.current = mockSpeed; }, [mockSpeed]);
  useEffect(() => {
    if (tripId) {
      setPoints([]); setCurrentSpeed(0); setLiveScore(100);
      mockCoordRef.current = { lat: 12.9716, lng: 77.5946 };
      lastBearingRef.current = 45;
    }
  }, [tripId]);

  // FIX: Gyro sirf tab on hoga jab trip start hai + 15km/h se upar speed hai
  useEffect(() => {
    if (!tripId) return; // Trip start nahi hua toh gyro band

    const handleMotion = (e: DeviceMotionEvent) => {
      // FIX: acceleration use karo, gravity wala nahi
      const acc = e.acceleration; 
      if (!acc || acc.x === null) return;
      
      // FIX: Cooldown 3 sec - ek hi turn pe 10 notification nahi
      if (Date.now() - lastEventTime.current < 3000) return;

      // FIX: Speed 15 se kam hai toh ignore - khadi gaadi me turn nahi
      if (currentSpeed < 15) return;

      if (Math.abs(acc.x) > 4) {
        lastEventTime.current = Date.now();
        setLastEvent({ type: 'harsh_turn', source: 'gyro', value: acc.x.toFixed(2) });
      }
    };

    if (typeof window !== 'undefined' && (window as any).DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [tripId, currentSpeed]); // tripId aur speed change pe hi chalega

  useEffect(() => {
    if (!tripId) return;
    const sendPoint = async (point: DrivePoint) => {
      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}/point`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point),
        });
        const data = await res.json();
        if (data.currentScore !== undefined) setLiveScore(data.currentScore);
        if (data.lastEvent) setLastEvent(data.lastEvent);
      } catch (err) {}
    };

    if (isMock) {
      const intervalId = setInterval(() => {
        const prev = mockCoordRef.current;
        const nextLat = prev.lat + (Math.random() * 0.0001 + 0.00005); // FIX: Jump kam kiya
        const nextLng = prev.lng + (Math.random() * 0.0001 + 0.00005);
        const bearing = calculateBearing(prev.lat, prev.lng, nextLat, nextLng);
        const bearingDiff = Math.abs(bearing - lastBearingRef.current);
        
        // FIX: Sirf tab harsh turn jab speed >15 aur cooldown khatam
        if (bearingDiff > 35 && mockSpeedRef.current > 20 && Date.now() - lastEventTime.current > 5000) {
          lastEventTime.current = Date.now();
          setLastEvent({ type: 'harsh_turn', source: 'gps', value: bearingDiff.toFixed(0) });
        }
        lastBearingRef.current = bearing;
        mockCoordRef.current = { lat: nextLat, lng: nextLng };
        const simulatedSpeed = mockSpeedRef.current + (Math.random() * 0.4 - 0.2); // FIX: Variation kam kiya 2 se 0.4
        const point: DrivePoint = { lat: nextLat, lng: nextLng, speed: simulatedSpeed, timestamp: Date.now(), bearing };
        setCurrentSpeed(simulatedSpeed);
        setPoints((prevPoints) => [...prevPoints, point]);
        void sendPoint(point);
      }, 2000);
      return () => clearInterval(intervalId);
    } else {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          const speedKmph = Math.max(0, (speed || 0) * 3.6);
          const bearing = pos.coords.heading || 0;
          setCurrentSpeed(speedKmph);
          const point: DrivePoint = { lat: latitude, lng: longitude, speed: speedKmph, timestamp: Date.now(), bearing };
          setPoints((prev) => [...prev, point]);
          void sendPoint(point);
        },
        (err) => console.error(err), { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [tripId, isMock]);

  return { points, currentSpeed, liveScore, lastEvent };
};