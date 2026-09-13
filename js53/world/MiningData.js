import {BLOCK,ITEM,INFO} from './Block.js';

/** Minecraft-like mining data layer.  Values are intentionally data-driven so
 * blocks/tools can be extended without touching the mining state machine.
 */
export const TOOL_TYPE=Object.freeze({NONE:'none',PICKAXE:'pickaxe',AXE:'axe',SHOVEL:'shovel',SWORD:'sword',HOE:'hoe'});
export const TOOL_TIER=Object.freeze({NONE:0,WOOD:1,STONE:2,IRON:3,DIAMOND:4,NETHERITE:5});

export const BLOCK_DATA=Object.freeze({
 [BLOCK.DIRT]:{hardness:.5,preferredTool:TOOL_TYPE.SHOVEL,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:'dirt'},
 [BLOCK.GRASS]:{hardness:.6,preferredTool:TOOL_TYPE.SHOVEL,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:'grass'},
 [BLOCK.STONE]:{hardness:1.5,preferredTool:TOOL_TYPE.PICKAXE,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:true,experienceDrop:[0,0],lootTable:'stone'},
 [BLOCK.COAL]:{hardness:3,preferredTool:TOOL_TYPE.PICKAXE,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:true,experienceDrop:[0,2],lootTable:'coal'},
 [BLOCK.IRON]:{hardness:3,preferredTool:TOOL_TYPE.PICKAXE,requiredTier:TOOL_TIER.STONE,requiresCorrectTool:true,experienceDrop:[0,2],lootTable:'iron'},
 [BLOCK.COPPER]:{hardness:3.2,preferredTool:TOOL_TYPE.PICKAXE,requiredTier:TOOL_TIER.STONE,requiresCorrectTool:true,experienceDrop:[0,2],lootTable:'copper'},
 [BLOCK.DIAMOND_ORE]:{hardness:3,preferredTool:TOOL_TYPE.PICKAXE,requiredTier:TOOL_TIER.IRON,requiresCorrectTool:true,experienceDrop:[3,7],lootTable:'diamond_ore'},
 [BLOCK.OBSIDIAN]:{hardness:50,preferredTool:TOOL_TYPE.PICKAXE,requiredTier:TOOL_TIER.DIAMOND,requiresCorrectTool:true,experienceDrop:[0,0],lootTable:'obsidian'},
 [BLOCK.SAND]:{hardness:.5,preferredTool:TOOL_TYPE.SHOVEL,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:'sand'},
 [BLOCK.GRAVEL]:{hardness:.6,preferredTool:TOOL_TYPE.SHOVEL,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:'gravel'},
 [BLOCK.LOG]:{hardness:2,preferredTool:TOOL_TYPE.AXE,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:'log'},
 [BLOCK.PLANKS]:{hardness:2,preferredTool:TOOL_TYPE.AXE,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:'planks'},
 [BLOCK.LEAVES]:{hardness:.2,preferredTool:TOOL_TYPE.HOE,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:'leaves'},
 [BLOCK.CLAY]:{hardness:.7,preferredTool:TOOL_TYPE.SHOVEL,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:'clay'},
 [BLOCK.COBBLE]:{hardness:2,preferredTool:TOOL_TYPE.PICKAXE,requiredTier:TOOL_TIER.WOOD,requiresCorrectTool:true,experienceDrop:[0,0],lootTable:'cobble'},
 [BLOCK.BEDROCK]:{hardness:-1,preferredTool:TOOL_TYPE.NONE,requiredTier:TOOL_TIER.NETHERITE,requiresCorrectTool:true,experienceDrop:[0,0],lootTable:null}
});

export const TOOL_DATA=Object.freeze({
 [ITEM.WOOD_PICK]:{toolType:TOOL_TYPE.PICKAXE,tier:TOOL_TIER.WOOD,miningSpeed:2,durabilityDamage:1,efficiency:0,silkTouch:0,fortune:0},
 [ITEM.STONE_PICK]:{toolType:TOOL_TYPE.PICKAXE,tier:TOOL_TIER.STONE,miningSpeed:4,durabilityDamage:1,efficiency:0,silkTouch:0,fortune:0},
 [ITEM.IRON_PICK]:{toolType:TOOL_TYPE.PICKAXE,tier:TOOL_TIER.IRON,miningSpeed:6,durabilityDamage:1,efficiency:0,silkTouch:0,fortune:0},
 [ITEM.DIAMOND_PICK]:{toolType:TOOL_TYPE.PICKAXE,tier:TOOL_TIER.DIAMOND,miningSpeed:8,durabilityDamage:1,efficiency:0,silkTouch:0,fortune:0},
 [ITEM.WOOD_SHOVEL]:{toolType:TOOL_TYPE.SHOVEL,tier:TOOL_TIER.WOOD,miningSpeed:2,durabilityDamage:1,efficiency:0,silkTouch:0,fortune:0}
});

export const LOOT_TABLES=Object.freeze({
 dirt:[{item:BLOCK.DIRT,min:1,max:1}],grass:[{item:BLOCK.GRASS,min:1,max:1}],stone:[{item:BLOCK.COBBLE,min:1,max:1}],
 sand:[{item:BLOCK.SAND,min:1,max:1}],gravel:[{item:BLOCK.GRAVEL,min:1,max:1,chance:.9}],log:[{item:BLOCK.LOG,min:1,max:1}],planks:[{item:BLOCK.PLANKS,min:1,max:1}],
 cobble:[{item:BLOCK.COBBLE,min:1,max:1}],clay:[{item:BLOCK.CLAY,min:1,max:1}],leaves:[{item:ITEM.SEEDS,min:0,max:1,chance:.12}],
 coal:[{item:BLOCK.COAL,min:1,max:1,fortune:true}],iron:[{item:BLOCK.IRON,min:1,max:1}],copper:[{item:BLOCK.COPPER,min:1,max:1}],
 diamond_ore:[{item:ITEM.DIAMOND,min:1,max:1,fortune:true}],obsidian:[{item:BLOCK.OBSIDIAN,min:1,max:1}]
});

export function getBlockData(id){
 const d=BLOCK_DATA[id];
 if(d)return d;
 const i=INFO[id];
 if(!i||i.item||i.solid===false)return null;
 return {hardness:Number.isFinite(i.hardness)?i.hardness:1.5,preferredTool:i.tool==='pick'?TOOL_TYPE.PICKAXE:i.tool==='axe'?TOOL_TYPE.AXE:i.tool==='hoe'?TOOL_TYPE.HOE:TOOL_TYPE.NONE,requiredTier:i.minPower>=4?TOOL_TIER.DIAMOND:i.minPower>=2?TOOL_TIER.IRON:i.minPower>=1?TOOL_TIER.WOOD:TOOL_TIER.NONE,requiresCorrectTool:false,experienceDrop:[0,0],lootTable:null};
}
export function getToolData(id){return TOOL_DATA[id]||null}
