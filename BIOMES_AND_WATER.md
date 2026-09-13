# Biomes / Flora / Friendly Mobs / Water — implementation notes

## Architecture

`BiomeGenerator` owns seeded Perlin/fBm noise, terrain height, biome selection and deterministic decorations.
`Generator` extends it, so the existing `World` API remains compatible.

`World -> Generator -> Chunk -> rebuildChunk()`
- Terrain and decorations are generated in `WorldWorker.js` when workers are available.
- The synchronous fallback uses the same `Generator`.
- New plants are rendered as batched cross-quads: one geometry/material bucket per plant type and chunk.
- Leaves use transparent materials with `alphaTest` (cutout) instead of expensive blended transparency.

## Biomes

- `plains`: flat-ish terrain, grass, flowers, rare oak.
- `birch_grove`: dense birch, tall grass.
- `mixed_forest`: oak/birch/spruce mixture.
- `mountains`: high rocky/snowy terrain and boosted coal/iron/gold/diamond probabilities.
- `desert`: sand, cactus and dead bushes.
- `jungle`: jungle trees, vines and watermelon.

All biome choices are deterministic for the world seed.

## Flora

`PlantBlock` is the common metadata/helper layer for grass, flowers, vines and crops.
High grass uses two block IDs. `World.setBlock()` removes the paired half when either half is destroyed, so the plant behaves as one object.

## Friendly mobs

`MobManager` now supports both zombies and `FriendlyMob`.
`FriendlyMob` builds a low-poly cube model and delegates movement decisions to `MobAI`.
During daytime the manager spawns passive animals according to the current biome. Animals wander, avoid solid blocks and flee for several seconds after being hit.

Drops:
- chicken: feathers + raw chicken
- pig: raw pork
- sheep: wool + raw mutton; sheep can be sheared with `ITEM.SHEARS`
- cow: raw beef + leather

## Water

`WaterPhysics` treats level 4 as a full/source block and levels 1–3 as flowing water.
Every simulation step first tries to move water downward, then sideways with a lower level. Work is capped around the player to prevent an uncontrolled flood of CPU work.

Player integration:
- water movement is slowed in `Player.move()`
- jump/space applies buoyancy while submerged
- air starts at 20 seconds
- submerged players show the breath HUD
- at zero air, periodic drowning damage is applied

Water materials use a shader hook to add a very small time-based surface wave and are transparent. Chunk geometry scales the water block's vertical height according to its level.

## Performance

The existing chunk builder already groups faces by block ID. The new flora follows the same bucket/batch approach instead of creating a Three.js mesh per plant. Leaves use cutout alpha testing. World generation remains worker-compatible and has a synchronous fallback for Safari/iOS.

## Main runtime flow

1. `Game` creates `World`, `MobManager` and `WaterPhysics`.
2. `World.generateAround()` asks `WorldWorker` to generate chunks using the same `Generator`.
3. Each chunk is meshed in a frame-budgeted queue.
4. During gameplay the loop calls `WaterPhysics.tick()` before `Player.move()`.
5. `MobManager.update()` advances zombies and passive animals.
6. `HUD.update()` displays health, hunger, stamina, XP and underwater breath.
