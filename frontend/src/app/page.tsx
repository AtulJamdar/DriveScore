"use client";
import { useState, useEffect } from "react";
import { useDriveTracker } from "@/hooks/useDriveTracker";
import dynamic from "next/dynamic";

// Leaflet map ko SSR (Server-Side Rendering) se bachane ke liye dynamic import karte hain
const LiveMap = dynamic(() => import("@/components/LiveMap"), { ssr: false });

export default function DrivePage() {
  const [tripId, setTripId] = useState<string | null>(null);
  const [isMock, setIsMock] = useState<boolean>(true);
  const [mockSpeed, setMockSpeed] = useState<number>(45); // Mock speed controller
  const [score, setScore] = useState<number>(100);
  const [miles, setMiles] = useState<number>(0);
  const [isEnded, setIsEnded] = useState<boolean>(false);

  // Custom hook call (passing mockSpeed if needed or handling mock inside)
  const { points, currentSpeed } = useDriveTracker(tripId, isMock);

  const handleStartTrip = async () => {
    try {
      const res = await fetch("http://localhost:3000/trips/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user_123" }),
      });
      const data = await res.json();
      setTripId(data._id || data.id);
      setIsEnded(false);
      setScore(100);
      setMiles(0);
    } catch (err) {
      console.error("Failed to start trip:", err);
    }
  };

  const handleEndTrip = async () => {
    if (!tripId) return;
    try {
      const res = await fetch(`http://localhost:3000/trips/${tripId}/end`, {
        method: "POST",
      });
      const data = await res.json();
      setScore(data.score);
      setMiles(data.milesEarned);
      setIsEnded(true);
      setTripId(null);
    } catch (err) {
      console.error("Failed to end trip:", err);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900 text-white">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-6 text-center text-blue-400">DriveScore - Live Tracker</h1>

        {/* Controls Bar */}
        <div className="flex flex-wrap gap-4 justify-center items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow">
          {!tripId ? (
            <button
              onClick={handleStartTrip}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition"
            >
              Start Trip
            </button>
          ) : (
            <button
              onClick={handleEndTrip}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition"
            >
              End Trip
            </button>
          )}

          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-gray-900 rounded-lg border border-gray-700">
            <input
              type="checkbox"
              checked={isMock}
              onChange={(e) => setIsMock(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            <span>Mock Drive Mode</span>
          </label>

          {/* Mock Speed Controller */}
          {isMock && tripId && (
            <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-sm text-gray-400">Mock Speed:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={mockSpeed}
                onChange={(e) => setMockSpeed(Number(e.target.value))}
                className="accent-yellow-400 cursor-pointer"
              />
              <span className="font-bold text-yellow-400 w-12 text-right">{mockSpeed} km/h</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow">
            <h2 className="text-gray-400 text-lg">Current Speed</h2>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{Math.round(currentSpeed || mockSpeed)} km/h</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow">
            <h2 className="text-gray-400 text-lg">GPS Points Recorded</h2>
            <p className="text-3xl font-bold text-blue-400 mt-2">{points.length}</p>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow">
            <h2 className="text-gray-400 text-lg">Live Score</h2>
            <p className="text-3xl font-bold text-green-400 mt-2">{score}</p>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow mb-8">
          <h2 className="text-gray-400 text-lg mb-3 font-semibold">Live Route Map</h2>
          <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-700">
            <LiveMap points={points} />
          </div>
        </div>

        {isEnded && (
          <div className="p-6 bg-gray-800 rounded-xl border border-green-500 text-center shadow-lg">
            <h3 className="text-2xl font-bold text-green-400 mb-2">Trip Ended Successfully!</h3>
            <p className="text-lg">Final Score: <span className="font-bold text-white">{score}</span></p>
            <p className="text-lg">Reward Miles Earned: <span className="font-bold text-yellow-400">+{miles} Miles</span></p>
          </div>
        )}
      </div>
    </main>
  );
}