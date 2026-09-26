# Kont26 House

A walkable 3D model of our home (the lower half of a semi-detached pair), built from the architect's plans and photos of the rooms. It is a single self-contained web page using WebGL 2 with no libraries, tuned to run smoothly on a mid-2015 MacBook Pro.

## Open it

Open `index.html` in a current version of Safari, Chrome or Firefox. If GitHub Pages is turned on for this repository, the same page is served at the repository's Pages address.

## Controls

| Key | Action |
| --- | --- |
| W A S D / arrows | Walk (Shift for a brisk jog) |
| Mouse | Look; click the view to capture the mouse, Esc releases it |
| E | Use what you look at: doors, wardrobes, drawers, windows (tilt), curtains, chairs, beds, the bunk-bed ladder, the fireplace door |
| C | Crouch |
| V | Natural or wide field of view |
| G | Foam-dart blaster on or off; F fires (hold to keep firing), R reloads |
| M | Floor plan (click it to jump) |
| O | View from above |
| H | Settings and controls |

## Build

The page is assembled from the files in `src/`:

```
python3 build.py
```

This writes `index.html` (and a copy under `dist/`). The source is split by area: `engine.js` (renderer), `builder.js` (geometry), `textures.js` (generated textures), `exterior.js`, `interior.js` and one file per detailed room (`desk.js`, `bedroom.js`, `bathroom.js`, `kidsroom.js`, `living.js`), `site.js` (garden and street), `blaster.js`, `sound.js` and `app.js` (movement, interaction and the user interface). `src/shell.html` holds the page's HTML and CSS.
