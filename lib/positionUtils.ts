// lib/positionUtils.ts

/**
 * Converts a value to pixels based on the dimension and positioning mode.
 * @param value - The value to convert (percentage or pixel).
 * @param dimension - The reference dimension (width or height).
 * @param isRelative - Whether the template uses relative (percentage) positioning.
 */
export function percentToPixel(value: number, dimension: number, isRelative: boolean = false): number {
    if (isRelative) {
        return (value / 100) * dimension;
    }
    // If not relative, treat as absolute pixels.
    // We removed the implicit fallback (value <= 100) to avoid ambiguity and instability.
    return value;
}

/**
 * Converts a pixel value to a percentage (0-100) based on the dimension.
 */
export function pixelToPercent(pixel: number, dimension: number): number {
    if (dimension === 0) return 0;
    return (pixel / dimension) * 100;
}
