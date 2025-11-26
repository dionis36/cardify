// lib/selectionHelpers.ts

import { KonvaNodeDefinition, KonvaNodeProps } from "@/types/template";

/**
 * Rectangle interface for selection bounds
 */
export interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Bounding box interface
 */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
}

/**
 * Check if a point is inside a rectangle
 */
function isPointInRect(px: number, py: number, rect: SelectionRect): boolean {
    return (
        px >= rect.x &&
        px <= rect.x + rect.width &&
        py >= rect.y &&
        py <= rect.y + rect.height
    );
}

/**
 * Check if two rectangles intersect
 */
function rectsIntersect(rect1: SelectionRect, rect2: SelectionRect): boolean {
    return !(
        rect1.x + rect1.width < rect2.x ||
        rect2.x + rect2.width < rect1.x ||
        rect1.y + rect1.height < rect2.y ||
        rect2.y + rect2.height < rect1.y
    );
}

/**
 * Get bounding box for a node
 */
function getNodeBoundingBox(props: KonvaNodeProps): BoundingBox {
    const { x, y, width, height, rotation = 0 } = props;

    // For rotated nodes, we need to calculate the actual bounding box
    // For simplicity, we'll use the non-rotated bounds for selection
    // A more accurate implementation would rotate the corners and find min/max

    return {
        x,
        y,
        width,
        height,
        right: x + width,
        bottom: y + height,
    };
}

/**
 * Find all nodes within a selection rectangle
 */
export function getNodesInRect(
    nodes: KonvaNodeDefinition[],
    selectionRect: SelectionRect
): number[] {
    const selectedIndices: number[] = [];

    nodes.forEach((node, index) => {
        const nodeBounds = getNodeBoundingBox(node.props);

        // Check if node intersects with selection rectangle
        if (rectsIntersect(selectionRect, nodeBounds)) {
            selectedIndices.push(index);
        }
    });

    return selectedIndices;
}

/**
 * Get combined bounding box for multiple nodes
 */
export function getBoundingBox(nodes: KonvaNodeDefinition[]): BoundingBox | null {
    if (nodes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
        const box = getNodeBoundingBox(node.props);
        minX = Math.min(minX, box.x);
        minY = Math.min(minY, box.y);
        maxX = Math.max(maxX, box.right);
        maxY = Math.max(maxY, box.bottom);
    });

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        right: maxX,
        bottom: maxY,
    };
}

/**
 * Alignment types
 */
export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

/**
 * Align multiple nodes
 */
export function alignNodes(
    nodes: KonvaNodeDefinition[],
    alignment: AlignmentType
): Partial<KonvaNodeProps>[] {
    if (nodes.length < 2) return [];

    const boundingBox = getBoundingBox(nodes);
    if (!boundingBox) return [];

    const updates: Partial<KonvaNodeProps>[] = [];

    nodes.forEach((node) => {
        const props = node.props;
        let update: Partial<KonvaNodeProps> = {};

        switch (alignment) {
            case 'left':
                update.x = boundingBox.x;
                break;
            case 'center':
                update.x = boundingBox.x + boundingBox.width / 2 - props.width / 2;
                break;
            case 'right':
                update.x = boundingBox.right - props.width;
                break;
            case 'top':
                update.y = boundingBox.y;
                break;
            case 'middle':
                update.y = boundingBox.y + boundingBox.height / 2 - props.height / 2;
                break;
            case 'bottom':
                update.y = boundingBox.bottom - props.height;
                break;
        }

        updates.push(update);
    });

    return updates;
}

/**
 * Distribution types
 */
export type DistributionType = 'horizontal' | 'vertical';

/**
 * Distribute nodes evenly
 */
export function distributeNodes(
    nodes: KonvaNodeDefinition[],
    distribution: DistributionType
): Partial<KonvaNodeProps>[] {
    if (nodes.length < 3) return [];

    const updates: Partial<KonvaNodeProps>[] = [];

    // Sort nodes by position
    const sortedNodes = [...nodes].sort((a, b) => {
        if (distribution === 'horizontal') {
            return a.props.x - b.props.x;
        } else {
            return a.props.y - b.props.y;
        }
    });

    const first = sortedNodes[0].props;
    const last = sortedNodes[sortedNodes.length - 1].props;

    if (distribution === 'horizontal') {
        const totalSpace = last.x - (first.x + first.width);
        const gap = totalSpace / (sortedNodes.length - 1);

        let currentX = first.x + first.width + gap;

        for (let i = 1; i < sortedNodes.length - 1; i++) {
            const nodeIndex = nodes.indexOf(sortedNodes[i]);
            updates[nodeIndex] = { x: currentX };
            currentX += sortedNodes[i].props.width + gap;
        }
    } else {
        const totalSpace = last.y - (first.y + first.height);
        const gap = totalSpace / (sortedNodes.length - 1);

        let currentY = first.y + first.height + gap;

        for (let i = 1; i < sortedNodes.length - 1; i++) {
            const nodeIndex = nodes.indexOf(sortedNodes[i]);
            updates[nodeIndex] = { y: currentY };
            currentY += sortedNodes[i].props.height + gap;
        }
    }

    return updates;
}

/**
 * Normalize selection rectangle (handle negative width/height from drag)
 */
export function normalizeRect(rect: SelectionRect): SelectionRect {
    return {
        x: rect.width < 0 ? rect.x + rect.width : rect.x,
        y: rect.height < 0 ? rect.y + rect.height : rect.y,
        width: Math.abs(rect.width),
        height: Math.abs(rect.height),
    };
}
