// components\editor\EditorTopbar.tsx

"use client";

import { Dispatch, SetStateAction } from "react";

type EditorMode = "FULL_EDIT" | "DATA_ONLY";

interface EditorTopbarProps {
  undo: () => void;
  redo: () => void;
  exportPNG: () => void;
  exportPDF: () => void;
  saveDesign: () => void;
  mode: EditorMode; 
  setMode: Dispatch<SetStateAction<EditorMode>>;
  toggleOrientation: () => void; // NEW PROP
}

export default function EditorTopbar({
  undo,
  redo,
  exportPNG,
  exportPDF,
  saveDesign,
  mode,
  setMode,
  toggleOrientation, // NEW PROP
}: EditorTopbarProps) {
  
  const toggleMode = () => {
    setMode(mode === "FULL_EDIT" ? "DATA_ONLY" : "FULL_EDIT");
  };

  return (
    <div className="w-full bg-white border-b p-3 flex justify-between items-center shadow-md">
      {/* Title / Logo */}
      <h1 className="text-xl font-bold text-gray-800">Cardify Editor</h1>

      {/* Center Group: Undo/Redo, Mode Toggle & Orientation Toggle */}
      <div className="flex gap-4 items-center">
        {/* Undo/Redo */}
        <div className="flex gap-2">
          <button
            onClick={undo}
            className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition"
            title="Undo (Ctrl+Z)"
          >
            ↩️ Undo
          </button>
          <button
            onClick={redo}
            className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition"
            title="Redo (Ctrl+Y)"
          >
            Redo ↪️
          </button>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={toggleMode}
          className={`px-4 py-1 rounded text-sm font-semibold transition-all ${
            mode === "FULL_EDIT"
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
          title={mode === "FULL_EDIT" ? "Switch to Data-Only Editing" : "Switch to Full Layout Editing"}
        >
          {mode === "FULL_EDIT" ? "Design Mode" : "Data Edit Mode"}
        </button>

        {/* NEW: Orientation Toggle Button */}
        <button
          onClick={toggleOrientation}
          className="px-4 py-1 rounded text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          title="Toggle Card Orientation (Horizontal/Vertical)"
        >
          🔄 Orient
        </button>

      </div>

      {/* Right Group: Export & Save */}
      <div className="flex gap-2">
        <button
          onClick={exportPNG}
          className="px-3 py-1 bg-yellow-400 text-gray-900 rounded text-sm hover:bg-yellow-500 transition"
        >
          Export PNG
        </button>
        <button
          onClick={exportPDF}
          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
        >
          Export PDF
        </button>
        <button
          onClick={saveDesign}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
        >
          💾 Save
        </button>
      </div>
    </div>
  );
}