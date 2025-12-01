"use client";

import React, { useRef, useState, useEffect, memo } from "react";
import { Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { ImageProps, KonvaNodeDefinition } from "@/types/template";

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
  node: KonvaNodeDefinition & { type: "Image"; props: ImageProps };
  nodeRef?: React.RefObject<Konva.Image>;
  isSelected: boolean;
  onSelect: () => void;
  onNodeChange: (updates: Partial<ImageProps>) => void;
  isLocked: boolean;
  isLayoutDisabled: boolean;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}

const ImageNode: React.FC<ImageNodeProps> = memo(({
  node,
  nodeRef,
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

  const {
    x, y, width, height, rotation, opacity, visible, src,
    stroke, strokeWidth, cornerRadius,
    cropX, cropY, cropWidth, cropHeight,
    filters, flipHorizontal, flipVertical
  } = node.props;

  const image = useCachedImage(src);

  // Apply filters when image loads or props change
  useEffect(() => {
    if (image && konvaNodeRef.current) {
      konvaNodeRef.current.cache();
    }
  }, [image, filters, width, height, cornerRadius, stroke, strokeWidth, flipHorizontal, flipVertical]);

  const activeFilters = [];
  if (filters) {
    if (filters.blur && filters.blur > 0) activeFilters.push(Konva.Filters.Blur);
    if (filters.brightness && filters.brightness !== 100) activeFilters.push(Konva.Filters.Brighten);
    if (filters.contrast && filters.contrast !== 100) activeFilters.push(Konva.Filters.Contrast);
    if (filters.grayscale && filters.grayscale > 0) activeFilters.push(Konva.Filters.Grayscale);
    if (filters.sepia && filters.sepia > 0) activeFilters.push(Konva.Filters.Sepia);
  }

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
      image={image}
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
      crop={{
        x: cropX || 0,
        y: cropY || 0,
        width: cropWidth || 0,
        height: cropHeight || 0,
      }}

      // Filters
      filters={activeFilters}
      blurRadius={filters?.blur || 0}
      // Map 0-200 to -1 to 1. 100 is 0.
      brightness={(filters?.brightness !== undefined ? filters.brightness - 100 : 0) / 100}
      // Map 0-200 to -100 to 100. 100 is 0.
      contrast={filters?.contrast !== undefined ? filters.contrast - 100 : 0}

      // Flip (Scale -1)
      scaleX={flipHorizontal ? -1 : 1}
      scaleY={flipVertical ? -1 : 1}
      offsetX={flipHorizontal ? width : 0}
      offsetY={flipVertical ? height : 0}
    />
  );
});

ImageNode.displayName = "ImageNode";
export default ImageNode;