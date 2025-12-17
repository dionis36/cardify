"use client";

import React from "react";
import { ArrowLeft, Undo, Redo, MoreVertical } from "lucide-react";
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
            {/* Left: Back, Undo, Redo */}
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
            </div>

            {/* Center: Template Name */}
            <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[120px] px-2">
                {templateName}
            </h1>

            {/* Right: Menu, Export */}
            <div className="flex items-center gap-1">
                {onShowMenu && (
                    <button
                        onClick={onShowMenu}
                        className="p-2 text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-target"
                        aria-label="More options"
                    >
                        <MoreVertical size={20} />
                    </button>
                )}
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
