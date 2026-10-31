import { useState, useEffect, useRef } from 'react';

export interface DrivePoint {
  lat: number; lng: number; speed: number; timestamp: number; bearing: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://drivescore.onrender.com";
const GLOBAL_COOLDOWN = 3000; // FIX 1: Bahar nikala - ek jagah se control

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
  const [events, setEvents] = useState<any[]>([]);

  const mockCoordRef = useRef({ lat: 12.9716, lng: 77.5946 });
  const mockSpeedRef = useRef(mockSpeed);
  const lastBearingRef = useRef<number>(45);
  
  // FIX 2: Saare time wale ref banaye - let nahi use karna
  const lastAnyEventRef = useRef<number>(0);
  const lastTurnTimeRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(0);

  useEffect(() => { mockSpeedRef.current = mockSpeed; }, [mockSpeed]);
  useEffect(() => { currentSpeedRef.current = currentSpeed; }, [currentSpeed]);

  useEffect(() => {
    if (tripId) {
      setPoints([]); setCurrentSpeed(0); setLiveScore(100); setEvents([]);
      mockCoordRef.current = { lat: 12.9716, lng: 77.5946 };
      lastBearingRef.current = 45;
      lastAnyEventRef.current = 0;
      lastTurnTimeRef.current = 0;
    }
  }, [tripId]);

  // Gyro wala
  useEffect(() => {
    if (!tripId) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.acceleration && e.acceleration.x != null ? e.acceleration : e.accelerationIncludingGravity; // FIX: acceleration (gravity nahi)
      if (!acc || acc.x === null) return;
      
      // FIX 3: Global cooldown - 3 sec me ek hi event
      if (Date.now() - lastAnyEventRef.current < GLOBAL_COOLDOWN) return;
      if (currentSpeedRef.current < 15) return; // 15km/h se kam pe ignore

      if (Math.abs(acc.x) > 2.5) {
        lastAnyEventRef.current = Date.now();
        lastTurnTimeRef.current = Date.now();
        const ev = { type: 'harsh_turn', source: 'gyro', value: acc.x.toFixed(2), time: new Date().toLocaleTimeString(), speed: currentSpeedRef.current };
        setLastEvent(ev);
        setEvents(p => [...p, ev]);
      }
    };

    if (typeof window !== 'undefined' && (window as any).DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => window.removeEventListener('devicemotion', handleMotion);
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
        if (data.currentScore !== undefined) setLiveScore(data.currentScore);
        if (data.lastEvent) {
           // Backend se event aaya toh bhi global cooldown check
           if (Date.now() - lastAnyEventRef.current > GLOBAL_COOLDOWN) {
             lastAnyEventRef.current = Date.now();
             if (data.lastEvent.type === 'harsh_turn') lastTurnTimeRef.current = Date.now();
             // FIX 4: Turn ke 2 sec baad accel/brake ignore
             if (data.lastEvent.type !== 'harsh_turn' && Date.now() - lastTurnTimeRef.current < 2000) return;
             setLastEvent(data.lastEvent);
             setEvents(p => [...p, data.lastEvent]);
           }
        }
      } catch (err) {}
    };

    if (isMock) {
      const intervalId = setInterval(() => {
        const prev = mockCoordRef.current;
        const nextLat = prev.lat + (Math.random() * 0.0001 + 0.00005);
        const nextLng = prev.lng + (Math.random() * 0.0001 + 0.00005);
        const bearing = calculateBearing(prev.lat, prev.lng, nextLat, nextLng);
        const bearingDiff = Math.abs(bearing - lastBearingRef.current);
        
        if (bearingDiff > 35 && mockSpeedRef.current > 20 && Date.now() - lastAnyEventRef.current > 5000) {
          lastAnyEventRef.current = Date.now();
          lastTurnTimeRef.current = Date.now();
          const ev = { type: 'harsh_turn', source: 'gps', value: bearingDiff.toFixed(0), time: new Date().toLocaleTimeString(), speed: mockSpeedRef.current };
          setLastEvent(ev);
          setEvents(p => [...p, ev]);
        }
        lastBearingRef.current = bearing;
        mockCoordRef.current = { lat: nextLat, lng: nextLng };
        const simulatedSpeed = mockSpeedRef.current + (Math.random() * 0.4 - 0.2);
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

  return { points, currentSpeed, liveScore, lastEvent, events };
};