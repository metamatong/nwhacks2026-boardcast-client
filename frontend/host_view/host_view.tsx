// HostView.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Pause, X, Camera, Play } from "lucide-react";

const HostView: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [roomCode] = useState("ABC-123-XYZ");
  const [roomName] = useState("Untitled Board");
  const videoRef = useRef<HTMLVideoElement>(null);
  const userGestureCaptured = useRef(false);

  // Prevent scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Attach stream to video element
  const attachStream = (media: MediaStream | null) => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = media;
    if (media) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  // Start camera stream safely with environment preference and fallback
  const startStream = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera not supported. Use HTTPS/localhost and allow camera access.");
      return;
    }

    // Stop any existing stream first
    const current = videoRef.current?.srcObject as MediaStream | null;
    if (current) current.getTracks().forEach((t) => t.stop());

    const constraintsExact: MediaStreamConstraints = {
      video: { facingMode: { exact: "environment" } as any, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };
    const constraintsIdeal: MediaStreamConstraints = {
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsExact);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(constraintsIdeal);
      }

      // Bind end events so UI updates when camera is revoked
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setIsStreaming(false);
          setIsPaused(false);
          attachStream(null);
        };
      });

      attachStream(stream);
      setIsStreaming(true);
      setIsPaused(false);
      console.log("Stream started");
    } catch (error) {
      console.error("Failed to start stream:", error);
      alert("Failed to access camera. Check permissions and try again.");
      setIsStreaming(false);
      setIsPaused(false);
      attachStream(null);
    }
  }, []);

  // Auto-prompt on mount (some browsers allow; others require gesture)
  useEffect(() => {
    startStream();
    return () => {
      const s = videoRef.current?.srcObject as MediaStream | null;
      if (s) s.getTracks().forEach((t) => t.stop());
      attachStream(null);
    };
  }, [startStream]);

  // Capture first user gesture to ensure autoplay on iOS if needed
  const handleUserGesture = useCallback(() => {
    if (!userGestureCaptured.current && !isStreaming) {
      userGestureCaptured.current = true;
      startStream();
    }
  }, [isStreaming, startStream]);

  const handleEndStream = useCallback(() => {
    if (confirm("End stream?")) {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setIsStreaming(false);
      setIsPaused(false);
      attachStream(null);
      console.log("Stream ended");
    }
  }, []);

  const handleTogglePause = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const nextEnabled = !track.enabled;
    track.enabled = nextEnabled;
    setIsPaused(!nextEnabled); // disabled => paused
    console.log(nextEnabled ? "Stream resumed" : "Stream paused");
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !isStreaming) return;

    // Snapshot to download (minimal behavior)
    const canvas = document.createElement("canvas");
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "snapshot.jpg";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }, "image/jpeg", 0.9);
    }

    // Subtle flash
    const flash = document.getElementById("camera-flash");
    if (flash) {
      flash.classList.remove("opacity-0");
      setTimeout(() => flash.classList.add("opacity-0"), 150);
    }
  }, [isStreaming]);

  const noStream = !isStreaming;

  return (
    <div
      className="h-screen w-full bg-background relative overflow-hidden font-sans"
      onClick={handleUserGesture}
      onTouchStart={handleUserGesture}
      style={
        noStream
          ? {
              backgroundImage:
                "radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }
          : undefined
      }
    >
      {/* Camera Stream or Waiting State */}
      {!noStream && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover bg-black"
            autoPlay
            playsInline
            muted
          />

          {isPaused && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-20">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-page border border-selected flex items-center justify-center mx-auto">
                  <Pause className="w-8 h-8 text-primary" />
                </div>
                <p className="text-primary text-lg font-semibold">Paused</p>
              </div>
            </div>
          )}

          <div
            id="camera-flash"
            className="absolute inset-0 bg-white opacity-0 transition-opacity duration-150 pointer-events-none z-30"
          />
        </>
      )}

      {/* Top Bar - Room Info (minimal) */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/70 to-transparent backdrop-blur-sm z-10">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-primary">{roomName}</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted">Room:</span>
            <code className="text-xs font-mono text-secondary font-semibold tracking-widest">
              {roomCode}
            </code>
          </div>
        </div>
      </div>

      {/* Center waiting state */}
      {noStream && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-6 p-8">
            <Camera className="w-20 h-20 text-muted mx-auto" />
            <div className="space-y-2">
              <p className="text-secondary text-lg font-semibold">No Camera Stream</p>
              <p className="text-muted text-sm">Tap anywhere to start streaming</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls (3 minimal grey buttons) */}
      {!noStream && (
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 px-6 z-10">
          <button
            onClick={handleTogglePause}
            className="w-16 h-16 rounded-full bg-hover backdrop-blur-sm border border-selected hover:border-primary transition-all flex items-center justify-center shadow-xl cursor-pointer active:scale-95"
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="w-6 h-6 text-primary" />
            ) : (
              <Pause className="w-6 h-6 text-primary" />
            )}
          </button>

          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full bg-hover backdrop-blur-sm border-2 border-selected hover:border-primary transition-all flex items-center justify-center shadow-xl cursor-pointer active:scale-95"
            aria-label="Capture snapshot"
          >
            <Camera className="w-7 h-7 text-primary" />
          </button>

          <button
            onClick={handleEndStream}
            className="w-16 h-16 rounded-full bg-hover backdrop-blur-sm border border-selected hover:border-red-500 transition-all flex items-center justify-center shadow-xl cursor-pointer active:scale-95"
            aria-label="End stream"
          >
            <X className="w-6 h-6 text-primary" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HostView;