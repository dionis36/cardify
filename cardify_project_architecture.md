# Cardify — Project Architecture & File Reference (Exhaustive Developer Reference)

**Purpose:**
This document is the single source-of-truth for the Cardify project at a code-level granularity. It is written so that any developer (or ChatGPT instance) who receives this file can immediately understand the exact **file layout**, **type definitions**, **import relationships**, **run-time interactions**, and **how each file should be implemented or modified**. The document goes beyond a README to include APi signatures, props, expected JSON shapes, example code snippets, and a step-by-step change/checklist for future upgrades.

Place this file at `docs/ARCHITECTURE.md` inside the repository. If you open a new chat and upload this file, the assistant will have all the context needed to continue development.

---

## Table of contents
1. Canonical file tree (complete)
2. File-by-file: absolute detail (imports, exports, full prop signatures)
3. Type definitions (full TypeScript types with examples)
4. Template JSON spec (exhaustive fields, examples)
5. API routes: contract, request/response, error codes
6. Component interaction diagrams (textual sequence flows)
7. Editor lifecycle and state flow (reducer, history, undo/redo)
8. Integration points: where to plug future features (snapping, plugins, CMYK export)
9. Tailwind and CSS conventions (exact tokens to define)
10. package.json (exact dependencies recommended)
11. Testing & debugging checklist + common errors and fixes
12. File creation checklist: exact files to paste and where

---

# 1. Canonical file tree (complete)

```
cardify/
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── (landing)/
│   │     └── page.tsx
│   │
│   ├── (templates)/
│   │     └── page.tsx
│   │
│   ├── (editor)/
│   │     └── design/
│   │           └── [templateId]/
│   │                 └── page.tsx
│   │
│   └── api/
│         ├── templates/route.ts
│         ├── design/route.ts
│         └── upload/route.ts
│
├── components/
│   ├── editor/
│   │     ├── CanvasStage.tsx
│   │     ├── EditorSidebar.tsx
│   │     ├── EditorTopbar.tsx
│   │     ├── LayerList.tsx
│   │     └── PropertyPanel.tsx
│   │
│   ├── templates/
│   │     ├── TemplateCard.tsx
│   │     ├── TemplateGrid.tsx
│   │     └── TemplateFilters.tsx
│   │
│   └── ui/
│         ├── Button.tsx
│         ├── Input.tsx
│         ├── Card.tsx
│         └── Modal.tsx
│
├── lib/
│   ├── templates.ts
│   ├── templateCategories.ts
│   ├── konvaUtils.ts
│   ├── pdf.ts
│   ├── alignmentHelpers.ts
│   └── pluginSystem.ts
│
├── public/
│   └── templates/
│         ├── template-01.json
│         ├── template-02.json
│         ├── template-03.json
│         ├── thumb_01.png
│         └── thumb_02.png
│
├── types/
│   ├── template.ts
│   └── editor.ts
│
├── docs/
│   └── ARCHITECTURE.md  <-- this file
│
└── package.json
```

---

# 2. File-by-file: absolute detail

Below each file includes: **Path**, **Responsibility**, **Exact imports used**, **Props / exported signatures**, **Example usage**, **Edge cases / errors to watch**.

> NOTE: All TypeScript interfaces referenced below are defined in section 3.

---

## `app/layout.tsx`
- **Responsibility:** Root layout for Next.js App Router; loads global CSS and wraps pages with header/footer. Also configures global providers (e.g., ThemeProvider) if needed.
- **Exact imports:**
  ```ts
  import '@/app/globals.css';
  import React from 'react';
  import { PropsWithChildren } from 'react';
  import Header from '@/components/ui/Header'; // optional
  ```
- **Export signature:**
  ```tsx
  export default function RootLayout({ children }: PropsWithChildren) {
    return (
      <html lang="en">
        <body>
          <Header />
          <main>{children}</main>
        </body>
      </html>
    );
  }
  ```
- **Edge cases:** Ensure `globals.css` exists and includes Tailwind directives; otherwise CSS compilation will fail.

---

## `app/globals.css`
- **Responsibility:** Tailwind base + project CSS variables. Must define semantic colors used in UI: `--primary`, `--panel-bg`, etc.
- **Minimum content required:**
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  :root {
    --primary: #2563EB;
    --panel-bg: #F9FAFB;
    --canvas-bg: #F3F4F6;
    --border: #D1D5DB;
  }

  .btn-primary { @apply bg-primary text-white px-4 py-2 rounded-xl; }
  ```
- **Edge case:** If using `bg-primary` Tailwind utility, ensure `primary` is defined in `tailwind.config.js` under `theme.extend.colors` or use CSS var class as `.bg-primary { background: var(--primary) }`.

---

## `app/(landing)/page.tsx`
- **Responsibility:** Homepage: marketing + links to templates and demo editor.
- **Import example:** `import Link from 'next/link'`.
- **Export sig:** `export default function Home() { return (<main>...</main>); }`

**Example content:**
```tsx
import Link from 'next/link';
export default function Home(){
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold text-[var(--primary)]">Cardify</h1>
      <p className="mt-4">Design business cards in your browser.</p>
      <div className="mt-8">
        <Link href="/templates" className="btn-primary">Browse templates</Link>
      </div>
    </main>
  )
}
```

---

## `app/(templates)/page.tsx` (templates gallery page)
- **Responsibility:** Fetch & render templates list; wire `TemplateFilters` -> `TemplateGrid`.
- **Exact imports:**
  ```ts
  import { useEffect, useState, useMemo } from 'react';
  import TemplateFilters from '@/components/templates/TemplateFilters';
  import TemplateGrid from '@/components/templates/TemplateGrid';
  import { loadTemplates, searchTemplates, filterTemplates } from '@/lib/templates';
  import type { CardTemplate } from '@/types/template';
  ```
- **Component props & state (internal):**
  ```ts
  const [filters, setFilters] = useState<FilterOptions>({});
  const all = useMemo(() => loadTemplates(), []);
  const templates = useMemo(() => /* combine search + filter */ , [all, filters]);
  ```
- **Edge cases:** When large numbers of templates exist (50+), consider server-side pagination and querying `/api/templates`.

---

## `app/(editor)/design/[templateId]/page.tsx` (FULL detail)
- **Responsibility:** The editor orchestration component. This is a client component and should be marked `"use client"`.
- **Exact imports:**
  ```ts
  'use client';
  import React, { useReducer, useRef, useState, useCallback } from 'react';
  import { useParams } from 'next/navigation';
  import CanvasStage from '@/components/editor/CanvasStage';
  import EditorSidebar from '@/components/editor/EditorSidebar';
  import EditorTopbar from '@/components/editor/EditorTopbar';
  import LayerList from '@/components/editor/LayerList';
  import PropertyPanel from '@/components/editor/PropertyPanel';
  import { loadTemplate } from '@/lib/templates';
  import { downloadPNG, downloadPDF } from '@/lib/pdf';
  import type { CardTemplate, KonvaNodeDefinition } from '@/types/template';
  ```
- **State & reducer signature (import from `types/editor.ts`):**
  ```ts
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  ```
- **Handlers passed to children:**
  - `CanvasStage` props: `{ template: state.pages[state.current], selectedIndex, onSelectNode, onNodeChange }`.
  - `EditorSidebar` props: `{ addText, addRect, addImage, undo, redo, exportPNG, exportPDF, addPage, removePage, gotoPage }`.
  - `EditorTopbar` props: `{ undo, redo, exportPNG, exportPDF, saveDesign, currentPage, pageCount }`.
  - `LayerList` props: `{ layers, selectedIndex, onSelectLayer, onMoveUp, onMoveDown, onToggleVisible, onToggleLock }`.
- **Save/export:** `saveDesign()` serializes the stage/state (use `konvaUtils.stageToJSON(stageRef.current)`) and `fetch('/api/design', { method: 'POST', body: JSON.stringify(payload) })`.
- **Edge cases:** When `loadTemplate` throws — show a friendly 404 UI.

---

## `components/editor/CanvasStage.tsx` (very detailed)
- **Responsibility:** Render the Konva Stage and layers. Provide a fast, memoized rendering pipeline and a single Transformer instance for selection. Support image caching and well-typed event handlers.
- **File header (must be `"use client"`):**
  ```tsx
  'use client';
  import React, { forwardRef, useRef, useEffect, useCallback, memo } from 'react';
  import { Stage, Layer, Group, Rect, Text, Image as KonvaImage, Transformer, Circle } from 'react-konva';
  import Konva from 'konva';
  import type { CardTemplate, KonvaNodeDefinition } from '@/types/template';
  ```
- **Prop types (CanvasStageProps):**
  ```ts
  interface CanvasStageProps {
    template: CardTemplate;
    selectedIndex: number | null;
    onSelectNode: (node: KonvaNodeDefinition, index: number) => void;
    onNodeChange: (index: number, newProps: Partial<KonvaNodeDefinition['props']>) => void;
    enableSnapping?: boolean;
    zoom?: number;
  }
  ```
- **Memoized node components:** Define `TextNode`, `RectNode`, `ImageNode`, `CircleNode` as `React.memo` components that accept `node`, `index`, `selected`, `onSelect`, `onChange`.
- **Transformer handling:** Keep a single `Transformer` ref. On `selectedIndex` change, find node by id `stageRef.findOne('#node-<index>')` and call `transformer.nodes([...])`.
- **Event handling details:**
  - `onDragEnd`: call `onNodeChange(index, { x: e.target.x(), y: e.target.y() })`.
  - `onTransformEnd`: read `node.width()`, `node.scaleX()` etc., compute new width/height/fontSize and reset scales to 1.
  - `onDragMove` (if snapping enabled): call `alignmentHelpers.getSnapDelta(...)` and apply delta to `e.target.position()`.
- **Image caching utility:** Implement a small `useCachedImage(src)` that stores `HTMLImageElement` in a module-scoped cache object and returns it for `KonvaImage`.
- **Export signature:** Default export of `forwardRef<HTMLDivElement | Konva.Stage, CanvasStageProps>`.

**Important performance notes:**
- Use `key={node.id}` for nodes to preserve identity.
- Avoid passing new object literals as props (memoize handlers with `useCallback`).
- Use `Konva.FastLayer` for static background layers.

---

## `components/editor/EditorSidebar.tsx` (detailed)
- **Responsibility:** Tools to add nodes, upload assets, page controls, and quick change controls.
- **Props:**
  ```ts
  interface EditorSidebarProps {
    addText: () => void;
    addRect: () => void;
    addImage: (fileOrSrc: File | string) => void;
    undo: () => void;
    redo: () => void;
    exportPNG: () => void;
    exportPDF: () => void;
    addPage?: () => void;
    removePage?: () => void;
    pageCount?: number;
    currentPage?: number;
    gotoPage?: (i: number) => void;
  }
  ```
- **Upload behavior:** Use `<input type="file" accept="image/*" />` and `FileReader` to convert to dataURL; pass result to `addImage`.
- **Drag & Drop (future):** integrate `react-dropzone`.

---

## `components/editor/EditorTopbar.tsx` (detailed)
- **Responsibility:** Top toolbar for undo/redo/export/save and page navigation.
- **Props:**
  ```ts
  interface EditorTopbarProps {
    undo: () => void; redo: () => void;
    exportPNG: () => void; exportPDF: () => void;
    saveDesign: () => void;
    currentPage?: number; pageCount?: number;
  }
  ```
- **Keyboard shortcuts:** Bind `Ctrl+Z` and `Ctrl+Y` here using `useEffect` and `window.addEventListener('keydown', ...)`.

---

## `components/editor/LayerList.tsx` (detailed)
- **Responsibility:** Display list of layers with actions: select, move up/down, visibility toggle, lock toggle, delete.
- **Props & callbacks:**
  ```ts
  interface LayerListProps {
    layers: KonvaNodeDefinition[];
    selectedIndex: number | null;
    onSelectLayer: (i: number) => void;
    onMoveUp: (i: number) => void;
    onMoveDown: (i: number) => void;
    onToggleVisible: (i: number) => void;
    onToggleLock: (i: number) => void;
  }
  ```
- **UI notes:** Show thumbnails for image nodes (use the `src`), text summary for Text nodes (shortened text), and icons for types.

---

## `components/editor/PropertyPanel.tsx` (detailed)
- **Responsibility:** Show editable properties for the selected node.
- **Props:**
  ```ts
  interface PropertyPanelProps {
    node: KonvaNodeDefinition | null;
    onChange: (newProps: Partial<KonvaNodeDefinition['props']>) => void;
  }
  ```
- **Controls to include:**
  - For Text: text input, font family select, font size number input, bold/italic toggle (if implemented), alignment, letter spacing, color (use `react-colorful` color picker), opacity slider.
  - For Rect/Image/Circle: width/height (number), fill color, cornerRadius (for rect), opacity, visible/locked toggles, rotation.
- **Implementation notes:** Debounce numeric updates (e.g., `onChange` call after 100ms) to avoid flooding history.

---

## `components/templates/TemplateCard.tsx` & `TemplateGrid.tsx`
- **TemplateCard Props:** `{ template: CardTemplate; onEdit: (id: string) => void; }`
- **TemplateGrid Props:** `{ templates: CardTemplate[]; onEditTemplate?: (id: string) => void }`
- **Important:** Use `next/link` for click-to-edit or call `onEditTemplate` for JS navigation.

---

## `lib/templates.ts` (full contract)
- **Exports:**
  ```ts
  export function loadTemplates(): CardTemplate[];
  export function loadTemplate(id: string): CardTemplate;
  export function searchTemplates(query: string): CardTemplate[];
  export function filterTemplates(filters: TemplateFilterOptions): CardTemplate[];
  ```
- **Implementation notes:** Use static imports for template JSON (Next.js handles bundling). For large sets, switch to server-side scanning of `public/templates`.

---

## `lib/konvaUtils.ts`
- **Responsibility:** Stage serialization helpers, stage → cleaned JSON (for save), JSON → stage (for load), compute print-scale.
- **Exported signatures:**
  ```ts
  export function stageToJSON(stage: Konva.Stage): any; // returns safe JSON
  export function stageFromJSON(json: any, containerId: string): Konva.Stage;
  export function computePrintScale(options: { dpi: number; widthPx: number; widthMm?: number }): number;
  ```

---

## `lib/pdf.ts`
- **Responsibility:** Export helpers.
- **Exports & example usage:**
  ```ts
  export type ExportOptions = { format?: 'PNG'|'PDF'|'JPG'; dpi?: number; includeBleed?: boolean; cropMarks?: boolean };

  export function downloadPNG(stage: Konva.Stage, options?: ExportOptions): void;
  export function downloadPDF(stage: Konva.Stage, options?: ExportOptions): Promise<void>;
  ```
- **Implementation notes:** Use `stage.toDataURL({ pixelRatio })` to get high-DPI PNG, then embed into `jsPDF` for PDF. For CMYK conversion, prefer server-side conversion or a library that supports CMYK.

---

## `lib/alignmentHelpers.ts` (scaffold)
- **Responsibility:** Provide snap calculations and guide-line data.
- **Exported class signature:**
  ```ts
  export class AlignmentSystem {
    constructor(gridSize?: number);
    getSnapDelta(nodeBounds: Rect, otherNodesBounds: Rect[]): { dx: number; dy: number; guides: Guide[] };
  }
  ```

---

## `lib/pluginSystem.ts` (scaffold)
- **Responsibility:** Enable plugins to register node types and tools.
- **API:** `registerPlugin(plugin: EditorPlugin)`, `getPlugins()`.
- **Data types:** `EditorPlugin { id: string; name: string; nodeRenderers?: NodeRenderer[]; toolbarItems?: ToolItem[] }`.

---

## `app/api/templates/route.ts`
- **Responsibility:** Server route returning JSON list of templates. Accepts query params for `search`, `category`, `orientation`.
- **Contract:**
  - `GET /api/templates` -> 200 OK `{ templates: CardTemplate[] }` or 204 if none.
  - Query string: `?search=...&category=...&orientation=horizontal|vertical`.
- **Edge cases:** Return 400 for invalid query params.

**Example (Next.js Route handler):**
```ts
import { NextResponse } from 'next/server';
import { loadTemplates, searchTemplates, filterTemplates } from '@/lib/templates';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || undefined;
  const orientation = url.searchParams.get('orientation') || undefined;
  let templates = loadTemplates();
  if (search) templates = searchTemplates(search);
  // then filter by category/orientation
  // return as JSON
  return NextResponse.json({ templates });
}
```

---

# 3. Type definitions (full)

Put this file at `types/template.ts` (copy exact):
```ts
export type Orientation = 'horizontal'|'vertical';

export type NodeCommonProps = {
  x?: number; y?: number; width?: number; height?: number; rotation?: number;
  opacity?: number; visible?: boolean; locked?: boolean;
  stroke?: string; strokeWidth?: number;
  shadowColor?: string; shadowBlur?: number; shadowOffsetX?: number; shadowOffsetY?: number;
  cornerRadius?: number | number[];
};

export type TextProps = NodeCommonProps & { text: string; fontSize?: number; fontFamily?: string; fill?: string; align?: 'left'|'center'|'right'; letterSpacing?: number };
export type RectProps = NodeCommonProps & { fill?: string };
export type ImageProps = NodeCommonProps & { src?: string; objectFit?: 'cover'|'contain' };
export type CircleProps = NodeCommonProps & { radius?: number; fill?: string };

export type KonvaNodeDefinition =
  | { id: string; type: 'Text'; props: TextProps; editable?: boolean }
  | { id: string; type: 'Rect'; props: RectProps; editable?: boolean }
  | { id: string; type: 'Image'; props: ImageProps; editable?: boolean }
  | { id: string; type: 'Circle'; props: CircleProps; editable?: boolean }
  | { id: string; type: string; props: NodeCommonProps & Record<string, any>; editable?: boolean };

export interface CardTemplate {
  id: string; name: string; width: number; height: number; thumbnail?: string; preview?: string;
  tags?: string[]; category?: string; industry?: string[]; colors?: string[]; orientation?: Orientation; features?: string[];
  layers: KonvaNodeDefinition[];
}
```

Editor runtime types in `types/editor.ts` (full):
```ts
import { CardTemplate, KonvaNodeDefinition } from './template';

export type EditorState = {
  pages: CardTemplate[];
  current: number;
  history: string[]; // serialized pages arrays
  historyIndex: number;
};

export type EditorAction =
  | { type: 'SET_PAGES'; pages: CardTemplate[]; current?: number }
  | { type: 'UPDATE_NODE'; page: number; index: number; props: Partial<KonvaNodeDefinition['props']> }
  | { type: 'ADD_NODE'; page: number; node: KonvaNodeDefinition }
  | { type: 'MOVE_NODE'; page: number; from: number; to: number }
  | { type: 'ADD_PAGE'; page: CardTemplate }
  | { type: 'REMOVE_PAGE'; index: number }
  | { type: 'SET_CURRENT'; index: number }
  | { type: 'UNDO' }
  | { type: 'REDO' };
```

---

# 4. Template JSON spec (exhaustive)

**File path:** `public/templates/{template-id}.json`

**Root fields:**
- `id` (string, required): unique id (e.g., `template_01`).
- `name` (string, required): display name.
- `width` (number, required): canvas width in pixels (e.g., 1050 for 3.5" @ 300dpi).
- `height` (number, required): canvas height in pixels.
- `thumbnail` (string, optional): small preview path.
- `preview` (string, optional): high-res preview path.
- `tags` (string[], optional).
- `category` (string, optional): one of `templateCategories` keys.
- `colors` (string[], optional): palette hex strings.
- `orientation` (string, optional): `horizontal` | `vertical`.
- `features` (string[], optional).
- `layers` (array of node objects) — required.

**Node object (layer) fields:**
- `id` (string, required)
- `type` (string): `Text`, `Rect`, `Image`, `Circle`, ...
- `props` (object): shape depends on `type` (see types above)
- `editable` (boolean, optional): whether user can edit
- `visible` (boolean, optional)
- `locked` (boolean, optional)

**Example (full) - `template-01.json`:** (see Appendix earlier in this doc)

---

# 5. API routes: contract and examples

### `GET /api/templates`
- Query params: `search`, `category`, `orientation`.
- Success 200 JSON:
  ```json
  { "templates": [ { /* CardTemplate */ } ] }
  ```
- Errors: 400 for invalid params, 500 for server error.

### `POST /api/upload`
- Accepts multipart/form-data with field `file`.
- Returns 201 with JSON: `{ "url": "/uploads/abc.png" }` or base64 data.`

### `POST /api/design` (save)
- Body: `{ "title": "My Card", "templateId": "template_01", "data": { /* stage JSON */ } }`
- Returns: 201 `{ "id": "design_1234", "url": "/designs/design_1234" }`

### `GET /api/design/:id` (load)
- Returns 200 `{ "id": "design_1234", "data": { /* stage JSON */ } }` or 404 if not found.

Security: In production, require authentication for saving; sanitise uploads.

---

# 6. Component interaction diagrams (textual)

### Template Gallery flow
1. `app/(templates)/page.tsx` calls `loadTemplates()` → returns `CardTemplate[]`.
2. `TemplateFilters` emits filter changes (`onChange`) → parent recomputes `filtered = filterTemplates(opts)`.
3. `TemplateGrid` receives `filtered` and renders `TemplateCard` components.
4. `TemplateCard` Edit button → navigates to `/editor/design/${template.id}`.

### Editor flow (detailed)
1. URL load `editor/design/:templateId` → page loads template via `loadTemplate(templateId)`.
2. Initialize `EditorState` with pages = [template]. Serialize initial state to history[0].
3. `CanvasStage` renders `template.layers`.
4. User clicks a node → `CanvasStage.onSelectNode(node, index)` → page sets `selectedIndex`.
5. `PropertyPanel` shows node props; edit → `onChange` calls `dispatch({ type: 'UPDATE_NODE', page: current, index, props })`.
6. Reducer updates `pages`, appends serialized state to `history`, increments `historyIndex`.
7. `CanvasStage` receives new `template` prop and updates just the changed node (memoization avoids full re-render).
8. Export: `EditorTopbar` triggers `lib/pdf.downloadPDF(stageRef.current, options)`.

---

# 7. Editor lifecycle and state flow (reducer & history)

**Reducer responsibilities:**
- Manage pages array.
- Apply local edits (UPDATE_NODE) immutably and push history snapshot.
- Handle UNDO/REDO by deserializing history entry.

**History snapshot strategy:**
- Snapshot = `JSON.stringify(state.pages)` (or better: JSON.stringify(single page to reduce size).
- On `UPDATE_NODE` or `ADD_NODE`: push new snapshot if last snapshot != current snapshot.
- Keep history max length (e.g., 100 entries) to bound memory.

**Undo/Redo algorithm:**
- `UNDO`: if `historyIndex > 0`, `historyIndex--`, parse `history[historyIndex]` and set `pages` to parsed value.
- `REDO`: if `historyIndex < history.length - 1`, `historyIndex++`, parse.

**Optimizations:** Use `immer` in reducer to make edits easier and avoid accidental mutation.

---

# 8. Integration points for future features

- **alignmentHelpers.ts**: used by `CanvasStage.onDragMove` to compute snapping deltas.
- **pluginSystem.ts**: used by `EditorSidebar` to show plugin-provided tools.
- **konvaUtils.stageToJSON**: used by `app/api/design` save endpoint to store canonical version.
- **lib/pdf**: extend to handle print presets and color space conversions.

---

# 9. Tailwind / CSS conventions (required tokens)

Add to `tailwind.config.js` under `theme.extend.colors`:
```js
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'panel-bg': '#F9FAFB',
        'canvas-bg': '#F3F4F6',
        border: '#D1D5DB'
      }
    }
  }
}
```

Define utility classes used in components (globals.css): `.btn-primary`, `.card`, `.input-field`.

---

# 10. package.json (recommended dependencies)

Use this `dependencies` block to ensure all features work (copy into your package.json):
```json
"dependencies": {
  "clsx": "^2.1.1",
  "konva": "^10.4.0",
  "next": "^16.0.3",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-konva": "^19.2.0",
  "use-image": "^1.1.4",
  "jsPDF": "^3.0.3",
  "immer": "^10.0.0",
  "framer-motion": "^10.0.0",
  "react-colorful": "^5.6.1",
  "pica": "^9.0.1",
  "react-dropzone": "^14.2.3",
  "lodash": "^4.17.21",
  "uuid": "^9.0.0"
}
```

DevDependencies (TypeScript & Tailwind):
```json
"devDependencies": {
  "typescript": "^5",
  "tailwindcss": "^4.1.17",
  "postcss": "^8",
  "autoprefixer": "^10"
}
```

---

# 11. Testing & debugging checklist + common fixes

**When starting the app:**
- `npm install` → `npm run dev`.
- If Tailwind error `Cannot apply unknown utility class 'bg-primary'`: ensure `tailwind.config.js` defines `primary` color; or replace `bg-primary` with `style={{ background: 'var(--primary)' }}`.

**Common errors & fixes:**
- `Argument of type '{}' is not assignable to parameter of type '...'`: check props interfaces match between use-site and component; update component prop interface.
- `templates.map is not a function`: ensure `loadTemplates()` returns an array, not an object.
- `Element type is invalid`: check default vs named exports in TemplateCard/TemplateGrid.
- `Cannot find module '@/public/templates/...json'`: Next.js requires importing JSON from `public` using relative paths or static JSON under `src`; prefer importing from `public` at compile-time with `import template from '@/public/templates/template-01.json'`.

**Manual tests:**
- Create a template, open editor, add text, move, change font size, export PDF, then check image DPI using image properties.

---

# 12. File creation checklist — exact files & copy/paste order

To upgrade your repo to the advanced plan, paste the following files in order (this reduces TypeScript mismatch errors):
1. `types/template.ts` (full types)
2. `types/editor.ts` (editor reducer/action types)
3. `lib/templateCategories.ts` (constants)
4. `lib/templates.ts` (loader + helpers)
5. `public/templates/template-01.json` (example template) + small thumbnails
6. `components/templates/TemplateFilters.tsx`
7. `components/templates/TemplateGrid.tsx` (updated)
8. `components/templates/TemplateCard.tsx` (ensure default export)
9. `components/editor/CanvasStage.tsx` (upgraded; memoized nodes)
10. `components/editor/PropertyPanel.tsx` (connects to types)
11. `components/editor/EditorSidebar.tsx` (props updated)
12. `components/editor/EditorTopbar.tsx`
13. `components/editor/LayerList.tsx`
14. `lib/konvaUtils.ts` (scaffolding)
15. `lib/pdf.ts` (scaffolding)
16. `app/(templates)/page.tsx` (gallery wiring)
17. `app/(editor)/design/[templateId]/page.tsx` (editor — large file)
18. `app/api/templates/route.ts`
19. `app/globals.css` and `tailwind.config.js` update

After pasting: run `npm run dev` and fix type errors iteratively (most will be prop mismatches). Use this document as the reference.

---

# Appendix: Example template (complete copy)
Place as `public/templates/template-01.json`:
```json
{
  "id": "template_01",
  "name": "Minimalist Horizontal",
  "width": 1050,
  "height": 600,
  "thumbnail": "/templates/thumb_01.png",
  "preview": "/templates/preview_01.png",
  "tags": ["minimalist", "modern"],
  "category": "minimal",
  "colors": ["#000000", "#2563EB"],
  "orientation": "horizontal",
  "features": ["Logo Ready"],
  "layers": [
    {"id":"bg_rect","type":"Rect","props":{"x":0,"y":0,"width":1050,"height":600,"fill":"#ffffff"},"editable":false},
    {"id":"logo_rect","type":"Rect","props":{"x":900,"y":60,"width":120,"height":120,"fill":"#2563EB","cornerRadius":12},"editable":false},
    {"id":"text_01","type":"Text","props":{"x":60,"y":60,"text":"Your Name","fontSize":36,"fill":"#000000","fontFamily":"Arial","width":600,"height":48},"editable":true},
    {"id":"text_02","type":"Text","props":{"x":60,"y":120,"text":"Your Title","fontSize":22,"fill":"#555555","fontFamily":"Arial","width":600,"height":38},"editable":true},
    {"id":"rect_01","type":"Rect","props":{"x":60,"y":180,"width":420,"height":2,"fill":"#E5E7EB"},"editable":false}
  ]
}
```

---

## Final notes
This document is intentionally exhaustive. If you want, I will now:
- (1) generate the actual concrete code files for Phase 1 and place them in the canvas ready to copy/paste; **or**
- (2) produce a downloadable `ARCHITECTURE.md` file and a ZIP containing template JSONs + thumbnails.

Tell me **(1)** or **(2)** and I will run the requested action immediately. If you want the code files, tell me which file to start with — I'll produce them in the exact path and with TypeScript code that integrates with the rest of this architecture.

