// HostView.tsx
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [participants] = useState<Participant[]>(MOCK_PARTICIPANTS);
  const [detectedRect, setDetectedRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Get room details from URL parameters
  const roomCode = searchParams.get("id") || "ABC 123";
  const roomName = searchParams.get("title") || "Untitled Board";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userGestureCaptured = useRef(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Start camera stream safely
  const startStream = useCallback(
    async (mode?: "environment" | "user") => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Camera not supported. Please use a modern browser with HTTPS.",
        );
        return;
      }

      const current = videoRef.current?.srcObject as MediaStream | null;
      if (current) current.getTracks().forEach((t) => t.stop());

      const targetMode = mode || facingMode;

      // Try multiple constraint strategies for better mobile compatibility
      const constraintStrategies: MediaStreamConstraints[] = [
        // Strategy 1: Mobile-optimized with facing mode
        {
          video: {
            facingMode: targetMode,
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
          },
          audio: false,
        },
        // Strategy 2: Lower resolution for compatibility
        {
          video: {
            facingMode: targetMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        // Strategy 3: Just facing mode (minimal constraints)
        {
          video: { facingMode: targetMode },
          audio: false,
        },
        // Strategy 4: Try exact facing mode
        {
          video: { facingMode: { exact: targetMode } },
          audio: false,
        },
        // Strategy 5: Basic video without facing mode (ultimate fallback)
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        // Strategy 6: Absolute basic video
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: any = null;

      for (const constraints of constraintStrategies) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log("✅ Stream started with constraints:", constraints);
          break;
        } catch (error) {
          console.warn("❌ Failed with constraints:", constraints, error);
          lastError = error;
        }
      }

      if (!stream) {
        console.error("All camera strategies failed:", lastError);
        const errorMsg =
          lastError?.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access in your browser settings."
            : lastError?.name === "NotFoundError"
              ? "No camera found on this device."
              : "Failed to access camera. Please check permissions and try again.";
        alert(errorMsg);
        setIsStreaming(false);
        attachStream(null);
        return;
      }

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setIsStreaming(false);
          attachStream(null);
        };
      });

      attachStream(stream);
      setIsStreaming(true);
      console.log("✅ Stream started successfully with facing mode:", targetMode);
    },
    [facingMode],
  );

  // Enhanced whiteboard detection with edge detection and contour analysis
  const detectWhiteboard = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isStreaming) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Convert to grayscale and apply edge detection (Sobel-like)
    const gray = new Uint8Array(width * height);
    const edges = new Uint8Array(width * height);

    // Grayscale conversion
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      gray[idx] = Math.floor(
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
      );
    }

    // Simple edge detection using gradient
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        // Sobel operators
        const gx =
          -gray[(y - 1) * width + (x - 1)] +
          gray[(y - 1) * width + (x + 1)] +
          -2 * gray[y * width + (x - 1)] +
          2 * gray[y * width + (x + 1)] +
          -gray[(y + 1) * width + (x - 1)] +
          gray[(y + 1) * width + (x + 1)];

        const gy =
          -gray[(y - 1) * width + (x - 1)] -
          2 * gray[(y - 1) * width + x] -
          gray[(y - 1) * width + (x + 1)] +
          gray[(y + 1) * width + (x - 1)] +
          2 * gray[(y + 1) * width + x] +
          gray[(y + 1) * width + (x + 1)];

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[idx] = magnitude > 50 ? 255 : 0;
      }
    }

    // Find bright regions (potential whiteboard)
    const brightThreshold = 160;
    const brightMask = new Uint8Array(width * height);

    for (let i = 0; i < gray.length; i++) {
      brightMask[i] = gray[i] > brightThreshold ? 255 : 0;
    }

    // Combine edges and brightness to find whiteboard candidates
    const combined = new Uint8Array(width * height);
    for (let i = 0; i < combined.length; i++) {
      combined[i] = brightMask[i] > 0 && edges[i] > 0 ? 255 : 0;
    }

    // Find bounding box of largest connected bright region
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;
    let pixelCount = 0;

    // Sample grid for performance (every 8 pixels)
    for (let y = 0; y < height; y += 8) {
      for (let x = 0; x < width; x += 8) {
        const idx = y * width + x;

        // Check if this area is bright
        if (brightMask[idx] > 0) {
          pixelCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Validate detection
    const detectedWidth = maxX - minX;
    const detectedHeight = maxY - minY;
    const aspectRatio = detectedWidth / Math.max(detectedHeight, 1);
    const area = detectedWidth * detectedHeight;
    const minArea = width * height * 0.1; // At least 10% of frame
    const maxArea = width * height * 0.9; // At most 90% of frame

    // Check if detection is valid (reasonable size, aspect ratio, and pixel count)
    if (
      pixelCount > 200 &&
      area > minArea &&
      area < maxArea &&
      aspectRatio > 0.5 &&
      aspectRatio < 3 && // Reasonable aspect ratio
      detectedWidth > 100 &&
      detectedHeight > 100 // Minimum size
    ) {
      // Add padding and ensure within bounds
      const padding = 30;
      setDetectedRect({
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(width - (minX - padding), detectedWidth + padding * 2),
        height: Math.min(
          height - (minY - padding),
          detectedHeight + padding * 2,
        ),
      });
    } else {
      setDetectedRect(null);
    }
  }, [isStreaming]);

  // Auto-start stream on mount
  useEffect(() => {
    startStream();
    return () => {
      const s = videoRef.current?.srcObject as MediaStream | null;
      if (s) s.getTracks().forEach((t) => t.stop());
      attachStream(null);
    };
  }, [startStream]);

  // Run whiteboard detection periodically
  useEffect(() => {
    if (isStreaming) {
      // Run detection every 500ms
      detectionIntervalRef.current = setInterval(detectWhiteboard, 500);
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setDetectedRect(null);
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [isStreaming, detectWhiteboard]);

  const handleUserGesture = useCallback(() => {
    if (!userGestureCaptured.current && !isStreaming) {
      userGestureCaptured.current = true;
      startStream();
    }
  }, [isStreaming, startStream]);

  const handleEndStream = useCallback(() => {
    if (confirm("End stream and return to home?")) {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setIsStreaming(false);
      attachStream(null);
      console.log("Stream ended");
      // Navigate back to home or room list
      window.location.href = "/";
    }
  }, []);

  const handleFlipCamera = useCallback(async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    if (isStreaming) {
      await startStream(newMode);
    }
  }, [facingMode, isStreaming, startStream]);

  const handleViewParticipants = useCallback(() => {
    setShowParticipants(true);
  }, []);

  const handleShowHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  const noStream = !isStreaming;

  return (
    <div
      className="h-screen w-full bg-background relative overflow-hidden font-sans touch-none"
      onClick={handleUserGesture}
      onTouchStart={handleUserGesture}
      style={
        noStream
          ? {
              backgroundImage:
                "radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
              width: "100vw",
              maxWidth: "100vw",
            }
          : {
              width: "100vw",
              maxWidth: "100vw",
            }
      }
    >
      {/* Camera Stream */}
      {!noStream && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            playsInline
            muted
            webkit-playsinline="true"
          />

          {/* Hidden canvas for detection */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Whiteboard detection overlay */}
          <AnimatePresence>
            {detectedRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute border-4 border-white rounded-lg pointer-events-none z-20 transition-all duration-300"
                style={{
                  left: `${(detectedRect.x / (canvasRef.current?.width || 1)) * 100}%`,
                  top: `${(detectedRect.y / (canvasRef.current?.height || 1)) * 100}%`,
                  width: `${(detectedRect.width / (canvasRef.current?.width || 1)) * 100}%`,
                  height: `${(detectedRect.height / (canvasRef.current?.height || 1)) * 100}%`,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="absolute -top-8 left-0 bg-white text-black px-3 py-1 rounded-md text-xs font-semibold shadow-lg"
                >
                  Whiteboard Detected
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            id="camera-flash"
            className="absolute inset-0 bg-white opacity-0 transition-opacity duration-150 pointer-events-none z-30"
          />
        </>
      )}

      {/* Top Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/70 to-transparent backdrop-blur-sm z-10 flex items-start justify-between"
      >
        <div className="flex-1 text-center space-y-1">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg font-bold text-primary"
          >
            {roomName}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-xs text-muted">Room Code:</span>
            <code className="text-xs font-mono text-secondary font-semibold tracking-widest">
              {roomCode.slice(0, 3) + " " + roomCode.slice(3, 6)}
            </code>
          </motion.div>
        </div>

        {/* Help Button */}
        {!noStream && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              handleShowHelp();
            }}
            className="w-10 h-10 rounded-full border border-selected flex items-center justify-center cursor-pointer bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all"
            aria-label="Help & Tips"
          >
            <HelpCircle className="w-5 h-5 text-primary" />
          </motion.button>
        )}
      </motion.div>

      {/* Waiting State */}
      <AnimatePresence>
        {noStream && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="text-center space-y-6 p-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Camera className="w-20 h-20 text-muted mx-auto" />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-2"
              >
                <p className="text-secondary text-lg font-semibold">
                  No Camera Stream
                </p>
                <p className="text-muted text-sm">
                  Tap anywhere to start streaming
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {!noStream && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 pb-6 sm:pb-8 pt-4 z-10"
            style={{
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
          >
            {/* Participants Button with Avatars */}
            <motion.button
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleViewParticipants();
              }}
              className="px-3 sm:px-4 h-14 sm:h-16 relative rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer overflow-visible transition-transform backdrop-blur-sm flex-shrink-0"
              aria-label="View Participants"
              style={{
                backgroundColor: "rgba(30, 30, 30, 0.8)",
                backgroundImage:
                  "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            >
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((participant, idx) => (
                  <div
                    key={participant.id}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${participant.color} border-2 border-page flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                    style={{ zIndex: 3 - idx }}
                    title={participant.name}
                  >
                    {participant.name.charAt(0)}
                  </div>
                ))}
              </div>
              <span className="absolute inset-0 bg-white opacity-0 hover:opacity-5 transition-opacity rounded-full pointer-events-none" />
            </motion.button>

            {/* End Stream Button */}
            <motion.button
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleEndStream();
              }}
              className="w-16 h-16 sm:w-20 sm:h-20 relative rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer overflow-hidden transition-transform backdrop-blur-sm flex-shrink-0"
              aria-label="End Stream"
              style={{
                backgroundColor: "rgba(30, 30, 30, 0.8)",
                backgroundImage:
                  "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            >
              <X className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              <span className="absolute inset-0 bg-white opacity-0 hover:opacity-5 transition-opacity rounded-full pointer-events-none" />
            </motion.button>

            {/* Flip Camera Button */}
            <motion.button
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleFlipCamera();
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 relative rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer overflow-hidden transition-transform backdrop-blur-sm flex-shrink-0"
              aria-label="Flip Camera"
              style={{
                backgroundColor: "rgba(30, 30, 30, 0.8)",
                backgroundImage:
                  "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            >
              <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="absolute inset-0 bg-white opacity-0 hover:opacity-5 transition-opacity rounded-full pointer-events-none" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants Modal */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowParticipants(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-page rounded-xl border border-selected p-6 max-w-md w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">Participants</h2>
                <button
                  onClick={() => setShowParticipants(false)}
                  className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary">
                      You (Host)
                    </p>
                    <p className="text-xs text-muted">Streaming</p>
                  </div>
                </div>

                <div className="text-center py-8">
                  <p className="text-sm text-muted">
                    No other participants yet
                  </p>
                  <p className="text-xs text-muted mt-1">
                    Share room code:{" "}
                    <span className="font-mono text-secondary">{roomCode}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowHelp(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-page rounded-xl border border-selected p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">
                  Stream Quality Tips
                </h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-primary">
                    📱 Camera Setup
                  </h3>
                  <ul className="space-y-1.5 text-muted">
                    <li>• Use a phone stand or tripod for stability</li>
                    <li>• Position camera directly above the whiteboard</li>
                    <li>• Ensure the entire board is visible in frame</li>
                    <li>• Keep camera at least 2-3 feet from the board</li>
                  </ul>
                </div>

                <div className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-primary">💡 Lighting</h3>
                  <ul className="space-y-1.5 text-muted">
                    <li>• Use bright, even lighting across the board</li>
                    <li>• Avoid direct sunlight causing glare</li>
                    <li>• Position lights to minimize shadows</li>
                    <li>• Turn on overhead lights if available</li>
                  </ul>
                </div>

                <div className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-primary">🌐 Connection</h3>
                  <ul className="space-y-1.5 text-muted">
                    <li>• Use WiFi instead of cellular data if possible</li>
                    <li>• Close other apps to free up bandwidth</li>
                    <li>• Stay close to your WiFi router</li>
                    <li>• Restart the stream if quality degrades</li>
                  </ul>
                </div>

                <div className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-primary">✏️ Board Tips</h3>
                  <ul className="space-y-1.5 text-muted">
                    <li>• Use dark markers for better contrast</li>
                    <li>• Clean the board before starting</li>
                    <li>• Write larger than usual for clarity</li>
                    <li>• Avoid standing in front of the camera</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HostView;
