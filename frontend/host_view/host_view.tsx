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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stage, setStage] = useState<"idle" | "ready" | "live">("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [participants] = useState<Participant[]>(MOCK_PARTICIPANTS);

  // Get room details from URL parameters
  const roomCode = searchParams.get("id") || "ABC 123";
  const roomName = searchParams.get("title") || "Untitled Board";

  // Prevent scrolling
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const requestPermission = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
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

  const handleFlipCamera = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);

    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Request new stream with new facing mode
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode },
        audio: false,
      });

      const video = videoRef.current;
      if (video && streamRef.current) {
        video.srcObject = streamRef.current;
      }
    } catch {
      alert("Failed to flip camera");
    }
  };

  const handleEndStream = () => {
    if (confirm("End stream and return to home?")) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setStage("idle");
      window.location.href = "/";
    }
  };

  const handleViewParticipants = () => {
    setShowParticipants(true);
  };

  const handleShowHelp = () => {
    setShowHelp(true);
  };

  const isLive = stage === "live";

  return (
    <div
      className="h-screen w-full bg-background relative overflow-hidden font-sans touch-none"
      style={
        !isLive
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
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover bg-black"
        muted
        playsInline
        autoPlay
      />

      {/* Top Bar */}
      {isLive && (
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
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShowHelp}
            className="w-10 h-10 rounded-full border border-selected flex items-center justify-center cursor-pointer bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all"
            aria-label="Help & Tips"
          >
            <HelpCircle className="w-5 h-5 text-primary" />
          </motion.button>
        </motion.div>
      )}

      {/* Waiting States */}
      <AnimatePresence>
        {!isLive && (
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
                className="space-y-4"
              >
                {stage === "idle" && (
                  <>
                    <p className="text-secondary text-lg font-semibold">
                      No Camera Stream
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={requestPermission}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:opacity-80 transition-all cursor-pointer"
                    >
                      Allow camera access
                    </motion.button>
                  </>
                )}

                {stage === "ready" && (
                  <>
                    <p className="text-secondary text-lg font-semibold">
                      Camera Ready
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startStream}
                      className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:opacity-80 transition-all cursor-pointer"
                    >
                      Tap to go live
                    </motion.button>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {isLive && (
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
            {/* Participants Button with Avatars */}
            <motion.button
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewParticipants}
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
              onClick={handleEndStream}
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
              onClick={handleFlipCamera}
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
            onClick={() => setShowParticipants(false)}
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
            onClick={() => setShowHelp(false)}
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
