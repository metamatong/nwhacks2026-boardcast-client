"use client";

import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

export type HighlightPayload = {
  title?: string;
  summary?: string;
  text?: string;
  message?: string;
  snippet?: string;
  transcript?: string;
  content?: string;
  timestamp?: string | number;
  created_at?: string | number;
  highlight?: Record<string, unknown>;
  [key: string]: unknown;
};

const toDisplayText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
};

const pickFirst = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = toDisplayText(value);
    if (text) return text;
  }
  return null;
};

const formatTimestamp = (value: unknown): string | null => {
  const text = toDisplayText(value);
  if (!text) return null;

  const parsed = Date.parse(text);
  if (Number.isNaN(parsed)) return text;
  return new Date(parsed).toLocaleString();
};

type HighlightToastProps = {
  highlight: HighlightPayload;
  onClose: () => void;
  className?: string;
};

export default function HighlightToast({
  highlight,
  onClose,
  className,
}: HighlightToastProps) {
  const title =
    pickFirst(highlight.title, highlight.label, highlight.category) ||
    "Highlight detected";
  const body = pickFirst(
    highlight.summary,
    highlight.text,
    highlight.message,
    highlight.snippet,
    highlight.transcript,
    highlight.content,
  );
  const timestamp = formatTimestamp(
    highlight.timestamp ?? highlight.created_at ?? highlight.time,
  );

  let fallback: string | null = null;
  if (!body) {
    try {
      fallback = JSON.stringify(highlight, null, 2);
    } catch {
      fallback = null;
    }
  }

  const containerClassName = [
    "fixed right-6 top-24 z-50 w-[320px]",
    "bg-page/95 backdrop-blur-sm border border-selected rounded-xl shadow-2xl p-4",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={containerClassName}
    >
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-lg bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm font-semibold text-primary truncate">
              {title}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-background/60 transition-colors"
              aria-label="Dismiss highlight"
            >
              <X className="w-4 h-4 text-muted" />
            </button>
          </div>
          {timestamp && (
            <div className="text-[10px] text-muted mt-0.5">{timestamp}</div>
          )}
          {body ? (
            <p className="text-xs text-secondary mt-2 whitespace-pre-wrap">
              {body}
            </p>
          ) : (
            fallback && (
              <pre className="text-[10px] text-muted mt-2 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {fallback}
              </pre>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
