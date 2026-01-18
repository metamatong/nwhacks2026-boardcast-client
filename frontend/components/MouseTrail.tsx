"use client";

import { useEffect, useRef } from "react";

interface MouseTrailProps {
  color?: string;
}

export default function MouseTrail({
  color = "rgba(100, 180, 255, 0.35)",
}: MouseTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const posRef = useRef({ x: -1, y: -1 });
  const colorRef = useRef(color);
  const isEraserRef = useRef(false);
  const isDrawingRef = useRef(false);

  /* -------- color / mode updates -------- */
  useEffect(() => {
    colorRef.current = color;
    isEraserRef.current = color === "eraser";
  }, [color]);

  /* -------- setup -------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    drawGrid(ctx, canvas);

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // left click only
      isDrawingRef.current = true;
      posRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      drawLine(e.clientX, e.clientY);
    };

    const stopDrawing = () => {
      isDrawingRef.current = false;
      posRef.current = { x: -1, y: -1 };
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDrawing);
    window.addEventListener("mouseleave", stopDrawing);

    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawGrid(ctx, canvas);
    });

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDrawing);
      window.removeEventListener("mouseleave", stopDrawing);
    };
  }, []);

  /* -------- draw logic -------- */
  const drawLine = (x: number, y: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const { x: px, y: py } = posRef.current;
    if (px === -1) {
      posRef.current = { x, y };
      return;
    }

    const dx = x - px;
    const dy = y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.5) return;

    const width = Math.max(1.5, 6 - dist * 0.2);

    if (isEraserRef.current) {
      ctx.clearRect(x - width * 3, y - width * 3, width * 6, width * 6);
    } else {
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    posRef.current = { x, y };
  };

  /* -------- grid -------- */
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dotSize = 1.5;
    const spacing = 40;

    // Create an offscreen canvas for the pattern
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
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
  );
}
