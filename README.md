# Cardify – Digital Business Card Builder

A modern, high‑performance **React + Next.js** business card designer featuring:

* A fully interactive **drag‑and‑drop editor** powered by *React-Konva*
* **Template-based design system** using JSON files
* **TailwindCSS UI**
* Multi‑page designs, asset uploads, and export tools (PNG/PDF)

This README serves as the complete project guide.

---

## 🚀 Features

* 🎨 **Interactive Canvas Editor** (drag, resize, rotate, edit text)
* 📄 **Template System** powered by JSON files
* 🗂️ **Multi‑Page Support** (front/back business cards)
* 🖼️ **Image Uploads** for profile photos, logos, etc
* ↕️ **Layer Reordering** (z-index manipulation)
* 💾 **Export PNG** & **Export PDF**
* 🔄 **Undo / Redo** History System
* 📱 **Responsive Layout** for all screen sizes
* 💨 Fast UI using **TailwindCSS** and **Next.js App Router**

---

## 📁 Project Structure

```
cardify/
├─ app/
│  ├─ (landing)/
│  │  └─ page.tsx
│  ├─ (editor)/
│  │  └─ design/[templateId]/page.tsx
│  ├─ layout.tsx
│  └─ globals.css
├─ components/
│  ├─ editor/CanvasStage.tsx
│  ├─ editor/EditorSidebar.tsx
│  ├─ editor/Toolbar.tsx
│  ├─ ui/... (shared UI components)
├─ lib/
│  ├─ templates.ts
│  ├─ export.ts
│  ├─ history.ts
├─ public/
│  ├─ templates/
│  │  ├─ template-01.json
│  │  ├─ template-02.json
│  │  ├─ thumb_01.png
│  │  ├─ thumb_02.png
├─ types/
│  └─ template.d.ts
├─ package.json
└─ README.md
```

---

## 🧩 Key Concepts

### 1. Templates (JSON‑based)

Templates define how a business card looks.
Each template includes:

* Card size (width/height)
* Orientation
* Thumbnail
* Layers (Text, Rect, Image, etc)
* Editable properties

Example:

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
        "fontFamily": "Arial"
      },
      "editable": true
    }
  ]
}
```

---

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/cardify.git
cd cardify
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Access the app at:

```
http://localhost:3000
```

---

## 🖥️ Development Workflow

### Landing Page

Located in:

```
app/(landing)/page.tsx
```

Displays the template library.

### Editor Page

```
app/(editor)/design/[templateId]/page.tsx
```

Loads the template and initializes:

* CanvasStage
* EditorSidebar
* Toolbar
* Undo/Redo
* PageManager

---

## 🎨 Canvas Editing

The editor supports:

* Selecting layers
* Transforming (drag, resize, rotate)
* Editing text
* Changing colors, font, alignment
* Reordering nodes (z‑index)
* Deleting nodes
* Uploading image layers

Canvas engine: **React-Konva + Konva**.

---

## 📚 Library Imports

### Templates Loader

```
import { loadTemplates, loadTemplate } from "@/lib/templates";
```

### Canvas Renderer

```
import CanvasStage from "@/components/editor/CanvasStage";
```

### Sidebar Controller

```
import EditorSidebar from "@/components/editor/EditorSidebar";
```

---

## 📤 Exports (PNG/PDF)

PNG uses:

```
stage.toDataURL()
```

PDF uses:

```
pdf-lib
```

(Generated internally from canvas export)

---

## 🔄 Undo / Redo System

Implemented in:

```
lib/history.ts
```

Uses a simple pointer‑based stack system.

---

## 🧪 Adding New Templates

1. Create a JSON file under:

```
public/templates/template-XX.json
```

2. Add thumbnail under:

```
public/templates/thumb_XX.png
```

3. Register template in:

```
lib/templates.ts
```

---

## 🚧 Roadmap

* [ ] AI‑Generated Business Card Designs
* [ ] Save Projects to Cloud
* [ ] Team Collaboration
* [ ] Export SVG
* [ ] Custom Fonts Upload
* [ ] Smart Element Snapping / Alignment Guides

---

## 🤝 Contribution

Pull requests are welcome!

To contribute:

1. Fork the repo
2. Create a feature branch
3. Submit PR with clear description

---

## 📜 License

MIT License – free to use for personal & commercial projects.

---

## ⭐ Support

If you like this project, please star the repository 💙

Thank you for using **Cardify**!
