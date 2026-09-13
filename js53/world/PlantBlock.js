import {BLOCK} from './Block.js';

/** Shared metadata for non-solid flora. Rendering is batched by the World chunk builder. */
export class PlantBlock {
  static is(id){return !!(id && [BLOCK.GRASS_LOW,BLOCK.GRASS_HIGH_BOTTOM,BLOCK.GRASS_HIGH_TOP,BLOCK.FLOWER_POPPY,BLOCK.FLOWER_DANDELION,BLOCK.DEAD_BUSH,BLOCK.VINE,BLOCK.WHEAT].includes(id))}
  static pair(id){return id===BLOCK.GRASS_HIGH_BOTTOM?BLOCK.GRASS_HIGH_TOP:id===BLOCK.GRASS_HIGH_TOP?BLOCK.GRASS_HIGH_BOTTOM:null}
  static isClimbable(id){return id===BLOCK.VINE}
}
