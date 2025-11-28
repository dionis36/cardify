"use client";

import React, { useMemo } from "react";
import { Group, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import useImage from "use-image";
import { IconProps } from "@/types/template";
import { getIcon } from "@/lib/iconLoader";

interface IconNodeProps {
    nodeRef: React.RefObject<Konva.Group>;
    iconName: string;
    props: IconProps;
    commonKonvaProps: Konva.NodeConfig;
    isLayoutDisabled: boolean;
}

const IconNode: React.FC<IconNodeProps> = ({
    nodeRef,
    iconName,
    props,
    commonKonvaProps,
    isLayoutDisabled
}) => {
    const { x, y, rotation, opacity, fill, stroke, strokeWidth, width, height } = props;

    // Get icon data from Iconify
    const iconData = useMemo(() => getIcon(iconName) || getIcon('lucide:help-circle'), [iconName]);

    // Generate SVG URL
    const svgUrl = useMemo(() => {
        if (!iconData) return '';

        // Handle colors:
        // 1. If the icon uses 'currentColor', we replace it with the user's selected color.
        // 2. We also set the style color property for good measure.
        // 3. For Lucide (strokes), we ensure stroke is set.
        // 4. For filled icons, we ensure fill is set.

        let body = iconData.body;

        // Replace currentColor with the appropriate color
        // If it's a stroke-based icon (usually Lucide), currentColor usually maps to stroke
        // If it's a fill-based icon, it maps to fill.
        // However, since we have separate fill and stroke props, we can just let CSS/Attributes handle it
        // by setting the parent group attributes.

        // BUT, to be absolutely sure, we can replace 'currentColor' with the specific prop if needed.
        // A safer bet for generic icons is to set 'color' style on the SVG/G which currentColor inherits from.

        // We also need to handle "fill='none'" in Lucide icons if the user WANTS to fill them.
        // If the user selects a fill color other than transparent/none, we should probably override fill="none".

        if (fill && fill !== 'transparent' && fill !== 'none') {
            // If user explicitly wants fill, we try to force it. 
            // But blindly replacing fill="none" might break complex icons.
            // For now, let's rely on the group attribute, but remove fill="none" from the body if it exists
            // so the group's fill can take effect? 
            // No, that's risky.

            // Better approach: Just set the style color.
        }

        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${iconData.width}" height="${iconData.height}" viewBox="0 0 ${iconData.width} ${iconData.height}" style="color: ${stroke !== 'transparent' ? stroke : fill}">
                <g fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}">
                    ${body}
                </g>
            </svg>
        `.trim();

        return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    }, [iconData, fill, stroke, strokeWidth]);

    // Load image
    const [image] = useImage(svgUrl);

    return (
        <Group
            {...commonKonvaProps}
            ref={nodeRef}
            x={x}
            y={y}
            rotation={rotation}
            opacity={opacity}
            draggable={!isLayoutDisabled}
        >
            {image && (
                <KonvaImage
                    image={image}
                    width={width}
                    height={height}
                />
            )}
        </Group>
    );
};

IconNode.displayName = "IconNode";
export default IconNode;