import { useState, useEffect, useRef } from 'react';

// Ek GPS point ka structure - lat, lng, speed sab isme rahega
export interface DrivePoint {
  lat: number; lng: number; speed: number; timestamp: number; bearing: number;
}

// Backend ka URL - Vercel pe env var se aayega, local pe localhost
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Ye main hook hai jo poori driving track karta hai
export const useDriveTracker = (tripId: string | null, isMock: boolean = false, mockSpeed: number = 45) => {
  const [points, setPoints] = useState<DrivePoint[]>([]); // Saare GPS points ka list
  const [currentSpeed, setCurrentSpeed] = useState<number>(0); // Abhi ki speed
  const [liveScore, setLiveScore] = useState<number>(100); // Live driving score 100 se start
  const [lastEvent, setLastEvent] = useState<any>(null); // Last harsh event kya hua
  const mockCoordRef = useRef({ lat: 12.9716, lng: 77.5946 }); // Mock mode me Bangalore se start
  const mockSpeedRef = useRef(mockSpeed); // Slider wala speed yaha store hota hai
  const lastGyroX = useRef<number | null>(null); // Phone ka gyro X value - turn detect karne ke liye
  const lastBearingRef = useRef<number>(45); // Pichla bearing - kitna ghooma tha

  // Slider se speed change hua toh usko ref me update karo
  useEffect(() => { mockSpeedRef.current = mockSpeed; }, [mockSpeed]);

  // Naya trip start hua toh sab reset kar do
  useEffect(() => {
    if (tripId) {
      setPoints([]); setCurrentSpeed(0); setLiveScore(100);
      mockCoordRef.current = { lat: 12.9716, lng: 77.5946 };
      lastBearingRef.current = 45;
    }
  }, [tripId]);

  // 2 GPS points se bearing nikalna - matlab gaadi kis direction me ja rahi hai 0-360 degree
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; // 0-360 degree me convert
  };

  // Phone ka gyro sensor on karna - side ka hilna detect karne ke liye
  useEffect(() => {
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity; // Phone ka accelerometer
      // Null check zaruri hai warna TS error aayega
      if (acc && acc.x !== null) {
        lastGyroX.current = acc.x; // X value save kar lo
        if (Math.abs(acc.x) > 5) { // 5 m/s2 matlab 0.5G - side me tez hila toh harsh turn
          console.log("Harsh Turn Gyro se!", acc.x);
          setLastEvent({ type: 'harsh_turn', source: 'gyro', value: acc.x });
        }
      }
    };

    // Agar browser me DeviceMotionEvent hai toh listener lagao
    if (typeof window !== 'undefined' && (window as any).DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }
    // Cleanup - component hatne pe listener hata do
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, []);

  // Main tracking logic - GPS se point lena aur backend pe bhejna
  useEffect(() => {
    if (!tripId) return; // Trip ID nahi hai toh kuch mat karo

    // Backend pe point bhejna
    const sendPoint = async (point: DrivePoint) => {
      try {
        const res = await fetch(`${API_BASE}/trips/${tripId}/point`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(point),
        });
        const data = await res.json();
        if (data.currentScore !== undefined) setLiveScore(data.currentScore); // Backend ka score le lo
        if (data.lastEvent) setLastEvent(data.lastEvent); // Backend ka event le lo
      } catch (err) { console.error(err); }
    };

    // Mock Drive Mode - bina gaadi ke testing ke liye
    if (isMock) {
      const intervalId = setInterval(() => {
        const prev = mockCoordRef.current;
        const nextLat = prev.lat + (Math.random() * 0.0002 + 0.00005); // Thoda aage badho
        const nextLng = prev.lng + (Math.random() * 0.0002 + 0.00005);
        
        // Bearing nikal ke check karo harsh turn hai kya
        const bearing = calculateBearing(prev.lat, prev.lng, nextLat, nextLng);
        const bearingDiff = Math.abs(bearing - lastBearingRef.current); // Kitna degree ghooma
        if (bearingDiff > 30 && mockSpeedRef.current > 15) { // 30 degree se zyada + 15 km/h se upar = harsh turn
          console.log("Harsh Turn GPS se!", bearingDiff);
          setLastEvent({ type: 'harsh_turn', source: 'gps', value: bearingDiff });
        }
        lastBearingRef.current = bearing; // Naya bearing save kar lo
        mockCoordRef.current = { lat: nextLat, lng: nextLng };

        const simulatedSpeed = mockSpeedRef.current + (Math.random() * 2 - 1); // Speed me thoda variation
        const point: DrivePoint = { lat: nextLat, lng: nextLng, speed: simulatedSpeed, timestamp: Date.now(), bearing };
        setCurrentSpeed(simulatedSpeed);
        setPoints((prevPoints) => [...prevPoints, point]); // Points list me add karo
        void sendPoint(point); // Backend pe bhejo
      }, 2000); // Har 2 sec me ek point
      return () => clearInterval(intervalId);
    } else {
      // Real GPS Mode - mobile ka GPS use hoga
      if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          const speedKmph = Math.max(0, (speed || 0) * 3.6); // m/s se km/h me convert
          // Agar heading nahi hai toh pichle point se bearing nikal lo
          const bearing = pos.coords.heading || calculateBearing(
            points[points.length-1]?.lat || latitude,
            points[points.length-1]?.lng || longitude,
            latitude, longitude
          );
          
          // Real me harsh turn check - GPS + Gyro dono se
          const bearingDiff = Math.abs(bearing - lastBearingRef.current);
          if (bearingDiff > 30 && speedKmph > 15) { // GPS se turn detect
            setLastEvent({ type: 'harsh_turn', source: 'gps+gyro', value: bearingDiff });
          }
          if (lastGyroX.current !== null && Math.abs(lastGyroX.current) > 5 && speedKmph > 15) { // Gyro se turn detect
            setLastEvent({ type: 'harsh_turn', source: 'gyro', value: lastGyroX.current });
          }
          lastBearingRef.current = bearing;

          const point: DrivePoint = { lat: latitude, lng: longitude, speed: speedKmph, timestamp: Date.now(), bearing };
          setCurrentSpeed(speedKmph); 
          setPoints((prev) => [...prev, point]); 
          void sendPoint(point);
        },
        (err) => console.error(err), { enableHighAccuracy: true } // High accuracy GPS chahiye
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [tripId, isMock, points]);

  return { points, currentSpeed, liveScore, lastEvent }; // Ye sab component me use hoga
};