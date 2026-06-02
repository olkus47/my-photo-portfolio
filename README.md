# Minimalist Photo Portfolio Website

A clean, premium, and minimalistic photo portfolio website. It features an organic masonry grid, category filtering, a persistence-enabled dark/light theme, and an immersive touch-enabled fullscreen lightbox.

This project is built using vanilla HTML, CSS, and JS. **It requires no complex build systems, bundle stages, or npm installations.** It is designed to work out of the box.

---

## 📂 Project Structure

```text
my-photo-portfolio/
├── photos/             <-- Add your image files here (.jpg, .png, .webp)
├── index.html          <-- Main webpage
├── styles.css          <-- Custom styles & responsiveness
├── app.js              <-- Layout & interaction logic
├── gallery-data.js     <-- Automatically syncs photos & holds your bio
├── sync.js             <-- Node script to auto-generate gallery config
└── README.md           <-- Documentation (this file)
```

---

## ⚡ How to Add Photos

Adding photos is incredibly simple and takes two steps:

1. **Drop your photos** inside the `photos/` folder.
2. **Run the synchronization script** in your terminal:
   ```bash
   node sync.js
   ```

The script scans your `photos/` directory, detects new photos, and adds them to `gallery-data.js` while keeping your existing configuration and written metadata intact!

---

## ⚙️ Customizing the Portfolio

To edit details, open the auto-generated `gallery-data.js` file:

### 1. Photographer Bio & Socials
At the top of the file, customize your name, title, bio, and social profile links. Social links will automatically render as clean navigation items in the header if they have a URL:

```javascript
const GALLERY_CONFIG = {
  photographerName: "Alex Mercer",
  photographerTitle: "Visual Artist & Photographer",
  photographerBio: "Capturing the interplay of light, geometry, and human stories in urban spaces and natural landscapes.",
  socialLinks: {
    instagram: "https://instagram.com/yourprofile",
    email: "mailto:yourname@example.com",
    unsplash: "https://unsplash.com/@yourprofile"
  },
  ...
```

### 2. Photo Captions, Categories, and Camera Settings
Each photo in the `photos` list has metadata that you can change. Editing these properties will update how they display on hover and inside the fullscreen lightbox:

```javascript
  photos: [
    {
      id: "photo_1717316719_3e512",
      src: "photos/my_photo.jpg",
      title: "My Photo Title",                  // Displayed in lightbox and hover
      category: "Architecture",                 // Used for filters (All, Architecture, etc.)
      description: "A description of the scene.", // Text in lightbox
      cameraSettings: "Sony A7 IV • 85mm • f/1.4" // EXIF info (Optional)
    }
  ]
```
> **Note**: Running `node sync.js` will **never** overwrite your titles, descriptions, categories, or camera settings for photos already in the list. It will only add new files or clean up photos you have deleted from the `photos/` folder.

---

## 🖥️ Running & Previewing Locally

There are two easy ways to view the website on your machine:

### Option A: Double-Click (Zero Setup)
Since the app loads configuration via standard `<script>` imports instead of network fetches, you can simply **double-click the `index.html` file** to open it directly in any browser. It will load completely with zero local server requirements!

### Option B: Local Web Server (Recommended)
To run a local development server with standard networking:
* **Python**: Open a terminal in the folder and run:
  ```bash
  python -m http.server 8000
  ```
  Then open `http://localhost:8000` in your browser.
* **Node (npx)**: Run:
  ```bash
  npx live-server
  ```
