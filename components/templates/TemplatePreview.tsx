"use client";

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Path, RegularPolygon, Star, Arrow, Line, Image as KonvaImage } from 'react-konva';
import { CardTemplate, KonvaNodeDefinition } from '@/types/template';
import useImage from 'use-image';

// Inner component for handling image loading
const URLImage = ({ src, ...props }: any) => {
    const [image] = useImage(src || '', 'anonymous');
    return <KonvaImage image={image} {...props} />;
};

interface TemplatePreviewProps {
    template: CardTemplate;
    // Optional initial dimensions, but component will auto-resize
    width?: number;
    height?: number;
}

export default function TemplatePreview({ template, width: initialWidth = 400, height: initialHeight = 229 }: TemplatePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    // Measure container size
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                // Maintain 1.75 aspect ratio (standard business card)
                const height = width / 1.75;
                setDimensions({ width, height });
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Calculate scale to fit template in preview container
    const scale = useMemo(() => {
        const scaleX = dimensions.width / template.width;
        const scaleY = dimensions.height / template.height;
        return Math.min(scaleX, scaleY);
    }, [template.width, template.height, dimensions.width, dimensions.height]);

    // Render background
    const renderBackground = () => {
        const bg = template.background;
        if (!bg) {
            return <Rect width={template.width} height={template.height} fill="#F3F4F6" listening={false} />;
        }

        if (bg.type === 'solid') {
            return <Rect width={template.width} height={template.height} fill={bg.color1} listening={false} />;
        }

        if (bg.type === 'pattern') {
            // For patterns, we'll use a solid color with a subtle overlay
            return (
                <>
                    <Rect width={template.width} height={template.height} fill={bg.color1} listening={false} />
                    {bg.patternColor && (
                        <Rect
                            width={template.width}
                            height={template.height}
                            fill={bg.patternColor}
                            opacity={0.1}
                            listening={false}
                        />
                    )}
                </>
            );
        }

        // Default fallback
        return <Rect width={template.width} height={template.height} fill={bg.color1 || "#F3F4F6"} listening={false} />;
    };

    // Render individual layer
    const renderLayer = (layer: KonvaNodeDefinition, index: number) => {
        const baseProps = {
            id: layer.props.id,
            x: layer.props.x,
            y: layer.props.y,
            width: layer.props.width,
            height: layer.props.height,
            rotation: layer.props.rotation,
            opacity: layer.props.opacity,
            listening: false,
            perfectDrawEnabled: false,
        };

        switch (layer.type) {
            case 'Text':
                return (
                    <Text
                        key={layer.id || index}
                        {...baseProps}
                        text={(layer.props as any).text || ''}
                        fontSize={(layer.props as any).fontSize || 16}
                        fontFamily={(layer.props as any).fontFamily || 'Arial'}
                        fill={layer.props.fill || '#000000'}
                        align={(layer.props as any).align || 'left'}
                    />
                );

            case 'Rect':
                return (
                    <Rect
                        key={layer.id || index}
                        {...baseProps}
                        fill={layer.props.fill}
                        stroke={(layer.props as any).stroke}
                        strokeWidth={(layer.props as any).strokeWidth}
                        cornerRadius={(layer.props as any).cornerRadius}
                    />
                );

            case 'Circle':
                return (
                    <Circle
                        key={layer.id || index}
                        x={layer.props.x}
                        y={layer.props.y}
                        radius={(layer.props as any).radius || 50}
                        fill={layer.props.fill}
                        stroke={(layer.props as any).stroke}
                        strokeWidth={(layer.props as any).strokeWidth}
                        rotation={layer.props.rotation}
                        opacity={layer.props.opacity}
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );

            case 'RegularPolygon':
                return (
                    <RegularPolygon
                        key={layer.id || index}
                        x={layer.props.x}
                        y={layer.props.y}
                        sides={(layer.props as any).sides || 6}
                        radius={(layer.props as any).radius || 50}
                        fill={layer.props.fill}
                        stroke={(layer.props as any).stroke}
                        strokeWidth={(layer.props as any).strokeWidth}
                        rotation={layer.props.rotation}
                        opacity={layer.props.opacity}
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );

            case 'Star':
                return (
                    <Star
                        key={layer.id || index}
                        x={layer.props.x}
                        y={layer.props.y}
                        numPoints={(layer.props as any).numPoints || 5}
                        innerRadius={(layer.props as any).innerRadius || 20}
                        outerRadius={(layer.props as any).outerRadius || 40}
                        fill={layer.props.fill}
                        stroke={(layer.props as any).stroke}
                        strokeWidth={(layer.props as any).strokeWidth}
                        rotation={layer.props.rotation}
                        opacity={layer.props.opacity}
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );

            case 'Arrow':
                return (
                    <Arrow
                        key={layer.id || index}
                        points={(layer.props as any).points || [0, 0, 100, 100]}
                        pointerLength={(layer.props as any).pointerLength || 10}
                        pointerWidth={(layer.props as any).pointerWidth || 10}
                        fill={layer.props.fill}
                        stroke={(layer.props as any).stroke}
                        strokeWidth={(layer.props as any).strokeWidth || 2}
                        opacity={layer.props.opacity}
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );

            case 'Line':
                return (
                    <Line
                        key={layer.id || index}
                        points={(layer.props as any).points || [0, 0, 100, 100]}
                        stroke={(layer.props as any).stroke || '#000000'}
                        strokeWidth={(layer.props as any).strokeWidth || 2}
                        opacity={layer.props.opacity}
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );

            case 'Path':
            case 'Icon':
                return (
                    <Path
                        key={layer.id || index}
                        x={layer.props.x}
                        y={layer.props.y}
                        data={(layer.props as any).data || ''}
                        fill={layer.props.fill}
                        stroke={(layer.props as any).stroke}
                        strokeWidth={(layer.props as any).strokeWidth}
                        scaleX={layer.props.width / 24} // Icons are typically 24x24
                        scaleY={layer.props.height / 24}
                        rotation={layer.props.rotation}
                        opacity={layer.props.opacity}
                        listening={false}
                        perfectDrawEnabled={false}
                    />
                );

            case 'Image':
                return (
                    <URLImage
                        key={layer.id || index}
                        src={(layer.props as any).src}
                        {...baseProps}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-50">
            <Stage
                width={dimensions.width}
                height={dimensions.height}
                scaleX={scale}
                scaleY={scale}
                listening={false}
            >
                <Layer listening={false}>
                    {renderBackground()}
                    {template.layers.map((layer, index) => renderLayer(layer, index))}
                </Layer>
            </Stage>
        </div>
    );
}
