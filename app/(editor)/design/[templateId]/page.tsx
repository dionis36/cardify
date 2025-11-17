// app/(editor)/design/[templateId]/page.tsx (UPGRADED - Stable 3-Column Layout with Professional Workarea)

"use client";

import { useCallback, useEffect, useRef, useReducer, useState } from "react";
import { useParams } from "next/navigation";
import Konva from "konva";
import { produce } from "immer"; 

// Components
import CanvasStage from "@/components/editor/CanvasStage";
import EditorSidebar from "@/components/editor/EditorSidebar";
import EditorTopbar from "@/components/editor/EditorTopbar";
// NOTE: LayerList is now imported *inside* EditorSidebar.tsx, NOT here, for the integrated UI.
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

// Placeholder for the Reducer: MUST be defined or imported elsewhere.
// This is a minimal structure required for the page.tsx file to function.
function reducer(state: State, action: any): State {
    switch (action.type) {
        // Reducer cases (UPDATE_NODE_PROPS, ADD_NODE, REMOVE_NODE, MOVE_NODE, etc.) 
        // need to be fully implemented with Immer (produce) for robust state management.
        
        case "UPDATE_NODE_PROPS":
        case "UPDATE_NODE_DEFINITION":
        case "ADD_NODE":
        case "REMOVE_NODE":
        case "MOVE_NODE":
        case "ADD_PAGE":
        case "REMOVE_PAGE":
        case "GOTO_PAGE":
        case "TOGGLE_ORIENTATION":
        case "UNDO":
        case "REDO":
            // Replace with your actual immer-based logic
            return produce(state, draft => {
                // Placeholder logic: prevents errors but needs implementation
                console.warn(`Action ${action.type} dispatched. State transition not fully implemented in reducer placeholder.`);
            }); 
            
        default:
            return state;
    }
}
// --- END Placeholder ---


export default function DesignEditorPage() {
    
    const params = useParams();
    // Load the initial template based on the URL parameter
    const initialTemplate = loadTemplate(params.templateId as string); 
    
    // Initialize state with reducer
    const [state, dispatch] = useReducer(reducer, initialTemplate, getInitialState as (arg: any) => State); 
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [mode, setMode] = useState<EditorMode>("FULL_EDIT");

    const stageRef = useRef<Konva.Stage | null>(null);
    const currentPage = state.pages[state.current];
    const selectedNode = selectedIndex !== null ? currentPage.layers[selectedIndex] : null;

    // --- HANDLERS ---

    // History & Export
    const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
    const redo = useCallback(() => dispatch({ type: "REDO" }), []);
    const exportPNG = useCallback(() => stageRef.current && downloadPNG(stageRef.current), []);
    const exportPDF = useCallback(() => stageRef.current && downloadPDF(stageRef.current), []);
    const saveDesign = useCallback(() => console.log("Design Saved:", JSON.stringify(state.pages)), [state.pages]);
    const toggleOrientation = useCallback(() => dispatch({ type: "TOGGLE_ORIENTATION", page: state.current }), [state.current]);
    
    // Core Node Property Handlers (Used by Canvas and Property Panel)
    const onNodeChange = useCallback((index: number, newProps: Partial<KonvaNodeProps>) => {
        dispatch({ type: "UPDATE_NODE_PROPS", page: state.current, index, newProps });
    }, [state.current]);
    
    const onNodeDefinitionChange = useCallback((index: number, updates: Partial<KonvaNodeDefinition>) => {
        dispatch({ type: "UPDATE_NODE_DEFINITION", page: state.current, index, updates });
    }, [state.current]);

    // Element Creation Logic
    const getNewId = (type: string) => `${type.toLowerCase()}_${Date.now()}`;
    const addNode = useCallback((newNode: KonvaNodeDefinition) => {
        dispatch({ type: "ADD_NODE", page: state.current, node: newNode });
        // Select the newly added node (it's always the last one)
        setSelectedIndex(currentPage.layers.length); 
    }, [state.current, currentPage.layers.length]);

    const addText = useCallback(() => {
        const newNode: KonvaNodeDefinition = { id: getNewId('text'), type: 'Text', editable: true, locked: false, props: { x: 50, y: 50, text: 'New Text', fontSize: 30, fill: '#000000', fontFamily: 'Arial', width: 200, height: 40, rotation: 0, opacity: 1 }};
        addNode(newNode);
    }, [addNode]);
    
    const addRect = useCallback(() => {
        const newNode: KonvaNodeDefinition = { id: getNewId('rect'), type: 'Rect', editable: true, locked: false, props: { x: 100, y: 100, width: 100, height: 100, fill: '#0070F3', rotation: 0, opacity: 1 }};
        addNode(newNode);
    }, [addNode]);
    
    const addImage = useCallback((file: File) => {
        const src = URL.createObjectURL(file);
        const newNode: KonvaNodeDefinition = { id: getNewId('image'), type: 'Image', editable: true, locked: false, props: { x: 10, y: 10, width: 100, height: 100, src, rotation: 0, opacity: 1 }};
        addNode(newNode);
    }, [addNode]);
    
    // Layer Reordering & Removal (Passed to EditorSidebar/LayerList)
    const moveNode = useCallback((fromKonvaIndex: number, toKonvaIndex: number) => {
        dispatch({ type: "MOVE_NODE", page: state.current, from: fromKonvaIndex, to: toKonvaIndex });
        setSelectedIndex(toKonvaIndex);
    }, [state.current]);
    
    const removeNode = useCallback((index: number) => {
        dispatch({ type: "REMOVE_NODE", page: state.current, index });
        setSelectedIndex(null); // Deselect after removal
    }, [state.current]);
    
    // Page Handlers (Passed to EditorSidebar)
    const addPage = useCallback(() => dispatch({ type: "ADD_PAGE" }), []);
    const removePage = useCallback(() => dispatch({ type: "REMOVE_PAGE" }), []);
    const gotoPage = useCallback((i: number) => {
        dispatch({ type: "GOTO_PAGE", index: i });
        setSelectedIndex(null); // Deselect when changing pages
    }, []);


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
            {/* 1. TOP BAR (Fixed Header) */}
            <EditorTopbar 
                undo={undo} 
                redo={redo} 
                exportPNG={exportPNG}
                exportPDF={exportPDF}
                saveDesign={saveDesign}
                mode={mode}
                setMode={setMode}
                toggleOrientation={toggleOrientation}
            />

            {/* 2. MAIN EDITOR AREA: STABLE 3-Column Layout */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* A. LEFT SIDEBAR (Fixed Width - Elements, Layers, Pages) */}
                <EditorSidebar 
                    // Element handlers
                    addText={addText}
                    addRect={addRect}
                    addImage={addImage}
                    // Page handlers
                    addPage={addPage}
                    removePage={removePage}
                    pageCount={state.pages.length}
                    currentPage={state.current}
                    gotoPage={gotoPage}
                    // Layer management handlers (now integrated into sidebar)
                    layers={currentPage.layers}
                    selectedIndex={selectedIndex}
                    onSelectLayer={setSelectedIndex} 
                    onMoveLayer={moveNode}
                    onRemoveLayer={removeNode}
                    onDefinitionChange={onNodeDefinitionChange}
                    // Mode
                    mode={mode}
                />
                
                {/* B. CENTER: Canvas Stage (Flexible Width and Centered Workarea) */}
                {/* UPGRADE: Added bg-gray-200 for a distinct, professional work area background */}
                <main className="flex-1 flex justify-center items-center overflow-auto p-8 bg-gray-200">
                    <CanvasStage
                        ref={stageRef}
                        template={currentPage}
                        selectedIndex={selectedIndex}
                        // Update selected index via CanvasStage click
                        onSelectNode={(_, index) => setSelectedIndex(index)}
                        onNodeChange={onNodeChange}
                        mode={mode}
                    />
                </main>

                {/* C. RIGHT SIDEBAR (Fixed Width - Property Panel) */}
                <PropertyPanel
                    node={selectedNode}
                    // Prop changes (x, y, fill, etc.)
                    onPropChange={(updates) => selectedIndex !== null && onNodeChange(selectedIndex, updates)}
                    // Definition changes (locked, visible)
                    onDefinitionChange={(updates) => selectedIndex !== null && onNodeDefinitionChange(selectedIndex, updates)}
                    mode={mode}
                />
            </div>
        </div>
    );
}