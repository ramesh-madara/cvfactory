# CV Factory.LK

A premium, glassmorphic portfolio site for showcasing resume layouts and client feedback.

Open `index.html` in any modern browser — no build step required.

Installable as a **Progressive Web App (PWA)** when served over HTTPS (e.g. GitHub Pages).

## Features

- CV and feedback galleries driven by `data.js`
- iPhone-style fullscreen image viewer with bottom reel
- Responsive grid layout controls
- Dark / light theme
- **PWA** — add to home screen, offline app shell, cached gallery images
- Image editor (`edit.html`) for privacy blur

## Project structure

| Path | Purpose |
|------|---------|
| `index.html` | Main site layout |
| `app.js` | Gallery, modal, theme, and navigation logic |
| `data.js` | CV and feedback counts and folders |
| `cvs/` | Resume preview images (`1.jpg`, `2.jpg`, …) |
| `customerFeedback/` | Client review screenshots |
| `update_numbering.py` | Renumber images and sync `data.js` |
| `manifest.webmanifest` | PWA manifest (name, icons, display) |
| `sw.js` | Service worker for offline caching |
| `pwa.js` | Registers the service worker |
| `icons/` | App icons (SVG + PNG) |
| `docs/` | Design and behavior notes |

## PWA install

When hosted on **HTTPS** (GitHub Pages, Netlify, etc.):

1. Open the site in Chrome, Edge, or Safari
2. Use **Install app** / **Add to Home Screen**
3. The app opens fullscreen without the browser bar

**Offline behavior:** the UI shell loads offline; CV and feedback images are cached as you view them.

Regenerate PNG icons after changing the logo:

```bash
pip install pillow
python generate_pwa_icons.py
```

## Documentation

- [Dark mode toggle button](docs/darkmode-toggle-btn.md) — shape, look, and feel of the theme switch

## Quick start

1. Add images to `cvs/` and `customerFeedback/`
2. Run `python update_numbering.py` to renumber and update counts
3. Open `index.html`

## Links

- [Facebook — CV Factory.LK](https://www.facebook.com/cvf.lk)
