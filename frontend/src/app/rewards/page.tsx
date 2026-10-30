"use client";
import { useState, useEffect } from "react";
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const rewardsList = [
  { name: "Fuel Voucher Rs 100", miles: 100 },
  { name: "Free Car Wash", miles: 150 },
  { name: "Puncture Service Free", miles: 50 },
];

export default function RewardsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const userId = "user_123"; // Dummy user id for demo

  useEffect(() => {
    fetch(`${API_BASE}/rewards/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setBalance(data.milesBalance || 0);
        setHistory(data.history || []);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleRedeem = async (item: { name: string; miles: number }) => {
    if (balance < item.miles) {
      alert("Aapke paas sufficient miles nahi hain!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/rewards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, milesNeeded: item.miles, voucherName: item.name }),
      });
      const data = await res.json();
      setBalance(data.milesBalance);
      setHistory(data.history);
      alert(`Success! Redeemed: ${item.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-block mb-6 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
  ← Back to Drive / Start New Trip
</Link>
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Attento Rewards Wallet</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400">Available Miles Balance</h2>
            <p className="text-4xl font-bold text-yellow-400 mt-1">{balance} Miles</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Available Vouchers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {rewardsList.map((item, idx) => (
            <div key={idx} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                <p className="text-yellow-400 font-mono mb-4">{item.miles} Miles Required</p>
              </div>
              <button
                onClick={() => handleRedeem(item)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-bold transition"
              >
                Redeem
              </button>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-4">Redemption History</h2>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <ul className="space-y-3">
  {history.map((h: any, i) => {
    // Purana data ho ya naya, dono se kaam karega
    const amount = h.amount ?? h.miles ?? 0;
    const reason = h.reason ?? h.note ?? `Trip completed - ${amount} miles`;
    const isEarn = reason.toLowerCase().includes('completed') || reason.toLowerCase().includes('trip') || amount > 0;

    return (
      <li key={i} className="flex justify-between border-b border-gray-700 pb-2">
        <span>{reason}</span>
        <span className={isEarn ? "text-green-400" : "text-red-400"}>
          {isEarn ? `+${Math.abs(amount)}` : `-${Math.abs(amount)}`} miles
        </span>
      </li>
    )
  })}
</ul>
        </div>
      </div>
    </main>
  );
}