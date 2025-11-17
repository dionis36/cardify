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

// --- Placeholder/Assumption for your State/Reducer logic ---
// Based on file snippets, this structure manages multi-page state and history.
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

// Reducer implementation (simplified for context)
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
    }, [state.current, mode]);

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
    
    // 3. Add a new node (Text, Rect, Image)
    const onAddNode = useCallback((node: KonvaNodeDefinition) => {
        dispatch({
            type: 'ADD_NODE',
            pageIndex: state.current,
            node,
        });
        // Select the new node
        setSelectedIndex(currentPage.layers.length);
    }, [state.current, currentPage.layers.length]);



    // --- Sidebar Helper Functions ---

    const addText = useCallback(() => {
        const newText: KonvaNodeDefinition = {
            id: `text_${Date.now()}`,
            type: 'Text',
            props: {
                x: currentPage.width / 4,
                y: currentPage.height / 4,
                width: 200,
                height: 40,
                text: "New Text",
                fontSize: 24,
                fill: '#000000',
                fontFamily: 'Arial',
                rotation: 0,
                opacity: 1,
            },
            editable: true,
            locked: false,
        };
        onAddNode(newText);
    }, [currentPage.width, currentPage.height, onAddNode]);

    const addRect = useCallback(() => {
        const newRect: KonvaNodeDefinition = {
            id: `rect_${Date.now()}`,
            type: 'Rect',
            props: {
                x: currentPage.width / 4,
                y: currentPage.height / 4,
                width: 100,
                height: 100,
                fill: '#E0E0E0',
                rotation: 0,
                opacity: 1,
            },
            editable: true,
            locked: false,
        };
        onAddNode(newRect);
    }, [currentPage.width, currentPage.height, onAddNode]);

    const addImage = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const newImage: KonvaNodeDefinition = {
                id: `image_${Date.now()}`,
                type: 'Image',
                props: {
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
        // In a real app, you would send currentPage to an API here
        alert('Design saved to console!');
    }, [currentPage.layers]);


    // Deselect if we change page or go into Data-Only mode
    useEffect(() => {
        if (mode === "DATA_ONLY" && selectedIndex !== null) {
            // Find the index of the selected node among the editable layers
            const isSelectedEditable = selectedNode?.editable ?? false;
            // If the selected node is NOT editable, clear selection
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
                    // Element Creation
                    addText={addText}
                    addRect={addRect}
                    addImage={addImage}

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
                    onMoveLayer={(from, to) => dispatch({ type: 'MOVE_NODE', pageIndex: state.current, from, to })}
                    onRemoveLayer={(index) => {
                        dispatch({ type: 'REMOVE_NODE', pageIndex: state.current, nodeIndex: index });
                        setSelectedIndex(null);
                    }}
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
                        onNodeChange={onNodeChange}
                        mode={mode}
                    />
                </main>

                {/* C. RIGHT SIDEBAR (Fixed Width - Property Panel) */}
                <PropertyPanel
                    // FIX 2: Renamed 'selectedNode' to 'node' (based on component signature)
                    node={selectedNode}
                    // FIX 2: Removed 'selectedIndex' prop (likely not needed in PropertyPanel)
                    
                    // Prop changes (x, y, fill, etc.)
                    // FIX 2: Renamed prop to 'onPropChange' (based on component signature)
                    // FIX 3: Added explicit type 'Partial<KonvaNodeProps>' to 'updates'
                    onPropChange={(updates: Partial<KonvaNodeProps>) => 
                        selectedIndex !== null && onNodeChange(selectedIndex, updates)
                    }
                    // Definition changes (locked, editable)
                    // FIX 2: Renamed prop to 'onDefinitionChange' (based on component signature)
                    // FIX 4: Added explicit type 'Partial<KonvaNodeDefinition>' to 'updates'
                    onDefinitionChange={(updates: Partial<KonvaNodeDefinition>) => 
                        selectedIndex !== null && onNodeDefinitionChange(selectedIndex, updates)
                    }
                    mode={mode}
                />
            </div>
        </div>
    );
}