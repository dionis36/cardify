# Cardify — Project Architecture & File Reference

**Purpose:**
This document is a single-source reference for the *Cardify* business-card designer project. It explains the file/folder structure, responsibilities of each file, how files import each other, runtime/data flow, developer conventions, and a testing checklist. If you (or another developer) upload this file into a new ChatGPT conversation, the assistant can use it to continue work with full context.

---

## Table of contents
1. Project tree (visual)
2. High-level overview
3. Detailed file list (by folder) — responsibilities + common imports
4. Types and data shapes
5. Data flow & runtime lifecycle
6. How components communicate (props & events)
7. API routes (server-side behavior)
8. Development & testing checklist
9. Performance & future features roadmap

---

## 1) Project tree (visual)

```
cardify/
│
├── app/
│   ├── globals.css
│   ├── layout.tsx             # app root layout (shared UI wrapper)
│   ├── page.tsx               # landing page
│   │
│   ├── (templates)/
│   │     └── page.tsx         # template gallery page
│   │
│   ├── (editor)/
│   │     └── design/
│   │           └── [templateId]/
│   │                 └── page.tsx   # editor page (dynamic route)
│   │
│   └── api/
│         ├── templates/       # GET list of templates
│         │    └── route.ts
│         ├── design/          # save/load design (POST/GET)
│         │    └── route.ts
│         └── upload/          # image upload (demo/placeholder)
│              └── route.ts
│
├── components/
│   ├── editor/
│   │     ├── CanvasStage.tsx      # Konva Stage + rendering of nodes
│   │     ├── EditorSidebar.tsx    # tools (add text, shapes, upload, pages)
│   │     ├── EditorTopbar.tsx     # undo/redo/export/save controls
│   │     ├── LayerList.tsx        # list & reorder layers
│   │     └── PropertyPanel.tsx    # edit properties of selected node
│   │
│   ├── templates/
│   │     ├── TemplateCard.tsx     # small card preview for a template
│   │     └── TemplateGrid.tsx     # grid wrapper for gallery
│   │
│   └── ui/
│         ├── Button.tsx
│         ├── Input.tsx
│         ├── Card.tsx
│         └── Modal.tsx
│
├── lib/
│   ├── templates.ts               # template loader / map / helpers
│   ├── konvaUtils.ts              # serialization / deserialization helpers
│   └── pdf.ts                     # export helpers (PNG -> PDF)
│
├── public/
│   └── templates/                 # template JSON files & thumbnails
│        ├── template-01.json
│        ├── template-02.json
│        ├── thumb_01.png
│        └── thumb_02.png
│
├── types/
│   ├── template.ts                # CardTemplate & KonvaNodeDefinition
│   └── editor.ts                  # Editor state / action types
│
├── package.json
└── tailwind.config.js
```

---

## 2) High-level overview

**Core idea:** Cardify provides a template gallery and an in-browser editor using Konva (react-konva). Templates are stored as JSON (Konva-like nodes). The editor loads a template, allows editing (add/move/resize text, shapes, images), supports multi-page documents, exports PNG/PDF, and has simple upload & save endpoints.

**Primary layers:**
- `app/` — Next.js pages and API routes (App Router). Editor page is dynamic and client-heavy.
- `components/` — UI & editor building blocks.
- `lib/` — shared runtime helpers (template loader, export utils).
- `public/templates/` — static template JSON and assets.
- `types/` — TypeScript shapes that everything relies on.

---

## 3) Detailed file list (by folder)

### `app/`
- `globals.css` — Tailwind base + semantic color variables. Imported by `layout.tsx`.
- `layout.tsx` — App root layout wrapping pages (header, footer, global providers).
- `page.tsx` — Landing page (marketing + CTA linking to template gallery).

**(templates)/page.tsx**
- Renders the template gallery. It fetches templates (either via `lib/loadTemplates()` or calls `/api/templates`). Imports `TemplateCard` and `TemplateGrid`.
- Expected to call `loadTemplates()` or fetch `/api/templates` which returns `CardTemplate[]`.

**(editor)/design/[templateId]/page.tsx**
- Main editor page. Client component.
- Responsibilities:
  - read `useParams()` to get `templateId` (URL param)
  - call `loadTemplate(templateId)` to get initial `CardTemplate`
  - manage editor state (pages array via `useReducer`), selected node, history stacks
  - pass handlers to `EditorSidebar`, `CanvasStage`, `LayerList`, and `EditorTopbar`
  - wire export/save functions (calls to `lib/pdf` or API `POST /api/design`)

**API routes**
- `app/api/templates/route.ts` — returns `CardTemplate[]`. Implementation usually reads `lib/templates` map or reads JSON files under `public/templates`.
- `app/api/upload/route.ts` — demo endpoint for image uploads; in production you'd use S3 or similar.
- `app/api/design/route.ts` — (optional) save/load designs; for a demo it can return success or store to local filesystem if running server-side.


### `components/editor/`
- `CanvasStage.tsx` — **the most performance-sensitive component**. Contains:
  - `Stage` + `Layer` from `react-konva`
  - memoized child node components (ImageNode, TextNode, RectNode)
  - a single `Transformer` used for selected node
  - `onNodeChange` callbacks (drag/transform events) call back to the parent editor state reducer
  - Exports `default` as a forwardRef React component

- `EditorSidebar.tsx` — UI tools for adding text/rect/images, image upload input, color/fill options, and page controls. Receives handlers from the page.

- `EditorTopbar.tsx` — top toolbar for undo/redo, export, save. Receives `undo/redo/exportPNG/exportPDF/saveDesign` callbacks.

- `LayerList.tsx` — shows a vertical list of layers for the current page, supports `onMoveUp`/`onMoveDown` and select. Good candidate for virtualization later.

- `PropertyPanel.tsx` — shows the selected node's editable properties (text string, fontSize, color, width/height) and calls `onChange`.


### `components/templates/`
- `TemplateCard.tsx` — small card UI used in the gallery. Accepts `template: CardTemplate` and an `onEdit` callback.
- `TemplateGrid.tsx` — grid wrapper. Two patterns existed: either grid receives `templates` and maps internally OR it accepts `children`. Keep one consistent pattern.


### `components/ui/`
- small presentational components (Button, Input, Card, Modal) used across the app. Keep these minimal and side-effect-free.


### `lib/`
- `templates.ts` — exports `loadTemplates(): CardTemplate[]` and `loadTemplate(id: string): CardTemplate`. Implementation: imports static JSON files from `/public/templates` and maps them into a `Record<string,CardTemplate>` so editor can look up by id.
- `konvaUtils.ts` — helpers to convert Konva stage to/from JSON (serialization), clone node props, reconcile props — helpful for save/load.
- `pdf.ts` — `downloadPNG(stage)` and `downloadPDF(stage)` helpers. Client-side uses `stage.toDataURL({ pixelRatio })` then `jsPDF` to produce PDF.


### `public/templates/`
- Each `template-XX.json` is a `CardTemplate` JSON (see `types/template.ts`). Include `thumbnail` path and consistent `id`.


### `types/`
- `template.ts` — contains:
  - `type KonvaNodeType = "Rect" | "Text" | "Image"`;
  - `interface KonvaNodeDefinition { id: string; type: KonvaNodeType; props: any; editable?: boolean }`
  - `interface CardTemplate { id: string; name: string; width: number; height: number; layers: KonvaNodeDefinition[]; thumbnail?: string; tags?: string[]; orientation?: 'horizontal'|'vertical' }`

- `editor.ts` — editor runtime types (undo/redo stacks, EditorState, NodePropsChange). Use `useReducer` action types here.

---

## 4) Types & data shapes (examples)

**CardTemplate (JSON)**
```json
{
  "id":"template_01",
  "name":"Minimalist Horizontal",
  "width":1050,
  "height":600,
  "thumbnail":"/templates/thumb_01.png",
  "layers":[
    {"id":"text_01","type":"Text","props":{"x":50,"y":50,"text":"Your Name","fontSize":36,"fill":"#000"},"editable":true}
  ]
}
```

**Konva props** — `node.props` should be shaped to match the expected attributes for `Rect`, `Text`, or `Image` used by `react-konva`. Keep consistent keys (`x`, `y`, `width`, `height`, `rotation`, `fontSize`, `fill`, `fontFamily`, `src`, etc.).

---

## 5) Data flow & runtime lifecycle (Editor)

1. **Route load**: User opens `/editor/design/:templateId` → `page.tsx` (client) calls `loadTemplate(templateId)`.
2. **Initial state setup**: Page initializes `useReducer` with `pages: [loadedTemplate]` and `current: 0`.
3. **User interactions**:
   - **Add Node**: Sidebar handler dispatches `ADD_NODE` → reducer updates only current page's `layers` → page re-renders and passes updated `template` to `CanvasStage`.
   - **Select Node**: CanvasStage calls `onSelectNode(node, index)` → page sets `selectedIndex` state and renders `PropertyPanel` with node props.
   - **Edit Node**: PropertyPanel calls `onChange` → page dispatches `UPDATE_NODE` (or calls `onNodeChange` debounced) → only that node is updated.
   - **Reorder Layers**: LayerList calls `onMoveUp`/`onMoveDown` → page dispatches `MOVE_NODE` and updates selection accordingly.
4. **Export/Save**: Topbar calls `exportPNG` or `exportPDF` that uses `stageRef.current.toDataURL()` and `jsPDF` for PDF.
5. **Save to backend**: `saveDesign` can POST the current stage JSON and image assets to `/api/design`.

---

## 6) Component communication patterns

- **CanvasStage** ⇄ **EditorPage**
  - Props into CanvasStage: `template`, `selectedIndex`, `onSelectNode`, `onNodeChange`.
  - Canvas emits selection and node changes via callbacks; editor updates reducer state.

- **EditorSidebar** ⇄ **EditorPage**
  - Sidebar receives handlers like `addText`, `addRect`, `addImage`, `addPage`, `removePage`, `gotoPage`.
  - For uploads: Sidebar reads file input, passes `File` object to `addImage` handler (page transforms to data URL and dispatches `ADD_NODE`).

- **LayerList** ⇄ **EditorPage**
  - LayerList shows current page layers, allows selecting a layer (calls `onSelectLayer`) and reordering (calls `onMoveUp`/`onMoveDown`).

- **PropertyPanel** → **EditorPage**
  - PropertyPanel calls `onChange({ text, fontSize, fill })` and `EditorPage` dispatches `UPDATE_NODE`.


---

## 7) API routes (server-side behavior)

**`/api/templates`**
- `GET` returns `CardTemplate[]` (read static JSON via `lib/templates` or load all files in `public/templates`).

**`/api/upload`**
- `POST` receives multipart/form-data with an image file. For demo it can save to `public/uploads` (only in server dev) or return a base64 URL. In production use S3 or Cloudinary.

**`/api/design`**
- `POST` receives a JSON payload with `design` (Konva JSON) and metadata (title, owner). The server stores it in DB or FS and returns an ID. `GET /api/design/:id` returns saved JSON.

---

## 8) Development & testing checklist

### Before first run
- `npm install` or `yarn install` to install `react`, `next`, `react-konva`, `konva`, `jspdf`, `use-image`, `tailwindcss` etc.
- Tailwind config must include semantic colors (`primary`, `background`) used by components.

### Run locally
- `npm run dev` (Next.js) or `vite` if using Vite. For this project we use Next.js App Router.

### Smoke tests
- Landing page `/` renders.
- Template gallery `/templates` loads templates.
- Editor opens at `/editor/design/template_01` (replace with id from `lib/templates`).
- Add text, move, resize — property panel updates.
- Upload an image — appears on canvas.
- Export PNG/PDF downloads file.

### Unit / Integration suggestions
- Add tests for `lib/templates` (loadTemplates returns array, loadTemplate throws for unknown id).
- Snapshot test for `TemplateCard` and `TemplateGrid` components.

---

## 9) Performance & future roadmap

**Short-term**
- Implement `useReducer` (done) and memoize nodes (done in CanvasStage). Debounce transform updates.
- Virtualize `LayerList` for many layers.

**Mid-term**
- Server-side PDF rendering for print-quality (server uses headless Chrome or PDFKit).
- Authentication + user designs (DB + S3).

**Long-term**
- Collaboration (real-time editing using CRDT / WebSocket).
- Template marketplace & designer profiles.

---

## Appendix — Naming & conventions
- Files use `PascalCase` for React components.
- Default exports for components (consistent), named exports for helpers in `lib/`.
- Keep `id` values consistent (use `snake_case` like `template_01`) or normalize in `loadTemplate()`.

---

If you'd like, I can also export this document as a markdown file or PDF and place it into `docs/` inside the repo. Tell me which format you prefer.



---

## Addendum — `app/(landing)` directory

I omitted the `app/(landing)` area in the original export. Add this folder as the public-facing landing pages (homepage, about, pricing, features). Example structure:

```
app/
  (landing)/
    page.tsx         # public homepage (marketing, CTA)
    about/page.tsx   # optional about page
    pricing/page.tsx # optional pricing page
```

**Responsibilities of `app/(landing)/page.tsx`:**
- Serve the marketing homepage for Cardify (logo, short description, links to gallery and editor).
- Provide a prominent CTA ("Start Designing") that links to `/templates` or the gallery.
- Minimal client-side JS — mostly static content. Use `Link` from `next/link` for navigation to `/templates`.

**Example `app/(landing)/page.tsx` (simple):**

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold text-primary">Cardify</h1>
      <p className="mt-4 text-lg text-secondary max-w-2xl text-center">
        Create beautiful business cards in your browser — browse templates, customize, and export print-ready files.
      </p>

      <div className="mt-8 flex gap-4">
        <Link href="/templates" className="btn-primary px-6 py-3 rounded-lg">Browse Templates</Link>
        <Link href="/editor/design/template_01" className="px-6 py-3 border rounded-lg">Try Demo</Link>
      </div>
    </main>
  );
}
```

---

## Example `public/templates/template-01.json`

Here is a concrete example of a single template JSON (the same example you provided). Save this file as `public/templates/template-01.json` and ensure its `id` matches the key in `lib/templates.ts` (e.g. `template_01`).

```json
{
  "id": "template_01",
  "name": "Minimalist Horizontal",
  "width": 1050,
  "height": 600,
  "thumbnail": "/templates/thumb_01.png",
  "tags": ["minimalist", "modern"],
  "orientation": "horizontal",
  "layers": [
    {
      "id": "text_01",
      "type": "Text",
      "props": {
        "x": 50,
        "y": 50,
        "text": "Your Name",
        "fontSize": 36,
        "fill": "#000000",
        "fontFamily": "Arial",
        "width": 500,
        "height": 60
      },
      "editable": true
    },
    {
      "id": "text_02",
      "type": "Text",
      "props": {
        "x": 50,
        "y": 120,
        "text": "Your Title",
        "fontSize": 24,
        "fill": "#555555",
        "fontFamily": "Arial",
        "width": 500,
        "height": 48
      },
      "editable": true
    },
    {
      "id": "rect_01",
      "type": "Rect",
      "props": {
        "x": 900,
        "y": 500,
        "width": 120,
        "height": 50,
        "fill": "#2563EB",
        "cornerRadius": 5
      },
      "editable": false
    }
  ]
}
```

---

I updated the architecture doc with the landing folder notes and the sample template JSON. You can now upload this document into a new chat and I (or another assistant) will have full context of the project structure including the landing page and a sample template file. If you want, I can also export this markdown into `docs/ARCHITECTURE.md` in your repo — tell me if you want that and I will generate the file contents ready to paste into your repo.

