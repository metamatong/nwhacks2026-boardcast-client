"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
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

export default function HostView() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("id") || "ABC123";
  const roomName = searchParams.get("title") || "Untitled Board";

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stage, setStage] = useState<"idle" | "ready" | "live">("idle");
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [participants] = useState(MOCK_PARTICIPANTS);

  // Prevent scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Ask for camera permission
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

  // Start stream
  const startStream = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    setStage("live");
  }, []);

  // Stop stream
  const stopStream = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStage("idle");
  }, []);

  const noStream = stage !== "live";

  return (
    <div
      className="h-screen w-full bg-background relative overflow-hidden font-sans touch-none"
      style={{
        backgroundImage: noStream
          ? "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)"
          : undefined,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Camera Stream */}
      {stage === "live" && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover bg-black"
          autoPlay
          playsInline
          muted
        />
      )}

      {/* Top Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/70 to-transparent backdrop-blur-sm z-10 flex items-start justify-between"
      >
        <div className="flex-1 text-center space-y-1">
          <h1 className="text-lg font-bold text-primary">{roomName}</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted">Room Code:</span>
            <code className="text-xs font-mono text-secondary font-semibold tracking-widest">
              {roomCode.slice(0, 3)} {roomCode.slice(3)}
            </code>
          </div>
        </div>

        {!noStream && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHelp(true);
            }}
            className="w-10 h-10 rounded-full border border-selected flex items-center justify-center bg-background/50 backdrop-blur-sm"
          >
            <HelpCircle className="w-5 h-5 text-primary" />
          </button>
        )}
      </motion.div>

      {/* Idle / Ready Overlay */}
      <AnimatePresence>
        {stage !== "live" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <div className="text-center space-y-6 p-8">
              <Camera className="w-20 h-20 text-muted mx-auto" />

              {stage === "idle" && (
                <button
                  onClick={requestPermission}
                  className="px-6 py-3 rounded-full bg-white text-black font-semibold"
                >
                  Allow camera access
                </button>
              )}

              {stage === "ready" && (
                <button
                  onClick={startStream}
                  className="px-6 py-3 rounded-full bg-white text-black font-semibold"
                >
                  Tap again to go live
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Bottom Controls */}
      <AnimatePresence>
        {stage === "live" && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 z-50 bg-gradient-to-t from-black/60 via-black/30 to-transparent"
            style={{
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
              paddingTop: "2rem",
            }}
          >
            {/* Participants Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowParticipants(true);
              }}
              className="px-4 h-16 rounded-full border border-selected flex items-center justify-center shadow-xl backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(30,30,30,0.8)",
                backgroundImage:
                  "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            >
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((p, i) => (
                  <div
                    key={p.id}
                    className={`w-8 h-8 rounded-full ${p.color} border-2 border-page flex items-center justify-center text-xs font-bold text-white`}
                    style={{ zIndex: 3 - i }}
                  >
                    {p.name.charAt(0)}
                  </div>
                ))}
              </div>
            </motion.button>

            {/* End Stream */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                stopStream();
              }}
              className="w-20 h-20 rounded-full border border-selected flex items-center justify-center shadow-xl backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(30,30,30,0.85)",
                backgroundImage:
                  "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            >
              <X className="w-7 h-7 text-primary" />
            </motion.button>

            {/* Flip Camera (UI only for now) */}
            <motion.button
              className="w-16 h-16 rounded-full border border-selected flex items-center justify-center shadow-xl opacity-40 cursor-not-allowed backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(30,30,30,0.8)",
                backgroundImage:
                  "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
                backgroundSize: "24px 24px",
              }}
            >
              <SwitchCamera className="w-6 h-6 text-primary" />
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
            className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex items-center justify-center p-4"
            onClick={() => setShowParticipants(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-page rounded-xl border border-selected p-6 max-w-md w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">Participants</h2>
                <button onClick={() => setShowParticipants(false)}>
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="space-y-2">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 bg-background rounded-lg"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${p.color} flex items-center justify-center text-white font-bold`}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {p.name}
                      </p>
                      <p className="text-xs text-muted">
                        {p.name === "You" ? "Host" : "Viewer"}
                      </p>
                    </div>
                  </div>
                ))}
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
            className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-page rounded-xl border border-selected p-6 max-w-md w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-primary">Stream Tips</h2>
                <button onClick={() => setShowHelp(false)}>
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <ul className="text-sm text-muted space-y-2">
                <li>• Use good lighting</li>
                <li>• Keep camera steady</li>
                <li>• Avoid glare</li>
                <li>• Stay in frame</li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
