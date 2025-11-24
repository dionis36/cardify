// components/editor/ImageNode.tsx (CORRECTED)

"use client";

import React, { useRef, useState, useEffect, memo } from "react";
import { Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { ImageProps, KonvaNodeDefinition } from "@/types/template"; // Import ImageProps

// Simple image cache (Helps prevent unnecessary reloads)
const imageCache: Record<string, HTMLImageElement> = {};

function useCachedImage(src?: string | null): HTMLImageElement | undefined {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    if (!src) {
      setImage(undefined);
      return;
    }

    if (imageCache[src]) {
      setImage(imageCache[src]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;

    const handleLoad = () => {
      imageCache[src] = img;
      setImage(img);
    };

    img.addEventListener('load', handleLoad);

    return () => {
      img.removeEventListener('load', handleLoad);
    };
  }, [src]);

  return image;
}

interface ImageNodeProps {
  // Use a narrowed type for strict type-checking
  node: KonvaNodeDefinition & { type: "Image"; props: ImageProps };
  nodeRef?: React.RefObject<Konva.Image>; // Added prop
  isSelected: boolean;
  onSelect: () => void;
  onNodeChange: (updates: Partial<ImageProps>) => void; // ImageProps here
  isLocked: boolean;
  isLayoutDisabled: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}

const ImageNode: React.FC<ImageNodeProps> = memo(({
  node,
  nodeRef, // Destructure
  isSelected,
  onSelect,
  onNodeChange,
  isLocked,
  isLayoutDisabled,
  onDragStart,
  onDragMove,
  onDragEnd,
  onTransformEnd,
}) => {
  const internalRef = useRef<Konva.Image>(null);
  const konvaNodeRef = nodeRef || internalRef;

  // FIX APPLIED: strokeWidth is now safe to destructure from node.props because ImageProps extends BaseNodeProps and explicitly includes strokeWidth
  const { x, y, width, height, rotation, opacity, visible, src, stroke, strokeWidth, cornerRadius } = node.props;

  const image = useCachedImage(src);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onNodeChange({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  return (
    <KonvaImage
      key={node.id}
      ref={konvaNodeRef}
      id={node.id}
      image={image} // Konva prop for the loaded image
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={rotation}
      opacity={opacity}
      visible={visible}
      draggable={!isLocked && !isLayoutDisabled && node.editable}
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        onDragEnd?.(e);
        handleDragEnd(e);
      }}
      stroke={stroke}
      strokeWidth={strokeWidth}
      cornerRadius={cornerRadius}
    />
  );
});

ImageNode.displayName = "ImageNode";
export default ImageNode;