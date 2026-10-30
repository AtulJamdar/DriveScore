'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://drivescore.onrender.com";

export default function HistoryPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [debug, setDebug] = useState('');

  useEffect(() => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'atul_test_user'; // fallback
      localStorage.setItem('userId', userId);
      setDebug('No userId found, using fallback: ' + userId);
    } else {
      setDebug('Using userId: ' + userId);
    }

    // Try user trips first, if empty try all trips
    fetch(`${API_BASE}/trips/user/${userId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTrips(data);
        } else {
          // Fallback - get all trips if userId trips empty
          setDebug(prev => prev + ' | No trips for this user, fetching all trips');
          return fetch(`${API_BASE}/trips`).then(r=>r.json()).then(all => {
            if(Array.isArray(all)) setTrips(all);
          });
        }
      })
      .catch(e => setDebug('Error: ' + e.message));
  }, []);

  return (
    <div className="p-4 max-w-xl mx-auto bg-white min-h-screen text-black">
      <h1 className="text-xl font-bold mb-4 text-center">Trip History</h1>
      <p className="text-xs text-gray-500 mb-4 text-center">{debug}</p>
      
      {trips.length === 0 ? (
        <div className="text-center mt-10">
          <p>No trips yet</p>
          <p className="text-sm text-gray-500 mt-2">Start a trip on main page first</p>
          <Link href="/"><button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Go to Home</button></Link>
        </div>
      ) : (
        trips.map(t => (
          <Link key={t._id} href={`/trip/${t._id}`}>
            <div className="bg-gray-800 text-white p-4 rounded-xl border mb-3">
              <p className="font-semibold">{new Date(t.startTime).toLocaleDateString()} - {t.totalKm || 0} km / {t.milesEarned || 0} miles</p>
              <p className="text-sm text-gray-400">B:{t.stats?.harshBraking||0} A:{t.stats?.harshAccel||0} T:{t.stats?.harshTurn||0} | Score: {t.finalScore||100}</p>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}