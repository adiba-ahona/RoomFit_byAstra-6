# ROOMFIT - Will it fit in my room?

A working 3D small-room planner with draggable furniture, configurable room dimensions, collision checks and a scroll-controlled camera tour.

A furniture showcase that doubles as a small-space planner.

Problem: People buy furniture without understanding its size or how much usable space it leaves.

Scroll experience: A flat floor plan rises into a furnished 3D room. The camera moves from overhead to eye level.

Working interaction: Enter room dimensions, drag furniture, rotate pieces, and switch materials. Show measurements and flag overlapping objects.

Distinctive detail: A “daily life” slider opens wardrobe doors and pulls out chairs to reveal clearance problems.

Manageable first version: One rectangular room with a bed, desk, chair, and wardrobe.

Demo moment: a desk fits against the wall, but opening the wardrobe reveals why that layout fails.

## Run locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. Stop the server with Ctrl+C.

No npm installation, build command, API key or backend is required. The archive includes Three.js. Your browser needs WebGL support.

## What you can do

- Enter room width and depth from 2.5 to 8 meters.
- Select 12 editable furniture and decor pieces: platform bed, writing desk, desk chair, double wardrobe, plant and book holder, hanging plants, big plant decor, book cabinet, room swing, vanity table, Islamic prayer mat and coffee corner.
- Drag furniture across the floor, or set center coordinates with the numeric fields.
- Use the arrow buttons or keyboard arrows to move the selected item by 10 cm.
- Rotate a selected piece by 90 degrees with the rotate button or R key.
- Drag empty space to orbit the camera. Select 3D, overhead floor-plan or eye-level views.
- Zoom in, zoom out, or reset the camera.
- Switch between oak, walnut and stone floor finishes.
- Move the Daily life slider to open wardrobe doors and pull out the chair.
- Toggle use-zone overlays and measurement guides.
- Scroll through the camera tour to travel from an overhead view to an eye-level view of the current layout.
- Download a text plan with dimensions, positions and current warnings.
- Reset the room to the original layout.

On mobile, controls stack beneath the model and the camera tour uses explicit Plan / Space / Live buttons. Reduced-motion preferences also enable these controls and disable scroll camera motion and camera easing.

## Files

- `index.html`: accessible controls and page structure.
- `styles.css`: responsive studio interface and scroll-tour presentation.
- `planner.js`: dimensions, positions, footprint math and clearance checks.
- `app.js`: Three.js scene, mesh furniture, raycast dragging, camera controls and UI behavior.
- `vendor/three.module.min.js`: bundled Three.js 0.160.0, under its MIT license.
- `vendor/THREE-LICENSE.txt`: the Three.js license; retain this when distributing the project.

The furniture consists of editable 3D mesh assemblies. No downloaded models or external image assets are necessary. Procedural surface textures provide the wood and stone finishes.

Every catalog item can be selected from the sidebar and moved by dragging it in the 3D room. The selected item can also be moved with the position fields, nudge buttons or keyboard arrows, and rotated in 90-degree increments. The new decor items use the same footprint, overlap and room-boundary checks as the original furniture.

## Coordinates and fit checks

The origin sits at the back-left floor corner. X increases toward the right wall; Z increases toward the open front. Furniture positions describe the footprint center at rest, in meters. Furniture rotates about its vertical Y axis in 90-degree increments.

The planner checks rectangular floor footprints for overlap and room-boundary violations. Touching edges do not count as overlaps. The selected object receives a green outline; physical conflicts receive red outlines. Amber use zones identify estimated wardrobe-door or chair-use space that overlaps another object or extends outside the room.

The chair translates backward by up to 0.65 meters as the Daily life slider increases. The wardrobe doors rotate by up to 90 degrees. The wardrobe use-zone rectangle grows up to 0.65 meters in front of the cabinet; this is a conservative approximation, not exact swept-door collision geometry.

Open-floor percentage subtracts the sum of furniture footprints from room area. It does not compute a geometric union, walkable paths, or building-code clearances. The on-page note explains that overlapping pieces count separately.

## Limitations

RoomFit is a concept planner, not architectural or purchasing advice. It has 12 fixed-size furniture and decor models and one rectangular room. It does not model a room-entry door, walking-route accessibility, walls inside the room, real product specifications, ceiling obstructions, or construction requirements. Verify physical measurements and access before buying furniture.

Edits remain in the current page session. Download the text plan to retain a human-readable record. No server receives your layout.

## Validation

The planner passed checks for its default layout, overlapping furniture, room boundaries, blocked wardrobe use space, rotated footprints, chair translation and touching edges. JavaScript syntax was checked with `node --check`, and browser smoke testing confirmed that the 12-item catalog loads and a new item can be selected. The default compact layout intentionally reports some overlaps so the user can arrange the pieces interactively.
