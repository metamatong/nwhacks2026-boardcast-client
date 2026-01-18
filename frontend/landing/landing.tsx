"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import HowItWorksModal from "./HowItWorksModal";
import MouseTrail from "../components/MouseTrail";
import DrawingToolbar from "../components/DrawingToolbar";

type CreatedRoom = {
  id: string;
  title: string;
  join_code: string;
  created_at: string;
};

export default function Landing() {
  const router = useRouter();

  const [mode, setMode] = useState<"join" | "create">("join");
  const [roomCode, setRoomCode] = useState("");
  const [roomTitle, setRoomTitle] = useState(""); // renamed from username
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [drawingColor, setDrawingColor] = useState("rgba(100, 180, 255, 0.35)");

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (mode === "join" && (!roomCode.trim() || !roomTitle.trim())) return;
    if (mode === "create" && !roomTitle.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === "create") {
        // Call Create Room API
        const res = await fetch(
          "https://boardcast-server.fly.dev/api/rooms/create/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: roomTitle, // send roomTitle instead of username
            }),
          },
        );

        if (!res.ok) {
          throw new Error("Failed to create room");
        }

        const data: CreatedRoom = await res.json();
        console.log("Room created:", data.id, data.join_code);

        // Redirect to /room_create with join_code and title
        router.push(
          `/room_create?id=${encodeURIComponent(data.join_code)}&title=${encodeURIComponent(data.title)}`,
        );
      } else {
        // Join existing room - redirect to /room with the room code
        console.log(`Joining room ${roomCode} as ${roomTitle}`);
        router.push(
          `/room?id=${encodeURIComponent(roomCode)}&title=${encodeURIComponent(roomTitle)}`,
        );
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    mode === "join" ? roomCode.trim() && roomTitle.trim() : roomTitle.trim();

  const handleClearCanvas = () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw the grid
    const dotSize = 1.5;
    const spacing = 40;

    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = spacing;
    patternCanvas.height = spacing;

    const pctx = patternCanvas.getContext("2d");
    if (!pctx) return;

    pctx.fillStyle = "rgba(150,150,150,0.15)";
    pctx.beginPath();
    pctx.arc(spacing / 2, spacing / 2, dotSize, 0, Math.PI * 2);
    pctx.fill();

    const pattern = ctx.createPattern(patternCanvas, "repeat");
    if (!pattern) return;

    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div
      className="landing min-h-screen bg-background text-primary font-sans flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)`,
      }}
    >
      {/* Hint */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-4 left-4 flex items-center gap-2 bg-background/70 px-3 py-1 rounded-md text-xs text-primary shadow-md z-20"
      >
        <span className="text-yellow-400">★</span>
        <span className="text-[rgba(255,255,255,0.4)]">
          Hold left click to draw
        </span>
      </motion.div>

      <MouseTrail color={drawingColor} />

      <DrawingToolbar
        selectedColor={drawingColor}
        setSelectedColor={setDrawingColor}
        onEraser={() => setDrawingColor("eraser")}
        onClear={handleClearCanvas}
      />

      <HowItWorksModal isOpen={showModal} onClose={() => setShowModal(false)} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 text-center"
        >
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-8xl font-bold text-primary mb-2"
          >
            Boardcast
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-secondary"
          >
            Stream your whiteboard in real time
          </motion.p>
        </motion.div>

        {/* Intro buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-6 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="w-full py-3 px-4 rounded-md font-medium text-sm bg-hover text-secondary hover:opacity-80 transition-all cursor-pointer"
          >
            Learn how it works
          </motion.button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-selected" />
            <span className="text-xs text-muted">or</span>
            <div className="flex-1 border-t border-selected" />
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-page rounded-xl border border-selected p-8"
        >
          {/* Mode switch */}
          <div className="flex gap-2 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                backgroundColor:
                  mode === "join"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.2)",
                scale: mode === "join" ? 1 : 0.98,
              }}
              transition={{ duration: 0.3 }}
              onClick={() => setMode("join")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors duration-300 text-sm cursor-pointer ${
                mode === "join"
                  ? "bg-selected text-primary border border-primary"
                  : "bg-background text-secondary border border-selected hover:border-primary"
              }`}
            >
              Join
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                backgroundColor:
                  mode === "create"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.2)",
                scale: mode === "create" ? 1 : 0.98,
              }}
              transition={{ duration: 0.3 }}
              onClick={() => setMode("create")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors duration-300 text-sm cursor-pointer ${
                mode === "create"
                  ? "bg-selected text-primary border border-primary"
                  : "bg-background text-secondary border border-selected hover:border-primary"
              }`}
            >
              Start
            </motion.button>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                {mode === "join" ? "Username" : "Room Title"}
              </label>
              <input
                type="text"
                placeholder={mode === "join" ? "Your name" : "Room name"}
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-3 border border-selected rounded-lg bg-background text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            <AnimatePresence mode="wait">
              {mode === "join" && (
                <motion.div
                  key="room-code"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    placeholder="ABC 123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                    className="w-full px-4 py-3 border border-selected rounded-lg bg-background text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition uppercase tracking-widest text-center font-mono text-lg"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 text-center mb-4">{error}</p>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: isFormValid && !isLoading ? 1.02 : 1 }}
            whileTap={{ scale: isFormValid && !isLoading ? 0.98 : 1 }}
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-500 cursor-pointer relative overflow-hidden ${
              isFormValid && !isLoading
                ? "bg-selected text-primary hover:bg-hover"
                : "bg-hover text-muted cursor-not-allowed"
            }`}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center gap-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
                  />
                  <span>Connecting...</span>
                </motion.div>
              ) : (
                <motion.span
                  key={mode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === "join" ? "Join" : "Start Boardcast"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted leading-relaxed">
            Transform physical whiteboards into live, collaborative digital
            pages. Capture, stream, and save in real time.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
