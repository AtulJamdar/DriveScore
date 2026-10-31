"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://drivescore.onrender.com";

const rewardsList = [
  { name: "Fuel Voucher Rs 100", miles: 100 },
  { name: "Free Car Wash", miles: 150 },
  { name: "Puncture Service Free", miles: 50 },
];

export default function RewardsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;
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

  const totalPages = Math.ceil(history.length / itemsPerPage) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

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
      setCurrentPage(1);
      alert(`Success! Redeemed: ${item.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const reversedHistory = [...history].reverse();
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = reversedHistory.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-block mb-6 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
        >
          ← Back to Drive / Start New Trip
        </Link>
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Rewards Wallet</h1>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-gray-400">Available Miles Balance</h2>
            <p className="text-4xl font-bold text-yellow-400 mt-1">{balance} Miles</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">Available Vouchers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {rewardsList.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col justify-between"
            >
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

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Redemption History</h2>
          {history.length > 0 && (
            <span className="text-sm text-gray-400">
              Total {history.length} {history.length === 1 ? "entry" : "entries"}
            </span>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No redemption history yet.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {paginatedHistory.map((h: any, i) => {
                  const amount = h.amount ?? h.miles ?? 0;
                  const reason = h.reason ?? h.note ?? `Trip completed - ${amount} miles`;
                  const isEarn =
                    reason.toLowerCase().includes("completed") ||
                    reason.toLowerCase().includes("trip") ||
                    amount > 0;

                  return (
                    <li
                      key={i}
                      className="flex justify-between items-center border-b border-gray-700 pb-2"
                    >
                      <div>
                        <span>{reason}</span>
                        {h.date && !isNaN(new Date(h.date).getTime()) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(h.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      <span className={`font-semibold ${isEarn ? "text-green-400" : "text-red-400"}`}>
                        {isEarn ? `+${Math.abs(amount)}` : `-${Math.abs(amount)}`} miles
                      </span>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    Showing <span className="font-medium text-white">{startIndex + 1}</span> to{" "}
                    <span className="font-medium text-white">
                      {Math.min(startIndex + itemsPerPage, history.length)}
                    </span>{" "}
                    of <span className="font-medium text-white">{history.length}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        currentPage === 1
                          ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                          : "bg-gray-700 hover:bg-gray-600 text-white"
                      }`}
                    >
                      ← Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, idx) =>
                        typeof page === "number" ? (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            }`}
                          >
                            {page}
                          </button>
                        ) : (
                          <span key={idx} className="px-1 text-gray-500">
                            ...
                          </span>
                        )
                      )}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        currentPage === totalPages
                          ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                          : "bg-gray-700 hover:bg-gray-600 text-white"
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
