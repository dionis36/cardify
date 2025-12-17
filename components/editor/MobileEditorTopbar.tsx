"use client";

import React from "react";
import { ArrowLeft, Undo, Redo, MoreVertical, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface MobileEditorTopbarProps {
    templateName: string;
    onUndo: () => void;
    onRedo: () => void;
    onExport: () => void;
    onReset: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onShowMenu?: () => void;
}

export default function MobileEditorTopbar({
    templateName,
    onUndo,
    onRedo,
    onExport,
    onReset,
    canUndo,
    canRedo,
    onShowMenu,
}: MobileEditorTopbarProps) {
    const router = useRouter();

    const handleBack = () => {
        router.push("/templates");
    };

    return (
        <div className="lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-3 safe-area-inset-top">
            {/* Left: Back, Undo, Redo, Reset */}
            <div className="flex items-center gap-1">
                <button
                    onClick={handleBack}
                    className="p-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-target"
                    aria-label="Back to templates"
                >
                    <ArrowLeft size={20} />
                </button>
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className={`p-2 rounded-lg transition-colors touch-target ${canUndo
                        ? "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                        : "text-gray-300 cursor-not-allowed"
                        }`}
                    aria-label="Undo"
                >
                    <Undo size={18} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className={`p-2 rounded-lg transition-colors touch-target ${canRedo
                        ? "text-gray-700 hover:bg-gray-100 active:bg-gray-200"
                        : "text-gray-300 cursor-not-allowed"
                        }`}
                    aria-label="Redo"
                >
                    <Redo size={18} />
                </button>
                <button
                    onClick={onReset}
                    className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors touch-target"
                    aria-label="Reset"
                >
                    <RotateCcw size={18} />
                </button>
            </div>

            {/* Right: Export */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onExport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors whitespace-nowrap"
                >
                    Export
                </button>
            </div>
        </div>
    );
}
