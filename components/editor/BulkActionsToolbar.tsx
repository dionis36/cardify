// components/editor/BulkActionsToolbar.tsx
"use client";

import React from "react";
import { Eye, EyeOff, Lock, Unlock, Trash2, Folder } from "lucide-react";

interface BulkActionsToolbarProps {
    selectedCount: number;
    onShowAll: () => void;
    onHideAll: () => void;
    onLockAll: () => void;
    onUnlockAll: () => void;
    onDeleteAll: () => void;
    onGroupSelected?: () => void;
}

export default function BulkActionsToolbar({
    selectedCount,
    onShowAll,
    onHideAll,
    onLockAll,
    onUnlockAll,
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
                        onClick={onShowAll}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title="Show all selected"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onHideAll}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title="Hide all selected"
                    >
                        <EyeOff className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onLockAll}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title="Lock all selected"
                    >
                        <Lock className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onUnlockAll}
                        className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                        title="Unlock all selected"
                    >
                        <Unlock className="w-4 h-4" />
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
