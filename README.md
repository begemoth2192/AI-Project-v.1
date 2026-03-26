# VOS — SelfArchitect

> *Understand yourself. Improve your life.*

A personality-based identity transformation app with AI mentoring, 3-month master plans, and archetype discovery — deployed as a static website with zero build tools.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point — loads React, fonts, CSS, and mounts the app |
| `app.jsx` | Full React application (Babel transforms JSX in the browser) |
| `README.md` | This file |

---

## Deploy to GitHub Pages (Step-by-Step)

### Step 1 — Create a GitHub Repository

1. Go to https://github.com and sign in
2. Click the "+" button → New repository
3. Name it `vos-selfarchitect` (or anything you like)
4. Set it to **Public**
5. Click **Create repository**

### Step 2 — Upload Your Files

1. On your new repository page, click **"uploading an existing file"**
2. Drag all three files (`index.html`, `app.jsx`, `README.md`) into the upload area
3. Write a commit message like `Initial deploy`
4. Click **Commit changes**

### Step 3 — Enable GitHub Pages

1. In your repository, click **Settings** (top menu)
2. Scroll down to **Pages** in the left sidebar
3. Under Source, select: Branch: `main`, Folder: `/ (root)`
4. Click **Save**

### Step 4 — Your Site is Live

After 1-2 minutes your site will be available at:
https://YOUR-USERNAME.github.io/vos-selfarchitect/

GitHub will show the exact URL in the Pages settings panel.

---

## How It Works

- No build step required — Babel compiles JSX in the visitor's browser
- No server required — 100% static files, hosted free on GitHub Pages
- Data is saved to localStorage in the visitor's browser
- React 18 and fonts are loaded from CDN

---

## Notes

- First load takes 2-4 seconds while Babel compiles — this is normal
- The AI chat is in viewing mode — connect an Anthropic API key to enable live responses
- All user data is stored locally in the browser, nothing sent to any server

---

© VOS SelfArchitect. All rights reserved.
