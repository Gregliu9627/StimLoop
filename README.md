# StimLoop website

A static one-page site that introduces the StimLoop closed-loop neuromodulation platform, the in-house tTIS stimulator, the neural state models, and the non-invasive pain and depression program.

No build step and no dependencies: `index.html` plus `assets/` (CSS, JS, logo). Google Fonts load from the web; the page falls back to system fonts offline.

## Publish on GitHub Pages

1. Create a repository (for example `<org>.github.io` for a root site, or any name for `https://<user>.github.io/<repo>/`).
2. Push these files to the default branch.
3. In **Settings → Pages**, choose *Deploy from a branch*, branch `main`, folder `/ (root)`.

## Before publishing

- The "Get in touch" button in `index.html` mails xdliu@cuhk.edu.hk; change it there if the contact changes.
- Re-check the numbers against the current releases: 357 tests (StimLoop V1.1, 2026-11-11), 1,641 firmware checks (tTIS firmware v0.2.6, 2026-11-13), and the tTIS parameter ranges from the firmware README.

## Interactive figures

All figures are drawn in `assets/site.js` with plain canvas/SVG:

- hero: animated multichannel traces;
- platform: clickable five-stage loop;
- tTIS: two-carrier interference waveform (TI / sham) and a 2-D homogeneous-conductor envelope map with a current-ratio slider (illustrative, not a head model);
- state models: an illustrative closed-loop state monitor.

Animations pause off-screen and are disabled under `prefers-reduced-motion`.
