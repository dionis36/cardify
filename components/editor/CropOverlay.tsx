import React, { useRef, useState, useEffect } from 'react';
import { Group, Rect, Transformer, Layer, Text as KonvaText } from 'react-konva';
import Konva from 'konva';
import { ImageProps } from '@/types/template';

interface CropOverlayProps {
    imageNode: {
        x: number;
        y: number;
        width: number;
        height: number;
        rotation: number;
        props: ImageProps;
    };
    onCropChange: (newCrop: { cropX: number; cropY: number; cropWidth: number; cropHeight: number }) => void;
    onExit: () => void;
}

const CropOverlay: React.FC<CropOverlayProps> = ({ imageNode, onCropChange, onExit }) => {
    const { x, y, width, height, rotation, props } = imageNode;
    const cropRectRef = useRef<Konva.Rect>(null);
    const transformerRef = useRef<Konva.Transformer>(null);

    // Initialize crop rectangle state
    const [cropRect, setCropRect] = useState({
        x: props.cropX || 0,
        y: props.cropY || 0,
        width: props.cropWidth || width,
        height: props.cropHeight || height,
    });

    // Attach transformer to crop rectangle
    useEffect(() => {
        if (transformerRef.current && cropRectRef.current) {
            transformerRef.current.nodes([cropRectRef.current]);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, []);

    const handleCropDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        setCropRect({
            ...cropRect,
            x: Math.max(0, Math.min(node.x(), width - cropRect.width)),
            y: Math.max(0, Math.min(node.y(), height - cropRect.height)),
        });
    };

    const handleCropTransformEnd = () => {
        const node = cropRectRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale and update dimensions
        node.scaleX(1);
        node.scaleY(1);

        const newWidth = Math.max(10, node.width() * scaleX);
        const newHeight = Math.max(10, node.height() * scaleY);
        const newX = Math.max(0, Math.min(node.x(), width - newWidth));
        const newY = Math.max(0, Math.min(node.y(), height - newHeight));

        setCropRect({
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
        });

        node.position({ x: newX, y: newY });
        node.width(newWidth);
        node.height(newHeight);
    };

    const handleApply = () => {
        onCropChange({
            cropX: cropRect.x,
            cropY: cropRect.y,
            cropWidth: cropRect.width,
            cropHeight: cropRect.height,
        });
        onExit();
    };

    const handleCancel = () => {
        onExit();
    };

    return (
        <Group>
            {/* Darkening overlay - top */}
            <Rect
                x={x}
                y={y}
                width={width}
                height={cropRect.y}
                fill="black"
                opacity={0.5}
                listening={false}
            />
            {/* Darkening overlay - bottom */}
            <Rect
                x={x}
                y={y + cropRect.y + cropRect.height}
                width={width}
                height={height - cropRect.y - cropRect.height}
                fill="black"
                opacity={0.5}
                listening={false}
            />
            {/* Darkening overlay - left */}
            <Rect
                x={x}
                y={y + cropRect.y}
                width={cropRect.x}
                height={cropRect.height}
                fill="black"
                opacity={0.5}
                listening={false}
            />
            {/* Darkening overlay - right */}
            <Rect
                x={x + cropRect.x + cropRect.width}
                y={y + cropRect.y}
                width={width - cropRect.x - cropRect.width}
                height={cropRect.height}
                fill="black"
                opacity={0.5}
                listening={false}
            />

            {/* Crop rectangle */}
            <Rect
                ref={cropRectRef}
                x={x + cropRect.x}
                y={y + cropRect.y}
                width={cropRect.width}
                height={cropRect.height}
                stroke="white"
                strokeWidth={2}
                dash={[10, 5]}
                draggable
                onDragEnd={handleCropDragEnd}
                onTransformEnd={handleCropTransformEnd}
            />

            {/* Transformer for crop rectangle */}
            <Transformer
                ref={transformerRef}
                rotateEnabled={false}
                borderStroke="white"
                borderStrokeWidth={2}
                anchorSize={8}
                anchorStroke="white"
                anchorFill="#4F46E5"
                boundBoxFunc={(oldBox, newBox) => {
                    // Prevent crop from going outside image bounds
                    if (newBox.width < 10 || newBox.height < 10) {
                        return oldBox;
                    }
                    return newBox;
                }}
            />

            {/* Instructions text */}
            <KonvaText
                x={x + 10}
                y={y + 10}
                text="Drag to move • Resize handles to adjust • ESC to cancel"
                fontSize={14}
                fill="white"
                stroke="black"
                strokeWidth={0.5}
                listening={false}
            />

            {/* Apply button (visual only - actual button in UI) */}
            <Rect
                x={x + width - 180}
                y={y + height - 50}
                width={80}
                height={35}
                fill="#10B981"
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={5}
                shadowOpacity={0.3}
                onClick={handleApply}
                onTap={handleApply}
            />
            <KonvaText
                x={x + width - 180}
                y={y + height - 50}
                width={80}
                height={35}
                text="Apply"
                fontSize={14}
                fontStyle="bold"
                fill="white"
                align="center"
                verticalAlign="middle"
                listening={false}
            />

            {/* Cancel button */}
            <Rect
                x={x + width - 90}
                y={y + height - 50}
                width={80}
                height={35}
                fill="#EF4444"
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={5}
                shadowOpacity={0.3}
                onClick={handleCancel}
                onTap={handleCancel}
            />
            <KonvaText
                x={x + width - 90}
                y={y + height - 50}
                width={80}
                height={35}
                text="Cancel"
                fontSize={14}
                fontStyle="bold"
                fill="white"
                align="center"
                verticalAlign="middle"
                listening={false}
            />
        </Group>
    );
};

export default CropOverlay;
