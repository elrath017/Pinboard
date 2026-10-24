# 📌 Pinboard — Neo-Brutalist Visual Canvas & Daily Tasks

A responsive, single-page web app built with **React**, **Vite**, and **Tailwind CSS**, styled in a vibrant **Neo-Brutalist** aesthetic.

---

## 🎨 Visual Theme (Neo-Brutalist Look)

- **Soft Canvas Background**: Light off-white / lavender tint (`#faf8ff`) with a subtle pinboard dot-grid pattern.
- **Thick Solid Black Borders**: `2.5px` to `3px` solid black borders on all cards, buttons, inputs, and modals.
- **Hard Offset Shadows**: `4px 4px 0 #000` (and `5px 5px 0 #000` / `8px 8px 0 #000`) with **zero blur**.
- **Primary & Secondary Palette**:
  - Primary: Bold Purple (`#8b5cf6` / `#7c3aed`)
  - Accent: Warm Yellow/Amber (`#fde047` / `#facc15`)
  - Highlights: Pink (`#f472b6`), Mint (`#86efac`), Sky (`#93c5fd`)
- **Interactive Tactile Micro-Interactions**:
  - Buttons translate `2px` on hover (shadow shrinks to `2px 2px 0 #000`)
  - On active/click, buttons "press in" by `4px` (`shadow: none`)
- **Branded Header**: Styled as **Pin** (black) + **board** (purple `#8b5cf6`).
- **Notice Board Elements**:
  - Organic slight rotations (`-2°` to `+2°`)
  - Washi tape strips and colored pushpins with black outlines on top of cards.

---

## 🚀 Key Features

### 1. 📌 Notice Board & Image Management
- **Multi-Image Upload & Drag & Drop**:
  - Upload multiple images at once via the "+ Add Image" modal.
  - Drag and drop image files directly anywhere onto the screen or modal.
  - Automatic client-side canvas compression/resizing (max 1400px, 85% quality) to prevent browser storage bloat.
- **Card Actions & Lightbox**:
  - Click any card to open a full-size neo-brutalist **Lightbox Modal**.
  - Edit captions directly inline on the card or in the lightbox.
  - Delete with a two-step confirmation (`Delete? [✓] [✕]`) to prevent accidental deletion.
  - Reorder cards by dragging and dropping them on the board.
- **Persistent Storage**:
  - High-res images and pins are stored in browser **IndexedDB** for reliability.
  - Fast instant load with pre-populated sample architecture & design diagrams.

### 2. 📅 Today's Tasks Square (Top-Right Corner)
- **Top-Right Fixed Widget**:
  - ~300px wide neo-brutalist card with today's live date and daily completion streak (`🔥 3d`).
  - Snappy animated checkboxes with strike-through and progress counter (`3/5 done`) with a progress bar.
- **Daily Refresh Logic**:
  - Tasks persist in `localStorage`.
  - When a new day arrives (detected automatically on load and at midnight), all checkmarks reset to unchecked.
  - **Repeat Daily vs Today Only Toggle**:
    - `Repeat Daily`: Resets to unchecked each morning.
    - `Today Only`: Automatically cleaned up after the day ends.
  - **Simulate Tomorrow Button**: Includes a `"Simulate tomorrow"` button to test the daily rollover mechanism instantly without changing system time.
- **Mobile Responsive Drawer**:
  - Collapsible on desktop.
  - On mobile, transitions into a header badge button that slides out a dedicated drawer panel.

### 3. 💾 Backup & Data Portability
- **JSON Export**: Download all your image pins, daily tasks, and streak history as a single `.json` file.
- **JSON Import**: Upload any backup file to restore your entire board state instantly.

---

## 🛠️ Tech Stack

- **React 18** + **TypeScript**
- **Vite 6** (lightning-fast HMR and bundling)
- **Tailwind CSS 3** (configured with neo-brutalist shadows, borders, and color tokens)
- **Lucide React** (crisp neo-brutalist icons)
- **IndexedDB** (high-capacity client-side image storage)

---

## 💻 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build
```

Once running, navigate to **`http://localhost:5173/`** in your browser.
