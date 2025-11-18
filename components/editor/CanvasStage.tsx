// components/editor/CanvasStage.tsx (MODIFIED - Coordinate Fixes and Type Safety)

"use client";

import React, { forwardRef, useRef, useEffect, useCallback, memo, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
// NOTE: Make sure your types file defines all shape props (CircleProps, EllipseProps, etc.)
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps, RectProps, ImageProps, TextProps, KonvaNodeType, CircleProps, EllipseProps } from "@/types/template"; 
import KonvaNodeRenderer from "./KonvaNodeRenderer";
import { Stage as KonvaStageType } from "konva/lib/Stage";

// NEW IMPORTS for Snapping
import { getSnappingLines, getSnapAndAlignLines, SnappingLine } from "@/lib/alignmentHelpers";
import TextEditor from "./TextEditor"; 

/**
 * Define print-production constants in pixels.
 */
const BLEED_MARGIN = 15;
const SAFE_MARGIN = 15; 

// Simple image cache 
const imageCache: Record<string, HTMLImageElement> = {};

// ... (useCachedImage hook remains here) ...
function useCachedImage(src?: string | null) {
    const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  
    useEffect(() => {
      if (!src) {
        setImage(undefined);
        return;
      }
      
      // Check cache first
      if (imageCache[src]) {
        setImage(imageCache[src]);
        return;
      }
  
      // Load image
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
// ... (end useCachedImage hook) ...

type EditorMode = "FULL_EDIT" | "DATA_ONLY";

interface CanvasStageProps {
    template: CardTemplate;
    selectedNodeIndex: number | null;
    onNodeChange: (index: number, updates: Partial<KonvaNodeProps>) => void;
    onSelectNode: (index: number | null) => void; 
    mode: EditorMode;
    onDeselectNode?: () => void
}

type StageRef = KonvaStageType | null;

const CanvasStage = forwardRef<StageRef, CanvasStageProps>((({
    template,
    selectedNodeIndex,
    onNodeChange,
    onSelectNode,
    mode,
}, ref) => {
    const transformerRef = useRef<Konva.Transformer>(null);
    const stageRef = useRef<Konva.Stage>(null);
    
    // Snapping State
    const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);
    const [visibleSnappingLines, setVisibleSnappingLines] = useState<SnappingLine[]>([]);
    
    // Inline Text Editing State
    const [editingNode, setEditingNode] = useState<{
        konvaNode: Konva.Text; 
        nodeDef: KonvaNodeDefinition & { type: 'Text', props: TextProps };
        index: number;
    } | null>(null);

    const isLayoutDisabled = mode === "DATA_ONLY";

    // ---------------------- 1. DRAG AND TRANSFORM HANDLERS (UPDATED FOR FIXES) ----------------------

    /**
     * Handles the end of a drag operation. Uses draggedNodeIndex from state
     * (set in handleDragStart) to ensure correct index context, fixing Error 2.
     * Also includes coordinate conversion for center-based shapes.
     */
    // FIX: Removed the 'index: number' argument from the function signature to match Konva's event handler type
    const onNodeDragEnd = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => { 
        if (draggedNodeIndex === null) return;
        
        const node = e.target;
        const nodeType = node.name() as KonvaNodeType; 
    
        let newX = node.x();
        let newY = node.y();
    
        // CRITICAL: Adjust center-based shapes back to top-left bounding box
        if (['Circle', 'Ellipse', 'Star', 'RegularPolygon'].includes(nodeType)) {
            // Konva gives the center coordinates for these shapes.
            // We need to subtract half the width/height to get the top-left corner.
            newX = node.x() - node.width() / 2;
            newY = node.y() - node.height() / 2;
        }
    
        // Call the parent state update function with the new top-left coordinates
        onNodeChange(draggedNodeIndex, { x: newX, y: newY });

        // Clear snapping states 
        setVisibleSnappingLines([]);
        setDraggedNodeIndex(null);

    }, [onNodeChange, draggedNodeIndex]);


    /**
     * Handles the end of a transform operation (resize/rotate).
     * Includes coordinate conversion and dimension/radius updates, fixing Error 1.
     */
    const onNodeTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>, index: number) => {
        const trNode = e.target;
        const type = trNode.name() as KonvaNodeType;
    
        // Reset scale to 1 to prevent double transformation (Konva best practice)
        const scaleX = trNode.scaleX();
        const scaleY = trNode.scaleY();
        trNode.scaleX(1);
        trNode.scaleY(1);
    
        // Initialize general properties
        let newProps: Partial<KonvaNodeProps> = {
            x: trNode.x(),
            y: trNode.y(),
            width: trNode.width() * scaleX,
            height: trNode.height() * scaleY,
            rotation: trNode.rotation(),
        };
        
        // CRITICAL: Handle center-based shapes separately for type safety and geometry
        if (['Circle', 'Ellipse', 'Star', 'RegularPolygon'].includes(type)) {
            const newWidth = newProps.width!;
            const newHeight = newProps.height!;

            if (type === 'Circle') {
                 // FIX: Cast to CircleProps here to satisfy TypeScript (Error 1)
                const circleProps: Partial<CircleProps> = newProps as Partial<CircleProps>; 
                const newRadius = Math.max(newWidth, newHeight) / 2;
                
                circleProps.radius = newRadius;
                // Delete common Konva props that conflict with circle props (optional, but cleaner)
                delete circleProps.width;
                delete circleProps.height;
                newProps = circleProps; 
            } 
            else if (type === 'Ellipse') {
                // FIX: Cast to EllipseProps here to satisfy TypeScript (Error 1)
                const ellipseProps: Partial<EllipseProps> = newProps as Partial<EllipseProps>;
                
                ellipseProps.radiusX = newWidth / 2;
                ellipseProps.radiusY = newHeight / 2;
                // Delete common Konva props that conflict with ellipse props
                delete ellipseProps.width;
                delete ellipseProps.height;
                newProps = ellipseProps; 
            } 
            
            // Adjust the calculated x/y (center) back to top-left for the state definition.
            newProps.x = trNode.x() - newWidth / 2;
            newProps.y = trNode.y() - newHeight / 2;
        }

        // Persist the changes to the app state
        onNodeChange(index, newProps);
    }, [onNodeChange]);


    // ---------------------- 2.1 INLINE TEXT EDITING HANDLERS ----------------------
    const handleStartTextEditing = useCallback((konvaNode: Konva.Text) => {
        const index = template.layers.findIndex(
            (node) => node.id === konvaNode.id()
        );
        
        if (index === -1 || template.layers[index].type !== 'Text' || template.layers[index].locked) return;
        
        // 1. Deselect other nodes
        onSelectNode(null)
        
        // 2. Set the state to start editing
        setEditingNode({
            konvaNode,
            nodeDef: template.layers[index] as KonvaNodeDefinition & { type: 'Text', props: TextProps },
            index,
        });

    }, [template.layers, onSelectNode]);


    const handleStopTextEditing = useCallback((newText: string) => {
        if (!editingNode) return;

        // 1. Commit the text change
        onNodeChange(editingNode.index, { text: newText });

        // 2. Clear editing state
        setEditingNode(null);
    }, [editingNode, onNodeChange]);

    // ---------------------- 2.2 SNAPPING/DRAGGING HANDLERS ----------------------

    const handleDragStart = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
        const id = e.target.id();
        const index = template.layers.findIndex((node) => node.id === id);
        
        if (index !== -1 && !template.layers[index].locked) {
            // Set the index of the node being dragged for use in onNodeDragEnd
            setDraggedNodeIndex(index); 
        }
    }, [template.layers]);


    const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        if (draggedNodeIndex === null) return;
        
        const draggedKonvaNode = e.target as Konva.Node;
        const draggedNodeDef = template.layers[draggedNodeIndex];

        // Ensure we only snap editable, non-locked nodes
        if (draggedNodeDef.locked || !draggedNodeDef.editable) {
            return;
        }

        // 1. Get current (unsnapped) properties of the dragged node
        const currentProps: KonvaNodeProps = {
            x: draggedKonvaNode.x(),
            y: draggedKonvaNode.y(),
            width: draggedKonvaNode.width() * draggedKonvaNode.scaleX(),
            height: draggedKonvaNode.height() * draggedKonvaNode.scaleY(),
            rotation: draggedKonvaNode.rotation(),
            opacity: draggedNodeDef.props.opacity, 
        } as KonvaNodeProps; 
        
        // 2. Calculate all potential snapping targets (from other nodes + canvas)
        const allSnappingLines = getSnappingLines(
            template.layers, 
            draggedNodeIndex, 
            template.width, 
            template.height
        );

        // 3. Find the best snap location
        const { x: newX, y: newY, snappingLines: guidesToDisplay } = getSnapAndAlignLines(
            currentProps, 
            allSnappingLines
        );

        // 4. Apply the snapped position
        draggedKonvaNode.x(newX);
        draggedKonvaNode.y(newY);

        // 5. Update state for visualization
        setVisibleSnappingLines(guidesToDisplay);

    }, [draggedNodeIndex, template.layers, template.width, template.height]);

    // ---------------------- 3. SIDE EFFECTS/LIFECYCLE ----------------------

    // Attach transformer to selected node
    useEffect(() => {
        if (!stageRef.current || !transformerRef.current) return;
        
        // If a node is being edited with the HTML TextEditor, do not attach the transformer.
        if (editingNode !== null) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
            return;
        }

        const transformer = transformerRef.current;
        const selectedNode = selectedNodeIndex !== null
            ? stageRef.current.findOne(`#${template.layers[selectedNodeIndex].id}`)
            : null;

        if (selectedNode) {
            // Check if the node is transformable and not locked
            const selectedDef = template.layers[selectedNodeIndex!];
            if (selectedDef.editable && !selectedDef.locked) {
                // Attach the node to the transformer
                transformer.nodes([selectedNode as Konva.Node]);
            } else {
                transformer.nodes([]);
            }
        } else {
            transformer.nodes([]);
        }
        
        // Redraw layer to make transformer visible
        transformer.getLayer()?.batchDraw();

    }, [selectedNodeIndex, template.layers, editingNode]); 

    // Expose Konva Stage methods via ref
    React.useImperativeHandle(ref, () => stageRef.current as KonvaStageType, []);

    // ---------------------- 4. RENDER ----------------------
    
    // The node definition that is currently selected (for passing to TextEditor)
    const selectedNodeDef = selectedNodeIndex !== null ? template.layers[selectedNodeIndex] : null;

    return (
        <div className="relative" style={{ width: template.width, height: template.height }}>
            {/* 2.1: Render the HTML Text Editor on top of the canvas */}
            {editingNode && (
                <TextEditor
                    nodeDef={editingNode.nodeDef}
                    konvaNode={editingNode.konvaNode}
                    canvasStageRef={stageRef}
                    onStopEditing={handleStopTextEditing}
                />
            )}

                <Stage 
                ref={stageRef}
                width={template.width} 
                height={template.height}
                // Handle deselecting on click outside of a node
                onClick={(e) => {
                    // Always clear editing state on ANY click that bubbles up to the stage
                    setEditingNode(null);

                    // Only deselect everything if the click hit the stage background
                    if (e.target === e.target.getStage()) {
                        onSelectNode(null);
                    }
                }}
            >
                <Layer>
                    {/* 1. BACKGROUND RECT (The card itself) */}
                    <Rect 
                        width={template.width} 
                        height={template.height}
                        fill="#FFFFFF" // Default white background
                        listening={true} 
                    />
                    
                    {/* 2. SAFE/BLEED MARGINS (Visual Guides - Not Exported) */}
                    {/* Bleed Margin (Red Outline) */}
                    <Rect
                        x={0} y={0} 
                        width={template.width} 
                        height={template.height}
                        stroke="#ef4444" // Tailwind red-500
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                    />
                    {/* Safe Margin (Blue Outline) */}
                    <Rect
                        x={SAFE_MARGIN} y={SAFE_MARGIN}
                        width={template.width - 2 * SAFE_MARGIN}
                        height={template.height - 2 * SAFE_MARGIN}
                        stroke="#3b82f6" // Tailwind blue-500
                        strokeWidth={1}
                        dash={[5, 5]}
                        listening={false}
                    />

                    {/* 3. MAIN CONTENT GROUP */}
                    <Group>
                        {template.layers.map((nodeDef, index) => {
                            const isBeingEdited = editingNode?.index === index;
                            
                                return (
                                    <KonvaNodeRenderer 
                                        key={nodeDef.id}
                                        node={nodeDef}
                                        index={index}
                                        isSelected={selectedNodeIndex === index}
                                        onSelect={(indexValue) => { 
                                            onSelectNode(indexValue);
                                        }}
                                        onNodeChange={(indexValue, updates) => onNodeChange(indexValue, updates)}
                                        isLocked={nodeDef.locked}
                                        isLayoutDisabled={isLayoutDisabled}
                                        onStartEditing={handleStartTextEditing}
                                        isVisible={!isBeingEdited}
                                        onDragStart={handleDragStart}
                                        onDragMove={handleDragMove}
                                        onDragEnd={onNodeDragEnd}
                                        // onTransformEnd={onNodeTransformEnd} // <-- added: satisfy KonvaNodeRendererProps
                                    />
                                );
                        })}
                    </Group>

                    {/* 4. SNAPPING LINES (Phase 2.2) */}
                    {visibleSnappingLines.map((line, index) => {
                        // Calculate dimensions for a thin line (1px wide or high)
                        const isVertical = line.guideType === "v";
                        const lineProps = isVertical
                            ? {
                                x: line.lineCoord,
                                y: 0,
                                width: 1,
                                height: template.height,
                            }
                            : {
                                x: 0,
                                y: line.lineCoord,
                                width: template.width,
                                height: 1,
                            };
                            
                        return (
                            <Rect
                                key={index}
                                {...lineProps}
                                fill={line.strokeColor}
                                listening={false}
                            />
                        );
                    })}

                    {/* 5. TRANSFORMER */}
                    {editingNode === null && (
                        <Transformer
                            ref={transformerRef}
                            enabledAnchors={[
                                'top-left', 'top-right', 'bottom-left', 'bottom-right', 
                                'middle-left', 'middle-right', 'top-center', 'bottom-center'
                            ]}
                            rotationSnaps={[0, 90, 180, 270]}
                            // Disable drag/transform in data-only mode or if locked
                            visible={!isLayoutDisabled && !!selectedNodeDef && !selectedNodeDef.locked} 
                            // ADDED bounding box check for minimum size
                            boundBoxFunc={(oldBox, newBox) => {
                                // Prevent scaling down too small
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }

                                const templateMaxX = template.width;
                                const templateMaxY = template.height;
                                
                                // Clamping logic (relative to the Group)
                                let x = Math.max(0, newBox.x);
                                let y = Math.max(0, newBox.y);

                                if (x + newBox.width > templateMaxX) {
                                    x = templateMaxX - newBox.width;
                                }
                                if (y + newBox.height > templateMaxY) {
                                    y = templateMaxY - newBox.height;
                                }

                                return { x, y, width: newBox.width, height: newBox.height, rotation: newBox.rotation };
                            }}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
}));

CanvasStage.displayName = "CanvasStage";
export default CanvasStage;