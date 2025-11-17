// types/editor.ts

import { KonvaNodeDefinition } from "./template";

// Editor state types
export interface EditorState {
  selectedNodeIndex: number | null; // currently selected element
  nodes: KonvaNodeDefinition[]; // current elements on canvas
  history: KonvaNodeDefinition[][]; // for undo/redo
  future: KonvaNodeDefinition[][]; // redo stack
}

// Node property changes (for PropertyPanel)
export interface NodePropsChange {
  index: number;
  newProps: Partial<KonvaNodeDefinition["props"]>;
}
