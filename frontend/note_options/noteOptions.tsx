"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownTrayIcon,
  ShareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { BsFiletypePdf } from "react-icons/bs";

type Action = "download" | "share" | "pdf" | null;

export default function NoteOptions() {
  const [hovered, setHovered] = useState<Action>(null); // controls helper text
  const [clicked, setClicked] = useState<Action>(null); // controls showing check circle on click
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (action: Action) => setHovered(action);
  const handleMouseLeave = () => setHovered(null);
  const handleFocus = (action: Action) => setHovered(action);
  const handleBlur = () => setHovered(null);

  const handleClick = (action: Action) => {
    if (clicked) return; // ignore while another action is in clicked state

    setClicked(action);

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    // Show check circle for 1.5 seconds
    timeoutRef.current = window.setTimeout(() => {
      setClicked(null);
      timeoutRef.current = null;
    }, 1500);
  };

  const renderIcon = (action: Action, Icon: any, label: string) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => handleMouseEnter(action)}
      onMouseLeave={handleMouseLeave}
      onFocus={() => handleFocus(action)}
      onBlur={handleBlur}
      onClick={() => handleClick(action)}
      title={label}
      aria-label={label}
      className="flex flex-col items-center gap-2 px-4 py-2 rounded-lg text-sm text-primary hover:text-blue-500 transition-colors cursor-pointer"
    >
      <div className="relative h-10 w-10 flex items-center justify-center shadow-sm">
        <Icon
          className={`absolute h-6 w-6 transition-opacity duration-300 ${
            clicked === action ? "opacity-0" : "opacity-100"
          }`}
        />
        <CheckCircleIcon
          className={`absolute h-6 w-6 text-primary transition-opacity duration-300 ${
            clicked === action ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>

      {/* Always show the label (no hover-only visibility) */}
      <span className="text-xs text-secondary">{label}</span>
    </motion.button>
  );

  const helperText =
    hovered === "download"
      ? "Your notes will be saved in a high-quality format, ready to review offline."
      : hovered === "share"
        ? "Share a link so others can view your notes in real time."
        : hovered === "pdf"
          ? "Export a clean, printable PDF version of your notes."
          : "Your notes are all set — choose an option above!";

  return (
    <div
      className="min-h-screen bg-background text-primary font-sans w-full flex flex-col justify-center items-center relative px-4"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-page rounded-xl border border-selected p-6 shadow-lg text-center"
        >
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-primary mb-2"
          >
            Notes Saved!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-sm md:text-base text-secondary mb-3"
          >
            Sign in to download, share, or save your notes as a PDF.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-[11px] text-muted mb-3"
          >
            Session snapshot captured just now — nothing will be lost.
          </motion.div>

          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            src="/digital_board_example.png"
            alt="Preview"
            className="max-w-full rounded-lg border border-selected mt-2 mb-4"
          />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-row justify-center gap-6 mb-3"
          >
            {renderIcon("download", ArrowDownTrayIcon, "Download")}
            {renderIcon("share", ShareIcon, "Share")}
            {renderIcon("pdf", BsFiletypePdf, "Save as PDF")}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-xs text-secondary min-h-[2.5rem] flex items-center justify-center text-center px-4"
          >
            {helperText}
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-2 w-full py-3 px-4 rounded-lg font-semibold bg-blue-500 text-background hover:opacity-85 transition-all cursor-pointer text-sm"
          >
            Sign in to unlock these options
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-5 text-left text-xs text-muted space-y-2"
          >
            <p className="uppercase tracking-wide font-semibold text-[10px] text-muted">
              What happens when you sign in
            </p>
            <ul className="space-y-1 list-disc list-inside">
              {["Keep a history of all your whiteboard captures.",
                "Download high-quality images and PDFs of your notes.",
                "Generate share links to send notes to your team."].map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.3 }}
          className="mt-5 text-center"
        >
          <p className="text-[11px] text-muted leading-relaxed">
            You can always return to this page from your recent sessions. Your
            notes stay synced until you clear them.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
