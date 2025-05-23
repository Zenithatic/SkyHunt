'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/play');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute airplane"
            style={{
              top: `${(i/20) *-50}%`,
              left: `${(i/20) * 100}%`,
              animationDelay: `${(i/20) * 5}s`,
              animationDuration: `${3}s`
            }}
          >
            ✈️
          </div>
        ))}
      </div>
      
      <div className="relative z-10 w-full max-w-md bg-neutral-900 rounded-2xl shadow-lg p-8 border border-neutral-800">
        <h1 className="text-4xl font-semibold text-center mb-8 tracking-tight">✈️ SkyHunt ✈️</h1>
        <div className="space-y-6">
          <p className="block mb-8 text-center text-2xl font">Welcome to SkyHunt!</p>
          <p>
            SkyHunt is an airport-based scavenger hunt game designed to provide travellers with
            something to do when waiting for their flights. To play, you need a google account to
            sign in.
          </p>
          <button
            onClick={handleStart}
            className="w-full mt-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-neutral-200 transition duration-300"
          >
            Start Game
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-100%) rotate(0deg);
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }

        .airplane {
          font-size: 2rem;
          opacity: 0.5;
          animation: fall linear infinite;
        }
      `}</style>
    </div>
  );
}