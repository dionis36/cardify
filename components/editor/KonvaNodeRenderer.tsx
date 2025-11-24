"use client";

import React, { useRef, memo, useCallback, useEffect } from "react";
import { 
  Rect, Circle, Ellipse, Star, RegularPolygon, Line, Arrow, Path, Group, 
} from "react-konva"; 
import Konva from "konva";
import { 
  KonvaNodeDefinition, 
  KonvaNodeProps, 
  RectProps, 
  ImageProps, 
  TextProps,
  CircleProps,
  EllipseProps,
  StarProps,
  RegularPolygonProps,
  LineProps,
  ArrowProps,
  PathProps,
  IconProps,
  KonvaNodeType
} from "@/types/template";
// FIX: Using full paths for sibling components to resolve local module errors
import TextNode from "components/editor/TextNode"; 
import ImageNode from "components/editor/ImageNode"; 
import IconNode from "components/editor/IconNode"; 

/**
 * Props for the KonvaNodeRenderer component.
 */
interface KonvaNodeRendererProps {
  node: KonvaNodeDefinition;
  index: number;
  isSelected: boolean;
  onSelect: (indexValue: number | null) => void;
  onNodeChange: (indexValue: number, updates: Partial<KonvaNodeProps>) => void;
  isLocked: boolean;
  isLayoutDisabled: boolean;
  onStartEditing: (konvaNode: Konva.Text) => void;
  onDragStart: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

/**
 * Renders a single Konva node (shape, text, image, icon) based on its type.
 * It manages the attachment to the Konva Transformer and handles drag/transform end events.
 */
const KonvaNodeRendererBase: React.FC<KonvaNodeRendererProps> = ({
  node,
  index,
  isSelected,
  onSelect,
  onNodeChange,
  isLocked,
  isLayoutDisabled,
  onStartEditing,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  // Use a ref for the main Konva node (Group, Rect, etc.)
  const nodeRef = useRef<Konva.Node>(null);
  
  /**
   * Effect to manage the Konva Transformer attachment.
   * Attaches the transformer only when the node is selected and not layout disabled.
   */
  useEffect(() => {
    if (!nodeRef.current) return;
    
    // Safety check to ensure Konva instances are available
    const stage = nodeRef.current.getStage();
    const transformer = (stage as any)?.transformer as Konva.Transformer | undefined;

    if (!transformer) return;

    if (isSelected && !isLayoutDisabled) {
      // Attach the transformer to the current node if it's not already attached
      if (transformer.nodes().length !== 1 || transformer.nodes()[0] !== nodeRef.current) {
        transformer.nodes([nodeRef.current]);
      }
    } else {
      // Detach if the current node is deselected or layout is disabled
      if (transformer.nodes().includes(nodeRef.current)) {
        transformer.nodes([]);
      }
    }
    // Redraw the layer to update transformer visibility
    nodeRef.current.getLayer()?.batchDraw();

  }, [isSelected, isLayoutDisabled, nodeRef]); 

  /**
   * Handles the end of a transform (resize or rotation) event.
   * Calculates the new dimensions and resets the scale on the Konva object to 1.
   */
  const handleTransformEnd = useCallback(() => {
    if (!nodeRef.current) return;
    
    const node = nodeRef.current;
    
    // Calculate new width/height based on current scale and initial size
    let width = node.width() * node.scaleX();
    let height = node.height() * node.scaleY();
    
    // Reset scale to 1 on the Konva object, and transfer new size to props
    node.scaleX(1);
    node.scaleY(1);
    
    onNodeChange(index, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      // Text, Image, Path (Icon/Complex) use width/height
      width: width, 
      height: height,
    });
    
    // Redraw the layer to apply the scale reset
    node.getLayer()?.batchDraw();
  }, [index, onNodeChange]);

  // --- COMMON KONVA PROPERTIES ---
  const commonKonvaProps: Konva.NodeConfig = {
    id: node.id,
    x: node.props.x,
    y: node.props.y,
    rotation: node.props.rotation,
    opacity: node.props.opacity,
    draggable: !isLocked && !isLayoutDisabled, // Locked nodes and layout disabled nodes cannot be dragged
    
    // Event handlers
    onClick: () => onSelect(index),
    onTap: () => onSelect(index),
    onDragStart,
    onDragMove,
    onDragEnd,
    onTransformEnd: handleTransformEnd,
    // Visibility: only render if not locked
    visible: !isLocked, 
  };

  // Extract shared styling props for basic shapes
  const { fill, stroke, strokeWidth } = node.props;
  const shapeStyleProps = { fill, stroke, strokeWidth };


  // --- RENDERING DISPATCH ---

  // 1. Text (uses specialized component)
  if (node.type === "Text") {
    return (
      <TextNode
        node={node}
        nodeRef={nodeRef as React.RefObject<Konva.Text>}
        isSelected={isSelected}
        onSelect={() => onSelect(index)}
        onDeselect={() => onSelect(null)}
        onNodeChange={(updates) => onNodeChange(index, updates)}
        isLocked={isLocked}
        isLayoutDisabled={isLayoutDisabled}
        onStartEditing={onStartEditing}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    );
  }

  // 2. Image (uses specialized component)
  if (node.type === "Image") {
    return (
      <ImageNode
        node={node}
        nodeRef={nodeRef as React.RefObject<Konva.Image>}
        isSelected={isSelected}
        onSelect={() => onSelect(index)}
        onNodeChange={(updates) => onNodeChange(index, updates)}
        isLocked={isLocked}
        isLayoutDisabled={isLayoutDisabled}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      />
    );
  }

  // 3. Icon (Path with category "Icon" - uses specialized component)
  if (node.type === "Icon") {
    const props = node.props as IconProps;
    return (
        <IconNode
            nodeRef={nodeRef as React.RefObject<Konva.Group>}
            iconName={props.iconName || 'HelpCircle'}
            props={props}
            commonKonvaProps={commonKonvaProps}
            isLayoutDisabled={isLayoutDisabled}
        />
    );
  }

  // 4. Path (Complex Shapes / Generic SVG Data)
  if (node.type === "Path") {
    const { width, height, data } = node.props as PathProps;
    
    return (
        // Wrap Path in a Group for better handling of transformations (resizing the content via width/height)
        <Group
            {...commonKonvaProps}
            {...shapeStyleProps}
            ref={nodeRef as React.RefObject<Konva.Group>}
        >
            <Path
                x={0} // Positioned relative to Group
                y={0}
                width={width} // Konva Path uses width/height to scale the SVG 'data'
                height={height}
                data={data}
                // Styling is passed through the Group's style props for consistency
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
            />
        </Group>
    );
  }

  // --- BASIC SHAPES (No special wrapper needed) ---

  // 5. Rectangle
  if (node.type === "Rect") {
    const { width, height, cornerRadius } = node.props as RectProps;
    return (
      <Rect
        {...commonKonvaProps}
        {...shapeStyleProps}
        ref={nodeRef as React.RefObject<Konva.Rect>}
        width={width}
        height={height}
        cornerRadius={cornerRadius}
        // Rect is handled directly by TR for resize
      />
    );
  }

  // 6. Circle
  if (node.type === "Circle") {
    const { radius } = node.props as CircleProps;
    return (
      <Circle
        {...commonKonvaProps}
        {...shapeStyleProps}
        ref={nodeRef as React.RefObject<Konva.Circle>}
        radius={radius}
      />
    );
  }

  // 7. Ellipse
  if (node.type === "Ellipse") {
    const { radiusX, radiusY } = node.props as EllipseProps;
    return (
      <Ellipse
        {...commonKonvaProps}
        {...shapeStyleProps}
        ref={nodeRef as React.RefObject<Konva.Ellipse>}
        radiusX={radiusX}
        radiusY={radiusY}
      />
    );
  }

  // 8. Star
  if (node.type === "Star") {
    const { innerRadius, outerRadius, numPoints } = node.props as StarProps;
    return (
      <Star
        {...commonKonvaProps}
        {...shapeStyleProps}
        ref={nodeRef as React.RefObject<Konva.Star>}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        numPoints={numPoints}
      />
    );
  }

  // 9. Regular Polygon
  if (node.type === "RegularPolygon") {
    const { radius, sides } = node.props as RegularPolygonProps;
    return (
      <RegularPolygon
        {...commonKonvaProps}
        {...shapeStyleProps}
        ref={nodeRef as React.RefObject<Konva.RegularPolygon>}
        radius={radius}
        sides={sides}
      />
    );
  }

  // --- LINE SHAPES (Cannot be resized by TR, only dragged/rotated) ---

  // 10. Line
  if (node.type === "Line") {
    const { points, tension, lineCap, lineJoin } = node.props as LineProps;
    
    return (
        <Line
            {...commonKonvaProps}
            {...shapeStyleProps}
            ref={nodeRef as React.RefObject<Konva.Line>}
            // Line uses x/y as offset, points define the shape
            points={points}
            tension={tension}
            lineCap={lineCap}
            lineJoin={lineJoin}
        />
    );
  }

  // 11. Arrow
  if (node.type === "Arrow") {
    const { points, lineCap, lineJoin, pointerLength, pointerWidth } = node.props as ArrowProps;
    
    return (
        <Arrow
            {...commonKonvaProps}
            {...shapeStyleProps}
            ref={nodeRef as React.RefObject<Konva.Arrow>}
            // Arrow uses x/y as offset, points define the shape
            points={points}
            lineCap={lineCap}
            lineJoin={lineJoin}
            pointerLength={pointerLength}
            pointerWidth={pointerWidth}
        />
    );
  }


  // Fallback for unhandled types
  console.error(`[KonvaNodeRenderer] Unhandled Konva Node Type: ${(node as any).type}`);
  return null;
};

// FIX LAYER 4: Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prev: KonvaNodeRendererProps, next: KonvaNodeRendererProps) => {
    return (
        prev.isSelected === next.isSelected &&
        prev.isLocked === next.isLocked &&
        prev.isLayoutDisabled === next.isLayoutDisabled &&
        prev.node === next.node &&
        prev.index === next.index
    );
};

const KonvaNodeRenderer = memo(KonvaNodeRendererBase, arePropsEqual);
KonvaNodeRenderer.displayName = "KonvaNodeRenderer";
export default KonvaNodeRenderer;