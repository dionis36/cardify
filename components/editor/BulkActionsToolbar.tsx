// components/editor/BulkActionsToolbar.tsx
"use client";

import React from "react";
import { Eye, EyeOff, Lock, Unlock, Trash2, Folder } from "lucide-react";

interface BulkActionsToolbarProps {
    selectedCount: number;
    isAllVisible: boolean;
    isAllLocked: boolean;
    onToggleVisibility: () => void;
    onToggleLock: () => void;
    onDeleteAll: () => void;
    onGroupSelected?: () => void;
}

export default function BulkActionsToolbar({
    selectedCount,
    isAllVisible,
    isAllLocked,
    onToggleVisibility,
    onToggleLock,
    onDeleteAll,
    onGroupSelected,
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 shrink-0">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">
                    {selectedCount} layer{selectedCount > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggleVisibility}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title={isAllVisible ? "Hide all selected" : "Show all selected"}
                    >
                        {isAllVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onToggleLock}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title={isAllLocked ? "Unlock all selected" : "Lock all selected"}
                    >
                        {isAllLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    {onGroupSelected && (
                        <button
                            onClick={onGroupSelected}
                            className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                            title="Group selected layers"
                        >
                            <Folder className="w-4 h-4" />
                        </button>
                    )}
                    <div className="w-px h-4 bg-blue-300 mx-1" />
                    <button
                        onClick={onDeleteAll}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600"
                        title="Delete all selected"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
