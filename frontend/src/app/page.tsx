"use client";
import { useState, useEffect } from "react";
import { useDriveTracker } from "@/hooks/useDriveTracker";
import { useVoiceAlert } from "@/hooks/useVoiceAlert";
import dynamic from "next/dynamic";
import { Toaster, toast } from "sonner";
import Link from "next/link";



const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DrivePage() {
  const [tripId, setTripId] = useState<string | null>(null);
  const [isMock, setIsMock] = useState<boolean>(true);
  const [mockSpeed, setMockSpeed] = useState<number>(45);
  const [score, setScore] = useState<number>(100);
  const [miles, setMiles] = useState<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(false);
  const [events, setEvents] = useState<any[]>([]);
  const [lastProcessedEventTime, setLastProcessedEventTime] = useState(0);

  const { points, currentSpeed, liveScore, lastEvent } = useDriveTracker(tripId, isMock, mockSpeed);
  const { speak } = useVoiceAlert();
<Link href="/rewards" className="bg-blue-600 px-4 py-2 rounded-lg">My Rewards: {miles} Miles</Link>
  // Live score update
  useEffect(() => { if (liveScore !== undefined) setScore(liveScore); }, [liveScore]);

  //For PWA
  useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);


  // Attento style Toast + Voice on every harsh event
  useEffect(() => {
    if (!lastEvent) return;
    
    // same event ko dobara mat dikhao
    if (lastEvent.at === lastProcessedEventTime) return;

    setLastProcessedEventTime(lastEvent.at);

    let msg = ""; let voiceMsg = "";
    if (lastEvent.type === 'harsh_braking') {
      msg = "Harsh Braking!"; voiceMsg = "Please brake smoothly";
      toast.error(`🛑 ${msg} -10 pts`, { description: `Speed ${Math.round(currentSpeed)} km/h` });
    } else if (lastEvent.type === 'harsh_accel') {
      msg = "Harsh Acceleration!"; voiceMsg = "Easy on the accelerator";
      toast.warning(`⚡ ${msg} -8 pts`);
    } else if (lastEvent.type === 'harsh_turn') {
      msg = "Harsh Turn!"; voiceMsg = "Take turns slowly";
      toast.warning(`↪️ ${msg} -12 pts`);
    }

    if (msg) {
      setEvents(prev => [{ ...lastEvent, speed: Math.round(currentSpeed), time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      speak(voiceMsg);
    }
  }, [lastEvent]);

  const handleStartTrip = async () => {
    const res = await fetch(`${API_BASE}/trips/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: "user_123" }) });
    const data = await res.json();
    setTripId(data._id || data.id); setIsEnded(false); setScore(100); setMiles(0); setEvents([]);
  };

  const handleEndTrip = async () => {
    if (!tripId) return;
    const res = await fetch(`${API_BASE}/trips/${tripId}/end`, { method: 'POST' });
    const data = await res.json();
    setScore(data.score); setMiles(data.milesEarned); setIsEnded(true); setTripId(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900 text-white">
      <Toaster position="top-center" richColors theme="dark" />
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-6 text-center text-blue-400">DriveScore - Live Tracker</h1>
        
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
          {!tripId ? <button onClick={handleStartTrip} className="bg-green-600 hover:bg-green-700 py-2 px-6 rounded-lg font-bold">Start Trip</button> 
          : <button onClick={handleEndTrip} className="bg-red-600 hover:bg-red-700 py-2 px-6 rounded-lg font-bold">End Trip</button>}
          <label className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded-lg border"><input type="checkbox" checked={isMock} onChange={e=>setIsMock(e.target.checked)}/>Mock Drive Mode</label>
          {isMock && tripId && (
            <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-lg border">
              <span className="text-sm">Mock Speed:</span>
              <input type="range" min="20" max="100" value={mockSpeed} onChange={e=>setMockSpeed(Number(e.target.value))} className="accent-yellow-400"/>
              <span className="font-bold text-yellow-400 w-12">{mockSpeed} km/h</span>
            </div>
            
          )}
          <a href="/rewards" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-2 rounded-lg">
    Go to Wallet →
  </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border"><h2 className="text-gray-400">Current Speed</h2><p className="text-3xl font-bold text-yellow-400 mt-2">{Math.round(currentSpeed)} km/h</p></div>
          <div className="bg-gray-800 p-6 rounded-xl border"><h2 className="text-gray-400">GPS Points</h2><p className="text-3xl font-bold text-blue-400 mt-2">{points.length}</p></div>
          <div className="bg-gray-800 p-6 rounded-xl border"><h2 className="text-gray-400">Live Score</h2><p className="text-3xl font-bold text-green-400 mt-2">{score}</p></div>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl border mb-8">
          <h2 className="text-gray-400 mb-3 font-semibold">Live Route Map</h2>
          <div className="h- rounded-lg overflow-hidden border"><LiveMap points={points} /></div>
        </div>

        
        <div className="bg-gray-800 p-4 rounded-xl border mb-8">
          {tripId && (
  <div className="border rounded-xl p-4">
    <h3>Live Driving Events</h3>
    <p>{lastEvent ? lastEvent.type : "Abhi tak sab smooth hai, safe drive kar raha hai ✅"}</p>
  </div>
)}
            <div className="space-y-2">
              {events.map((e,i)=>(
                <div key={i} className={`p-3 rounded-lg flex justify-between ${e.type==='harsh_braking' ? 'bg-red-900/30 border border-red-700' : e.type==='harsh_accel' ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-orange-900/30 border border-orange-700'}`}>
                  <span>{e.type === 'harsh_braking' ? '🛑 Harsh Braking' : e.type === 'harsh_accel' ? '⚡ Harsh Acceleration' : '↪️ Harsh Turn'}</span>
                  <span className="text-gray-400">{e.speed} km/h • {e.time}</span>
                </div>
              ))}
            </div>
          }
        </div>

        {isEnded && (
          
  <div className="p-6 bg-gray-800 rounded-xl border border-green-500 text-center shadow-lg">
    <h3 className="text-2xl font-bold text-green-400 mb-2">Trip Ended Successfully!</h3>
    <p className="text-lg">Final Score: <span className="font-bold text-white">{score}</span></p>
    <p className="text-lg mb-4">Reward Miles Earned: <span className="font-bold text-yellow-400">+{miles} Miles</span></p>
    
    {/* Ye button add karo */}
    <a href="/rewards" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg mt-2">
      Go to Rewards Wallet → Redeem
    </a>
  </div>
)}
      </div>
    </main>
  );
}