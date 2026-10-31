'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://drivescore.onrender.com";

export default function HistoryPage() {
  const [trips, setTrips] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_BASE}/trips`).then(r=>r.json()).then(data=>{
      if(Array.isArray(data)) setTrips(data.filter((t:any)=> t.totalKm > 0 || t.stats?.totalEvents > 0).slice(0,20));
    });
  }, []);
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Trip History</h1>
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-gray-700">
          {trips.map(t => (
            <div key={t._id} className="flex justify-between py-4 border-b border-gray-700/50">
              <div>
                <p>Trip {t._id.slice(-6)} completed - {t.totalKm}km</p>
                <p className="text-xs text-gray-400">B:{t.stats?.harshBraking||0} A:{t.stats?.harshAccel||0} T:{t.stats?.harshTurn||0} | Score: {t.finalScore ?? t.score ?? 100}</p>   
              </div>
              <span className="text-green-400 font-semibold">+{t.milesEarned || 0} miles</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center mt-6">
          <Link href="/"><button className="bg-blue-600 px-6 py-2 rounded-lg">Go Home</button></Link>
          <Link href="/"><button className="bg-gray-700 px-6 py-2 rounded-lg">Start New Trip</button></Link>
        </div>
      </div>
    </div>
  );
}