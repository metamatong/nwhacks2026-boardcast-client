"use client";

import { useRef, useState } from "react";

export default function HostView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stage, setStage] = useState<"idle" | "ready" | "live">("idle");
  const streamRef = useRef<MediaStream | null>(null);

  const requestPermission = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setStage("ready");
    } catch {
      alert("Camera permission denied");
    }
  };

  const startStream = () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;
    setStage("live");
  };

  return (
    <div className="relative w-screen h-screen bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      />

      {stage !== "live" && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
          {stage === "idle" && (
            <button onClick={requestPermission}>Allow camera access</button>
          )}

          {stage === "ready" && (
            <button onClick={startStream}>Tap again to go live</button>
          )}
        </div>
      )}
    </div>
  );
}
