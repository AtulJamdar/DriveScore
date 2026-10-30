'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://drivescore.onrender.com";

export default function HistoryPage() {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    let userId = localStorage.getItem('userId') || 'atul_test_user';
    fetch(`${API_BASE}/trips`).then(r=>r.json()).then(data=>{
      if(Array.isArray(data)) setTrips(data.filter(t=>t.totalKm > 0 || t.milesEarned > 0)); // 0 km wale hatao
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Trip History</h1>
        
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-gray-700">
          {trips.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No trips yet. Start a trip first.</p>
          ) : (
            trips.map(t => (
              <div key={t._id} className="flex justify-between items-center py-4 border-b border-gray-700/50 last:border-0">
                <div>
                  <p className="font-medium">Trip {t._id.slice(-6)} completed - {t.totalKm?.toFixed(2) || 0}km</p>
                  <p className="text-xs text-gray-400 mt-1">B:{t.stats?.harshBraking||0} A:{t.stats?.harshAccel||0} T:{t.stats?.harshTurn||0} | Score: {t.finalScore || 100}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-400 font-semibold">+{t.milesEarned || 0} miles</span>
                  <Link href={`/trip/${t._id}`}>
                    <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg text-xs">Detail →</button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/"><button className="bg-gray-700 px-6 py-2 rounded-lg">Back to Drive</button></Link>
        </div>
      </div>
    </div>
  );
}