"use client";

import { Dispatch, SetStateAction, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";

interface DrawingToolbarProps {
  selectedColor: string;
  setSelectedColor: Dispatch<SetStateAction<string>>;
  onEraser: () => void;
  onClear: () => void;
}

export default function DrawingToolbar({
  selectedColor,
  setSelectedColor,
  onEraser,
  onClear,
}: DrawingToolbarProps) {
  const [showColors, setShowColors] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);

  const colors = [
    { name: "Blue", value: "rgba(100, 180, 255, 0.4)" },
    { name: "Green", value: "rgba(144, 238, 144, 0.25)" },
    { name: "Red", value: "rgba(255, 0, 0, 0.25)" },
    { name: "Pink", value: "rgba(250, 0, 255, 0.2)" },
    { name: "Orange", value: "rgba(255, 165, 0, 0.25)" },
    { name: "Purple", value: "rgba(147, 112, 219, 0.35)" },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-20 flex flex-col gap-2">
      {/* Colors Dialog */}
      {showColors && (
        <div className="absolute bottom-full right-0 mb-2 bg-[#1f1f1f] border border-gray-600 rounded-lg p-4 shadow-md">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Colors
          </p>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => {
                  // Select color and ensure eraser is deselected
                  setSelectedColor(color.value);
                  setShowColors(false);
                }}
                className={`w-8 h-8 rounded-md border-2 transition-all ${
                  selectedColor === color.value
                    ? "border-blue-400 scale-110"
                    : "border-gray-600 hover:border-blue-400"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Toolbar Buttons */}
      <div className="flex gap-2">
        <a
          onClick={(e) => {
            e.preventDefault();
            setShowColors(!showColors);
          }}
          className={`w-10 h-10 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer ${
            showColors
              ? "border-gray-400 bg-gray-500 text-white"
              : selectedColor !== "eraser" && selectedColor !== ""
                ? "border-gray-400 text-white"
                : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-400 hover:bg-gray-600"
          }`}
          style={
            selectedColor !== "eraser" && selectedColor !== "" && !showColors
              ? { backgroundColor: selectedColor.replace("0.35", "0.65") }
              : {}
          }
          title="Pen Colors"
        >
          <EditIcon className="w-5 h-5" />
        </a>

        <a
          onClick={(e) => {
            e.preventDefault();
            onEraser();
            setShowColors(false);
          }}
          className={`w-10 h-10 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer ${
            selectedColor === "eraser"
              ? "border-gray-400 bg-gray-500 text-white"
              : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-400 hover:bg-gray-600"
          }`}
          title="Eraser"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="w-5 h-5"
            viewBox="0 0 16 16"
          >
            <path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z" />
          </svg>
        </a>

        <a
          onClick={(e) => {
            e.preventDefault();
            if (confirmClear) {
              // Confirm and clear
              onClear();
              setConfirmClear(false);
              setShowColors(false);
            } else {
              // Enter confirm mode
              setConfirmClear(true);
              setShowColors(false);
              // Auto-reset after 3 seconds
              setTimeout(() => setConfirmClear(false), 3000);
            }
          }}
          className={`w-10 h-10 rounded-md border-2 transition-all flex items-center justify-center cursor-pointer ${
            confirmClear
              ? "border-red-700 bg-red-800 text-white"
              : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-400 hover:bg-gray-600"
          }`}
          title={confirmClear ? "Confirm Clear" : "Clear"}
        >
          {confirmClear ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <DeleteIcon className="w-5 h-5" />
          )}
        </a>
      </div>
    </div>
  );
}
