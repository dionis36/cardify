// components/editor/ZoomControls.tsx

"use client";

import React from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

interface ZoomControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onFitToScreen: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onFitToScreen,
}) => {
    const zoomPercentage = Math.round(zoom * 100);

    return (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-0 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {/* Zoom Out Button */}
                <button
                    onClick={onZoomOut}
                    disabled={zoom <= 0.1}
                    className="p-2.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-r border-gray-200"
                    title="Zoom Out"
                    aria-label="Zoom out"
                >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                </button>

                {/* Zoom Percentage Display (Clickable to reset to 100%) */}
                <button
                    onClick={onZoomReset}
                    className="px-4 py-2.5 min-w-[80px] text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border-r border-gray-200"
                    title="Reset to 100%"
                    aria-label={`Current zoom: ${zoomPercentage}%. Click to reset to 100%`}
                >
                    {zoomPercentage}%
                </button>

                {/* Zoom In Button */}
                <button
                    onClick={onZoomIn}
                    disabled={zoom >= 3.0}
                    className="p-2.5 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-r border-gray-200"
                    title="Zoom In"
                    aria-label="Zoom in"
                >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                </button>

                {/* Fit to Screen Button */}
                <button
                    onClick={onFitToScreen}
                    className="p-2.5 hover:bg-gray-100 transition-colors"
                    title="Fit to Screen"
                    aria-label="Fit to screen"
                >
                    <Maximize2 className="w-4 h-4 text-gray-700" />
                </button>
            </div>
        </div>
    );
};

export default ZoomControls;
