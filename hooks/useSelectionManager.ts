import { useState, useCallback } from 'react';
import { KonvaNodeDefinition } from '@/types/template';
import { getNodeCapabilities, NodeCapabilities } from '@/lib/capabilities';

export type EditMode = 'none' | 'text' | 'crop' | 'points' | 'isolation';

interface UseSelectionManagerProps {
    selectedNodeIndices: number[];
    onSelectNodes: (indices: number[]) => void;
    onDeselectNode: () => void;
    layers: KonvaNodeDefinition[];
}

export function useSelectionManager({
    selectedNodeIndices,
    onSelectNodes,
    onDeselectNode,
    layers,
}: UseSelectionManagerProps) {
    const [editMode, setEditMode] = useState<EditMode>('none');
    const [isolationGroupId, setIsolationGroupId] = useState<string | null>(null);

    // Helper to get the primary selected node (first one)
    const primarySelectedNodeIndex = selectedNodeIndices.length === 1 ? selectedNodeIndices[0] : null;
    const primarySelectedNode = primarySelectedNodeIndex !== null ? layers[primarySelectedNodeIndex] : null;

    const capabilities = primarySelectedNode ? getNodeCapabilities(primarySelectedNode) : null;

    const enterEditMode = useCallback((mode: EditMode) => {
        setEditMode(mode);
    }, []);

    const exitEditMode = useCallback(() => {
        setEditMode('none');
        setIsolationGroupId(null);
    }, []);

    const handleSingleClick = useCallback((index: number, isMultiSelect: boolean = false) => {
        // If we are in an edit mode that captures clicks (like crop), we might want to ignore this
        // or handle it differently. For now, standard selection logic.

        if (editMode !== 'none' && editMode !== 'isolation') {
            // If in specific edit mode (text, crop), clicking another node usually exits that mode
            // unless we are clicking *inside* the edit UI (which is handled by the edit UI itself).
            // Assuming this handler is called when a node is clicked via Konva.
            exitEditMode();
        }

        if (isMultiSelect) {
            if (selectedNodeIndices.includes(index)) {
                onSelectNodes(selectedNodeIndices.filter((i) => i !== index));
            } else {
                onSelectNodes([...selectedNodeIndices, index]);
            }
        } else {
            onSelectNodes([index]);
        }
    }, [selectedNodeIndices, onSelectNodes, editMode, exitEditMode]);

    const handleDoubleClick = useCallback((index: number) => {
        const node = layers[index];
        if (!node || node.locked) return;

        const caps = getNodeCapabilities(node);

        if (caps.canEditText) {
            enterEditMode('text');
        } else if (caps.hasCrop) {
            enterEditMode('crop');
        } else if (caps.canEnterIsolationMode) {
            // enterEditMode('isolation'); // Future
        } else if (caps.canEditPoints) {
            // enterEditMode('points'); // Future
        }
    }, [layers, enterEditMode]);

    const clearSelection = useCallback(() => {
        onDeselectNode();
        exitEditMode();
    }, [onDeselectNode, exitEditMode]);

    return {
        editMode,
        isolationGroupId,
        enterEditMode,
        exitEditMode,
        handleSingleClick,
        handleDoubleClick,
        clearSelection,
        capabilities,
        primarySelectedNode,
    };
}
