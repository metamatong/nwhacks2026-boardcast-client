"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CreateRoomPage() {
  const [title] = useState("My Awesome Room");
  const [roomCode] = useState(generateRoomCode());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  const handleProceed = () => {
    setIsSubmitting(true);
    console.log(`Proceeding to stream room "${title}" (${roomCode})`);

    setTimeout(() => {
      setIsSubmitting(false);
      alert(`Streaming room "${title}"!`);
    }, 1000);
  };

  const onCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
      <div className="w-full max-w-md relative z-10">
        {/* Heading */}
        <div className="mb-4 text-center">
          <h1 className="text-6xl font-bold text-primary mb-2">
            Room Created!
          </h1>
          <p className="text-secondary">
            Set your room title and invite others
          </p>
        </div>

        {/* Card */}
        <div className="bg-page rounded-xl border border-selected p-8 space-y-6">
          {/* Room Title & Code */}
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Room Title
              </p>
              <div className="px-4 py-2 border border-selected rounded-lg bg-background text-primary font-semibold">
                {title}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-right relative">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Room Code
              </p>
              <div className="flex items-center justify-center sm:justify-end gap-2 px-4 py-2 border border-selected rounded-lg bg-background text-primary font-mono text-lg tracking-widest select-all">
                {roomCode}
                <button
                  onClick={onCopyCode}
                  className="p-2 hover:bg-hover rounded-lg transition-colors cursor-pointer group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                  aria-label="Copy room code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-primary group-hover:text-primary transition-colors" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tips / Instructions */}
          <div className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2.5 text-sm shadow-sm">
            <p>• Keep this tab open while streaming your board.</p>
            <p>• Ensure your phone sits securely before starting.</p>
            <p>• The whole whiteboard should be captured on camera.</p>
            <p>• Share the room code with others.</p>
          </div>

          {/* Proceed Button */}
          <button
            onClick={handleProceed}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all cursor-pointer ${
              !isSubmitting
                ? "bg-primary text-background hover:opacity-80"
                : "bg-selected text-muted cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Proceeding..." : "Proceed to Stream"}
          </button>
        </div>

        {/* Footer text */}
        <div className="mt-3 text-center">
          <p className="text-xs text-muted leading-relaxed">
            Transform physical whiteboards into live, collaborative digital
            pages. Capture, stream, and save in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
