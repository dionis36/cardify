"use client";

import React from "react";
import { Layer, Rect, Text, Group } from "react-konva";
import { mmToPixels } from "@/lib/exportUtils";

interface PrintSpecsOverlayProps {
    visible: boolean;
    templateWidth: number;
    templateHeight: number;
    bleedMm: number; // Default 3mm
    dpi: number; // Default 300
}

export default function PrintSpecsOverlay({
    visible,
    templateWidth,
    templateHeight,
    bleedMm,
    dpi,
}: PrintSpecsOverlayProps) {
    if (!visible) return null;

    // Convert bleed from mm to pixels (at 72 DPI for screen display)
    const bleedPx = mmToPixels(bleedMm, 72);
    const safeZoneMarginMm = 3; // 3mm safe zone
    const safeZonePx = mmToPixels(safeZoneMarginMm, 72);

    // Bleed zone dimensions (extends beyond template)
    const bleedX = -bleedPx;
    const bleedY = -bleedPx;
    const bleedWidth = templateWidth + 2 * bleedPx;
    const bleedHeight = templateHeight + 2 * bleedPx;

    // Safe zone dimensions (inside template)
    const safeX = safeZonePx;
    const safeY = safeZonePx;
    const safeWidth = templateWidth - 2 * safeZonePx;
    const safeHeight = templateHeight - 2 * safeZonePx;

    return (
        <Layer listening={false}>
            {/* Bleed Zone - Red dashed outline */}
            <Rect
                x={bleedX}
                y={bleedY}
                width={bleedWidth}
                height={bleedHeight}
                stroke="#ef4444"
                strokeWidth={2}
                dash={[10, 5]}
                listening={false}
            />

            {/* Bleed Zone Label */}
            <Group x={bleedX + 10} y={bleedY + 10}>
                <Rect
                    width={120}
                    height={24}
                    fill="#ef4444"
                    cornerRadius={4}
                    opacity={0.9}
                />
                <Text
                    text="BLEED ZONE"
                    fontSize={12}
                    fontFamily="Inter, sans-serif"
                    fill="#ffffff"
                    fontStyle="bold"
                    width={120}
                    height={24}
                    align="center"
                    verticalAlign="middle"
                />
            </Group>

            {/* Safe Zone - Green dashed outline */}
            <Rect
                x={safeX}
                y={safeY}
                width={safeWidth}
                height={safeHeight}
                stroke="#22c55e"
                strokeWidth={2}
                dash={[10, 5]}
                listening={false}
            />

            {/* Safe Zone Label */}
            <Group x={safeX + 10} y={safeY + 10}>
                <Rect
                    width={110}
                    height={24}
                    fill="#22c55e"
                    cornerRadius={4}
                    opacity={0.9}
                />
                <Text
                    text="SAFE ZONE"
                    fontSize={12}
                    fontFamily="Inter, sans-serif"
                    fill="#ffffff"
                    fontStyle="bold"
                    width={110}
                    height={24}
                    align="center"
                    verticalAlign="middle"
                />
            </Group>

            {/* Info Badge - Top Right */}
            <Group x={templateWidth - 200} y={10}>
                <Rect
                    width={190}
                    height={32}
                    fill="#1f2937"
                    cornerRadius={6}
                    opacity={0.95}
                    shadowColor="#000000"
                    shadowBlur={10}
                    shadowOpacity={0.3}
                />
                <Text
                    text={`Print Mode | ${dpi} DPI | ${bleedMm}mm Bleed`}
                    fontSize={11}
                    fontFamily="Inter, sans-serif"
                    fill="#ffffff"
                    width={190}
                    height={32}
                    align="center"
                    verticalAlign="middle"
                />
            </Group>

            {/* Corner Markers (optional visual guides) */}
            {/* Top-left */}
            <Group x={0} y={0}>
                <Rect width={20} height={2} fill="#6b7280" opacity={0.5} />
                <Rect width={2} height={20} fill="#6b7280" opacity={0.5} />
            </Group>

            {/* Top-right */}
            <Group x={templateWidth} y={0}>
                <Rect x={-20} width={20} height={2} fill="#6b7280" opacity={0.5} />
                <Rect x={-2} width={2} height={20} fill="#6b7280" opacity={0.5} />
            </Group>

            {/* Bottom-left */}
            <Group x={0} y={templateHeight}>
                <Rect width={20} y={-2} height={2} fill="#6b7280" opacity={0.5} />
                <Rect width={2} y={-20} height={20} fill="#6b7280" opacity={0.5} />
            </Group>

            {/* Bottom-right */}
            <Group x={templateWidth} y={templateHeight}>
                <Rect x={-20} y={-2} width={20} height={2} fill="#6b7280" opacity={0.5} />
                <Rect x={-2} y={-20} width={2} height={20} fill="#6b7280" opacity={0.5} />
            </Group>
        </Layer>
    );
}
