// lib/alignmentHelpers.ts (NEW FILE - Implementing Phase 2.2 Smart Alignment & Snapping)

import Konva from "konva";
import { KonvaNodeDefinition, KonvaNodeProps } from "@/types/template";

/**
 * The pixel distance within which a dragged node will 'snap' to an alignment line.
 */
const SNAP_TO_TOLERANCE = 5;

/**
 * Defines a vertical or horizontal snapping line.
 * @param guideType - 'v' for vertical (x-coordinate) or 'h' for horizontal (y-coordinate).
 * @param lineCoord - The pixel coordinate (x or y) of the line.
 * @param strokeColor - Color for visualization (e.g., red for center, blue for edges).
 */
export interface SnappingLine {
  guideType: "v" | "h";
  lineCoord: number;
  strokeColor: string; 
}

/**
 * Helper to calculate the alignment lines (edges and center) for a single Konva node.
 * @param nodeProps - The properties of the node to inspect.
 * @returns An array of SnappingLine objects.
 */
function getLinesForNode(nodeProps: KonvaNodeProps, color: string): SnappingLine[] {
    const { x, y, width, height, rotation } = nodeProps;
    
    // Note: Konva's default transformer does not modify x/y when rotating; 
    // it keeps the top-left bounding box x/y. We rely on that simpler model.
    if (rotation !== 0) {
        // For simplicity and stability with Konva's Transformer in this design, 
        // we only snap nodes when rotation is 0. Complex rotation snapping 
        // would require calculating the Konva's `getClientRect()`.
        return [];
    }

    const lines: SnappingLine[] = [];
    
    // Vertical lines (X-coordinates)
    lines.push({ guideType: "v", lineCoord: x, strokeColor: color }); // Left
    lines.push({ guideType: "v", lineCoord: x + width / 2, strokeColor: color }); // Center
    lines.push({ guideType: "v", lineCoord: x + width, strokeColor: color }); // Right

    // Horizontal lines (Y-coordinates)
    lines.push({ guideType: "h", lineCoord: y, strokeColor: color }); // Top
    lines.push({ guideType: "h", lineCoord: y + height / 2, strokeColor: color }); // Middle
    lines.push({ guideType: "h", lineCoord: y + height, strokeColor: color }); // Bottom

    return lines;
}

/**
 * 1. Generates a list of all possible target snapping lines from all other nodes 
 * and the canvas boundaries.
 * * @param nodes - All node definitions on the canvas.
 * @param draggedNodeIndex - The index of the node currently being dragged.
 * @param canvasWidth - The width of the canvas.
 * @param canvasHeight - The height of the canvas.
 * @returns An array of SnappingLine objects.
 */
export function getSnappingLines(
  nodes: KonvaNodeDefinition[],
  draggedNodeIndex: number | null,
  canvasWidth: number,
  canvasHeight: number,
): SnappingLine[] {
  let lines: SnappingLine[] = [];

  // --- 1. Lines from other Konva nodes ---
  nodes.forEach((node, index) => {
    // Skip the dragged node itself and locked nodes
    if (index === draggedNodeIndex || node.locked) {
      return;
    }
    // Only snap to other *visible* nodes
    if (node.props.visible !== false) {
      lines = lines.concat(getLinesForNode(node.props as KonvaNodeProps, "#2563EB")); // Blue for element-to-element snap
    }
  });

  // --- 2. Lines from Canvas Edges/Center ---
  // Vertical Canvas Lines
  lines.push({ guideType: "v", lineCoord: 0, strokeColor: "#f97316" }); // Left Edge (Orange)
  lines.push({ guideType: "v", lineCoord: canvasWidth / 2, strokeColor: "#dc2626" }); // Horizontal Center (Red)
  lines.push({ guideType: "v", lineCoord: canvasWidth, strokeColor: "#f97316" }); // Right Edge (Orange)

  // Horizontal Canvas Lines
  lines.push({ guideType: "h", lineCoord: 0, strokeColor: "#f97316" }); // Top Edge (Orange)
  lines.push({ guideType: "h", lineCoord: canvasHeight / 2, strokeColor: "#dc2626" }); // Vertical Center (Red)
  lines.push({ guideType: "h", lineCoord: canvasHeight, strokeColor: "#f97316" }); // Bottom Edge (Orange)

  return lines;
}

/**
 * 2. Compares the dragged node's position with all potential snapping lines
 * and determines if a snap should occur.
 * * @param draggedNodeProps - The current (non-snapped) props of the dragged node.
 * @param allSnappingLines - All potential SnappingLines (from other elements/canvas).
 * @returns A result object containing the adjusted position and the lines to display.
 */
export function getSnapAndAlignLines(
  draggedNodeProps: KonvaNodeProps,
  allSnappingLines: SnappingLine[],
) {
  const { x, y, width, height, rotation } = draggedNodeProps;

  // If rotated, disable snapping for this drag (simplifies complexity)
  if (rotation !== 0) {
      return { x: x, y: y, snappingLines: [] };
  }

  // Calculate the 6 alignment points for the node currently being dragged
  const selfLines = {
    v: [
      { coord: x, prop: "x" as const }, // Left
      { coord: x + width / 2, prop: "xCenter" as const }, // Center
      { coord: x + width, prop: "xRight" as const }, // Right
    ],
    h: [
      { coord: y, prop: "y" as const }, // Top
      { coord: y + height / 2, prop: "yMiddle" as const }, // Middle
      { coord: y + height, prop: "yBottom" as const }, // Bottom
    ],
  };

  let newX = x;
  let newY = y;
  const snappingLines: SnappingLine[] = [];

  // --- Check Vertical Snapping (X-coordinate) ---
  allSnappingLines.filter(l => l.guideType === "v").forEach((targetLine) => {
    // Check all 3 vertical lines of the dragged node against the target line
    selfLines.v.forEach((selfLine) => {
      if (Math.abs(targetLine.lineCoord - selfLine.coord) < SNAP_TO_TOLERANCE) {
        // SNAP DETECTED: Calculate the required change in X
        const diffX = targetLine.lineCoord - selfLine.coord;
        
        // Adjust the newX position
        newX = x + diffX;
        
        // Add the detected line to the visible guides
        snappingLines.push(targetLine);
      }
    });
  });

  // --- Check Horizontal Snapping (Y-coordinate) ---
  allSnappingLines.filter(l => l.guideType === "h").forEach((targetLine) => {
    // Check all 3 horizontal lines of the dragged node against the target line
    selfLines.h.forEach((selfLine) => {
      if (Math.abs(targetLine.lineCoord - selfLine.coord) < SNAP_TO_TOLERANCE) {
        // SNAP DETECTED: Calculate the required change in Y
        const diffY = targetLine.lineCoord - selfLine.coord;

        // Adjust the newY position
        newY = y + diffY;

        // Add the detected line to the visible guides
        snappingLines.push(targetLine);
      }
    });
  });
  
  // Return the new snapped coordinates and the lines to render
  return { 
    x: newX, 
    y: newY, 
    snappingLines 
  };
}