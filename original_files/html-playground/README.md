HTML Playground — local HTML/JS playground (demo)

This is a small, local-only demo of the HTML Playground, a lightweight in-browser HTML/CSS/JS editor with a simple debug harness.

Files:
- html-playground.html — main UI (top-level)
- style.css — styling (in html-playground/)
- app.js — runtime and harness (in html-playground/)

How to run:
1. From the repository root (D:\\Toolswebsite) run a local static server, for example:

   python -m http.server 8000

2. Open http://localhost:8000/public/html-playground.html  (or your server root + /public/html-playground.html)

Notes:
- This demo supports JavaScript run/debug. The debug harness is a prototype and uses statement-splitting.
