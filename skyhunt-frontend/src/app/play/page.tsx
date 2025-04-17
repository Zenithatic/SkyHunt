'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import CameraCapture from '../components/CameraCapture';

export default function PlayPage() {
  const params = useSearchParams();
  const username = params.get('username') || '';
  const airport = params.get('airport') || '';

  const [challenge, setChallenge] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🔁 Fetch new GPT challenge
  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/gpt/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, airport }),
      });

      const data = await res.json();
      setChallenge(data.challenge || '⚠️ No challenge received.');
    } catch (err) {
      console.error('Error fetching challenge:', err);
      setChallenge('⚠️ Failed to load challenge.');
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 🧠 Load first challenge
  useEffect(() => {
    if (username && airport) fetchChallenge();
  }, [username, airport]);

  // 📤 Upload and verify image
  const handleUpload = async (file: File) => {
    console.log('[📤 Uploading to backend]', file.name);
    console.log('[🔥 handleUpload triggered]', file);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('username', username);
    formData.append('challenge', challenge);

    try {
      const response = await fetch('http://localhost:3000/photo/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      console.log('[✅ Backend Response]', result);

      if (result.match) {
        const points = Math.max(0, timeLeft);
        setScore((prev) => prev + points);
        alert(`✅ Challenge passed! You earned ${points} points.`);
      } else {
        alert('❌ Image did not match the challenge.');
      }

      setTimeLeft(60);
      await fetchChallenge();
    } catch (err) {
      console.error('[Upload Error]', err);
      alert('Something went wrong during upload.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-12 space-y-6">
      <h1 className="text-2xl font-semibold">SkyHunt ✈️</h1>
      <p className="text-lg text-neutral-400 text-center max-w-xl">
        {loading ? 'Generating challenge...' : challenge}
      </p>

      <div className="text-4xl font-mono bg-white text-black px-8 py-3 rounded-xl">
        {timeLeft}s
      </div>

      {/* 📸 Camera Capture */}
      <CameraCapture onCapture={handleUpload} />
      <button
  className="px-6 py-2 bg-red-500 rounded-lg"
  onClick={() => {
    const fake = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    handleUpload(fake);
  }}
>
  TEST Upload Call
</button>


      <p className="text-neutral-400">Score: {score}</p>
    </div>
    
  );
  
}
