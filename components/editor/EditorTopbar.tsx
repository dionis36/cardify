// components/editor/EditorTopbar.tsx

"use client";

import { Download, Undo, Redo, Save, ArrowLeft, Loader, Shuffle, RotateCcw } from "lucide-react";

interface EditorTopbarProps {
    templateName: string;
    onDownload: () => void; // Changed to open export modal
    onUndo: () => void;
    onRedo: () => void;
    onReset?: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // Saving State
    saving?: boolean;
    onSave?: () => void;
    onBack?: () => void;

    // Logo Shuffle
    onShuffleLogo?: () => void;
    hasLogo?: boolean;
}

export default function EditorTopbar({
    templateName,
    onDownload,
    onUndo,
    onRedo,
    onReset,
    canUndo,
    canRedo,
    saving = false,
    onSave,
    onBack,
    onShuffleLogo,
    hasLogo = false,
}: EditorTopbarProps) {
    return (
        <div className="absolute top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 shadow-sm">

            {/* 1. Left: Back & Title */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => onBack ? onBack() : window.history.back()}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                    title="Back"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col">
                    <h1 className="font-semibold text-gray-800 text-sm">{templateName || "Untitled Design"}</h1>
                    <span className="text-xs text-gray-400">Card Editor</span>
                </div>
            </div>

            {/* 2. Center: History Controls & Logo Shuffle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                    title="Undo"
                >
                    <Undo size={18} className="text-gray-700" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="p-1.5 rounded hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                    title="Redo"
                >
                    <Redo size={18} className="text-gray-700" />
                </button>

                {/* Reset Button */}
                {onReset && (
                    <>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <button
                            onClick={onReset}
                            className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-red-500 hover:text-red-600"
                            title="Reset Design"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </>
                )}

                {/* Shuffle Logo Button */}
                {hasLogo && onShuffleLogo && (
                    <>
                        <div className="w-px h-4 bg-gray-300 mx-1"></div>
                        <button
                            onClick={onShuffleLogo}
                            className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all group"
                            title="Shuffle Logo"
                        >
                            <Shuffle size={18} className="text-blue-600 group-hover:text-blue-700" />
                        </button>
                    </>
                )}
            </div>

            {/* 3. Right: Actions (Save, Export) */}
            <div className="flex items-center space-x-3">
                {/* Save Button */}
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                >
                    {saving ? <Loader size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                    Save
                </button>

                {/* Export Button */}
                <button
                    onClick={onDownload}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm"
                >
                    <Download size={16} className="mr-2" />
                    Export
                </button>
            </div>
        </div>
    );
}