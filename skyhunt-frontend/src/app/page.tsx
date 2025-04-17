'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const [airport, setAirport] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (username.trim() && airport.trim()) {
      // Pass username and airport to next page via query (for now)
      router.push(`/play?username=${encodeURIComponent(username)}&airport=${encodeURIComponent(airport)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md bg-neutral-900 rounded-2xl shadow-lg p-8 border border-neutral-800">
        <h1 className="text-4xl font-semibold text-center mb-8 tracking-tight">✈️ SkyHunt</h1>
        <div className="space-y-6">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Username</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Airport</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-lg bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-white"
              placeholder="e.g., JFK, LAX"
              value={airport}
              onChange={(e) => setAirport(e.target.value)}
            />
          </div>
          <button
            onClick={handleStart}
            className="w-full mt-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition duration-300"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}
