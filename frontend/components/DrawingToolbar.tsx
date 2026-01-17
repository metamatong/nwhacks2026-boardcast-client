'use client';

import { Dispatch, SetStateAction } from 'react';

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
  const colors = [
    { name: 'Blue', value: 'rgba(100, 180, 255, 0.35)' },
    { name: 'Purple', value: 'rgba(147, 112, 219, 0.35)' },
    { name: 'Pink', value: 'rgba(255, 105, 180, 0.35)' },
    { name: 'Green', value: 'rgba(144, 238, 144, 0.35)' },
    { name: 'Orange', value: 'rgba(255, 165, 0, 0.35)' },
    { name: 'Red', value: 'rgba(255, 99, 71, 0.35)' },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-20 flex flex-col gap-4">
      <div className="bg-page border border-selected rounded-lg p-4 shadow-lg">
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
            Colors
          </p>
          <div className="grid grid-cols-3 gap-2">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.value)}
                className={`w-8 h-8 rounded-md border-2 transition-all ${
                  selectedColor === color.value
                    ? 'border-primary scale-110'
                    : 'border-selected hover:border-primary'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-selected">
          <button
            onClick={onEraser}
            className={`w-full px-3 py-2 rounded-md text-xs font-medium transition-all ${
              selectedColor === 'eraser'
                ? 'bg-primary text-background'
                : 'bg-hover text-secondary hover:opacity-80'
            }`}
          >
            Eraser
          </button>
          <button
            onClick={onClear}
            className="w-full px-3 py-2 rounded-md text-xs font-medium bg-hover text-secondary hover:opacity-80 transition-all"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
