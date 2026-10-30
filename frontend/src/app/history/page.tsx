'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://drivescore.onrender.com";

export default function HistoryPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  useEffect(() => {
    if(!userId) return;
    fetch(`${API_BASE}/trips/user/${userId}`).then(r=>r.json()).then(setTrips);
  }, [userId]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Trip History</h1>
      {trips.map(t => (
        <Link key={t._id} href={`/trip/${t._id}`}>
          <div className="bg-gray-800 p-4 rounded-xl border mb-3">
            <p className="font-semibold">{new Date(t.startTime).toLocaleDateString()} - {t.totalKm} km / {t.milesEarned} miles</p>
            <p className="text-sm text-gray-400">B:{t.stats?.harshBraking||0} A:{t.stats?.harshAccel||0} T:{t.stats?.harshTurn||0} | Score: {t.finalScore||'-'}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}