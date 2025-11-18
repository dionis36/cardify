// components/editor/EditorSidebar.tsx (COMPLETE AND CORRECTED)

"use client";

import { useState } from "react";
import LayerList from "./LayerList"; // IMPORT LayerList
import { ShapeLibrary } from "./ShapeLibrary"; // IMPORT ShapeLibrary
import { KonvaNodeDefinition } from "@/types/template";
import { Move, Layers, Settings, Image, Trash2, ChevronLeft, ChevronRight, Plus } from "lucide-react"; // Updated icons

type EditorMode = "FULL_EDIT" | "DATA_ONLY"; 

interface EditorSidebarProps {
  // NEW SIMPLIFIED ELEMENT CREATION PROPS
  onAddNode: (node: KonvaNodeDefinition) => void;
  onAddImage: (file: File) => void; // Used for asset uploads
  
  // Page Control Props
  addPage: () => void;
  removePage: () => void;
  pageCount: number;
  currentPage: number;
  gotoPage: (i: number) => void;

  // Layer Management Props (Passed to LayerList)
  layers: KonvaNodeDefinition[];
  selectedIndex: number | null;
  onSelectLayer: (index: number | null) => void;
  onMoveLayer: (from: number, to: number) => void;
  onRemoveLayer: (index: number) => void;
  onDefinitionChange: (index: number, updates: Partial<KonvaNodeDefinition>) => void;
  
  mode: EditorMode; 
}

export default function EditorSidebar({
  // New props replacing addText and addRect
  onAddNode, onAddImage,
  // Remaining props
  addPage, removePage, pageCount, currentPage, gotoPage,
  layers, selectedIndex, onSelectLayer, onMoveLayer, onRemoveLayer, onDefinitionChange,
  mode,
}: EditorSidebarProps) {
    const [activeTab, setActiveTab] = useState<"elements" | "layers" | "pages">("layers"); 
    const [file, setFile] = useState<File | null>(null);

    const isDataOnlyMode = mode === "DATA_ONLY";

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setFile(e.target.files[0]);
      }
    };

    const renderTabContent = () => {
      // 1. LAYERS TAB 
      if (activeTab === "layers") {
          // Disable layers tab content in Data Edit Mode
          if (isDataOnlyMode) return <p className="p-4 text-center text-gray-500 text-sm">Layers management is locked in Data Edit Mode.</p>;

          return (
              // LayerList assumes its own scrolling/layout management for full height
              <div className="flex flex-col gap-2 h-full overflow-y-auto p-4"> 
                  <LayerList
                      layers={layers}
                      selectedIndex={selectedIndex}
                      onSelectLayer={onSelectLayer}
                      onMoveLayer={onMoveLayer}
                      onRemoveLayer={onRemoveLayer}
                      onDefinitionChange={onDefinitionChange}
                      // Assuming LayerList can handle the mode prop
                      mode={mode}
                  />
              </div>
          );
      }
      
      // 2. ELEMENTS TAB (Now incorporates ShapeLibrary and Image Upload)
      if (activeTab === "elements") {
        if (isDataOnlyMode) return <p className="p-4 text-center text-gray-500 text-sm">Element creation is locked in Data Edit Mode.</p>;

        return (
          // ShapeLibrary already applies p-4 internally, we use the flex-col for structure
          <div className="flex flex-col gap-3 h-full overflow-y-auto">
            {/* A. Shape Library (Uses onAddNode) */}
            <ShapeLibrary onAddNode={onAddNode} />

            {/* B. Image Upload Section (Uses onAddImage) */}
            {/* Applying padding here and a top border to visually separate from the shapes */}
            <div className="p-4 border-t border-gray-100 bg-white space-y-3 shadow-t-md">
              <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Asset Upload</h3>
              
              <div className="border p-3 rounded bg-white space-y-3 shadow-sm">
                <label className="block text-xs font-medium text-gray-700 mb-1">Upload Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <button
                  onClick={() => {
                    if (file) {
                      onAddImage(file); // Updated to use onAddImage
                      setFile(null); 
                    }
                  }}
                  disabled={!file}
                  className={`mt-2 w-full py-1 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    !file ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  <Image size={16} /> Add Image to Canvas
                </button>
              </div>
            </div>
          </div>
        );
      }
      
      // 3. PAGES TAB
      if (activeTab === "pages") {
          return (
              <div className="flex flex-col gap-3 pt-4 h-full overflow-y-auto p-4">
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Page Management</h3>
                  
                  {/* Page Navigation/Display */}
                  <div className="flex items-center justify-between p-3 border rounded bg-white shadow-sm">
                      <p className="font-medium text-gray-700">
                          Page: <span className="font-bold text-lg text-blue-600">{currentPage + 1}</span> / {pageCount}
                      </p>
                      <div className="flex gap-2">
                          <button
                              onClick={() => gotoPage(currentPage - 1)}
                              disabled={currentPage === 0}
                              className="p-2 rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                              title="Previous Page"
                          >
                              <ChevronLeft size={16} />
                          </button>
                          <button
                              onClick={() => gotoPage(currentPage + 1)}
                              disabled={currentPage === pageCount - 1}
                              className="p-2 rounded text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                              title="Next Page"
                          >
                              <ChevronRight size={16} />
                          </button>
                      </div>
                  </div>

                  {/* Page Actions */}
                  <button
                      onClick={addPage}
                      className={`w-full py-2 rounded text-sm font-semibold transition-colors bg-purple-600 text-white hover:bg-purple-700 mt-2 flex items-center justify-center gap-2`}
                  >
                      <Plus size={16} /> Add New Page
                  </button>
                  <button
                      onClick={removePage}
                      disabled={pageCount <= 1}
                      className={`w-full py-2 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${pageCount <= 1 ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-red-100 text-red-600 hover:bg-red-200"}`}
                  >
                      <Trash2 size={16} /> Remove Current
                  </button>
              </div>
          );
      }

      return null;
    };

    return (
      <div className="w-72 bg-white border-r flex flex-col shadow-xl z-20 flex-none">
        
        {/* Tab Header */}
        <div className="flex-none flex border-b bg-gray-50">
            <button
                onClick={() => setActiveTab("layers")}
                disabled={isDataOnlyMode}
                className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                    activeTab === "layers" ? "border-b-2 border-blue-600 text-blue-600 bg-white" : "text-gray-500 hover:text-gray-700 disabled:opacity-50"
                }`}
            >
                <Layers size={16} /> Layers
            </button>
            <button
                onClick={() => setActiveTab("elements")}
                disabled={isDataOnlyMode}
                className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                    activeTab === "elements" ? "border-b-2 border-blue-600 text-blue-600 bg-white" : "text-gray-500 hover:text-gray-700 disabled:opacity-50"
                }`}
            >
                <Move size={16} /> Elements
            </button>
            <button
                onClick={() => setActiveTab("pages")}
                className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                    activeTab === "pages" ? "border-b-2 border-blue-600 text-blue-600 bg-white" : "text-gray-500 hover:text-gray-700"
                }`}
            >
                <Settings size={16} /> Pages
            </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
            {renderTabContent()}
        </div>
      </div>
    );
}