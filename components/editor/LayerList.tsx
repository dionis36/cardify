// components/editor/LayerList.tsx (MODIFIED - Fixes Prop Errors and adds functionality)

"use client";

import { KonvaNodeDefinition } from "@/types/template"; // Need KonvaNodeDefinition for types
import React, { useState } from "react";

interface LayerListProps {
  layers: KonvaNodeDefinition[];
  selectedIndex: number | null;
  onSelectLayer: (index: number | null) => void;
  onMoveLayer: (from: number, to: number) => void;
  // NEW PROPS: Added to fix TypeScript errors and implement new features
  onRemoveLayer: (index: number) => void; // FIX 1 & 2: Explicitly typed 'index' as number
  onDefinitionChange: (index: number, updates: Partial<KonvaNodeDefinition>) => void;
  mode: "FULL_EDIT" | "DATA_ONLY"; // Add this
}

export default function LayerList({
  layers,
  selectedIndex,
  onSelectLayer,
  onMoveLayer,
  onRemoveLayer, // Destructure new props
  onDefinitionChange, // Destructure new props
  mode,
}: LayerListProps) {
  // We track the index of the item being dragged in the REVERSED list (0 = front, N = back).
  const [draggedListIndex, setDraggedListIndex] = useState<number | null>(null);

  // The layers array is ordered from back (0) to front (N).
  // A standard layer list should show front (N) at the top, and back (0) at the bottom.
  // We must reverse the array for display.
  const reversedLayers = [...layers].reverse();

  // Utility to convert the list index (0=front, N=back) back to the Konva array index (0=back, N=front)
  const mapListIndexToKonvaIndex = (listIndex: number): number => {
    return layers.length - 1 - listIndex;
  };

  // Handlers operate on the reversed list index, then convert to the Konva index
  const handleDragStart = (listIndex: number) => {
    setDraggedListIndex(listIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropListIndex: number) => {
    e.preventDefault();
    if (draggedListIndex === null || draggedListIndex === dropListIndex) return;

    // Convert reversed list indices to Konva indices (where 0 is the back layer)
    const fromKonvaIndex = mapListIndexToKonvaIndex(draggedListIndex);
    const toKonvaIndex = mapListIndexToKonvaIndex(dropListIndex);

    onMoveLayer(fromKonvaIndex, toKonvaIndex);
  };

  const handleSelect = (listIndex: number) => {
    onSelectLayer(mapListIndexToKonvaIndex(listIndex));
  }

  const handleRemove = (listIndex: number) => {
    const konvaIndex = mapListIndexToKonvaIndex(listIndex);
    onRemoveLayer(konvaIndex);
  }

  const handleToggleLock = (listIndex: number) => {
    const konvaIndex = mapListIndexToKonvaIndex(listIndex);
    const layer = reversedLayers[listIndex];
    onDefinitionChange(konvaIndex, { locked: !layer.locked });
  }

  const handleToggleVisibility = (listIndex: number) => {
    const konvaIndex = mapListIndexToKonvaIndex(listIndex);
    const layer = reversedLayers[listIndex];
    // Toggles the 'visible' prop inside the node's properties
    const currentVisibility = layer.props.visible ?? true;
    onDefinitionChange(konvaIndex, {
      props: { ...layer.props, visible: !currentVisibility }
    } as Partial<KonvaNodeDefinition>);
  }

  return (
    <div className="flex-1 h-full bg-white flex flex-col gap-3 overflow-hidden">
      <h2 className="font-semibold text-lg border-b border-gray-200 pb-3 px-4 pt-2 text-gray-800 shrink-0">Layers ({layers.length})</h2>

      <div className="space-y-2 flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {reversedLayers.map((layer, listIndex) => {
          const konvaIndex = mapListIndexToKonvaIndex(listIndex);
          const isSelected = selectedIndex === konvaIndex;
          const isLocked = layer.locked ?? false;
          const isVisible = layer.props.visible ?? true;

          return (
            <div
              key={layer.id}
              draggable={!isLocked}
              onClick={() => handleSelect(listIndex)}
              onDragStart={() => handleDragStart(listIndex)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, listIndex)}
              onDragEnd={() => setDraggedListIndex(null)}

              // Styling
              className={`p-2 rounded text-sm cursor-pointer border transition-all duration-150 ${isSelected
                  ? "bg-blue-100 border-blue-500 ring-2 ring-blue-500"
                  : draggedListIndex === listIndex ? "bg-gray-200 border-gray-400" : "bg-white border-gray-200 hover:bg-gray-100"
                } ${isLocked ? 'opacity-70' : 'hover:shadow-sm'}`}
            >
              <div className="flex justify-between items-center gap-2">

                {/* Layer Name/Info */}
                <span className={`font-medium truncate flex-1 ${isLocked ? 'italic text-gray-500' : 'text-gray-700'}`}>
                  {layer.type}: {
                    layer.type === 'Text' ? (layer.props as any).text :
                      layer.type === 'Image' ? (layer.props as any).src?.substring(0, 10) :
                        layer.id.substring(0, 5)
                  }...
                </span>

                {/* Control Buttons */}
                <div className="flex items-center gap-1">
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleVisibility(listIndex); }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 text-sm"
                    title={isVisible ? "Hide Layer" : "Show Layer"}
                  >
                    {isVisible ? '👁️' : '🚫'}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleLock(listIndex); }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 text-sm"
                    title={isLocked ? "Unlock Layer" : "Lock Layer"}
                  >
                    {isLocked ? '🔒' : '🔓'}
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(listIndex); }}
                    className="p-1 rounded hover:bg-red-100 text-red-500 text-sm"
                    title="Remove Layer"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Depth Indicator (Optional) */}
              <p className="text-xs text-gray-400 mt-0.5">
                {listIndex === 0 && <span className="text-blue-500">Front (Top)</span>}
                {listIndex === layers.length - 1 && <span className="text-red-500">Back (Bottom)</span>}
              </p>
            </div>
          );
        })}
      </div>

      {layers.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-center text-gray-500 text-sm">
            This page has no layers.
          </p>
        </div>
      )}
    </div>
  );
}