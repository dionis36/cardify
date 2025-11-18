// app/(editor)/design/[templateId]/page.tsx (COMPLETE AND CORRECTED)

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
import { CardTemplate, KonvaNodeDefinition, KonvaNodeProps } from "@/types/template";
import { loadTemplate } from "@/lib/templates";
import { downloadPNG, downloadPDF } from "@/lib/pdf"; 

// Define the editor modes
type EditorMode = "FULL_EDIT" | "DATA_ONLY";

// --- State/Reducer logic ---
type State = {
  pages: CardTemplate[]; 
  current: number; 
  history: State[]; 
  future: State[]; 
};

// Initial state function using the loaded template
function getInitialState(template: CardTemplate): State {
    return {
        pages: [template],
        current: 0,
        history: [],
        future: [],
    };
}

// Reducer actions
type Action = 
  | { type: 'SET_PAGES', pages: CardTemplate[] }
  | { type: 'GO_TO_PAGE', index: number }
  | { type: 'ADD_PAGE', template: CardTemplate }
  | { type: 'REMOVE_PAGE', index: number }
  | { type: 'UPDATE_NODE_PROPS', pageIndex: number, nodeIndex: number, updates: Partial<KonvaNodeProps> }
  | { type: 'UPDATE_NODE_DEFINITION', pageIndex: number, nodeIndex: number, updates: Partial<KonvaNodeDefinition> }
  | { type: 'ADD_NODE', pageIndex: number, node: KonvaNodeDefinition }
  | { type: 'REMOVE_NODE', pageIndex: number, nodeIndex: number }
  | { type: 'MOVE_NODE', pageIndex: number, from: number, to: number }
  | { type: 'TOGGLE_ORIENTATION', pageIndex: number }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// Reducer implementation
function editorReducer(state: State, action: Action): State {
  const newState = produce(state, draft => {
    // Save current state to history before any modification
    if (action.type !== 'UNDO' && action.type !== 'REDO') {
      draft.history.push({ ...state, history: [], future: [] }); // Push clean state
      draft.future = []; // Clear redo stack on new action
    }

    switch (action.type) {
      case 'SET_PAGES':
        draft.pages = action.pages;
        draft.current = Math.min(draft.current, action.pages.length - 1);
        break;
      case 'GO_TO_PAGE':
        draft.current = action.index;
        break;
      case 'ADD_PAGE':
        draft.pages.push(action.template);
        draft.current = draft.pages.length - 1;
        break;
      case 'REMOVE_PAGE':
        if (draft.pages.length > 1) {
          draft.pages.splice(action.index, 1);
          draft.current = Math.min(draft.current, draft.pages.length - 1);
        }
        break;
      case 'UPDATE_NODE_PROPS': {
        const node = draft.pages[action.pageIndex].layers[action.nodeIndex];
        node.props = { ...node.props, ...action.updates };
        break;
      }
      case 'UPDATE_NODE_DEFINITION': {
        const node = draft.pages[action.pageIndex].layers[action.nodeIndex];
        Object.assign(node, action.updates);
        break;
      }
      case 'ADD_NODE':
        draft.pages[action.pageIndex].layers.push(action.node);
        break;
      case 'REMOVE_NODE':
        draft.pages[action.pageIndex].layers.splice(action.nodeIndex, 1);
        break;
      case 'MOVE_NODE':
        const [removed] = draft.pages[action.pageIndex].layers.splice(action.from, 1);
        draft.pages[action.pageIndex].layers.splice(action.to, 0, removed);
        break;
      case 'TOGGLE_ORIENTATION': {
        const page = draft.pages[action.pageIndex];
        // Simple swap of width/height
        [page.width, page.height] = [page.height, page.width];
        // Move all nodes to ensure they are on canvas (simple re-center might be better for complex layouts)
        page.layers.forEach(layer => {
            // Very simple shift logic (might need to be smarter)
            layer.props.x = (page.width / 2) - (layer.props.width / 2);
            layer.props.y = (page.height / 2) - (layer.props.height / 2);
        });
        break;
      }
      case 'UNDO':
        if (draft.history.length > 0) {
          const previousState = draft.history.pop()!;
          draft.future.unshift({ ...state, history: [], future: [] });
          Object.assign(draft, previousState); // Restore everything except history/future
        }
        break;
      case 'REDO':
        if (draft.future.length > 0) {
          const nextState = draft.future.shift()!;
          draft.history.push({ ...state, history: [], future: [] });
          Object.assign(draft, nextState); // Restore everything except history/future
        }
        break;
      default:
        return state;
    }
  });

  return newState;
}

// --- Main Page Component ---

export default function DesignPage() {
    const params = useParams<{ templateId: string }>();
    const stageRef = useRef<Konva.Stage>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [mode, setMode] = useState<EditorMode>("FULL_EDIT");

    // Load initial state based on templateId
    const initialTemplate = loadTemplate(params.templateId);
    const [state, dispatch] = useReducer(editorReducer, initialTemplate, getInitialState);

    // Current page and selected node
    const currentPage = state.pages[state.current];
    const selectedNode = selectedIndex !== null ? currentPage.layers[selectedIndex] : null;

    // --- Core Action Handlers ---

    // 1. Update node properties (x, y, fill, text)
    const onNodeChange = useCallback((index: number, updates: Partial<KonvaNodeProps>) => {
        dispatch({
            type: 'UPDATE_NODE_PROPS',
            pageIndex: state.current,
            nodeIndex: index,
            updates,
        });
    }, [state.current]);

    // 2. Update node definition (locked, editable)
    const onNodeDefinitionChange = useCallback((index: number, updates: Partial<KonvaNodeDefinition>) => {
        dispatch({
            type: 'UPDATE_NODE_DEFINITION',
            pageIndex: state.current,
            nodeIndex: index,
            updates,
        });
    }, [state.current]);
    
    // Handler to clear any selection (sent to CanvasStage as a prop)
    const onDeselectNode = useCallback(() => {
        setSelectedIndex(null);
    }, []);
    
    // 3. Add a new node (Text, Rect, Image, etc.)
    const onAddNode = useCallback((node: KonvaNodeDefinition) => {
        dispatch({
            type: 'ADD_NODE',
            pageIndex: state.current,
            node,
        });
        // Select the new node
        setSelectedIndex(currentPage.layers.length);
    }, [state.current, currentPage.layers.length]);

    // --- LAYER ORDERING LOGIC (NEW) ---

    // Core layer move function: dispatches the array move and updates local selection index
    const onMoveLayer = useCallback((from: number, to: number) => {
        if (from === to) return;

        // 1. Dispatch the move action to the reducer
        dispatch({
            type: 'MOVE_NODE',
            pageIndex: state.current,
            from,
            to,
        });
        
        // 2. Update selected index (which is managed by local state)
        setSelectedIndex(prevIndex => {
            if (prevIndex === null) return null;
            if (prevIndex === from) {
                // The moved element remains selected at the new index
                return to;
            }
            // Handle adjustment for other selected elements only if the selection is not the layer being moved
            else if (from < prevIndex && to >= prevIndex) {
                // Layer moved up over the selected index, so selected index shifts down
                return prevIndex - 1;
            } else if (from > prevIndex && to <= prevIndex) {
                // Layer moved down over the selected index, so selected index shifts up
                return prevIndex + 1;
            }
            return prevIndex;
        });

    }, [dispatch, state.current]); 

    // Helper function used by all explicit move actions
    const moveSelectedLayer = useCallback((newIndex: number) => {
        // Check for locked status on the currently selected node
        if (selectedIndex === null || selectedNode?.locked) return;
        onMoveLayer(selectedIndex, newIndex);
    }, [selectedIndex, selectedNode, onMoveLayer]);

    const moveLayerToFront = useCallback(() => {
        // layers.length - 1 is the front (highest index)
        const newIndex = currentPage.layers.length - 1; 
        moveSelectedLayer(newIndex);
    }, [currentPage.layers.length, moveSelectedLayer]);

    const moveLayerToBack = useCallback(() => {
        // 0 is the back (lowest index)
        moveSelectedLayer(0);
    }, [moveSelectedLayer]);

    const moveLayerUp = useCallback(() => {
        if (selectedIndex === null) return;
        const newIndex = Math.min(selectedIndex + 1, currentPage.layers.length - 1);
        moveSelectedLayer(newIndex);
    }, [selectedIndex, currentPage.layers.length, moveSelectedLayer]);

    const moveLayerDown = useCallback(() => {
        if (selectedIndex === null) return;
        const newIndex = Math.max(selectedIndex - 1, 0);
        moveSelectedLayer(newIndex);
    }, [selectedIndex, moveSelectedLayer]);

    // --- Sidebar Helper Functions (Element Creation) ---
    
    // REMOVED: addText and addRect

    // ADDED: Replaced legacy addImage function to align with the new sidebar prop name
    const onAddImage = useCallback((file: File) => { 
        const reader = new FileReader();
        reader.onload = (e) => {
            const id = `image_${Date.now()}`; // declare id variable
            const newImage: KonvaNodeDefinition = {
                id,
                type: 'Image',
                props: {
                    id,
                    x: currentPage.width / 4,
                    y: currentPage.height / 4,
                    width: 150,
                    height: 150,
                    src: e.target?.result as string, // Data URL
                    rotation: 0,
                    opacity: 1,
                },
                editable: true,
                locked: false,
            };
            onAddNode(newImage);
        };
        reader.readAsDataURL(file);
    }, [currentPage.width, currentPage.height, onAddNode]);

    // --- Page Management Handlers ---
    const addPage = useCallback(() => {
        // Create a new page that is a copy of the current page
        const newTemplate: CardTemplate = JSON.parse(JSON.stringify(currentPage));
        newTemplate.id = `page_${Date.now()}`;
        newTemplate.name = `Page ${state.pages.length + 1}`;
        dispatch({ type: 'ADD_PAGE', template: newTemplate });
        setSelectedIndex(null); // Clear selection on page change
    }, [state.pages.length, currentPage]);

    const removePage = useCallback(() => {
        if (state.pages.length > 1) {
            dispatch({ type: 'REMOVE_PAGE', index: state.current });
            setSelectedIndex(null); // Clear selection on page change
        }
    }, [state.pages.length, state.current]);

    const gotoPage = useCallback((index: number) => {
        dispatch({ type: 'GO_TO_PAGE', index });
        setSelectedIndex(null); // Clear selection on page change
    }, []);

    const toggleOrientation = useCallback(() => {
        dispatch({ type: 'TOGGLE_ORIENTATION', pageIndex: state.current });
        setSelectedIndex(null); // Clear selection after layout change
    }, [state.current]);


    // --- Export Handlers ---
    const exportPNG = useCallback(() => {
        if (stageRef.current) {
            downloadPNG(stageRef.current, `${currentPage.name}.png`);
        }
    }, [currentPage.name]);

    const exportPDF = useCallback(() => {
        if (stageRef.current) {
            downloadPDF(stageRef.current, `${currentPage.name}.pdf`);
        }
    }, [currentPage.name]);

    const saveDesign = useCallback(() => {
        console.log("Design Saved:", JSON.stringify(currentPage.layers));
        alert('Design saved to console!');
    }, [currentPage.layers]);

    const removeLayer = useCallback((index: number) => {
        dispatch({ type: 'REMOVE_NODE', pageIndex: state.current, nodeIndex: index });
        // After removal, clear selection if the removed element was selected
        if (selectedIndex === index) {
            setSelectedIndex(null);
        } else if (selectedIndex !== null && index < selectedIndex) {
            // Adjust index if an element before the selected one was removed
            setSelectedIndex(selectedIndex - 1);
        }
    }, [state.current, selectedIndex]);

    // Deselect if we change page or go into Data-Only mode
    useEffect(() => {
        if (mode === "DATA_ONLY" && selectedIndex !== null) {
            const isSelectedEditable = selectedNode?.editable ?? false;
            if (!isSelectedEditable) {
                setSelectedIndex(null);
            }
        }
    }, [mode, selectedIndex, selectedNode]);

    // --- Render ---
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <EditorTopbar
                undo={() => dispatch({ type: 'UNDO' })}
                redo={() => dispatch({ type: 'REDO' })}
                exportPNG={exportPNG}
                exportPDF={exportPDF}
                saveDesign={saveDesign}
                mode={mode}
                setMode={setMode}
                toggleOrientation={toggleOrientation}
            />

            <div className="flex flex-1 overflow-hidden">
                {/* A. LEFT SIDEBAR (Fixed Width - Layer/Element/Page Panels) */}
                <EditorSidebar
                    // NEW SIMPLIFIED PROP INTERFACE for Element Creation
                    onAddNode={onAddNode} 
                    onAddImage={onAddImage} // Used by the Asset/Upload panel

                    // Page Control
                    addPage={addPage}
                    removePage={removePage}
                    pageCount={state.pages.length}
                    currentPage={state.current}
                    gotoPage={gotoPage}

                    // Layer Management
                    layers={currentPage.layers}
                    selectedIndex={selectedIndex}
                    onSelectLayer={setSelectedIndex}
                    onMoveLayer={onMoveLayer} // Pass the core logic to update local selection
                    onRemoveLayer={removeLayer} // Pass the updated remove layer logic
                    onDefinitionChange={onNodeDefinitionChange}
                    // Mode
                    mode={mode}
                />
                
                {/* B. CENTER: Canvas Stage (Flexible Width and Centered Workarea) */}
                <main className="flex-1 flex justify-center items-center overflow-auto p-8 bg-gray-200">
                    <CanvasStage
                        ref={stageRef}
                        template={currentPage}
                        selectedNodeIndex={selectedIndex} 
                        onSelectNode={(index: number | null) => setSelectedIndex(index)}
                        onDeselectNode={() => setSelectedIndex(null)} 
                        onNodeChange={onNodeChange}
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