'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  onCapture: (file: File) => void;
};

export default function CameraCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // 🟢 Start the webcam
  const enableCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('[❌ Camera Error]', err);
    }
  };

  // 🧹 Start/stop camera on mount
  useEffect(() => {
    enableCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // 📸 Capture the frame to canvas
  const handleCapture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      console.error('[❌] Missing canvas or video');
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);

    stream?.getTracks().forEach((track) => track.stop());
  };

  // 🔄 Retake
  const handleRetake = async () => {
    setCapturedImage(null);
    await enableCamera();
  };

  // 📤 Upload to parent
  const handleUpload = () => {
    console.log('[📸 Upload button pressed]');
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[❌ No canvas found]');
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('[❌ Failed to create blob]');
        return;
      }

      const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
      console.log('[✅ File created, sending to parent]', file);
      onCapture(file);
    }, 'image/jpeg');
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* ✅ Always keep canvas in DOM */}
      <canvas ref={canvasRef} className="hidden" />

      {!capturedImage ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-md rounded-xl shadow-lg"
          />
          <button
            type="button"
            onClick={handleCapture}
            className="px-6 py-2 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200"
          >
            Capture 📸
          </button>
        </>
      ) : (
        <>
          <img
            src={capturedImage}
            alt="Preview"
            className="w-full max-w-md rounded-xl shadow-lg"
          />
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleRetake}
              className="px-5 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="px-5 py-2 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200"
            >
              Upload
            </button>
          </div>
        </>
      )}
    </div>
  );
}
