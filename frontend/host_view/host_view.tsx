"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, SwitchCamera, Users, HelpCircle } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  color: string;
}

const MOCK_PARTICIPANTS: Participant[] = [
  { id: "1", name: "You", color: "bg-blue-500" },
  { id: "2", name: "Jane Smith", color: "bg-purple-500" },
  { id: "3", name: "Bob Johnson", color: "bg-green-500" },
];

const HostView: React.FC = () => {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("id") || "ABC123";
  const roomName = searchParams.get("title") || "Untitled Board";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userGestureCaptured = useRef(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [participants] = useState(MOCK_PARTICIPANTS);
  const [detectedRect, setDetectedRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  /* -------------------------------------------------- */
  /* 🔒 Prevent page scroll                             */
  /* -------------------------------------------------- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* -------------------------------------------------- */
  /* 🎥 Attach stream safely (mobile fix)               */
  /* -------------------------------------------------- */
  const attachStream = (stream: MediaStream | null) => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    if (!stream) {
      video.pause();
      return;
    }

    video.onloadedmetadata = () => {
      video
        .play()
        .then(() => {
          // iOS repaint fix
          video.style.display = "none";
          video.offsetHeight;
          video.style.display = "block";
        })
        .catch((err) => {
          console.error("Video play failed:", err);
        });
    };
  };

  /* -------------------------------------------------- */
  /* 🎬 Start camera (mobile-safe)                      */
  /* -------------------------------------------------- */
  const startStream = useCallback(
    async (forceFacing?: "user" | "environment") => {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Camera not supported");
        return;
      }

      const existing = videoRef.current?.srcObject as MediaStream | null;
      existing?.getTracks().forEach((t) => t.stop());

      const constraints: MediaStreamConstraints[] = [
        { video: true, audio: false }, // mobile-first
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        forceFacing
          ? { video: { facingMode: forceFacing }, audio: false }
          : null,
      ].filter(Boolean) as MediaStreamConstraints[];

      let stream: MediaStream | null = null;

      for (const c of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          break;
        } catch (e) {
          console.warn("Constraint failed:", c, e);
        }
      }

      if (!stream) {
        alert("Unable to access camera");
        return;
      }

      attachStream(stream);
      setIsStreaming(true);
    },
    [],
  );

  /* -------------------------------------------------- */
  /* 🔍 Whiteboard detection (guarded)                  */
  /* -------------------------------------------------- */
  const detectWhiteboard = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (
      !video ||
      !canvas ||
      !isStreaming ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simple placeholder detection (keep your existing logic here)
    setDetectedRect({
      x: canvas.width * 0.15,
      y: canvas.height * 0.15,
      width: canvas.width * 0.7,
      height: canvas.height * 0.7,
    });
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      detectionIntervalRef.current = setInterval(detectWhiteboard, 500);
    } else {
      detectionIntervalRef.current &&
        clearInterval(detectionIntervalRef.current);
      setDetectedRect(null);
    }

    return () => {
      detectionIntervalRef.current &&
        clearInterval(detectionIntervalRef.current);
    };
  }, [isStreaming, detectWhiteboard]);

  /* -------------------------------------------------- */
  /* 🧠 User gesture start                              */
  /* -------------------------------------------------- */
  const handleUserGesture = () => {
    if (!userGestureCaptured.current && !isStreaming) {
      userGestureCaptured.current = true;
      startStream();
    }
  };

  const handleFlipCamera = async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    await startStream(next);
  };

  const handleEndStream = () => {
    if (!confirm("End stream?")) return;
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setIsStreaming(false);
    attachStream(null);
    window.location.href = "/";
  };

  const noStream = !isStreaming;

  /* -------------------------------------------------- */
  /* 🖼 UI                                              */
  /* -------------------------------------------------- */
  return (
    <div
      className="h-screen w-full bg-background relative overflow-hidden touch-none"
      onClick={handleUserGesture}
      onTouchStart={handleUserGesture}
    >
      {!noStream && (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="absolute inset-0"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              backgroundColor: "black",
            }}
          />
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}

      {/* Waiting */}
      {noStream && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Camera className="w-20 h-20 text-muted mx-auto" />
            <p className="text-muted">Tap anywhere to start</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {!noStream && (
        <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4 z-10">
          <button
            onClick={handleFlipCamera}
            className="w-14 h-14 rounded-full bg-black/70 flex items-center justify-center"
          >
            <SwitchCamera className="text-white" />
          </button>

          <button
            onClick={handleEndStream}
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center"
          >
            <X className="text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HostView;
