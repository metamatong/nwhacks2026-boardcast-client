"use client";

import React, { useRef, useState, useEffect } from "react";

const isMobile =
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export default function HostView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Attach stream safely
  const attachStream = (stream: MediaStream | null) => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    if (stream) {
      setIsStreaming(true);
      video.play().catch(() => {});
    } else {
      video.pause();
      setIsStreaming(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    if (isStreaming) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      attachStream(stream);
    } catch (err) {
      console.error("Camera error:", err);
      alert("Camera permission denied or unavailable");
    }
  };

  // Auto-start on desktop
  useEffect(() => {
    if (!isMobile) startCamera();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      className="w-screen h-screen bg-black flex items-center justify-center"
      onClick={isMobile ? startCamera : undefined}
      onTouchStart={isMobile ? startCamera : undefined}
    >
      {/* Always mounted video /}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />

      {/ Tap overlay */}
      {!isStreaming && (
        <div className="z-10 text-white text-lg font-semibold">
          Tap anywhere to start camera
        </div>
      )}
    </div>
  );
}
