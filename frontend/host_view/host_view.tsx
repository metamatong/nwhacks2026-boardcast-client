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

const isMobile =
  typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const HostView: React.FC = () => {
  const searchParams = useSearchParams();

  const roomCode = searchParams.get("id") || "ABC123";
  const roomName = searchParams.get("title") || "Untitled Board";

  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startedRef = useRef(false);

  /* Prevent page scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  /* Attach stream safely */
  const attachStream = (stream: MediaStream | null) => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;

    if (stream) {
      video.onloadedmetadata = () => {
        video.play().catch(() => {});
        setIsStreaming(true);
      };
    } else {
      video.pause();
      setIsStreaming(false);
    }
  };

  /* Start camera */
  const startStream = useCallback(
    async (mode?: "environment" | "user") => {
      if (startedRef.current) return;
      startedRef.current = true;

      try {
        const targetMode = mode || facingMode;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetMode },
          audio: false,
        });

        stream.getTracks().forEach((t) => {
          t.onended = () => {
            setIsStreaming(false);
            attachStream(null);
          };
        });

        attachStream(stream);
      } catch (err) {
        console.error("Camera failed:", err);
        startedRef.current = false;
        alert("Camera access failed. Please allow permissions.");
      }
    },
    [facingMode],
  );

  /* Desktop auto-start */
  useEffect(() => {
    if (!isMobile) {
      startStream();
    }

    return () => {
      const s = videoRef.current?.srcObject as MediaStream | null;
      if (s) s.getTracks().forEach((t) => t.stop());
    };
  }, [startStream]);

  /* Whiteboard detection (safe on mobile) */
  const detectWhiteboard = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      !isStreaming ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    )
      return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = Math.floor(video.videoWidth / 2);
    canvas.height = Math.floor(video.videoHeight / 2);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simple brightness detection (mobile-safe)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width,
      minY = canvas.height,
      maxX = 0,
      maxY = 0,
      count = 0;

    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      if (brightness > 180) {
        const px = ((i / 4) % canvas.width) | 0;
        const py = (i / 4 / canvas.width) | 0;

        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
        count++;
      }
    }

    if (count > 200) {
      setDetectedRect({
        x: minX * 2,
        y: minY * 2,
        width: (maxX - minX) * 2,
        height: (maxY - minY) * 2,
      });
    } else {
      setDetectedRect(null);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      detectionIntervalRef.current = setInterval(detectWhiteboard, 1200);
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [isStreaming, detectWhiteboard]);

  const handleUserGesture = () => {
    if (!isStreaming) startStream();
  };

  const handleFlipCamera = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);

    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) stream.getTracks().forEach((t) => t.stop());

    startedRef.current = false;
    startStream(newMode);
  };

  const noStream = !isStreaming;

  return (
    <div
      className="h-screen w-full bg-background relative overflow-hidden font-sans"
      onTouchStart={isMobile ? handleUserGesture : undefined}
      onClick={!isMobile ? handleUserGesture : undefined}
      style={{
        backgroundImage: noStream
          ? "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)"
          : undefined,
        backgroundSize: "24px 24px",
      }}
    >
      {!noStream && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover bg-black"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}

      {/* Waiting State */}
      <AnimatePresence>
        {noStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <Camera className="w-16 h-16 text-muted mx-auto" />
              <p className="text-secondary font-semibold">
                Tap anywhere to start streaming
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      {!noStream && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20">
          <button
            onClick={handleFlipCamera}
            className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center"
          >
            <SwitchCamera className="text-white" />
          </button>
          <button
            onClick={() => window.location.replace("/")}
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
