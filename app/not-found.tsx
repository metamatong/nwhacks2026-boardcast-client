"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import MouseTrail from "../frontend/components/MouseTrail";
import DrawingToolbar from "../frontend/components/DrawingToolbar";
import { Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();
  const [drawingColor, setDrawingColor] = useState("rgba(100, 180, 255, 0.35)");

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl relative z-0 text-center pointer-events-none"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-[12rem] md:text-[16rem] font-bold text-primary leading-none opacity-20">
            404
          </h1>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 -mt-32 md:-mt-48"
        >
          <motion.h2
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-4xl md:text-6xl font-bold text-primary mb-4"
          >
            Oh no!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-lg md:text-xl text-secondary mb-4"
          >
            We couldn't find this page
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-sm md:text-base text-muted"
          >
            Feel free to draw instead
          </motion.p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pointer-events-auto"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-6 py-3 bg-selected text-primary rounded-lg font-semibold hover:bg-hover transition-colors duration-300 cursor-pointer shadow-lg"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="px-6 py-3 bg-hover text-primary rounded-lg font-semibold hover:bg-selected transition-colors duration-300 cursor-pointer border border-selected"
          >
            Go Back
          </motion.button>
        </motion.div>

        {/* Footer Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-12"
        >
          <p className="text-xs text-muted">
            Use the toolbar on the right to change colors or clear your drawing
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
