# Jiwon Min landing page

This repository serves the static landing page at [jwjp.github.io](https://jwjp.github.io/). English is the default language; the Korean version is at `/ko/`.

The content began with the archived `jiwon.io` landing page and now uses a custom editorial design. GitHub Pages serves the files directly from the `gh-pages` branch; `.nojekyll` disables Jekyll processing.

The home page's decorative wireframe uses Three.js. A small loader imports the self-hosted bundle only when the card enters view and motion is allowed. The static CSS design remains available if WebGL is unavailable. To rebuild the committed bundle after editing `assets/js/hero-wireframe.js`:

```bash
npm ci
npm run build:visual
```

To preview locally, serve this directory with a static HTTP server (for example, `python -m http.server 8000`) and open `http://localhost:8000/`.
