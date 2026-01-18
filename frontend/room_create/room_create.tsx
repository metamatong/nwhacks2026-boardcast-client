"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, AlertCircle, Home, RefreshCw } from "lucide-react";

export default function RoomCreatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const id = searchParams.get("id");
  const title = searchParams.get("title");

  const handleCopyRoomId = async () => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  if (!id || !title) {
    return (
      <div
        className="min-h-screen bg-background text-primary font-sans flex flex-col items-center justify-center px-4"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)`,
          backgroundSize: "40px 40px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Error Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-page rounded-xl border border-selected p-8 text-center space-y-6"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative inline-block"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-page"
              />
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-2"
            >
              <h1 className="text-2xl font-bold text-primary">
                Failed to Load Room
              </h1>
              <p className="text-secondary text-sm">
                The room could not be loaded because required information is missing.
              </p>
            </motion.div>

            {/* Missing Info Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-background/50 border border-red-500/20 rounded-lg p-4 space-y-2"
            >
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                Missing Parameters
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {!id && (
                  <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-sm font-medium">
                    Room ID
                  </span>
                )}
                {!title && (
                  <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-sm font-medium">
                    Room Title
                  </span>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/")}
                className="flex-1 py-3 px-4 rounded-lg font-semibold bg-selected text-primary hover:bg-hover transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 rounded-lg font-semibold bg-background border border-selected text-secondary hover:text-primary hover:border-primary/50 transition-colors duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-4 text-center"
          >
            <p className="text-xs text-muted">
              Please create a new room from the home page to get started.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const handleProceed = () => {
    setIsSubmitting(true);
    // Navigate to host view with room parameters
    router.push(`/host_view?id=${id}&title=${encodeURIComponent(title)}`);
  };

  return (
    <div
      className="min-h-screen bg-background text-primary font-sans flex flex-col items-center justify-center px-4 relative"
      style={{
        backgroundImage: `radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)`,
        backgroundSize: "40px 40px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-4 text-center"
        >
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-6xl font-bold text-primary mb-2"
          >
            Room Created!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-secondary"
          >
            Set your room title and invite others
          </motion.p>
        </motion.div>

        {/* Room Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-page rounded-xl border border-selected p-8 space-y-6"
        >
          {/* Room Title & ID - Stacked Layout */}
          <motion.div className="flex flex-col gap-4">
            {/* Room Title - Centered */}
            <motion.div className="text-center">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Room Title
              </p>
              <div className="px-4 py-2 border border-selected rounded-lg bg-background text-primary font-semibold">
                {title}
              </div>
            </motion.div>

            {/* Room ID - Centered with integrated copy button */}
            <motion.div className="text-center">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Room ID
              </p>
              <div className="relative flex items-center justify-center border border-selected rounded-lg bg-background">
                <div className="px-4 py-2 text-primary font-mono text-sm select-all">
                  {id.slice(0, 3) + " " + id.slice(3, 6)}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyRoomId}
                  className="absolute right-2 p-2 rounded-lg hover:bg-hover transition-colors cursor-pointer"
                  aria-label="Copy room ID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4 text-secondary" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Tips / Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-background/50 border border-primary/30 rounded-lg p-4 space-y-2.5 text-sm shadow-sm"
          >
            {[
              "• Keep this tab open while streaming your board.",
              "• Ensure your phone sits securely before starting.",
              "• The whole whiteboard should be captured on camera.",
              "• Share the room code with others to display live notes.",
            ].map((tip, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
              >
                {tip}
              </motion.p>
            ))}
          </motion.div>

          {/* Proceed Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            whileHover={{ scale: !isSubmitting ? 1.02 : 1 }}
            whileTap={{ scale: !isSubmitting ? 0.98 : 1 }}
            onClick={handleProceed}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors duration-300 cursor-pointer ${
              !isSubmitting
                ? "bg-selected text-primary hover:bg-hover"
                : "bg-hover text-muted cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Proceeding..." : "Proceed to Room"}
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.4 }}
          className="mt-3 text-center"
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
