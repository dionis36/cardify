"use client";

import { useCallback, useEffect, useRef, useReducer, useState } from "react";
import { useParams } from "next/navigation";
import Konva from "konva";
import { produce } from "immer";

// Components
import CanvasStage from "@/components/editor/CanvasStage";
import EditorSidebar, { SidebarTab } from "@/components/editor/EditorSidebar";
import EditorTopbar from "@/components/editor/EditorTopbar";
import PropertyPanel from "@/components/editor/PropertyPanel";
import ZoomControls from "@/components/editor/ZoomControls";

// Types/Libs
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps, BackgroundPattern, BackgroundType, LayerGroup } from "@/types/template";
import { Logo } from "@/types/logo";
import { loadTemplate } from "@/lib/templates";
import { downloadPNG, downloadPDF } from "@/lib/pdf";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";

// Define the editor modes
type EditorMode = "FULL_EDIT" | "DATA_ONLY";

const DEFAULT_BACKGROUND: BackgroundPattern = {
    type: 'solid',
    color1: '#F3F4F6', // A light gray default
    color2: '#000000',
    opacity: 1,
    rotation: 0,
    scale: 1,
    patternImageURL: '',
    gradientType: 'linear',
    gradientStops: [],
    overlayColor: '#000000',
};

// --- State/Reducer logic ---
type State = {
    pages: CardTemplate[];
    current: number;
    history: State[];
    future: State[];
};

// Initial state function using the loaded template
function getInitialState(template: CardTemplate): State {
    // Initialize the background state if the template doesn't provide one
    const initialTemplate: CardTemplate = {
        ...template,
        // Ensure background is initialized with default if missing
        background: template.background || DEFAULT_BACKGROUND,
    };

    return {
        pages: [initialTemplate],
        current: 0,
        history: [],
        future: [],
    };
}

// Reducer actions
type Action =
    | { type: 'SET_PAGES', pages: CardTemplate[] }
    | { type: 'CHANGE_NODE', index: number, updates: Partial<KonvaNodeProps> }
    | { type: 'CHANGE_NODE_DEFINITION', index: number, updates: Partial<KonvaNodeDefinition> }
    | { type: 'SET_SELECTED_INDEX', index: number | null }
    | { type: 'ADD_NODE', node: KonvaNodeDefinition }
    | { type: 'REMOVE_NODE', index: number }
    | { type: 'MOVE_NODE', from: number, to: number }
    | { type: 'CHANGE_MODE', mode: EditorMode }
    | { type: 'ADD_PAGE', template: CardTemplate }
    | { type: 'REMOVE_PAGE', index: number }
    | { type: 'GOTO_PAGE', index: number }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    // Background actions
    | { type: 'CHANGE_BACKGROUND', updates: Partial<BackgroundPattern> }
    // NEW: Group actions
    | { type: 'CREATE_GROUP', group: LayerGroup, layerIndices: number[] }
    | { type: 'DELETE_GROUP', groupId: string }
    | { type: 'CHANGE_GROUP', groupId: string, updates: Partial<LayerGroup> }
    | { type: 'ADD_LAYERS_TO_GROUP', groupId: string, layerIndices: number[] };

// The core reducer logic
function reducer(state: State, action: Action): State {
    const pages = state.pages;
    const current = state.current;

    const newPages = produce(pages, (draft) => {
        const currentPage = draft[current];
        if (!currentPage) return; // Should not happen

        switch (action.type) {
            case 'SET_PAGES':
                return action.pages;

            case 'CHANGE_NODE':
                const nodeToUpdate = currentPage.layers[action.index];
                if (nodeToUpdate) {
                    nodeToUpdate.props = { ...nodeToUpdate.props, ...action.updates } as KonvaNodeProps;
                }
                break;

            case 'CHANGE_NODE_DEFINITION':
                const defToUpdate = currentPage.layers[action.index];
                if (defToUpdate) {
                    Object.assign(defToUpdate, action.updates);
                }
                break;

            case 'ADD_NODE':
                currentPage.layers.push(action.node);
                break;

            case 'REMOVE_NODE':
                currentPage.layers.splice(action.index, 1);
                break;

            case 'MOVE_NODE':
                const [removed] = currentPage.layers.splice(action.from, 1);
                currentPage.layers.splice(action.to, 0, removed);
                break;

            case 'ADD_PAGE':
                draft.push(action.template);
                state.current = draft.length - 1; // Auto-switch to new page
                break;

            case 'REMOVE_PAGE':
                if (draft.length > 1) {
                    draft.splice(action.index, 1);
                    if (state.current >= draft.length) {
                        state.current = draft.length - 1;
                    }
                }
                break;

            // NEW: Background Change Handler
            case 'CHANGE_BACKGROUND':
                currentPage.background = {
                    ...currentPage.background,
                    ...action.updates
                };
                break;

            // NEW: Group Handlers
            case 'CREATE_GROUP':
                if (!currentPage.groups) {
                    currentPage.groups = [];
                }
                currentPage.groups.push(action.group);
                // Assign layers to the group
                action.layerIndices.forEach(index => {
                    if (currentPage.layers[index]) {
                        currentPage.layers[index].groupId = action.group.id;
                    }
                });
                break;

            case 'DELETE_GROUP':
                if (currentPage.groups) {
                    currentPage.groups = currentPage.groups.filter(g => g.id !== action.groupId);
                }
                // Unassign layers from the group
                currentPage.layers.forEach(layer => {
                    if (layer.groupId === action.groupId) {
                        layer.groupId = undefined;
                    }
                });
                break;

            case 'CHANGE_GROUP':
                if (currentPage.groups) {
                    const groupIndex = currentPage.groups.findIndex(g => g.id === action.groupId);
                    if (groupIndex !== -1) {
                        Object.assign(currentPage.groups[groupIndex], action.updates);
                    }
                }
                break;

            case 'ADD_LAYERS_TO_GROUP':
                action.layerIndices.forEach(index => {
                    if (currentPage.layers[index]) {
                        currentPage.layers[index].groupId = action.groupId;
                    }
                });
                break;

            // Other cases that don't change pages or are handled separately (like SET_SELECTED_INDEX)
            case 'SET_SELECTED_INDEX':
            case 'CHANGE_MODE':
            case 'GOTO_PAGE':
                // Do not produce a new state in immer for these, they are handled outside
                return;
        }
    });

    // Handle history, current page index, and mode changes outside the immer producer
    switch (action.type) {
        case 'SET_SELECTED_INDEX':
            return { ...state }; // selectedIndex logic moved to component state
        case 'CHANGE_MODE':
            return { ...state }; // mode logic moved to component state
        case 'GOTO_PAGE':
            return { ...state, current: action.index };
        case 'UNDO':
            if (state.history.length === 0) return state;
            const previous = state.history[state.history.length - 1];
            const newHistory = state.history.slice(0, -1);
            return {
                ...previous,
                history: newHistory,
                future: [state, ...state.future],
            };
        case 'REDO':
            if (state.future.length === 0) return state;
            const next = state.future[0];
            const newFuture = state.future.slice(1);
            return {
                ...next,
                history: [...state.history, state],
                future: newFuture,
            };
        default:
            // For actions that changed pages (like CHANGE_NODE, ADD_NODE, CHANGE_BACKGROUND, etc.)
            if (newPages !== pages) {
                return {
                    pages: newPages,
                    current: state.current,
                    history: [...state.history, { ...state, pages: pages }], // Save current pages before update
                    future: [], // Clear future on new action
                };
            }
            return state;
    }
}


export default function Editor() {
    const params = useParams();
    const templateId = Array.isArray(params.templateId) ? params.templateId[0] : params.templateId;
    const stageRef = useRef<Konva.Stage | null>(null);
    const mainRef = useRef<HTMLElement>(null);

    // Hardcode mode for now
    const mode: EditorMode = "FULL_EDIT";

    // --- State Management ---
    const [state, dispatch] = useReducer(reducer, null, () => getInitialState(loadTemplate(templateId)));
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]); // CHANGED: Multi-select
    const [activeTab, setActiveTab] = useState<SidebarTab | null>("layers"); // NEW: Lifted state
    const [zoom, setZoom] = useState(1); // NEW: Zoom state
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 }); // NEW: Pan state
    const [clipboard, setClipboard] = useState<KonvaNodeDefinition[]>([]); // NEW: Clipboard for copy/paste
    const currentPage = state.pages[state.current];

    const selectedNode = selectedIndices.length === 1 ? currentPage.layers[selectedIndices[0]] : null;
    const selectedNodes = selectedIndices.map(i => currentPage.layers[i]).filter(Boolean);

    // --- CORE HANDLERS ---

    const onNodeChange = useCallback((index: number, updates: Partial<KonvaNodeProps>) => {
        dispatch({ type: 'CHANGE_NODE', index, updates });
    }, [dispatch]);

    const onNodeDefinitionChange = useCallback((index: number, updates: Partial<KonvaNodeDefinition>) => {
        dispatch({ type: 'CHANGE_NODE_DEFINITION', index, updates });
    }, [dispatch]);

    // NEW HANDLER: Background Change
    const onBackgroundChange = useCallback((updates: Partial<BackgroundPattern>) => {
        dispatch({ type: 'CHANGE_BACKGROUND', updates });
    }, [dispatch]);

    // --- LAYER ORDERING HANDLERS ---

    const moveLayer = useCallback((from: number, to: number) => {
        dispatch({ type: 'MOVE_NODE', from, to });
        setSelectedIndices([to]); // Keep the item selected
    }, [dispatch]);

    const moveLayerUp = useCallback(() => {
        const selectedIndex = selectedIndices[0];
        if (selectedIndices.length !== 1 || selectedIndex === currentPage.layers.length - 1) return;
        moveLayer(selectedIndex, selectedIndex + 1);
    }, [selectedIndices, currentPage.layers.length, moveLayer]);

    const moveLayerDown = useCallback(() => {
        const selectedIndex = selectedIndices[0];
        if (selectedIndices.length !== 1 || selectedIndex === 0) return;
        moveLayer(selectedIndex, selectedIndex - 1);
    }, [selectedIndices, moveLayer]);

    const moveLayerToFront = useCallback(() => {
        const selectedIndex = selectedIndices[0];
        if (selectedIndices.length !== 1 || selectedIndex === currentPage.layers.length - 1) return;
        moveLayer(selectedIndex, currentPage.layers.length - 1);
    }, [selectedIndices, currentPage.layers.length, moveLayer]);

    const moveLayerToBack = useCallback(() => {
        const selectedIndex = selectedIndices[0];
        if (selectedIndices.length !== 1 || selectedIndex === 0) return;
        moveLayer(selectedIndex, 0);
    }, [selectedIndices, moveLayer]);

    const onRemoveLayer = useCallback(() => {
        if (selectedIndices.length === 0) return;
        // Remove all selected layers (in reverse order to maintain indices)
        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
        sortedIndices.forEach(index => {
            dispatch({ type: 'REMOVE_NODE', index });
        });
        setSelectedIndices([]);
    }, [selectedIndices, dispatch]);

    const onSelectLayer = useCallback((index: number | null) => {
        setSelectedIndices(index !== null ? [index] : []);
    }, []);

    // --- PAGE CONTROLS ---

    const addPage = useCallback(() => {
        const newPage: CardTemplate = {
            ...loadTemplate(templateId),
            name: `Page ${state.pages.length + 1}`,
            layers: [], // Start with an empty layer list
            background: DEFAULT_BACKGROUND, // Ensure new page gets a default background
        };
        dispatch({ type: 'ADD_PAGE', template: newPage });
        setSelectedIndices([]);
    }, [dispatch, state.pages.length, templateId]);

    const removePage = useCallback(() => {
        if (state.pages.length > 1) {
            dispatch({ type: 'REMOVE_PAGE', index: state.current });
            setSelectedIndices([]);
        }
    }, [dispatch, state.pages.length, state.current]);

    const gotoPage = useCallback((index: number) => {
        dispatch({ type: 'GOTO_PAGE', index });
        setSelectedIndices([]);
    }, [dispatch]);


    // --- GROUP HANDLERS ---

    const onCreateGroup = useCallback((name: string, layerIndices: number[]) => {
        const newGroup: LayerGroup = {
            id: `group_${Date.now()}`,
            name,
            expanded: true,
            visible: true,
            locked: false,
        };
        dispatch({ type: 'CREATE_GROUP', group: newGroup, layerIndices });
    }, [dispatch]);

    const onDeleteGroup = useCallback((groupId: string) => {
        dispatch({ type: 'DELETE_GROUP', groupId });
    }, [dispatch]);

    const onGroupChange = useCallback((groupId: string, updates: Partial<LayerGroup>) => {
        dispatch({ type: 'CHANGE_GROUP', groupId, updates });
    }, [dispatch]);


    // --- KEYBOARD SHORTCUT HANDLERS ---

    // Copy selected elements
    const handleCopy = useCallback(() => {
        if (selectedIndices.length === 0) return;
        const copiedNodes = selectedIndices.map(i => currentPage.layers[i]).filter(Boolean);
        setClipboard(copiedNodes);
    }, [selectedIndices, currentPage.layers]);

    // Paste copied elements
    const handlePaste = useCallback(() => {
        if (clipboard.length === 0) return;

        clipboard.forEach(node => {
            const newNode: KonvaNodeDefinition = {
                ...node,
                id: `${node.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                props: {
                    ...node.props,
                    x: node.props.x + 20, // Offset pasted elements
                    y: node.props.y + 20,
                },
            } as KonvaNodeDefinition;
            dispatch({ type: 'ADD_NODE', node: newNode });
        });

        // Select the newly pasted elements
        const newIndices = Array.from(
            { length: clipboard.length },
            (_, i) => currentPage.layers.length + i
        );
        setSelectedIndices(newIndices);
    }, [clipboard, dispatch, currentPage.layers.length]);

    // Duplicate selected elements
    const handleDuplicate = useCallback(() => {
        if (selectedIndices.length === 0) return;

        const nodesToDuplicate = selectedIndices.map(i => currentPage.layers[i]).filter(Boolean);
        const newIndices: number[] = [];

        nodesToDuplicate.forEach(node => {
            const newNode: KonvaNodeDefinition = {
                ...node,
                id: `${node.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                props: {
                    ...node.props,
                    x: node.props.x + 20,
                    y: node.props.y + 20,
                },
            } as KonvaNodeDefinition;
            dispatch({ type: 'ADD_NODE', node: newNode });
            newIndices.push(currentPage.layers.length + newIndices.length);
        });

        setSelectedIndices(newIndices);
    }, [selectedIndices, currentPage.layers, dispatch]);

    // Delete selected elements
    const handleDelete = useCallback(() => {
        if (selectedIndices.length === 0) return;

        // Sort in descending order to maintain correct indices during deletion
        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
        sortedIndices.forEach(index => {
            dispatch({ type: 'REMOVE_NODE', index });
        });
        setSelectedIndices([]);
    }, [selectedIndices, dispatch]);

    // Select all elements
    const handleSelectAll = useCallback(() => {
        setSelectedIndices(currentPage.layers.map((_, i) => i));
    }, [currentPage.layers]);

    // Deselect all
    const handleDeselect = useCallback(() => {
        setSelectedIndices([]);
    }, []);

    // Nudge elements
    const handleNudge = useCallback((direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
        if (selectedIndices.length === 0) return;

        selectedIndices.forEach(index => {
            const node = currentPage.layers[index];
            if (!node || node.locked) return;

            const updates: Partial<KonvaNodeProps> = {};
            switch (direction) {
                case 'up':
                    updates.y = node.props.y - amount;
                    break;
                case 'down':
                    updates.y = node.props.y + amount;
                    break;
                case 'left':
                    updates.x = node.props.x - amount;
                    break;
                case 'right':
                    updates.x = node.props.x + amount;
                    break;
            }

            onNodeChange(index, updates);
        });
    }, [selectedIndices, currentPage.layers, onNodeChange]);

    // Toggle lock on selected elements
    const handleToggleLock = useCallback(() => {
        if (selectedIndices.length === 0) return;

        // If any selected element is unlocked, lock all. Otherwise, unlock all.
        const anyUnlocked = selectedIndices.some(i => !currentPage.layers[i]?.locked);

        selectedIndices.forEach(index => {
            onNodeDefinitionChange(index, { locked: anyUnlocked });
        });
    }, [selectedIndices, currentPage.layers, onNodeDefinitionChange]);

    // Layer arrangement handlers
    const handleBringForward = useCallback(() => {
        if (selectedIndices.length !== 1) return;
        const index = selectedIndices[0];
        if (index === currentPage.layers.length - 1) return;
        moveLayer(index, index + 1);
    }, [selectedIndices, currentPage.layers.length, moveLayer]);

    const handleSendBackward = useCallback(() => {
        if (selectedIndices.length !== 1) return;
        const index = selectedIndices[0];
        if (index === 0) return;
        moveLayer(index, index - 1);
    }, [selectedIndices, moveLayer]);

    const handleBringToFront = useCallback(() => {
        if (selectedIndices.length !== 1) return;
        const index = selectedIndices[0];
        if (index === currentPage.layers.length - 1) return;
        moveLayer(index, currentPage.layers.length - 1);
    }, [selectedIndices, currentPage.layers.length, moveLayer]);

    const handleSendToBack = useCallback(() => {
        if (selectedIndices.length !== 1) return;
        const index = selectedIndices[0];
        if (index === 0) return;
        moveLayer(index, 0);
    }, [selectedIndices, moveLayer]);

    // Group/Ungroup via keyboard
    const handleGroupShortcut = useCallback(() => {
        if (selectedIndices.length < 2) return;
        const groupName = `Group ${(currentPage.groups?.length || 0) + 1}`;
        onCreateGroup(groupName, selectedIndices);
    }, [selectedIndices, currentPage.groups, onCreateGroup]);

    const handleUngroupShortcut = useCallback(() => {
        if (selectedIndices.length !== 1) return;
        const node = currentPage.layers[selectedIndices[0]];
        if (node?.groupId) {
            onDeleteGroup(node.groupId);
        }
    }, [selectedIndices, currentPage.layers, onDeleteGroup]);

    // Integrate keyboard shortcuts
    useKeyboardShortcuts({
        onUndo: () => dispatch({ type: 'UNDO' }),
        onRedo: () => dispatch({ type: 'REDO' }),
        onCopy: handleCopy,
        onPaste: handlePaste,
        onDuplicate: handleDuplicate,
        onDelete: handleDelete,
        onSelectAll: handleSelectAll,
        onDeselect: handleDeselect,
        onNudge: handleNudge,
        onToggleLock: handleToggleLock,
        onBringForward: handleBringForward,
        onSendBackward: handleSendBackward,
        onBringToFront: handleBringToFront,
        onSendToBack: handleSendToBack,
        onGroup: handleGroupShortcut,
        onUngroup: handleUngroupShortcut,
    }, mode === 'FULL_EDIT'); // Only enable shortcuts in full edit mode


    // --- ASSET & NODE ADDITION HANDLERS ---

    const onAddNode = useCallback((node: KonvaNodeDefinition) => {
        dispatch({ type: 'ADD_NODE', node });
        setSelectedIndices([currentPage.layers.length]); // Select the new node
    }, [dispatch, currentPage.layers.length]);

    // Placeholder for image upload
    const onAddImage = useCallback((file: File) => {
        // Implementation for converting File to Base64/URL and adding an Image node
        console.log("Image upload simulated for file:", file.name);
        // For now, let's add a placeholder image node
        const reader = new FileReader();
        reader.onload = (e) => {
            const timestamp = Date.now();
            const id = `image_${timestamp}`;
            const newImageLayer: KonvaNodeDefinition = {
                id,
                type: 'Image',
                props: {
                    id,
                    x: 50, y: 50,
                    width: 150, height: 100,
                    rotation: 0, opacity: 1,
                    src: e.target?.result as string, // Base64 data URL
                    category: 'Image',
                },
                editable: true,
                locked: false,
            };
            onAddNode(newImageLayer);
        };
        reader.readAsDataURL(file);

    }, [onAddNode]);


    // --- SIDE EFFECTS ---

    // REMOVED: Redundant Transformer logic. CanvasStage handles this internally.
    /* 
    useEffect(() => {
        const transformer = stageRef.current?.findOne('Transformer') as Konva.Transformer;
        if (transformer) {
            // ...
        }
    }, [selectedNode, stageRef]); 
    */

    // Cleanup selection on page change
    // CRITICAL FIX: Only clear selection if the Page ID changes (switching pages).
    // Previously, this ran on every 'currentPage' update (every edit), causing deselection.
    useEffect(() => {
        setSelectedIndices([]);
    }, [currentPage.id]);


    // Functionality for TextNode to communicate it wants to be edited (double click)
    const onStartEditing = useCallback((konvaNode: Konva.Text) => {
        // This is where we would typically show a custom TextEditor overlay.
        // For now, just log the intent.
        console.log("Start editing text node:", konvaNode.id());
    }, []);

    // NEW: Handle QR Code Edit Request
    const onEditQRCode = useCallback(() => {
        setActiveTab('qrcode');
    }, []);

    // NEW: Zoom control handlers
    const handleZoomIn = useCallback(() => {
        setZoom(prev => Math.min(3.0, prev * 1.2));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => Math.max(0.1, prev / 1.2));
    }, []);

    const handleZoomReset = useCallback(() => {
        setZoom(1);
    }, []);

    const handleFitToScreen = useCallback(() => {
        // This will be handled by the responsive scaling in CanvasStage
        // Reset zoom to 1 to show the fit-to-screen view
        setZoom(1);
    }, []);


    // --- OUTPUT / EXPORT HANDLERS ---

    const handleDownload = useCallback((format: 'PNG' | 'PDF') => {
        if (!stageRef.current) return;
        const stage = stageRef.current;

        // Hide Transformer before export
        const transformer = stage.findOne('Transformer');
        transformer?.visible(false);

        try {
            if (format === 'PNG') {
                downloadPNG(stage, currentPage.name);
            } else if (format === 'PDF') {
                downloadPDF(stage as any, currentPage as any);
            }
        } catch (error) {
            console.error(`Error during ${format} export:`, error);
        } finally {
            // Restore visibility
            transformer?.visible(true);
            stage.batchDraw();
        }
    }, [currentPage]);

    // NEW: Handle Logo Selection
    const onSelectLogo = useCallback((logo: Logo) => {
        // 1. Find existing logo layer
        const logoLayerIndex = currentPage.layers.findIndex(
            layer => layer.id === 'logo_icon' || (layer.type === 'Icon' && (layer.props as any).iconName === 'Logo')
        );

        if (logoLayerIndex !== -1) {
            // Update existing logo
            const existingLogo = currentPage.layers[logoLayerIndex];
            onNodeChange(logoLayerIndex, {
                data: logo.path,
                // Preserve existing fill, or use default if needed
                // viewBox: logo.viewBox, // If Icon component supports viewBox prop
            });
            // Also update definition if needed (e.g. for metadata)
            onNodeDefinitionChange(logoLayerIndex, {
                props: {
                    ...existingLogo.props,
                    data: logo.path,
                    iconName: logo.name,
                    category: 'Icon', // Explicitly set category to satisfy type requirements
                    // Store original viewBox if needed for scaling logic
                }
            });
        } else {
            // Add new logo if none exists
            const newLogoNode: KonvaNodeDefinition = {
                id: 'logo_icon',
                type: 'Icon',
                props: {
                    id: 'logo_icon',
                    x: 100,
                    y: 100,
                    width: logo.defaultSize || 80,
                    height: logo.defaultSize || 80,
                    data: logo.path,
                    fill: '#000000', // Default color
                    rotation: 0,
                    opacity: 1,
                    iconName: logo.name,
                    category: 'Icon',
                },
                editable: true,
                locked: false,
            };
            onAddNode(newLogoNode);
        }
    }, [currentPage.layers, onNodeChange, onNodeDefinitionChange, onAddNode]);

    // --- RENDER ---
    return (
        <div className="flex h-screen w-screen bg-gray-900 overflow-hidden">
            <EditorTopbar
                templateName={currentPage.name}
                onDownload={handleDownload}
                onUndo={() => dispatch({ type: 'UNDO' })}
                onRedo={() => dispatch({ type: 'REDO' })}
                canUndo={state.history.length > 0}
                canRedo={state.future.length > 0}
                saving={false}
                onSave={() => { }}
                onBack={() => { }}
            />

            <div className="flex flex-1 pt-14 overflow-hidden">
                {/* A. LEFT SIDEBAR (Fixed Width - Layer/Element/Data/Page Controls) */}
                <EditorSidebar
                    // Element/Layer Management
                    layers={currentPage.layers}
                    selectedIndex={selectedIndices.length === 1 ? selectedIndices[0] : null}
                    onSelectLayer={onSelectLayer}
                    onMoveLayer={moveLayer}
                    onRemoveLayer={onRemoveLayer}
                    onDefinitionChange={onNodeDefinitionChange}
                    onAddNode={onAddNode}
                    onAddImage={onAddImage}

                    // Page Controls
                    addPage={addPage}
                    removePage={removePage}
                    pageCount={state.pages.length}
                    currentPage={state.current}
                    gotoPage={gotoPage}

                    // Mode
                    mode={mode}

                    // NEW PROPS FOR BACKGROUND
                    currentBackground={currentPage.background}
                    onBackgroundChange={onBackgroundChange}

                    // NEW: Logo Selection
                    onSelectLogo={onSelectLogo}

                    // NEW: Group Management
                    groups={currentPage.groups || []}
                    onGroupChange={onGroupChange}
                    onCreateGroup={onCreateGroup}
                    onDeleteGroup={onDeleteGroup}

                    // NEW: Tab Control
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                />

                {/* B. CANVAS AREA (Flex Grow) */}
                <main
                    ref={mainRef}
                    // FIX LAYER 2: Ensure canvas container stays below (z-0 relative)
                    className="relative z-0 flex-1 flex justify-center items-center overflow-auto p-8 bg-gray-200"
                >
                    <CanvasStage
                        ref={stageRef}
                        parentRef={mainRef}
                        template={currentPage}
                        selectedNodeIndices={selectedIndices}
                        onSelectNodes={(indices: number[]) => setSelectedIndices(indices)}
                        onDeselectNode={() => setSelectedIndices([])}
                        onNodeChange={onNodeChange}
                        onStartEditing={onStartEditing}
                        onEditQRCode={onEditQRCode} // Pass handler
                        zoom={zoom}
                        onZoomChange={setZoom}
                        panOffset={panOffset}
                        onPanChange={setPanOffset}
                        mode={mode}
                    />

                    {/* Zoom Controls */}
                    <ZoomControls
                        zoom={zoom}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomReset={handleZoomReset}
                        onFitToScreen={handleFitToScreen}
                    />
                </main>

                {/* C. RIGHT SIDEBAR (Fixed Width - Property Panel) */}
                {/* FIX LAYER 2: Ensure panel DOM stays above the canvas */}
                {/* FIX SCROLL: Add h-full and shrink-0 to ensuring it fits container and doesn't squash */}
                <div className="property-panel relative z-50 h-full shrink-0">
                    <PropertyPanel
                        node={selectedNode}

                        onPropChange={(updates: Partial<KonvaNodeProps>) =>
                            selectedIndices.length === 1 && onNodeChange(selectedIndices[0], updates)
                        }
                        onDefinitionChange={(updates: Partial<KonvaNodeDefinition>) =>
                            selectedIndices.length === 1 && onNodeDefinitionChange(selectedIndices[0], updates)
                        }
                        mode={mode}

                        // NEW PROPS for Layer Ordering
                        onMoveToFront={moveLayerToFront}
                        onMoveToBack={moveLayerToBack}
                        onMoveUp={moveLayerUp}
                        onMoveDown={moveLayerDown}
                    />
                </div>
            </div>
        </div>
    );
}




