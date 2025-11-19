"use client";

import React, { memo } from "react";
import { Group, Path } from "react-konva";
import Konva from "konva";
import { IconProps } from "@/types/template"; // Use absolute import and correct type

// --- Icon Path Data ---
// A small subset of Lucide icons path data is included here for demonstration.
// In a full environment, this data would be fetched from a dedicated library file.
const ICON_PATH_MAP: Record<string, string> = {
    // Phone
    'Phone': 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-5.6-5.6A19.79 19.79 0 0 1 2 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72v4.29a1 1 0 0 1-.54.84l-2.18 1a18.2 18.2 0 0 0 6.61 6.61l1-2.18a1 1 0 0 1 .84-.54h4.29A2 2 0 0 1 22 16.92z',
    // Mail
    'Mail': 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
    // Home
    'Home': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    // MapPin
    'MapPin': 'M12 2C6.477 2 2 6.477 2 12c0 3.2 1.5 6.1 4 7.9V22l3-3h2c5.523 0 10-4.477 10-10C22 6.477 17.523 2 12 2zm0 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    // Star
    'Star': 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.25l-6.18 3.77 1.18-6.88-5-4.87 6.91-1.01L12 2z',
    // HelpCircle (Fallback)
    'HelpCircle': 'M9.09 3.1c1.88-1.88 4.79-2.02 6.84-.5l.07.05a4.77 4.77 0 0 1 1.76 2.3A4.77 4.77 0 0 1 17 9.87l-2.6 2.6H12v2.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
};

// --- Icon Node Component Definition ---

interface IconNodeProps {
    nodeRef: React.RefObject<Konva.Group>;
    iconName: string;
    props: IconProps; 
    commonKonvaProps: Konva.NodeConfig;
    isLayoutDisabled: boolean;
}

const IconNode: React.FC<IconNodeProps> = memo(({ 
    nodeRef, 
    iconName, 
    props, 
    commonKonvaProps, 
    isLayoutDisabled 
}) => {
    const { 
        x, y, rotation, opacity, fill, stroke, strokeWidth, 
        width, height
    } = props;
    
    // 1. Get path data (default to HelpCircle if not found)
    const pathData = ICON_PATH_MAP[iconName] || ICON_PATH_MAP['HelpCircle'];
    
    // 2. Wrap the Path in a Group for consistent scaling/transformation.
    // The Konva Path node naturally centers SVG data, but we use a Group 
    // to maintain (x, y) as the top-left corner of the bounding box.
    // The width/height prop is set on the Path, which scales the 'data' inside it.
    
    return (
        <Group
            {...commonKonvaProps}
            ref={nodeRef}
            x={x}
            y={y}
            rotation={rotation}
            opacity={opacity}
            draggable={!isLayoutDisabled}
            // Group scale is determined by the transformer, but initial scale is 1
            scaleX={1}
            scaleY={1}
        >
            <Path
                // The Path must be positioned relative to the Group (at 0,0)
                x={0}
                y={0}
                // width/height determine the scaling of the SVG data
                width={width}
                height={height} 
                data={pathData}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                // Since the icon data is typically normalized to a 24x24 or similar viewport, 
                // the Path component handles the necessary scaling based on the width/height props.
            />
        </Group>
    );
});

IconNode.displayName = "IconNode";
export default IconNode;