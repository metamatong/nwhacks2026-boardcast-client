"use client";

import { motion, AnimatePresence } from "framer-motion";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({
  isOpen,
  onClose,
}: HowItWorksModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-[rgba(0,0,0,0.15)] flex items-center justify-center px-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-page rounded-lg border border-selected max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-page border-b border-selected p-6 flex items-center justify-between">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-2xl font-bold text-primary"
              >
                How Boardcast Works
              </motion.h2>
              <motion.a
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="text-muted hover:text-primary transition-colors bg-transparent cursor-pointer"
              >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
              </motion.a>
            </div>

            <div className="p-8 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-primary mb-3">
                  For Teachers & Presenters
                </h3>
                <p className="text-secondary leading-relaxed">
                  Set up a camera pointing at your physical whiteboard. Boardcast
                  automatically captures what you write in real time, cleans it up
                  for clarity, and streams it live to your audience.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h3 className="text-lg font-semibold text-primary mb-3">
                  For Remote Students
                </h3>
                <p className="text-secondary leading-relaxed">
                  Join a session using a room code. See the whiteboard content
                  streamed live to your screen, follow along in real time, and never
                  miss what's being written—even if you're far away or joining late.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <h3 className="text-lg font-semibold text-primary mb-3">
                  Save & Review
                </h3>
                <p className="text-secondary leading-relaxed">
                  All sessions are automatically saved. Access your notes anytime to
                  review, study, or share with others who couldn't attend.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="bg-hover rounded-md p-4"
              >
                <h3 className="text-sm font-semibold text-primary mb-2">
                  Key Benefits
                </h3>
                <ul className="space-y-2 text-sm text-secondary">
                  {[
                    "No expensive smart boards required",
                    "Works with any physical whiteboard and camera",
                    "Real-time streaming and collaboration",
                    "Permanent record of your sessions",
                    "Perfect for remote, hybrid, and in-person teaching"
                  ].map((benefit, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    >
                      • {benefit}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="w-full py-3 px-4 rounded-md font-medium text-sm bg-selected text-primary hover:bg-hover transition-colors duration-300 cursor-pointer"
              >
                Got it, let's get started
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
