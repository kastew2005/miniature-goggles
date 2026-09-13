# Voxel Survival — Universe 73

Cross-platform performance/control fix. Touch camera uses pointer capture on the Three.js canvas, joystick and camera are independent, mobile rendering is lighter, and old launch keys remain compatible.


## Universe 74 performance/HUD fix
- Restored the gameplay HUD markup (health, hunger, clock, stamina, XP, hotbar, target, pause, mode badge).
- Mobile chunk meshing is throttled and moved after the gameplay render so input/movement gets priority.
- Mobile world generation/rendering is capped to reduce frame spikes.
- Chunk meshes use frustum culling and disabled shadow casting/receiving.
- Hardened saved quality-tier parsing.
