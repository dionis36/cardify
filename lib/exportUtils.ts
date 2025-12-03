// lib/exportUtils.ts
// Utility functions for export operations

import Konva from "konva";

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
