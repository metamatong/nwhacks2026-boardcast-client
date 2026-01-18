"use client";

export const dynamic = "force-dynamic";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function RoomCreatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const id = searchParams.get("id");
  const title = searchParams.get("title");

  if (!id || !title) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-sans bg-background">
        <p className="text-lg">Failed to load room. Missing ID or title.</p>
      </div>
    );
  }

  const handleProceed = () => {
    setIsSubmitting(true);
    // Here you can navigate to the actual streaming page if different
    console.log(`Proceeding to stream room "${title}" (${id})`);
    setTimeout(() => {
      setIsSubmitting(false);
      alert(`Streaming room "${title}"!`);
    }, 1000);
  };

  return (
    <div
      className="min-h-screen bg-background text-primary font-sans flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)`,
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

        {/* Room Card */}
        <div className="bg-page rounded-xl border border-selected p-8 space-y-6">
          {/* Room Title & ID */}
          <div className="flex flex-col gap-4">
            <div className="flex-1 text-center">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Room Title
              </p>
              <div className="px-4 py-2 border border-selected rounded-lg bg-background text-primary font-semibold">
                {title}
              </div>
            </div>

            <div className="flex-1 text-center">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Room ID
              </p>
              <div className="px-4 py-2 border border-selected rounded-lg bg-background text-primary font-mono text-sm select-all">
                {id}
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
            {isSubmitting ? "Proceeding..." : "Proceed to Room"}
          </button>
        </div>

        {/* Footer */}
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
