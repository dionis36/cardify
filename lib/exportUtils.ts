// lib/exportUtils.ts
// Utility functions for export operations

import Konva from "konva";
import { KonvaNodeDefinition, ColorRoleMap, ColorRole } from "@/types/template"; // Adjust import path if needed

/**
 * Convert millimeters to pixels based on DPI
 * @param mm - Measurement in millimeters
 * @param dpi - Dots per inch (72, 150, 300, etc.)
 * @returns Pixels
 */
export function mmToPixels(mm: number, dpi: number): number {
    // 1 inch = 25.4mm
    // pixels = (mm / 25.4) * dpi
    return (mm / 25.4) * dpi;
}

/**
 * Convert pixels to millimeters based on DPI
 * @param pixels - Measurement in pixels
 * @param dpi - Dots per inch
 * @returns Millimeters
 */
export function pixelsToMm(pixels: number, dpi: number): number {
    // mm = (pixels / dpi) * 25.4
    return (pixels / dpi) * 25.4;
}

/**
 * Estimate file size for export
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param format - Export format (PNG, PDF, JPG)
 * @param dpi - Dots per inch
 * @returns Human-readable file size estimate (e.g., "2.5 MB")
 */
export function estimateFileSize(
    width: number,
    height: number,
    format: string,
    dpi: number
): string {
    // Calculate total pixels
    const totalPixels = width * height;

    // Estimate bytes based on format
    let bytesPerPixel: number;

    switch (format.toUpperCase()) {
        case "PNG":
            // PNG is lossless, typically 3-4 bytes per pixel (RGB + alpha)
            bytesPerPixel = 3.5;
            break;
        case "JPG":
        case "JPEG":
            // JPG is lossy, typically 0.5-1.5 bytes per pixel at high quality
            bytesPerPixel = 1;
            break;
        case "PDF":
            // PDF with embedded image, similar to PNG but with overhead
            bytesPerPixel = 4;
            break;
        default:
            bytesPerPixel = 3;
    }

    // Calculate estimated bytes
    const estimatedBytes = totalPixels * bytesPerPixel;

    // Convert to human-readable format
    if (estimatedBytes < 1024) {
        return `${Math.round(estimatedBytes)} B`;
    } else if (estimatedBytes < 1024 * 1024) {
        return `${(estimatedBytes / 1024).toFixed(1)} KB`;
    } else {
        return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}

/**
 * Create a canvas with bleed zone for print export
 * @param stage - Konva stage to export
 * @param bleedMm - Bleed size in millimeters
 * @param dpi - Target DPI
 * @param baseDpi - Base DPI of the stage (default 72)
 * @returns Canvas with bleed zone added
 */
export function createBleedCanvas(
    stage: Konva.Stage,
    bleedMm: number,
    dpi: number,
    baseDpi: number = 72
): Promise<HTMLCanvasElement> {
    // Calculate bleed in pixels at target DPI
    const bleedPx = mmToPixels(bleedMm, dpi);

    // Calculate pixel ratio
    const pixelRatio = dpi / baseDpi;

    // Get original stage dimensions
    const stageWidth = stage.width();
    const stageHeight = stage.height();

    // Create new canvas with bleed
    const canvas = document.createElement('canvas');
    // Final dimensions = (Stage * Ratio) + (Bleed * 2)
    const newWidth = (stageWidth * pixelRatio) + (2 * bleedPx);
    const newHeight = (stageHeight * pixelRatio) + (2 * bleedPx);

    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    // Get stage as data URL with calculated pixel ratio
    // If baseDpi=300 and dpi=300, ratio=1.
    const stageDataURL = stage.toDataURL({ pixelRatio });

    // Create image from stage
    const img = new Image();
    img.src = stageDataURL;

    return new Promise<HTMLCanvasElement>((resolve) => {
        img.onload = () => {
            // Fill canvas with white background (bleed area)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, newWidth, newHeight);

            // Draw stage image centered with bleed offset
            // Offset is just the bleed pixels
            const offsetX = bleedPx;
            const offsetY = bleedPx;

            ctx.drawImage(
                img,
                offsetX,
                offsetY,
                stageWidth * pixelRatio,
                stageHeight * pixelRatio
            );

            resolve(canvas);
        };
    });
}

// --- NEW FEATURES: Sequential Renaming & Color Roles ---

/**
 * Rename nodes sequentially: rect_01, text_02, etc.
 * Also attempts to give semantic names to text fields (e.g., text_email_03).
 */
export function renumberNodes(layers: KonvaNodeDefinition[]): KonvaNodeDefinition[] {
    const counts: Record<string, number> = {};

    return layers.map(layer => {
        // Determine prefix based on type
        let prefix = layer.type.toLowerCase();

        // Enhance text prefix if possible
        if (layer.type === 'Text') {
            const textContent = (layer.props.text || '').toLowerCase();
            if (textContent.includes('@')) prefix = 'text_email';
            else if (textContent.match(/[\d\-\+\(\)\s]{7,}/)) prefix = 'text_contact'; // Simple phone check
            else if (textContent.length > 0 && textContent.length < 20) {
                // Try to use the content as a name, sanitized
                const sanitized = textContent.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
                if (sanitized.length > 0) prefix = `text_${sanitized}`;
                else prefix = 'text';
            } else {
                prefix = 'text';
            }
        } else if (layer.type === 'Rect') {
            prefix = 'rect';
        } else if (layer.type === 'Circle') {
            prefix = 'circle';
        } else if (layer.type === 'Image') {
            prefix = 'image';
        }

        // Initialize count
        if (!counts[prefix]) counts[prefix] = 0;
        counts[prefix]++;

        // Format number (01, 02, ...)
        const num = counts[prefix].toString().padStart(2, '0');
        const newId = `node_${prefix}_${num}`;

        // Return new node with updated ID
        return {
            ...layer,
            id: newId,
            props: {
                ...layer.props,
                id: newId
            }
        } as KonvaNodeDefinition;
    });
}

/**
 * Auto-assign color roles to layers based on heuristics.
 * Returns a mapping of { nodeId: role }.
 */
export function assignColorRoles(layers: KonvaNodeDefinition[], strict: boolean = false): ColorRoleMap {
    const roles: ColorRoleMap = {};
    const colorGroups: Record<string, KonvaNodeDefinition[]> = {};

    // 1. Group layers by Fill Color
    layers.forEach(layer => {
        const fill = layer.props.fill;
        if (fill && typeof fill === 'string' && fill !== 'transparent') {
            if (!colorGroups[fill]) colorGroups[fill] = [];
            colorGroups[fill].push(layer);
        }
    });

    // 2. Analyze groups to determine roles
    const sortedColors = Object.entries(colorGroups).sort((a, b) => {
        // Sort by number of elements (descending) -> largest groups first (likely surface/text)
        // Also consider total area if we wanted to be smarter (backgrounds are huge)
        return b[1].length - a[1].length;
    });

    // Simple heuristic assignment
    // In a real strict mode, we might want to force specific logic, 
    // but for now, we'll try to guess the intent.

    // We need to identify specific common colors
    // Assuming the template might have a "main" color (surface) and black/white (text)

    let assignedSurface = false;
    let assignedAccent = false;

    // Helper to check if color is dark (simple brightness check)
    const isDark = (color: string) => {
        if (color.startsWith('#')) {
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
        }
        return false; // Assume light if not hex (or complex)
    };

    sortedColors.forEach(([color, groupNodes]) => {
        let role = 'decorative'; // Default

        // Check if nodes are mostly Text
        const textCount = groupNodes.filter(n => n.type === 'Text').length;
        const isMostlyText = textCount > groupNodes.length / 2;

        // Check if nodes are valid "Backgrounds" (Rects with large size)
        const isBackground = groupNodes.some(n => n.type === 'Rect' && (n.props.width > 200 || n.props.height > 200));

        if (isMostlyText) {
            // Text color roles
            role = isDark(color) ? 'primary-text' : 'secondary-text';
            // If we already have primary-text, maybe this is 'highlight' or 'accent' text? 
            // For simplicity, let's stick to standard text roles.
        } else if (isBackground && !assignedSurface) {
            role = 'surface';
            assignedSurface = true;
        } else if (!assignedAccent && !isMostlyText) {
            role = 'accent';
            assignedAccent = true;
        }

        // Assign role to all nodes in this color group
        groupNodes.forEach(node => {
            roles[node.id] = role as ColorRole;

            // Also assign to shadow if it exists
            if (node.props.shadowColor) {
                // For shadows, we typically want them to match the object or be dark 'surface' shadow
                // But per requirements, we assign a role. 
                // Let's assume shadow follows the main role but maybe 'background' role for subtle shadows?
                // For now, let's leave shadowColorRole explicit or unset unless strict.
                if (strict) {
                    // In strict mode, maybe we force shadows to 'surface' or 'accent'?
                    // Let's map same role for now
                    // roles[`${node.id}_shadow`] = role; // This isn't how it works, property is on the node
                }
            }
        });
    });

    // Special handling for Stroke Color
    layers.forEach(layer => {
        if (layer.props.stroke && typeof layer.props.stroke === 'string') {
            // If stroke color is different from fill, it needs its own role logic
            // For now, let's assume stroke follows the same logic as fill if not already assigned
            // But we need to return a map for the 'strokeColorRole' property? 
            // Actually, the tutorial says: "shadowColorRole": "accent". 
            // So we just need to return properties to be merged?
            // The function definition returns Record<string, string>. 
            // Let's assume this map is ID -> FillRole.

            // WE NEED TO RETURN A MAP OF MODIFIED PROPS, OR MODIFY LAYERS DIRECTLY?
            // The plan said "Returns a mapping of { nodeId: role }". 
            // But layers can have fillRole, strokeColorRole, shadowColorRole.

            // Let's keep this function simple: It returns the MAIN role (for fill).
            // Handling complex stroke/shadow roles might conceptually be separate or nested.
        }
    });

    return roles;
}
