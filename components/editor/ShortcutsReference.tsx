// components/editor/ShortcutsReference.tsx
"use client";

import React, { useState } from "react";
import { KEYBOARD_SHORTCUTS } from "@/lib/useKeyboardShortcuts";
import { Search, X } from "lucide-react";

export default function ShortcutsReference() {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter shortcuts based on search
    const filterShortcuts = (shortcuts: typeof KEYBOARD_SHORTCUTS[keyof typeof KEYBOARD_SHORTCUTS]) => {
        if (!searchQuery) return shortcuts;

        const query = searchQuery.toLowerCase();
        return shortcuts.filter(shortcut =>
            shortcut.description.toLowerCase().includes(query) ||
            shortcut.keys.some(key => key.toLowerCase().includes(query))
        );
    };

    const renderShortcutKey = (key: string) => {
        // Replace arrow symbols with actual arrows
        const displayKey = key
            .replace('↑', '↑')
            .replace('↓', '↓')
            .replace('←', '←')
            .replace('→', '→');

        return (
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm">
                {displayKey}
            </kbd>
        );
    };

    const renderShortcutRow = (shortcut: { keys: string[]; description: string }) => (
        <div key={shortcut.description} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-700 flex-1">{shortcut.description}</span>
            <div className="flex items-center gap-1">
                {shortcut.keys.map((key, index) => (
                    <React.Fragment key={index}>
                        {index > 0 && <span className="text-gray-400 text-xs mx-0.5">+</span>}
                        {renderShortcutKey(key)}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    const categories = [
        { title: "Selection", shortcuts: filterShortcuts(KEYBOARD_SHORTCUTS.selection) },
        { title: "Editing", shortcuts: filterShortcuts(KEYBOARD_SHORTCUTS.editing) },
        { title: "Grouping", shortcuts: filterShortcuts(KEYBOARD_SHORTCUTS.grouping) },
        { title: "Arrangement", shortcuts: filterShortcuts(KEYBOARD_SHORTCUTS.arrangement) },
        { title: "Positioning", shortcuts: filterShortcuts(KEYBOARD_SHORTCUTS.positioning) },
        { title: "Navigation", shortcuts: filterShortcuts(KEYBOARD_SHORTCUTS.navigation) },
    ];

    return (
        <div className="flex-1 h-full bg-white flex flex-col gap-0 overflow-hidden">
            <h2 className="font-semibold text-lg border-b border-gray-200 pb-3 px-4 pt-2 text-gray-800 shrink-0">
                Keyboard Shortcuts
            </h2>

            {/* Search Bar */}
            <div className="px-4 pb-3 pt-3 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search shortcuts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            title="Clear search"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Shortcuts List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                {categories.map(category => {
                    if (category.shortcuts.length === 0) return null;

                    return (
                        <div key={category.title} className="mb-6">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                {category.title}
                            </h3>
                            <div className="space-y-0 bg-white rounded-lg border border-gray-200 p-3">
                                {category.shortcuts.map(renderShortcutRow)}
                            </div>
                        </div>
                    );
                })}

                {categories.every(cat => cat.shortcuts.length === 0) && (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-sm text-gray-500">No shortcuts found</p>
                    </div>
                )}
            </div>

            {/* Footer Note */}
            <div className="px-4 py-3 border-t border-gray-200 shrink-0">
                <p className="text-xs text-gray-500 text-center">
                    <span className="font-medium">Tip:</span> Use <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">Ctrl</kbd> on Windows/Linux or <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">⌘</kbd> on Mac
                </p>
            </div>
        </div>
    );
}
