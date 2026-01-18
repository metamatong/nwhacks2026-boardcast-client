// HostView.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [showParticipants, setShowParticipants] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [participants] = useState<Participant[]>(MOCK_PARTICIPANTS);
  const [detectedRect, setDetectedRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Get room details from URL parameters
  const roomCode = searchParams.get("id") || "ABC-123-XYZ";
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
  const startStream = useCallback(async (mode?: "environment" | "user") => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera not supported. Use HTTPS/localhost and allow camera access.");
      return;
    }

    const current = videoRef.current?.srcObject as MediaStream | null;
    if (current) current.getTracks().forEach((t) => t.stop());

    const targetMode = mode || facingMode;
    const constraintsExact: MediaStreamConstraints = {
      video: { facingMode: { exact: targetMode } as any, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };
    const constraintsIdeal: MediaStreamConstraints = {
      video: { facingMode: targetMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    };

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraintsExact);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia(constraintsIdeal);
      }

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setIsStreaming(false);
          attachStream(null);
        };
      });

      attachStream(stream);
      setIsStreaming(true);
      console.log("Stream started with facing mode:", targetMode);
    } catch (error) {
      console.error("Failed to start stream:", error);
      alert("Failed to access camera. Check permissions and try again.");
      setIsStreaming(false);
      attachStream(null);
    }
  }, [facingMode]);

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
      gray[idx] = Math.floor(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    // Simple edge detection using gradient
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Sobel operators
        const gx =
          -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
          -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
          -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
        
        const gy =
          -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
          gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
        
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
      combined[i] = (brightMask[i] > 0 && edges[i] > 0) ? 255 : 0;
    }

    // Find bounding box of largest connected bright region
    let minX = width, minY = height, maxX = 0, maxY = 0;
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
    const minArea = (width * height) * 0.1; // At least 10% of frame
    const maxArea = (width * height) * 0.9; // At most 90% of frame

    // Check if detection is valid (reasonable size, aspect ratio, and pixel count)
    if (
      pixelCount > 200 &&
      area > minArea &&
      area < maxArea &&
      aspectRatio > 0.5 && aspectRatio < 3 && // Reasonable aspect ratio
      detectedWidth > 100 && detectedHeight > 100 // Minimum size
    ) {
      // Add padding and ensure within bounds
      const padding = 30;
      setDetectedRect({
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: Math.min(width - (minX - padding), detectedWidth + padding * 2),
        height: Math.min(height - (minY - padding), detectedHeight + padding * 2),
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
      className="h-screen w-full bg-background relative overflow-hidden font-sans"
      onClick={handleUserGesture}
      onTouchStart={handleUserGesture}
      style={
        noStream
          ? {
              backgroundImage:
                "radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }
          : undefined
      }
    >
      {/* Camera Stream */}
      {!noStream && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover bg-black"
            autoPlay
            playsInline
            muted
          />

          {/* Hidden canvas for detection */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />

          {/* Whiteboard detection overlay */}
          {detectedRect && (
            <div
              className="absolute border-4 border-white rounded-lg pointer-events-none z-20 transition-all duration-300"
              style={{
                left: `${(detectedRect.x / (canvasRef.current?.width || 1)) * 100}%`,
                top: `${(detectedRect.y / (canvasRef.current?.height || 1)) * 100}%`,
                width: `${(detectedRect.width / (canvasRef.current?.width || 1)) * 100}%`,
                height: `${(detectedRect.height / (canvasRef.current?.height || 1)) * 100}%`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div className="absolute -top-8 left-0 bg-white text-black px-3 py-1 rounded-md text-xs font-semibold shadow-lg">
                Whiteboard Detected
              </div>
            </div>
          )}

          <div
            id="camera-flash"
            className="absolute inset-0 bg-white opacity-0 transition-opacity duration-150 pointer-events-none z-30"
          />
        </>
      )}

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-background/70 to-transparent backdrop-blur-sm z-10 flex items-start justify-between">
        <div className="flex-1 text-center space-y-1">
          <h1 className="text-lg font-bold text-primary">{roomName}</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted">Room Code:</span>
            <code className="text-xs font-mono text-secondary font-semibold tracking-widest">
              {roomCode}
            </code>
          </div>
        </div>
        
        {/* Help Button */}
        {!noStream && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShowHelp();
            }}
            className="w-10 h-10 rounded-full border border-selected flex items-center justify-center cursor-pointer active:scale-95 bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-all"
            aria-label="Help & Tips"
          >
            <HelpCircle className="w-5 h-5 text-primary" />
          </button>
        )}
      </div>

      {/* Waiting State */}
      {noStream && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-6 p-8">
            <Camera className="w-20 h-20 text-muted mx-auto" />
            <div className="space-y-2">
              <p className="text-secondary text-lg font-semibold">No Camera Stream</p>
              <p className="text-muted text-sm">Tap anywhere to start streaming</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      {!noStream && (
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 px-6 z-10">
          {/* Participants Button with Avatars */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewParticipants();
            }}
            className="px-4 h-16 relative rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer active:scale-95 overflow-visible transition-transform backdrop-blur-sm"
            aria-label="View Participants"
            style={{
              backgroundColor: "rgba(30, 30, 30, 0.8)",
              backgroundImage: "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          >
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((participant, idx) => (
                <div
                  key={participant.id}
                  className={`w-8 h-8 rounded-full ${participant.color} border-2 border-page flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                  style={{ zIndex: 3 - idx }}
                  title={participant.name}
                >
                  {participant.name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="absolute inset-0 bg-white opacity-0 hover:opacity-5 transition-opacity rounded-full pointer-events-none" />
          </button>

          {/* End Stream Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEndStream();
            }}
            className="w-20 h-20 relative rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer active:scale-95 overflow-hidden transition-transform backdrop-blur-sm"
            aria-label="End Stream"
            style={{
              backgroundColor: "rgba(30, 30, 30, 0.8)",
              backgroundImage: "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          >
            <X className="w-7 h-7 text-primary" />
            <span className="absolute inset-0 bg-white opacity-0 hover:opacity-5 transition-opacity rounded-full pointer-events-none" />
          </button>

          {/* Flip Camera Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFlipCamera();
            }}
            className="w-16 h-16 relative rounded-full border border-selected flex items-center justify-center shadow-xl cursor-pointer active:scale-95 overflow-hidden transition-transform backdrop-blur-sm"
            aria-label="Flip Camera"
            style={{
              backgroundColor: "rgba(30, 30, 30, 0.8)",
              backgroundImage: "radial-gradient(circle, rgba(150,150,150,0.15) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          >
            <SwitchCamera className="w-6 h-6 text-primary" />
            <span className="absolute inset-0 bg-white opacity-0 hover:opacity-5 transition-opacity rounded-full pointer-events-none" />
          </button>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipants && (
        <div 
          className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowParticipants(false);
          }}
        >
          <div 
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
                  <p className="text-sm font-semibold text-primary">You (Host)</p>
                  <p className="text-xs text-muted">Streaming</p>
                </div>
              </div>
              
              <div className="text-center py-8">
                <p className="text-sm text-muted">No other participants yet</p>
                <p className="text-xs text-muted mt-1">Share room code: <span className="font-mono text-secondary">{roomCode}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div 
          className="absolute inset-0 bg-background/90 backdrop-blur-md z-40 flex items-center justify-center p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp(false);
          }}
        >
          <div 
            className="bg-page rounded-xl border border-selected p-6 max-w-md w-full space-y-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Stream Quality Tips</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-primary">📱 Camera Setup</h3>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default HostView;
