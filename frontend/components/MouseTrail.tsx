'use client';

import { useEffect, useRef } from 'react';

interface MouseTrailProps {
  color?: string;
  onClear?: () => void;
}

export default function MouseTrail({ color = 'rgba(100, 180, 255, 0.35)', onClear }: MouseTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const positionRef = useRef({ x: -1, y: -1 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const isEraserRef = useRef(false);
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
    if (color === 'eraser') {
      isEraserRef.current = true;
    } else {
      isEraserRef.current = false;
    }
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Draw dotted grid
    const drawGrid = () => {
      if (!context) return;
      const gridSize = 40;
      const dotRadius = 1.5;
      
      context.fillStyle = 'rgba(150, 150, 150, 0.15)';
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          context.beginPath();
          context.arc(x, y, dotRadius, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    drawGrid();

    let animationFrameId: number;

    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { x, y } = positionRef.current;

      // Initialize position on first move
      if (x === -1 && y === -1) {
        positionRef.current = { x: clientX, y: clientY };
        return;
      }

      const vx = clientX - x;
      const vy = clientY - y;
      const distance = Math.sqrt(vx * vx + vy * vy);
      
      velocityRef.current = { x: vx, y: vy };

      if (distance > 2 && contextRef.current) {
        const speed = Math.min(distance, 15);
        const lineWidth = Math.max(1, 6 - speed * 0.2);
        
        if (isEraserRef.current) {
          contextRef.current.clearRect(clientX - lineWidth * 3, clientY - lineWidth * 3, lineWidth * 6, lineWidth * 6);
        } else {
          contextRef.current.strokeStyle = color;
          contextRef.current.lineWidth = lineWidth;
          contextRef.current.lineCap = 'round';
          contextRef.current.lineJoin = 'round';
          
          contextRef.current.beginPath();
          contextRef.current.moveTo(x, y);
          contextRef.current.lineTo(clientX, clientY);
          contextRef.current.stroke();
        }

        positionRef.current = { x: clientX, y: clientY };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drawGrid();
      }
    };

    window.addEventListener('resize', handleResize);

    const handleMouseLeave = () => {
      positionRef.current = { x: -1, y: -1 };
    };

    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
}
