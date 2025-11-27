// components/editor/CanvasStage.tsx

"use client";

import React, { forwardRef, useRef, useEffect, useCallback, memo, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Transformer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
// FIX: Using relative imports for local components/types
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps, KonvaNodeType, PathProps, BackgroundPattern, BackgroundType } from "../../types/template";
import KonvaNodeRenderer from "./KonvaNodeRenderer";
import { Stage as KonvaStageType } from "konva/lib/Stage";

// FIX: Using relative import for helper
import { getSnappingLines, getSnapAndAlignLines, SnappingLine } from "../../lib/alignmentHelpers";
import { getNodesInRect, normalizeRect, SelectionRect } from "../../lib/selectionHelpers";

/**
 * Define print-production constants in pixels.
 */
const BLEED_MARGIN = 15;
const SAFE_MARGIN = 15;
const STAGE_PADDING = 64; // CRITICAL: Padding value (p-8 in parent is 32px, 32*2 = 64px for safety margin on both sides/top/bottom)

// Simple image cache 
const imageCache: Record<string, HTMLImageElement> = {};

// --- Hooks for Assets (Moved here for single file mandate) ---

// Hook to load image asynchronously and cache it
function useCachedImage(src?: string | null) {
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

        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            imageCache[src] = img;
            setImage(img);
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            setImage(undefined);
        };
        img.src = src;

        return () => {
            // Cleanup is mostly for preventing memory leaks if component unmounts mid-load
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    return image;
}

// --- Background Renderer (To keep the component clean) ---

interface BackgroundRendererProps {
    template: CardTemplate;
    background: BackgroundPattern;
}

const BackgroundRenderer: React.FC<BackgroundRendererProps> = memo(({ template, background }) => {
    const { width, height } = template;
    const {
        type,
        color1,
        color2,
        gradientType,
        gradientStops,
        opacity,
        rotation,
        scale,
        patternImageURL,
        overlayColor
    } = background;

    // Pattern Image Loading
    const patternImage = useCachedImage((type === 'pattern' || type === 'texture') ? patternImageURL : null);

    // 1. Base Layer (Solid Color)
    // Always render a base color. For gradients, this might be hidden or used as fallback.
    // For patterns/textures, this is the background color behind the transparent pattern.
    const renderBaseLayer = () => (
        <Rect
            x={0} y={0} width={width} height={height}
            fill={color1}
            listening={false}
        />
    );

    // 2. Main Effect Layer (Gradient or Pattern/Texture)
    const renderEffectLayer = () => {
        if (type === 'solid') return null;

        if (type === 'gradient') {
            const stops = gradientStops
                ? gradientStops.flatMap(s => [s.offset, s.color])
                : [0, color1, 1, color2 || '#ffffff'];

            let gradientProps: any = {};

            if (gradientType === 'radial') {
                gradientProps = {
                    fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
                    fillRadialGradientStartRadius: 0,
                    fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
                    fillRadialGradientEndRadius: Math.max(width, height) / 1.5, // Cover the area
                    fillRadialGradientColorStops: stops,
                };
            } else {
                // Linear Gradient Math
                // Calculate start/end points based on rotation
                const angleRad = (rotation || 0) * (Math.PI / 180);
                // Simple approximation for full coverage:
                // Center is (w/2, h/2). Vector is (cos, sin).
                // Start = Center - Vector * Length. End = Center + Vector * Length.
                const length = Math.sqrt(width * width + height * height) / 2;
                const cx = width / 2;
                const cy = height / 2;

                gradientProps = {
                    fillLinearGradientStartPoint: {
                        x: cx - Math.cos(angleRad) * length,
                        y: cy - Math.sin(angleRad) * length
                    },
                    fillLinearGradientEndPoint: {
                        x: cx + Math.cos(angleRad) * length,
                        y: cy + Math.sin(angleRad) * length
                    },
                    fillLinearGradientColorStops: stops,
                };
            }

            return (
                <Rect
                    x={0} y={0} width={width} height={height}
                    {...gradientProps}
                    listening={false}
                />
            );
        }

        if ((type === 'pattern' || type === 'texture') && patternImage) {
            return (
                <Rect
                    x={0} y={0} width={width} height={height}
                    fillPatternImage={patternImage}
                    fillPatternScaleX={scale}
                    fillPatternScaleY={scale}
                    fillPatternRotation={rotation}
                    fillPatternRepeat='repeat'
                    listening={false}
                />
            );
        }

        return null;
    };

    // 3. Overlay Layer (Tint for Textures)
    const renderOverlayLayer = () => {
        if (type === 'texture' && overlayColor) {
            return (
                <Rect
                    x={0} y={0} width={width} height={height}
                    fill={overlayColor}
                    opacity={0.3} // Fixed low opacity for tinting, or could be configurable
                    globalCompositeOperation="source-over" // or 'multiply' for better tinting?
                    listening={false}
                />
            );
        }
        return null;
    };

    return (
        <Group
            opacity={opacity}
            name="background-layer-group"
            listening={false} // The group itself shouldn't capture events
        >
            {renderBaseLayer()}
            {renderEffectLayer()}
            {renderOverlayLayer()}

            {/* Invisible Hit Rect to ensure clicks on background are detected if needed, 
                but we generally want them to fall through to Stage or be handled by Stage */}
            <Rect
                x={0} y={0} width={width} height={height}
                fill="transparent"
                name="background-layer-rect" // Keep this name for click detection in CanvasStage
            />
        </Group>
    );
});

BackgroundRenderer.displayName = 'BackgroundRenderer';

// --- Main Canvas Stage Component ---

type KonvaRef = React.RefObject<KonvaStageType>;

interface CanvasStageProps {
    template: CardTemplate;
    selectedNodeIndices: number[]; // CHANGED: Support multi-selection
    onSelectNodes: (indices: number[]) => void; // CHANGED: Select multiple nodes
    onDeselectNode: () => void;
    onNodeChange: (index: number, updates: Partial<KonvaNodeProps>) => void;
    onBatchNodeChange?: (updates: Array<{ index: number; updates: Partial<KonvaNodeProps> }>) => void; // NEW: Batch updates
    onStartEditing: (node: Konva.Text) => void; // Placeholder for text editing
    onEditQRCode?: () => void; // NEW: Handler for QR Code editing

    // CRITICAL: New prop for scaling logic (Plan 3)
    parentRef: React.RefObject<HTMLElement>;

    // NEW: Zoom and Pan controlled props
    zoom?: number; // Zoom level (0.1 to 3.0)
    onZoomChange?: (zoom: number) => void; // Callback when zoom changes
    panOffset?: { x: number; y: number }; // Pan offset
    onPanChange?: (offset: { x: number; y: number }) => void; // Callback when pan changes

    mode: "FULL_EDIT" | "DATA_ONLY";
}

const CanvasStage = forwardRef<KonvaStageType, CanvasStageProps>(
    ({
        template, selectedNodeIndices, onSelectNodes, onDeselectNode,
        onNodeChange, onBatchNodeChange, onStartEditing, onEditQRCode, parentRef,
        zoom: externalZoom = 1, onZoomChange, panOffset: externalPanOffset = { x: 0, y: 0 }, onPanChange,
        mode
    }, ref) => {

        const { width: templateWidth, height: templateHeight, layers } = template;

        // CRITICAL: New state for dynamic stage size and scale
        const [stageSize, setStageSize] = useState({
            width: templateWidth,
            height: templateHeight,
            scale: 1
        });

        // --- Dynamic Scaling Logic (Plan 3) ---
        useEffect(() => {
            const container = parentRef.current;
            if (!container) return;

            let rafId: number | null = null;
            let timeoutId: number | null = null;

            const updateScale = () => {
                // Cancel any pending animation frame
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                }

                // Use requestAnimationFrame for smooth updates
                rafId = requestAnimationFrame(() => {
                    // Get the current dimensions of the <main> container
                    const parentWidth = container.offsetWidth;
                    const parentHeight = container.offsetHeight;

                    // Calculate maximum possible scale factor
                    // Formula: scale = min( (parentWidth - padding) / templateWidth, (parentHeight - padding) / templateHeight )
                    const scaleX = (parentWidth - STAGE_PADDING) / templateWidth;
                    const scaleY = (parentHeight - STAGE_PADDING) / templateHeight;

                    const newScale = Math.min(scaleX, scaleY);
                    // Ensure a minimum scale for visibility
                    const finalScale = Math.max(0.1, newScale);

                    setStageSize({
                        // The Konva stage size is the template size scaled up/down by the factor
                        width: templateWidth,
                        height: templateHeight,
                        scale: finalScale,
                    });
                });
            };

            const debouncedUpdate = () => {
                updateScale();
                // Also trigger after sidebar transition completes (500ms + 50ms buffer)
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                timeoutId = window.setTimeout(updateScale, 550);
            };

            // Initial run
            updateScale();

            // Setup ResizeObserver to run when parent container size changes (window resize, sidebar toggle)
            const observer = new ResizeObserver(debouncedUpdate);
            observer.observe(container);

            // Cleanup
            return () => {
                if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                }
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                observer.unobserve(container);
            };
        }, [templateWidth, templateHeight, parentRef]);

        // NEW: Use controlled zoom and pan (or fallback to defaults)
        const zoom = externalZoom;
        const panOffset = externalPanOffset;
        const [isPanning, setIsPanning] = useState(false);
        const [isSpacePressed, setIsSpacePressed] = useState(false);

        // NEW: Selection rectangle state
        const [selectionRect, setSelectionRect] = useState<{
            x: number;
            y: number;
            width: number;
            height: number;
        } | null>(null);
        const [isSelecting, setIsSelecting] = useState(false);



        // Transformer Reference
        const trRef = useRef<Konva.Transformer>(null);
        const layerRef = useRef<Konva.Layer>(null);

        // Snapping lines state
        const [verticalLines, setVerticalLines] = useState<SnappingLine[]>([]);
        const [horizontalLines, setHorizontalLines] = useState<SnappingLine[]>([]);
        const [isSnapping, setIsSnapping] = useState(false);

        // --- Interaction Handlers ---

        // Update transformer when selection changes
        useEffect(() => {
            const stage = (ref as KonvaRef)?.current;
            if (!stage) return;

            const transformer = trRef.current;
            if (!transformer) return;

            // NEW: Handle multi-selection for transformer
            if (selectedNodeIndices.length > 0 && mode === 'FULL_EDIT') {
                const selectedNodes: Konva.Node[] = [];

                selectedNodeIndices.forEach(index => {
                    const nodeDef = layers[index];
                    if (nodeDef && !nodeDef.locked) {
                        const node = stage.findOne(`#${nodeDef.id}`);
                        if (node && node.getType() !== 'Stage' && node.getType() !== 'Layer') {
                            selectedNodes.push(node);
                        }
                    }
                });

                transformer.nodes(selectedNodes);
            } else {
                // Detach if no selection or in restricted mode
                transformer.nodes([]);
            }

            // Must redraw the layer to show/hide the transformer immediately
            layerRef.current?.batchDraw();

        }, [selectedNodeIndices, layers, mode, ref]);


        // Handle click outside of any node/transformer
        const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
            const domTarget = e.evt.target as HTMLElement | null;

            // FIX LAYER 1: Check if click came from property panel
            if (domTarget && domTarget.closest(".property-panel")) {
                return;
            }

            // FIX LAYER 3: Check if click is on the actual canvas
            // Konva listens on the container, but we only want to process clicks on the canvas element itself
            if (!(domTarget instanceof HTMLCanvasElement)) {
                return;
            }

            // If we clicked on an already selected element, do nothing.
            // If we clicked on the canvas background itself:
            if (e.target === e.target.getStage() || e.target.name() === 'background-layer-rect') {
                onDeselectNode();
                return;
            }

            // If we clicked on a non-draggable/non-listening shape (e.g., the background rect)
            // this should be handled by the check above, but as a fallback:
            const ancestors = e.target.getAncestors();
            // Handle both Collection (array-like) and Array returns
            const ancestorsArray = Array.isArray(ancestors) ? ancestors : (ancestors as any).toArray?.() || Array.from(ancestors as any);

            if (e.target.attrs.name === 'background-layer-rect' || ancestorsArray.some((n: any) => n.name() === 'background-layer-rect')) {
                onDeselectNode();
                return;
            }

            // NEW: Multi-select logic with Ctrl+Click
            const clickedGroup = e.target.findAncestor('Group', true);
            const clickedId = clickedGroup?.id();

            if (clickedId) {
                const index = layers.findIndex(node => node.id === clickedId);
                if (index !== -1) {
                    const isCtrlPressed = e.evt.ctrlKey || e.evt.metaKey;

                    if (isCtrlPressed) {
                        // Toggle selection
                        if (selectedNodeIndices.includes(index)) {
                            onSelectNodes(selectedNodeIndices.filter(i => i !== index));
                        } else {
                            onSelectNodes([...selectedNodeIndices, index]);
                        }
                    } else {
                        // Single select
                        onSelectNodes([index]);
                    }
                    return;
                }
            }

            // Deselect if selection logic failed for any reason
            onDeselectNode();

        }, [layers, selectedNodeIndices, onSelectNodes, onDeselectNode]);


        // Handle drag movement of a node
        const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>, index: number) => {
            if (mode === 'DATA_ONLY' || layers[index].locked) return;

            const node = e.target;
            const stage = node.getStage();
            if (!stage) return;

            // 1. Snapping Logic
            // Get all potential snapping lines
            const allSnappingLines = getSnappingLines(
                layers, // Pass all layers (KonvaNodeDefinition[])
                index,  // Index of dragged node
                templateWidth,
                templateHeight
            );

            const { x: newX, y: newY, snappingLines } = getSnapAndAlignLines(
                {
                    ...layers[index].props,
                    x: node.x(),
                    y: node.y(),
                    width: node.width() * node.scaleX(),
                    height: node.height() * node.scaleY(),
                    rotation: node.rotation()
                } as KonvaNodeProps,
                allSnappingLines
            );

            // Update stage state for rendering the snapping guides
            setVerticalLines(snappingLines.filter(l => l.guideType === 'v'));
            setHorizontalLines(snappingLines.filter(l => l.guideType === 'h'));
            setIsSnapping(snappingLines.length > 0);

            // Apply snapping adjustments
            node.x(newX);
            node.y(newY);

            // Update props once drag is complete
            onNodeChange(index, {
                x: newX,
                y: newY,
                // Rotation/Scale are handled by transformer on dragend/transformend
            });

        }, [layers, onNodeChange, mode, stageSize.scale, templateWidth, templateHeight]); // Include stageSize.scale in dependency array


        // Update props after drag ends
        const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, index: number) => {
            if (mode === 'DATA_ONLY' || layers[index].locked) return;

            const node = e.target;
            onNodeChange(index, {
                x: node.x(),
                y: node.y(),
            });

            // Clear snapping lines
            setVerticalLines([]);
            setHorizontalLines([]);
            setIsSnapping(false);

        }, [layers, onNodeChange, mode]);


        // Update props after transformer ends
        const handleTransformEnd = useCallback((e: Konva.KonvaEventObject<Event>, index: number) => {
            if (mode === 'DATA_ONLY' || layers[index].locked) return;

            const group = e.target;
            const scaleX = group.scaleX();
            const scaleY = group.scaleY();

            // Read new dimensions/rotation from the transformed group
            const newWidth = group.width() * scaleX;
            const newHeight = group.height() * scaleY;
            const newRotation = group.rotation();

            // Apply scale of 1 back to the group and update the Konva props
            group.scaleX(1);
            group.scaleY(1);

            onNodeChange(index, {
                x: group.x(),
                y: group.y(),
                width: newWidth,
                height: newHeight,
                rotation: newRotation,
            });

        }, [onNodeChange, mode, layers]);


        // Handle double-click for text editing
        const handleDblClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, index: number) => {
            const selectedNodeDef = layers[index];
            if (selectedNodeDef && selectedNodeDef.type === 'Text' && mode === 'FULL_EDIT' && !selectedNodeDef.locked) {
                // Trigger the parent component to open the text editor UI
                // FIX: Pass the actual Konva node (Text) to the handler
                onStartEditing(e.target as Konva.Text);
            } else if (selectedNodeDef && selectedNodeDef.type === 'Image' && (selectedNodeDef.props as any).qrMetadata && onEditQRCode) {
                // NEW: Handle QR Code double click
                onEditQRCode();
            }
        }, [layers, mode, onStartEditing, onEditQRCode]);

        // NEW: Zoom with Ctrl+Scroll
        const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
            e.evt.preventDefault();

            if (e.evt.ctrlKey || e.evt.metaKey) {
                const scaleBy = 1.1;
                const stage = e.target.getStage();
                if (!stage) return;

                const oldZoom = zoom;
                const newZoom = e.evt.deltaY < 0 ? oldZoom * scaleBy : oldZoom / scaleBy;

                // Clamp zoom between 0.1 and 3.0
                const clampedZoom = Math.max(0.1, Math.min(3.0, newZoom));
                onZoomChange?.(clampedZoom);
            }
        }, [zoom, onZoomChange]);

        // NEW: Pan with Space+Drag
        const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
            if (isSpacePressed && e.evt.button === 0) {
                setIsPanning(true);
                e.evt.preventDefault();
            } else if (!isSpacePressed && e.evt.button === 0 && mode === 'FULL_EDIT') {
                // Start selection rectangle if clicking on stage background
                const stage = e.target.getStage();
                if (!stage) return;

                if (e.target === stage || e.target.name() === 'background-layer-rect') {
                    const pos = stage.getPointerPosition();
                    if (pos) {
                        setIsSelecting(true);
                        setSelectionRect({
                            x: (pos.x - panOffset.x) / (stageSize.scale * zoom),
                            y: (pos.y - panOffset.y) / (stageSize.scale * zoom),
                            width: 0,
                            height: 0,
                        });
                    }
                }
            }
        }, [isSpacePressed, mode, panOffset, stageSize.scale, zoom]);

        const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
            const stage = e.target.getStage();
            if (!stage) return;

            if (isPanning) {
                const dx = e.evt.movementX;
                const dy = e.evt.movementY;
                onPanChange?.({ x: panOffset.x + dx, y: panOffset.y + dy });
            } else if (isSelecting && selectionRect) {
                const pos = stage.getPointerPosition();
                if (pos) {
                    setSelectionRect(prev => prev ? {
                        ...prev,
                        width: (pos.x - panOffset.x) / (stageSize.scale * zoom) - prev.x,
                        height: (pos.y - panOffset.y) / (stageSize.scale * zoom) - prev.y,
                    } : null);
                }
            }
        }, [isPanning, isSelecting, selectionRect, panOffset, stageSize.scale, zoom, onPanChange]);

        const handleMouseUp = useCallback(() => {
            if (isPanning) {
                setIsPanning(false);
            } else if (isSelecting && selectionRect) {
                // Complete selection rectangle
                const normalized = normalizeRect(selectionRect);
                const selectedIndices = getNodesInRect(layers, normalized);

                if (selectedIndices.length > 0) {
                    onSelectNodes(selectedIndices);
                }

                setIsSelecting(false);
                setSelectionRect(null);
            }
        }, [isPanning, isSelecting, selectionRect, layers, onSelectNodes]);

        // NEW: Keyboard handlers for Space key
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.code === 'Space' && !isSpacePressed) {
                    setIsSpacePressed(true);
                    e.preventDefault();
                }
            };

            const handleKeyUp = (e: KeyboardEvent) => {
                if (e.code === 'Space') {
                    setIsSpacePressed(false);
                    setIsPanning(false);
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);

            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }, [isSpacePressed]);


        // --- Render ---

        // Konva requires that width/height are the unscaled dimensions of the content
        // The scaleX/scaleY props handle the visual zoom

        // Get first selected node for single-selection operations (like double-click editing)
        const selectedNodeDef = selectedNodeIndices.length === 1 ? layers[selectedNodeIndices[0]] : null;

        return (
            // Wrapper div is not strictly necessary but can help for styling/debug
            <div
                style={{
                    // Set the size of the container to the scaled size of the card (with zoom applied)
                    width: templateWidth * stageSize.scale * zoom,
                    height: templateHeight * stageSize.scale * zoom,
                    // Optional: add a subtle shadow for a card-like effect
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    cursor: isSpacePressed ? (isPanning ? 'grabbing' : 'grab') : 'default',
                }}
                className="bg-white rounded-lg overflow-hidden transition-all duration-500 ease-in-out"
            >
                <Stage
                    ref={ref}
                    // Set Konva stage dimensions to the TEMPLATE dimensions
                    width={templateWidth}
                    height={templateHeight}
                    // CRITICAL: Apply the calculated scale factor combined with zoom
                    scaleX={stageSize.scale * zoom}
                    scaleY={stageSize.scale * zoom}
                    // Apply pan offset
                    x={panOffset.x}
                    y={panOffset.y}
                    // Events
                    onClick={handleStageClick}
                    onTap={handleStageClick} // Handle mobile touch events
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    {/* 1. BACKGROUND LAYER (Fixed Size, Unscaled Content) */}
                    <Layer name="background-layer">
                        <BackgroundRenderer
                            template={template}
                            background={template.background}
                        />

                        {/* Render bleed/safe margins if necessary (optional) */}
                        <Rect
                            x={BLEED_MARGIN} y={BLEED_MARGIN}
                            width={templateWidth - BLEED_MARGIN * 2}
                            height={templateHeight - BLEED_MARGIN * 2}
                            stroke="rgba(0, 0, 0, 0.1)"
                            strokeWidth={1}
                            dash={[5, 5]}
                            listening={false}
                        />

                    </Layer>

                    {/* 2. CONTENT LAYER (All layers/nodes) */}
                    <Layer ref={layerRef} name="content-layer">
                        {layers.map((nodeDef, index) => (
                            <KonvaNodeRenderer
                                key={nodeDef.id}
                                index={index}
                                node={nodeDef}
                                isSelected={selectedNodeIndices.includes(index)}
                                isLocked={nodeDef.locked}
                                isLayoutDisabled={mode === 'DATA_ONLY'} // Fix: map mode to isLayoutDisabled

                                // Event handlers
                                onSelect={() => onSelectNodes([index])}
                                onNodeChange={(idx, updates) => onNodeChange(idx, updates)} // Fix: onNodeChange signature match
                                onStartEditing={onStartEditing}

                                onDragStart={() => { }} // Optional?
                                onDragMove={(e) => handleDragMove(e, index)}
                                onDragEnd={(e) => handleDragEnd(e, index)}
                            // onTransformEnd is handled via KonvaNodeRenderer props? 
                            // KonvaNodeRenderer has its own onTransformEnd handling that calls onNodeChange.
                            // So we don't need to pass handleTransformEnd explicitly to it if it handles it internally.
                            // But we need to pass onNodeChange which we did.
                            />
                        ))}

                        {/* Transformer - Visible for single or multi-selection in full edit mode */}
                        {selectedNodeIndices.length > 0 && (() => {
                            // Check if any selected nodes are unlocked and transformable
                            const hasTransformableNodes = selectedNodeIndices.some(index => {
                                const nodeDef = layers[index];
                                return nodeDef && !nodeDef.locked && nodeDef.type !== 'Line' && nodeDef.type !== 'Arrow';
                            });

                            // For multi-selection, check if all selected nodes have same type for keepRatio
                            const isMultiSelection = selectedNodeIndices.length > 1;
                            const shouldKeepRatio = isMultiSelection ? false : (
                                selectedNodeDef?.type === 'Icon' ||
                                (selectedNodeDef?.type === 'Image' && !!(selectedNodeDef.props as any).qrMetadata)
                            );

                            return (
                                <Transformer
                                    ref={trRef}
                                    rotationSnaps={[0, 90, 180, 270]}
                                    anchorSize={10}
                                    // Enhanced visual styling for multi-selection
                                    borderStrokeWidth={isMultiSelection ? 2 : 1}
                                    borderStroke={isMultiSelection ? '#3B82F6' : '#4F46E5'} // Blue-500 for multi, Indigo-600 for single
                                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                                    padding={5}
                                    // Show transformer if in FULL_EDIT mode and has transformable nodes
                                    visible={!!(mode === 'FULL_EDIT' && hasTransformableNodes)}
                                    ignoreStroke={false}
                                    flipEnabled={false}
                                    // CRITICAL: Enable keepRatio for Icon nodes and QR Codes to maintain aspect ratio
                                    keepRatio={shouldKeepRatio}

                                    // ADDED bounding box check for minimum size and template bounds
                                    boundBoxFunc={(oldBox, newBox) => {
                                        // Prevent scaling down too small
                                        if (newBox.width * stageSize.scale < 10 || newBox.height * stageSize.scale < 10) { // check scaled minimum size
                                            return oldBox;
                                        }

                                        const templateMaxX = template.width;
                                        const templateMaxY = template.height;

                                        // Clamping logic (relative to the Group)
                                        let x = Math.max(0, newBox.x);
                                        let y = Math.max(0, newBox.y);

                                        // Clamp max X/Y position
                                        if (x + newBox.width > templateMaxX) {
                                            x = templateMaxX - newBox.width;
                                        }
                                        if (y + newBox.height > templateMaxY) {
                                            y = templateMaxY - newBox.height;
                                        }

                                        return { x, y, width: newBox.width, height: newBox.height, rotation: newBox.rotation };
                                    }}
                                />
                            );
                        })()}


                    </Layer>

                    {/* 3. ALIGNMENT/SNAPPING LINES LAYER */}
                    <Layer name="snapping-layer" listening={false} visible={isSnapping}>
                        {verticalLines.map((line, i) => (
                            <Rect
                                key={`v-${i}`}
                                x={line.lineCoord - 0.5} // Line should be 1px wide, center on the value
                                y={0}
                                width={1}
                                height={templateHeight}
                                fill={line.strokeColor || "#4F46E5"} // Indigo-600
                                opacity={0.7}
                            />
                        ))}
                        {horizontalLines.map((line, i) => (
                            <Rect
                                key={`h-${i}`}
                                x={0}
                                y={line.lineCoord - 0.5} // Line should be 1px wide, center on the value
                                width={templateWidth}
                                height={1}
                                fill={line.strokeColor || "#4F46E5"} // Indigo-600
                                opacity={0.7}
                            />
                        ))}
                    </Layer>

                    {/* 4. SELECTION RECTANGLE LAYER */}
                    {selectionRect && isSelecting && (
                        <Layer name="selection-layer" listening={false}>
                            <Rect
                                x={selectionRect.x}
                                y={selectionRect.y}
                                width={selectionRect.width}
                                height={selectionRect.height}
                                fill="rgba(59, 130, 246, 0.2)" // Blue-500 with 20% opacity
                                stroke="#3B82F6" // Blue-500
                                strokeWidth={1 / (stageSize.scale * zoom)} // Keep stroke width consistent at all zoom levels
                            />
                        </Layer>
                    )}
                </Stage>
            </div>
        );
    });

CanvasStage.displayName = "CanvasStage";
export default CanvasStage;



