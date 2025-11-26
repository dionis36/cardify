// lib/useKeyboardShortcuts.ts
"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcutHandlers {
    // Undo/Redo
    onUndo?: () => void;
    onRedo?: () => void;

    // Clipboard
    onCopy?: () => void;
    onPaste?: () => void;
    onDuplicate?: () => void;

    // Selection
    onDelete?: () => void;
    onSelectAll?: () => void;
    onDeselect?: () => void;

    // Grouping
    onGroup?: () => void;
    onUngroup?: () => void;

    // Nudging
    onNudge?: (direction: 'up' | 'down' | 'left' | 'right', amount: number) => void;

    // Locking
    onToggleLock?: () => void;

    // Layer arrangement
    onBringForward?: () => void;
    onSendBackward?: () => void;
    onBringToFront?: () => void;
    onSendToBack?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean = true) {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        // Don't trigger shortcuts when typing in input fields
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return;
        }

        const ctrl = e.ctrlKey || e.metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)
        const shift = e.shiftKey;
        const alt = e.altKey;

        // Undo/Redo
        if (ctrl && !shift && e.key === 'z') {
            e.preventDefault();
            handlers.onUndo?.();
            return;
        }
        if ((ctrl && e.key === 'y') || (ctrl && shift && e.key === 'z')) {
            e.preventDefault();
            handlers.onRedo?.();
            return;
        }

        // Copy/Paste/Duplicate
        if (ctrl && !shift && e.key === 'c') {
            e.preventDefault();
            handlers.onCopy?.();
            return;
        }
        if (ctrl && !shift && e.key === 'v') {
            e.preventDefault();
            handlers.onPaste?.();
            return;
        }
        if (ctrl && !shift && e.key === 'd') {
            e.preventDefault();
            handlers.onDuplicate?.();
            return;
        }

        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            handlers.onDelete?.();
            return;
        }

        // Select All / Deselect
        if (ctrl && !shift && e.key === 'a') {
            e.preventDefault();
            handlers.onSelectAll?.();
            return;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            handlers.onDeselect?.();
            return;
        }

        // Group/Ungroup
        if (ctrl && shift && e.key === 'G') {
            e.preventDefault();
            handlers.onUngroup?.();
            return;
        }
        if (ctrl && !shift && e.key === 'g') {
            e.preventDefault();
            handlers.onGroup?.();
            return;
        }

        // Lock/Unlock
        if (ctrl && !shift && e.key === 'l') {
            e.preventDefault();
            handlers.onToggleLock?.();
            return;
        }

        // Layer arrangement
        if (ctrl && shift && e.key === ']') {
            e.preventDefault();
            handlers.onBringToFront?.();
            return;
        }
        if (ctrl && shift && e.key === '[') {
            e.preventDefault();
            handlers.onSendToBack?.();
            return;
        }
        if (ctrl && !shift && e.key === ']') {
            e.preventDefault();
            handlers.onBringForward?.();
            return;
        }
        if (ctrl && !shift && e.key === '[') {
            e.preventDefault();
            handlers.onSendBackward?.();
            return;
        }

        // Arrow key nudging
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const amount = shift ? 10 : 1;
            const directionMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
                'ArrowUp': 'up',
                'ArrowDown': 'down',
                'ArrowLeft': 'left',
                'ArrowRight': 'right',
            };
            handlers.onNudge?.(directionMap[e.key], amount);
            return;
        }
    }, [enabled, handlers]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, handleKeyDown]);
}

// Export shortcut definitions for reference
export const KEYBOARD_SHORTCUTS = {
    selection: [
        { keys: ['Ctrl', 'A'], description: 'Select all elements' },
        { keys: ['Escape'], description: 'Deselect all' },
    ],
    editing: [
        { keys: ['Ctrl', 'Z'], description: 'Undo' },
        { keys: ['Ctrl', 'Y'], description: 'Redo' },
        { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (alternative)' },
        { keys: ['Ctrl', 'C'], description: 'Copy selected element(s)' },
        { keys: ['Ctrl', 'V'], description: 'Paste element(s)' },
        { keys: ['Ctrl', 'D'], description: 'Duplicate selected element(s)' },
        { keys: ['Delete'], description: 'Delete selected element(s)' },
        { keys: ['Backspace'], description: 'Delete selected element(s)' },
        { keys: ['Ctrl', 'L'], description: 'Lock/Unlock selected element(s)' },
    ],
    grouping: [
        { keys: ['Ctrl', 'G'], description: 'Group selected elements' },
        { keys: ['Ctrl', 'Shift', 'G'], description: 'Ungroup selected group' },
    ],
    arrangement: [
        { keys: ['Ctrl', ']'], description: 'Bring forward one layer' },
        { keys: ['Ctrl', '['], description: 'Send backward one layer' },
        { keys: ['Ctrl', 'Shift', ']'], description: 'Bring to front' },
        { keys: ['Ctrl', 'Shift', '['], description: 'Send to back' },
    ],
    positioning: [
        { keys: ['↑', '↓', '←', '→'], description: 'Nudge element 1px' },
        { keys: ['Shift', '↑', '↓', '←', '→'], description: 'Nudge element 10px' },
    ],
    navigation: [
        { keys: ['Space', 'Drag'], description: 'Pan canvas' },
        { keys: ['Ctrl', 'Scroll'], description: 'Zoom in/out' },
    ],
};
