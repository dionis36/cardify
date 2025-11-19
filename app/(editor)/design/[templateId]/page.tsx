"use client";

import { useCallback, useEffect, useRef, useReducer, useState } from "react";
import { useParams } from "next/navigation";
import Konva from "konva";
import { produce } from "immer"; 

// Components
import CanvasStage from "@/components/editor/CanvasStage";
import EditorSidebar from "@/components/editor/EditorSidebar";
import EditorTopbar from "@/components/editor/EditorTopbar";
import PropertyPanel from "@/components/editor/PropertyPanel";

// Types/Libs
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps, BackgroundPattern, BackgroundType } from "@/types/template";
import { loadTemplate } from "@/lib/templates";
import { downloadPNG, downloadPDF } from "@/lib/pdf"; 

// Define the editor modes
type EditorMode = "FULL_EDIT" | "DATA_ONLY";

// --- BACKGROUND DEFINITION (Temporary placeholder until types are consistently linked) ---
// We assume this type exists in '@/types/template'
// type BackgroundType = 'solid' | 'gradient' | 'pattern';
// interface BackgroundPattern {
//     type: BackgroundType;
//     color1: string; // Primary color or gradient start
//     color2: string; // Secondary color or gradient end
//     opacity: number;
//     rotation: number;
//     scale: number;
//     patternImageURL?: string; // Only for pattern type
// }

const DEFAULT_BACKGROUND: BackgroundPattern = {
    type: 'solid',
    color1: '#F3F4F6', // A light gray default
    color2: '#000000', 
    opacity: 1,
    rotation: 0,
    scale: 1,
    patternImageURL: '',
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
  // NEW ACTION: Update Background
  | { type: 'CHANGE_BACKGROUND', updates: Partial<BackgroundPattern> }; 

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
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const currentPage = state.pages[state.current];

    const selectedNode = selectedIndex !== null ? currentPage.layers[selectedIndex] : null;

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
        setSelectedIndex(to); // Keep the item selected
    }, [dispatch]);

    const moveLayerUp = useCallback(() => {
        if (selectedIndex === null || selectedIndex === currentPage.layers.length - 1) return;
        moveLayer(selectedIndex, selectedIndex + 1);
    }, [selectedIndex, currentPage.layers.length, moveLayer]);

    const moveLayerDown = useCallback(() => {
        if (selectedIndex === null || selectedIndex === 0) return;
        moveLayer(selectedIndex, selectedIndex - 1);
    }, [selectedIndex, moveLayer]);

    const moveLayerToFront = useCallback(() => {
        if (selectedIndex === null || selectedIndex === currentPage.layers.length - 1) return;
        moveLayer(selectedIndex, currentPage.layers.length - 1);
    }, [selectedIndex, currentPage.layers.length, moveLayer]);

    const moveLayerToBack = useCallback(() => {
        if (selectedIndex === null || selectedIndex === 0) return;
        moveLayer(selectedIndex, 0);
    }, [selectedIndex, moveLayer]);

    const onRemoveLayer = useCallback(() => {
        if (selectedIndex === null) return;
        dispatch({ type: 'REMOVE_NODE', index: selectedIndex });
        setSelectedIndex(null);
    }, [selectedIndex, dispatch]);

    const onSelectLayer = useCallback((index: number | null) => {
        setSelectedIndex(index);
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
        setSelectedIndex(null);
    }, [dispatch, state.pages.length, templateId]);

    const removePage = useCallback(() => {
        if (state.pages.length > 1) {
            dispatch({ type: 'REMOVE_PAGE', index: state.current });
            setSelectedIndex(null);
        }
    }, [dispatch, state.pages.length, state.current]);

    const gotoPage = useCallback((index: number) => {
        dispatch({ type: 'GOTO_PAGE', index });
        setSelectedIndex(null);
    }, [dispatch]);


    // --- ASSET & NODE ADDITION HANDLERS ---
    
    const onAddNode = useCallback((node: KonvaNodeDefinition) => {
        dispatch({ type: 'ADD_NODE', node });
        setSelectedIndex(currentPage.layers.length); // Select the new node
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

    // Select the transformer on selection change
    useEffect(() => {
        const transformer = stageRef.current?.findOne('Transformer') as Konva.Transformer;
        if (transformer) {
            if (selectedNode) {
                const node = stageRef.current?.findOne(`#${selectedNode.id}`);
                if (node) {
                    transformer.nodes([node]);
                }
            } else {
                transformer.nodes([]);
            }
            transformer.getLayer()?.batchDraw();
        }
    }, [selectedNode, stageRef]);

    // Cleanup selection on page change
    useEffect(() => {
        setSelectedIndex(null);
    }, [currentPage]);
    
    
    // Functionality for TextNode to communicate it wants to be edited (double click)
    const onStartEditing = useCallback((konvaNode: Konva.Text) => {
        // This is where we would typically show a custom TextEditor overlay.
        // For now, just log the intent.
        console.log("Start editing text node:", konvaNode.id());
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
                onSave={() => {}}
                onBack={() => {}}
            />

            <div className="flex flex-1 pt-14 overflow-hidden">
                {/* A. LEFT SIDEBAR (Fixed Width - Layer/Element/Data/Page Controls) */}
                <EditorSidebar
                    // Element/Layer Management
                    layers={currentPage.layers}
                    selectedIndex={selectedIndex}
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
                />

                {/* B. CANVAS AREA (Flex Grow) */}
                <main 
                    ref={mainRef}
                    className="flex-1 flex justify-center items-center overflow-auto p-8 bg-gray-200"
                >
                    <CanvasStage
                        ref={stageRef}
                        parentRef={mainRef}
                        template={currentPage}
                        selectedNodeIndex={selectedIndex} 
                        onSelectNode={(index: number | null) => setSelectedIndex(index)}
                        onDeselectNode={() => setSelectedIndex(null)} 
                        onNodeChange={onNodeChange}
                        onStartEditing={onStartEditing}
                        mode={mode}
                    />
                </main>

                {/* C. RIGHT SIDEBAR (Fixed Width - Property Panel) */}
                <PropertyPanel
                    node={selectedNode}
                    
                    onPropChange={(updates: Partial<KonvaNodeProps>) => 
                        selectedIndex !== null && onNodeChange(selectedIndex, updates)
                    }
                    onDefinitionChange={(updates: Partial<KonvaNodeDefinition>) => 
                        selectedIndex !== null && onNodeDefinitionChange(selectedIndex, updates)
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
    );
}




