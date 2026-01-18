"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
        console.log(`Joining room ${roomCode} as ${roomTitle}`);
        // You can handle joining logic here later
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
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div
      className="landing min-h-screen bg-background text-primary font-sans flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)`,
      }}
    >
      {/* Hint */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/70 px-3 py-1 rounded-md text-xs text-primary shadow-md z-20">
        <span className="text-yellow-400">★</span>
        <span className="text-[rgba(255,255,255,0.4)]">
          Hold left click to draw
        </span>
      </div>

      <MouseTrail color={drawingColor} />

      <DrawingToolbar
        selectedColor={drawingColor}
        setSelectedColor={setDrawingColor}
        onEraser={() => setDrawingColor("eraser")}
        onClear={handleClearCanvas}
      />

      <HowItWorksModal isOpen={showModal} onClose={() => setShowModal(false)} />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-8xl font-bold text-primary mb-2">Boardcast</h1>
          <p className="text-secondary">Stream your whiteboard in real time</p>
        </div>

        {/* Intro buttons */}
        <div className="space-y-6 mb-8">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 px-4 rounded-md font-medium text-sm bg-hover text-secondary hover:opacity-80 transition-all cursor-pointer"
          >
            Learn how it works
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-selected" />
            <span className="text-xs text-muted">or</span>
            <div className="flex-1 border-t border-selected" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-page rounded-xl border border-selected p-8">
          {/* Mode switch */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setMode("join")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all text-sm cursor-pointer ${
                mode === "join"
                  ? "bg-selected text-primary border border-primary"
                  : "bg-background text-secondary border border-selected hover:border-primary"
              }`}
            >
              Join
            </button>

            <button
              onClick={() => setMode("create")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all text-sm cursor-pointer ${
                mode === "create"
                  ? "bg-selected text-primary border border-primary"
                  : "bg-background text-secondary border border-selected hover:border-primary"
              }`}
            >
              Start
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                Room Title
              </label>
              <input
                type="text"
                placeholder="Room name"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                className="w-full px-4 py-3 border border-selected rounded-lg bg-background text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            {mode === "join" && (
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Session Code
                </label>
                <input
                  type="text"
                  placeholder="ABC123"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full px-4 py-3 border border-selected rounded-lg bg-background text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition uppercase tracking-widest text-center font-mono text-lg"
                />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 text-center mb-4">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all cursor-pointer ${
              isFormValid && !isLoading
                ? "bg-primary text-background hover:opacity-80"
                : "bg-selected text-muted cursor-not-allowed"
            }`}
          >
            {isLoading
              ? "Connecting..."
              : mode === "join"
                ? "Join"
                : "Start Boardcast"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted leading-relaxed">
            Transform physical whiteboards into live, collaborative digital
            pages. Capture, stream, and save in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
