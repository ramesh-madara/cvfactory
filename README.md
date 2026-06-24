# CV Factory.LK

A premium, glassmorphic portfolio site for showcasing resume layouts and client feedback.

Open `index.html` in any modern browser — no build step required.

## Features

- CV and feedback galleries driven by `data.js`
- iPhone-style fullscreen image viewer with bottom reel
- Responsive grid layout controls
- Dark / light theme
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
| `docs/` | Design and behavior notes |

## Documentation

- [Dark mode toggle button](docs/darkmode-toggle-btn.md) — shape, look, and feel of the theme switch

## Quick start

1. Add images to `cvs/` and `customerFeedback/`
2. Run `python update_numbering.py` to renumber and update counts
3. Open `index.html`

## Links

- [Facebook — CV Factory.LK](https://www.facebook.com/cvf.lk)
