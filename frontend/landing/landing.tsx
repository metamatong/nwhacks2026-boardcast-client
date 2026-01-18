"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import HowItWorksModal from "./HowItWorksModal";
import MouseTrail from "../components/MouseTrail";
import DrawingToolbar from "../components/DrawingToolbar";

export default function Landing() {
  const [mode, setMode] = useState<"join" | "create">("join");
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [drawingColor, setDrawingColor] = useState("rgba(100, 180, 255, 0.35)");

  const handleSubmit = () => {
    if (mode === "join" && (!roomCode.trim() || !username.trim())) return;
    if (mode === "create" && !username.trim()) return;

    setIsLoading(true);

    console.log(
      mode === "join"
        ? `Joining room: ${roomCode} as ${username}`
        : `Creating room as ${username}`,
    );
  };

  const isFormValid =
    mode === "join" ? roomCode.trim() && username.trim() : username.trim();

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
      className="min-h-screen bg-background text-primary font-sans flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)
        `,
        backgroundSize: "40px 40px",
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
            className="bg-blue-500 w-full py-3 px-4 rounded-md font-medium text-sm text-secondary hover:opacity-80 transition-all"
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
                backgroundColor: mode === "join" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.2)",
                scale: mode === "join" ? 1 : 0.98,
              }}
              transition={{ duration: 0.3 }}
              onClick={() => setMode("join")}
              className={`bg-blue-500 flex-1 py-2 px-4 rounded-lg font-semibold transition-all text-sm ${
                mode === "join"
                  ? "bg-blue-500 text-primary border border-primary"
                  : "bg-blue-500 text-secondary border border-selected hover:border-primary"
              }`}
            >
              Join
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{
                backgroundColor: mode === "create" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.2)",
                scale: mode === "create" ? 1 : 0.98,
              }}
              transition={{ duration: 0.3 }}
              onClick={() => setMode("create")}
              className={`bg-blue-500 flex-1 py-2 px-4 rounded-lg font-semibold transition-all text-sm ${
                mode === "create"
                  ? "bg-blue-500 text-primary border border-primary"
                  : "bg-blue-500 text-secondary border border-selected hover:border-primary"
              }`}
            >
              Start
            </motion.button>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-3 border border-selected rounded-lg bg-background text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            <AnimatePresence mode="wait">
              {mode === "join" && (
                <motion.div
                  key="session-code"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                    Session Code
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
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all cursor-pointer relative overflow-hidden ${
              isFormValid && !isLoading
                ? "bg-blue-500 text-background hover:opacity-80"
                : "bg-blue-500 text-muted cursor-not-allowed"
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
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
