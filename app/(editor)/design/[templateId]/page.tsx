"use client";

import { useCallback, useEffect, useRef, useReducer, useState } from "react";
import { useParams } from "next/navigation";
import Konva from "konva";
import { produce } from "immer";

// Components
import CanvasStage from "@/components/editor/CanvasStage";
import EditorSidebar, { SidebarTab } from "@/components/editor/EditorSidebar";
import EditorTopbar from "@/components/editor/EditorTopbar";
import MobileEditorTopbar from "@/components/editor/MobileEditorTopbar";
import MobileBottomToolbar from "@/components/editor/MobileBottomToolbar";
import PropertyPanel from "@/components/editor/PropertyPanel";
import LayerList from "@/components/editor/LayerList";
import { ShapeLibrary } from "@/components/editor/ShapeLibrary";
import IconLibrary from "@/components/editor/IconLibrary";
import LogoLibraryPanel from "@/components/editor/LogoLibraryPanel";
import ImageLibraryPanel from "@/components/editor/ImageLibraryPanel";
import BackgroundPanel from "@/components/editor/BackgroundPanel";
import QRCodeDesigner from "@/components/editor/QRCodeDesigner";
import ShortcutsReference from "@/components/editor/ShortcutsReference";
import ZoomControls from "@/components/editor/ZoomControls";

import ConfirmationModal from "@/components/ui/ConfirmationModal";
import ExportModal from "@/components/editor/ExportModal";


// Types/Libs
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps, BackgroundPattern, BackgroundType, LayerGroup, ExportOptions, TemplateExportMetadata, TemplateExportResponse } from "@/types/template";
import { LogoVariant } from "@/lib/logoIndex";
import { trackLogoUsage } from "@/lib/logoAssignments";
import { loadTemplate, prepareTemplateForExport } from "@/lib/templates";
import { exportWithOptions } from "@/lib/pdf";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import { renumberNodes, assignColorRoles } from "@/lib/exportUtils";

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
    | { type: 'ADD_LAYERS_TO_GROUP', groupId: string, layerIndices: number[] }
    | { type: 'RESET', template: CardTemplate };

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

            case 'RESET':
                return [action.template];

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
        case 'RESET':
            return {
                pages: [action.template],
                current: 0,
                history: [], // Clear history on reset
                future: [], // Clear future on reset
            };
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
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Export & Print State
    const [exportModalOpen, setExportModalOpen] = useState(false);

    // NEW: QR Code Mode State ('add' | 'update')
    const [qrCodeMode, setQrCodeMode] = useState<'add' | 'update'>('add');


    // Mobile panel state - MUST match desktop SidebarTab
    type MobilePanelType = 'layers' | 'elements' | 'icons' | 'logos' | 'images' | 'background' | 'qrcode' | 'settings' | 'properties' | null;
    const [activeMobilePanel, setActiveMobilePanel] = useState<MobilePanelType>(null);

    const selectedNode = selectedIndices.length === 1 ? currentPage.layers[selectedIndices[0]] : null;
    const selectedNodes = selectedIndices.map(i => currentPage.layers[i]).filter(Boolean);

    // Regenerate QR codes client-side when template loads (for variations with color roles)
    useEffect(() => {
        const regenerateQRCodes = async () => {
            // Only regenerate for variations (IDs with _gen_)
            if (!templateId.includes('_gen_')) return;

            // Process each layer
            for (let index = 0; index < currentPage.layers.length; index++) {
                const layer = currentPage.layers[index];

                // Check if this is a QR code with metadata
                if (layer.type === 'Image' && layer.props.qrMetadata) {
                    const qrMetadata = layer.props.qrMetadata;

                    try {
                        // Dynamically import react-qrcode-logo
                        const { QRCode } = await import('react-qrcode-logo');
                        const ReactDOM = await import('react-dom/client');
                        const React = await import('react');

                        // Create a temporary container
                        const container = document.createElement('div');
                        container.style.position = 'absolute';
                        container.style.left = '-9999px';
                        container.style.top = '-9999px';
                        document.body.appendChild(container);

                        // Create root and render QR code
                        const root = ReactDOM.createRoot(container);

                        // Render the QR code component
                        root.render(
                            React.createElement(QRCode, {
                                value: qrMetadata.value,
                                size: 400,
                                fgColor: qrMetadata.fgColor,
                                bgColor: qrMetadata.bgColor === 'transparent' ? '#FFFFFF00' : qrMetadata.bgColor,
                                qrStyle: qrMetadata.dotStyle || 'squares',
                                eyeRadius: (qrMetadata as any).eyeRadius || [0, 0, 0],
                                ecLevel: (qrMetadata as any).ecLevel || 'Q',
                                logoImage: (qrMetadata as any).logoSource || undefined,
                                id: 'temp-qr-code'
                            })
                        );

                        // Wait for render and extract canvas
                        await new Promise<void>((resolve) => {
                            setTimeout(() => {
                                const qrCanvas = container.querySelector('canvas');
                                if (qrCanvas) {
                                    const dataUrl = qrCanvas.toDataURL('image/png');
                                    dispatch({
                                        type: 'CHANGE_NODE_DEFINITION',
                                        index,
                                        updates: {
                                            props: {
                                                ...layer.props,
                                                src: dataUrl
                                            }
                                        }
                                    });
                                }

                                // Cleanup
                                root.unmount();
                                document.body.removeChild(container);
                                resolve();
                            }, 200); // Give it time to render
                        });

                    } catch (error) {
                        console.error('Failed to regenerate QR code:', error);
                    }
                }
            }
        };

        regenerateQRCodes();
    }, [templateId, currentPage.layers.length]); // Run when template or layer count changes


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

        // NEW: If adding a text node, auto-focus the property panel editor
        if (node.type === 'Text') {
            setShouldFocusTextEditor(true);
        }
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


    // NEW: State to trigger focus on the text editor in property panel
    const [shouldFocusTextEditor, setShouldFocusTextEditor] = useState(false);

    // Call back to reset the focus trigger once the PropertyPanel has handled it
    const onTextEditorFocusHandled = useCallback(() => {
        setShouldFocusTextEditor(false);
    }, []);

    // Functionality for TextNode to communicate it wants to be edited (double click)
    const onStartEditing = useCallback((konvaNode: Konva.Text) => {
        // Trigger focus on the property panel text editor
        setShouldFocusTextEditor(true);
    }, []);

    // NEW: Handle QR Code Edit Request
    const onEditQRCode = useCallback(() => {
        setQrCodeMode('update');
        setActiveTab('qrcode');
    }, []);

    // Wrapper for tab changing to reset QR mode to 'add' when manually opening tabs
    const handleTabChange = useCallback((tab: SidebarTab | null) => {
        if (tab === 'qrcode') {
            setQrCodeMode('add');
        }
        setActiveTab(tab);
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

    const handleReset = useCallback(() => {
        setShowResetConfirm(true);
    }, []);
    const confirmReset = useCallback(() => {
        const originalTemplate = loadTemplate(templateId);
        dispatch({ type: 'RESET', template: originalTemplate });
        setSelectedIndices([]);
        setShowResetConfirm(false);
    }, [templateId]);


    // --- OUTPUT / EXPORT HANDLERS ---

    // --- OUTPUT / EXPORT HANDLERS ---

    const handleOpenExportModal = useCallback(() => {
        setExportModalOpen(true);
    }, []);

    const handleCloseExportModal = useCallback(() => {
        setExportModalOpen(false);
    }, []);



    const handleExport = useCallback(async (options: ExportOptions) => {
        if (!stageRef.current) return;

        try {
            // Add template dimensions to options for accurate cropping
            const enhancedOptions = {
                ...options,
                templateWidth: currentPage.width,
                templateHeight: currentPage.height
            };

            await exportWithOptions(stageRef.current, enhancedOptions);
        } catch (error) {
            console.error("Export failed:", error);
        }
    }, [currentPage]);

    const handleExportAsTemplate = useCallback(async (
        metadata: TemplateExportMetadata,
        options?: { strictColorRoles: boolean; forceId?: string }
    ) => {
        try {
            // 1. Clone & Prepare
            const templateToProcess = JSON.parse(JSON.stringify(currentPage));

            // Override ID if forceId is provided (e.g. sequential ID from modal)
            if (options?.forceId) {
                templateToProcess.id = options.forceId;
            }

            // 2. Renumber Nodes
            templateToProcess.layers = renumberNodes(templateToProcess.layers);

            // 3. Assign Color Roles
            // Determine roles based on colors used, but DO NOT modify layers directly
            // The roles will be stored in the root 'colorRoles' property
            const roles = assignColorRoles(templateToProcess.layers, options?.strictColorRoles);

            // 4. Prepare Final JSON
            // Note: prepareTemplateForExport might regen ID, so we set it back after if needed
            const templateData = prepareTemplateForExport(templateToProcess, metadata);

            if (options?.forceId) {
                // Filename uses hyphen (template-30), but internal ID uses underscore (template_30)
                templateData.id = options.forceId.replace(/-/g, '_');
            }

            // Attach Top-Level Properties (as per Schema)
            templateData.colorRoles = roles;
            templateData.strictColorRoles = options?.strictColorRoles;

            // 5. Send to API
            const response = await fetch('/api/templates/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template: {
                        "$schema": "./schema.json",
                        ...templateData
                    },
                    metadata: metadata,
                    // Use forceId as filename if provided (e.g. template-29.json)
                    // Otherwise default to metadata name which might be "My Card"
                    filename: options?.forceId || metadata.name
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Export failed');
            }

            const result: TemplateExportResponse = await response.json();
            console.log('Template saved:', result);

        } catch (error) {
            console.error("Template export failed:", error);
            alert('Failed to save template');
            throw error;
        }
    }, [currentPage]);

    // Handle Logo Selection - ONLY changes the logo, NOT the theme
    const onSelectLogo = useCallback((logoVariant: LogoVariant) => {
        // Find existing logo layer (Image with isLogo=true, or legacy Icon)
        const logoLayerIndex = currentPage.layers.findIndex(
            layer => (layer.type === 'Image' && layer.props.isLogo) ||
                (layer.type === 'Icon' && (layer.props as any).iconName === 'Logo') ||
                layer.id === 'logo_icon' || layer.id === 'main_logo'
        );

        if (logoLayerIndex !== -1) {
            // Update existing logo - ONLY change the src, keep everything else
            const existingNode = currentPage.layers[logoLayerIndex];

            // If it's an Icon, convert to Image
            if (existingNode.type === 'Icon') {
                const newNodeDef: KonvaNodeDefinition = {
                    ...existingNode,
                    type: 'Image',
                    props: {
                        id: existingNode.props.id,
                        x: existingNode.props.x,
                        y: existingNode.props.y,
                        width: existingNode.props.width,
                        height: existingNode.props.height,
                        rotation: existingNode.props.rotation,
                        opacity: existingNode.props.opacity,
                        src: logoVariant.path,
                        category: 'Image',
                        isLogo: true,
                    } as any
                };
                onNodeDefinitionChange(logoLayerIndex, newNodeDef);
            } else {
                // Just update the src
                onNodeChange(logoLayerIndex, { src: logoVariant.path });
            }
        } else {
            // Add new logo
            const newLogoNode: KonvaNodeDefinition = {
                id: 'main_logo',
                type: 'Image',
                props: {
                    id: 'main_logo',
                    x: 100,
                    y: 100,
                    width: 150,
                    height: 150,
                    src: logoVariant.path,
                    rotation: 0,
                    opacity: 1,
                    category: 'Image',
                    isLogo: true,
                },
                editable: true,
                locked: false,
            };
            onAddNode(newLogoNode);
        }

        // Track logo usage for shuffle feature
        // Extract logo family ID from path: "/logos/LogoTaco_Logo-01/..." -> "logo_01"
        const pathParts = logoVariant.path.split('/');
        const logoFolderName = pathParts[2]; // "LogoTaco_Logo-01"
        const logoNumber = logoFolderName.split('-')[1]; // "01"
        const logoFamilyId = `logo_${logoNumber}`;
        trackLogoUsage(currentPage.id, logoFamilyId);
    }, [currentPage, onNodeChange, onNodeDefinitionChange, onAddNode]);

    // --- RENDER ---
    return (
        <div className="flex h-screen w-screen bg-gray-900 overflow-hidden">
            {/* Mobile Top Bar (only visible on mobile) */}
            <MobileEditorTopbar
                templateName={currentPage.name}
                onUndo={() => dispatch({ type: 'UNDO' })}
                onRedo={() => dispatch({ type: 'REDO' })}
                onExport={handleOpenExportModal}
                onReset={handleReset}
                canUndo={state.history.length > 0}
                canRedo={state.future.length > 0}
            />

            {/* Desktop Top Bar (hidden on mobile) */}
            <EditorTopbar
                templateName={currentPage.name}
                onDownload={handleOpenExportModal}
                onUndo={() => dispatch({ type: 'UNDO' })}
                onRedo={() => dispatch({ type: 'REDO' })}
                canUndo={state.history.length > 0}
                canRedo={state.future.length > 0}
                saving={false}
                onSave={() => { }}
                onBack={() => { }}
                onReset={handleReset}

            />

            <div className="flex flex-col lg:flex-row flex-1 pt-14 overflow-hidden">
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
                    onNodeChange={onNodeChange} // NEW: Pass onNodeChange for QR code updates

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
                    onTabChange={handleTabChange}

                    // NEW: QR Code Mode
                    qrCodeMode={qrCodeMode}
                />

                {/* B. CANVAS AREA (Flex Grow on desktop, Fixed height on mobile) */}
                <main
                    ref={mainRef}
                    // FIX LAYER 2: Ensure canvas container stays below (z-0 relative)
                    // Mobile: Fixed 35vh height, FULL WIDTH, minimal padding
                    // Desktop: flex-1 to take remaining space, normal padding
                    className="relative z-0 w-full h-[35vh] min-h-[250px] lg:h-auto lg:flex-1 flex justify-center items-center overflow-auto p-1 lg:p-8 bg-gray-200"
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
                        onEditQRCode={onEditQRCode}
                        onEditLogo={() => setActiveTab('logos')}
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

                {/* C. RIGHT SIDEBAR / MOBILE CONTENT AREA - Dynamic Container */}
                {/* Desktop: Shows PropertyPanel (fixed width, right side) */}
                {/* Mobile: Shows PropertyPanel OR mobile panel content (full width below canvas) */}
                <div className="property-panel relative z-50 h-full shrink-0">
                    {/* PropertyPanel - Desktop: always visible | Mobile: only when element selected AND no mobile panel active */}
                    {(!activeMobilePanel || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                        <PropertyPanel
                            node={selectedNode}

                            onPropChange={(_id: string, updates: Partial<KonvaNodeProps>) =>
                                selectedIndices.length === 1 && onNodeChange(selectedIndices[0], updates)
                            }
                            onDefinitionChange={(_id: string, updates: Partial<KonvaNodeDefinition>) =>
                                selectedIndices.length === 1 && onNodeDefinitionChange(selectedIndices[0], updates)
                            }

                            // NEW PROPS for Layer Ordering
                            onMoveToFront={moveLayerToFront}
                            onMoveToBack={moveLayerToBack}
                            onMoveUp={moveLayerUp}
                            onMoveDown={moveLayerDown}

                            // NEW: Allow deleting nodes from property panel
                            onDelete={handleDelete}
                            shouldFocus={shouldFocusTextEditor}
                            onFocusHandled={onTextEditorFocusHandled}
                        />
                    )}

                    {/* Mobile Content Panels - Only visible on mobile when toolbar button tapped */}
                    {activeMobilePanel && (
                        <div className="lg:hidden flex-1 overflow-y-auto bg-gray-50 border-t border-gray-200 min-h-0 h-full">
                            {/* Layers Panel */}
                            {activeMobilePanel === 'layers' && (
                                <div className="h-full overflow-y-auto bg-white pb-24">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                                        <h2 className="text-lg font-bold text-gray-900">Layers</h2>
                                        <button
                                            onClick={() => setActiveMobilePanel(null)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <LayerList
                                            layers={currentPage.layers}
                                            selectedIndex={selectedIndices.length === 1 ? selectedIndices[0] : null}
                                            onSelectLayer={(index: number | null) => setSelectedIndices(index !== null ? [index] : [])}
                                            onMoveLayer={moveLayer}
                                            onRemoveLayer={onRemoveLayer}
                                            onDefinitionChange={onNodeDefinitionChange}
                                            groups={currentPage.groups}
                                            onGroupChange={onGroupChange}
                                            onCreateGroup={onCreateGroup}
                                            onDeleteGroup={onDeleteGroup}
                                            mode="FULL_EDIT"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Shapes Panel */}
                            {activeMobilePanel === 'elements' && (
                                <div className="h-full overflow-y-auto bg-white pb-24">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                                        <h2 className="text-lg font-bold text-gray-900">Shapes</h2>
                                        <button
                                            onClick={() => setActiveMobilePanel(null)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <ShapeLibrary onAddNode={onAddNode} />
                                    </div>
                                </div>
                            )}

                            {/* Icons Panel */}
                            {activeMobilePanel === 'icons' && (
                                <div className="h-full overflow-y-auto bg-white pb-24">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                                        <h2 className="text-lg font-bold text-gray-900">Icons</h2>
                                        <button
                                            onClick={() => setActiveMobilePanel(null)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <IconLibrary onAddLayer={onAddNode} />
                                    </div>
                                </div>
                            )}

                            {/* Logos Panel */}
                            {activeMobilePanel === 'logos' && (
                                <div className="h-full overflow-y-auto bg-white pb-24">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                                        <h2 className="text-lg font-bold text-gray-900">Logos</h2>
                                        <button
                                            onClick={() => setActiveMobilePanel(null)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <LogoLibraryPanel onSelectLogo={onSelectLogo} />
                                    </div>
                                </div>
                            )}

                            {/* Images Panel */}
                            {activeMobilePanel === 'images' && (
                                <div className="h-full overflow-y-auto bg-white pb-24">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                                        <h2 className="text-lg font-bold text-gray-900">Images</h2>
                                        <button
                                            onClick={() => setActiveMobilePanel(null)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <ImageLibraryPanel onAddNode={onAddNode} />
                                    </div>
                                </div>
                            )}

                            {/* Background Panel */}
                            {activeMobilePanel === 'background' && (
                                <div className="h-full overflow-y-auto bg-white pb-24">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                                        <h2 className="text-lg font-bold text-gray-900">Background</h2>
                                        <button
                                            onClick={() => setActiveMobilePanel(null)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <BackgroundPanel
                                            currentBackground={currentPage.background}
                                            onBackgroundChange={onBackgroundChange}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* QR Code Panel */}
                            {activeMobilePanel === 'qrcode' && (
                                <div className="h-full overflow-y-auto bg-white pb-24">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                                        <h2 className="text-lg font-bold text-gray-900">QR Code</h2>
                                        <button
                                            onClick={() => setActiveMobilePanel(null)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <QRCodeDesigner
                                            onAddImage={onAddImage}
                                            onAddNode={onAddNode}
                                            onNodeChange={onNodeChange}
                                            mode="add"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Settings Panel */}
                            {activeMobilePanel === 'settings' && (
                                <div className="h-full overflow-y-auto bg-white pb-24">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                                        <h2 className="text-lg font-bold text-gray-900">Keyboard Shortcuts</h2>
                                        <button
                                            onClick={() => setActiveMobilePanel(null)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        <ShortcutsReference />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* Reset Confirmation Modal */}
            <ConfirmationModal
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={confirmReset}
                title="Reset Design"
                message="Are you sure you want to reset the design? All changes will be lost and cannot be recovered."
                variant="danger"
                confirmText="Reset"
            />

            <ExportModal
                isOpen={exportModalOpen}
                onClose={handleCloseExportModal}
                onExport={handleExport}
                onExportAsTemplate={handleExportAsTemplate}
                templateWidth={currentPage.width}
                templateHeight={currentPage.height}
            />

            {/* Mobile Bottom Toolbar (only visible on mobile) */}
            <MobileBottomToolbar
                activePanel={activeMobilePanel}
                onPanelChange={setActiveMobilePanel}
                onAddText={() => {
                    // Same logic as desktop - add text node immediately
                    const id = `node_text_${Date.now()}`;
                    const newTextNode: KonvaNodeDefinition = {
                        id,
                        type: 'Text',
                        props: {
                            id,
                            x: 50,
                            y: 50,
                            text: "Click to edit text",
                            fontSize: 28,
                            fill: '#000000',
                            fontFamily: 'Inter',
                            rotation: 0,
                            opacity: 1,
                            width: 250,
                            height: 40,
                        } as any,
                        editable: true,
                        locked: false,
                    };
                    dispatch({ type: 'ADD_NODE', node: newTextNode });
                }}
                selectedCount={selectedIndices.length}
            />
        </div>
    );
}


