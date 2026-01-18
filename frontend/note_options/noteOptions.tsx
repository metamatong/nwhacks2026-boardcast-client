"use client";

import { useState } from "react";
import {
  ArrowDownTrayIcon,
  ShareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { BsFiletypePdf } from "react-icons/bs";

type Action = "download" | "share" | "pdf" | null;

export default function NoteOptions() {
  const [clicked, setClicked] = useState<Action>(null);

  const handleClick = (action: Action) => {
    if (clicked) return;

    setClicked(action);
    setTimeout(() => setClicked(null), 1500);
  };

  const renderIcon = (action: Action, Icon: any) => (
    <div className="relative h-8 w-8">
      <Icon
        className={`absolute top-0 left-0 h-8 w-8 transition-opacity duration-300 ${
          clicked === action ? "opacity-0" : "opacity-100"
        }`}
      />
      <CheckCircleIcon
        className={`absolute top-0 left-0 h-8 w-8 text-white transition-opacity duration-300 ${
          clicked === action ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );

  return (
    <div
      className="min-h-screen bg-background text-primary font-sans w-full flex flex-col justify-center items-center relative"
      style={{
        backgroundImage: `
          radial-gradient(circle, rgba(150, 150, 150, 0.15) 1.5px, transparent 1.5px)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      <div className="max-w-md text-center z-10">
        <h1 className="text-5xl font-bold text-primary mb-2">Notes Saved!</h1>
        <p className="text-lg text-secondary">
          Sign in to download, share, or save as PDF
        </p>

        <img
          src="/digital_board_example.png"
          alt="Preview"
          className="max-w-full rounded border-2 mt-5 mb-5"
        />

        <div className="flex flex-row justify-center gap-6">
          <button
            onClick={() => handleClick("download")}
            className="px-8 py-2 flex flex-col items-center text-sm text-primary hover:text-blue-500 rounded-lg"
            title="Download"
          >
            {renderIcon("download", ArrowDownTrayIcon)}
          </button>

          <button
            onClick={() => handleClick("share")}
            className="px-8 py-2 flex flex-col items-center text-sm text-primary hover:text-blue-500 rounded-lg"
            title="Share"
          >
            {renderIcon("share", ShareIcon)}
          </button>

          <button
            onClick={() => handleClick("pdf")}
            className="px-8 py-2 flex flex-col items-center text-sm text-primary hover:text-blue-500 rounded-lg"
            title="Download as PDF"
          >
            {renderIcon("pdf", BsFiletypePdf)}
          </button>
        </div>
      </div>
    </div>
  );
}
