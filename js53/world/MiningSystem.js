import THREE from "../three.js";
import {BLOCK,INFO} from "./Block.js";
import {BLOCK_DATA,TOOL_DATA,TOOL_TYPE,TOOL_TIER,LOOT_TABLES,getBlockData,getToolData} from "./MiningData.js";

export class MiningSystem{
  constructor(game){this.game=game;this.currentProgress=0;this.targetKey="";this.targetId=0;this.held=false;this.toolKey="";this.crackStage=-1;this.lastUi=0;this.drops=[];this.dropGeometry=new THREE.BoxGeometry(.22,.22,.22);this.dropMaterials=new Map()}
  tool(){const t=this.game.inventory.getMiningTool();const data=getToolData(t.id);return {...t,data}}
  targetKeyOf(hit){return hit?`${hit.block.x},${hit.block.y},${hit.block.z}`:""}
  canHarvest(block,tool){const d=getBlockData(block);if(!d||d.hardness<0)return false;const t=tool.data;if(!d.requiresCorrectTool)return true;return !!t&&t.toolType===d.preferredTool&&t.tier>=d.requiredTier}
  speed(block,tool){const d=getBlockData(block);let speed=1;const t=tool.data;if(t&&t.toolType===d.preferredTool)speed=t.miningSpeed;else if(t?.efficiency>0&&t.toolType===d.preferredTool)speed+=t.efficiency*t.efficiency+1;
    const p=this.game.player;const atFeet=this.game.world.getBlock(Math.floor(p.pos.x),Math.floor(p.pos.y),Math.floor(p.pos.z));const atHead=this.game.world.getBlock(Math.floor(p.pos.x),Math.floor(p.pos.y+1.5),Math.floor(p.pos.z));
    if((atFeet===BLOCK.WATER||atHead===BLOCK.WATER)&&!(t?.aquaAffinity))speed/=5;
    if(!p.onGround)speed/=5;
    const haste=Number(p.effects?.haste||0);const fatigue=Number(p.effects?.miningFatigue||0);if(haste>0)speed*=1+.2*haste;if(fatigue>0)speed*=Math.pow(.3,fatigue);
    return Math.max(.001,speed);
  }
  begin(hit){
    const d=getBlockData(hit?.id);if(!hit||!d||d.hardness<0)return false;
    const tool=this.tool(),key=this.targetKeyOf(hit);const targetChanged=key!==this.targetKey||hit.id!==this.targetId||this.toolKey!==this.toolSignature(tool);
    if(targetChanged){this.currentProgress=0;this.crackStage=0;this.targetKey=key;this.targetId=hit.id;this.toolKey=this.toolSignature(tool)}
    this.held=true;this.show(hit.id);return true;
  }
  toolSignature(t){return `${t.id}:${t.durability}:${t.data?.toolType||"none"}:${t.data?.tier||0}:${t.data?.efficiency||0}:${t.data?.silkTouch||0}:${t.data?.fortune||0}`}
  stop(){this.held=false;this.reset()}
  reset(){this.currentProgress=0;this.targetKey="";this.targetId=0;this.toolKey="";this.crackStage=-1;this.game.hideBreakProgress?.()}
  update(dt){
    if(!this.held||!this.game.running||this.game.inventoryOpen)return;
    const hit=this.game.player.raycast();const key=this.targetKeyOf(hit);const tool=this.tool();
    if(!hit||key!==this.targetKey||hit.id!==this.targetId||this.toolKey!==this.toolSignature(tool)){this.reset();return}
    const d=getBlockData(hit.id);if(!d||d.hardness<0){this.reset();return}
    const toolSpeed=this.speed(hit.id,tool),canHarvest=this.canHarvest(hit.id,tool);
    // Requested canonical rule: 20 ticks/s and hardness-scaled damage.
    const damagePerTick=canHarvest?toolSpeed/d.hardness/30:toolSpeed/d.hardness/100;
    this.currentProgress=Math.min(1,this.currentProgress+damagePerTick*20*dt);
    this.show(hit.id);
    if(this.currentProgress>=1)this.finish(hit,tool,canHarvest);
  }
  finish(hit,tool,canHarvest){
    const id=hit.id,p={x:hit.block.x,y:hit.block.y,z:hit.block.z};
    if(!this.game.world.setBlock(p.x,p.y,p.z,BLOCK.AIR)){this.reset();return}
    this.game.network.blockChanged(p.x,p.y,p.z,BLOCK.AIR);this.game.world.recordChange?.(p.x,p.y,p.z,BLOCK.AIR);this.game.systems.removed(id,p);
    const loot=this.rollLoot(id,tool,canHarvest);for(const x of loot)this.spawnDrop(x.item,x.count,p);
    if(canHarvest&&tool.id&&tool.data?.durabilityDamage){const alive=this.game.inventory.damageMiningTool(tool.data.durabilityDamage);if(!alive)this.game.systems.toast("Инструмент сломан")}
    const d=getBlockData(id),xp=this.randomRange(d?.experienceDrop||[0,0]);if(canHarvest&&!tool.data?.silkTouch&&xp>0){this.game.player.addXP(xp);this.game.systems.award(xp)}
    this.game.particles.burst(new THREE.Vector3(p.x+.5,p.y+.5,p.z+.5),0xffffff,8);this.game.audio.break?.();
    this.reset();this.held=true;
  }
  rollLoot(blockId,tool,canHarvest){
    if(!canHarvest)return [];
    const d=getBlockData(blockId);if(!d)return [];
    if(tool.data?.silkTouch&&d.lootTable&&this.isSilkSupported(blockId))return [{item:blockId,count:1}];
    const table=LOOT_TABLES[d.lootTable]||[];const out=[];
    for(const rule of table){if(Math.random()>(rule.chance??1))continue;let count=this.randomRange([rule.min??1,rule.max??rule.min??1]);if(count<=0)continue;if(rule.fortune&&tool.data?.fortune&&!tool.data?.silkTouch)count=this.applyFortune(count,tool.data.fortune);if(count>0)out.push({item:rule.item,count})}
    return out;
  }
  isSilkSupported(id){return ![BLOCK.BEDROCK,BLOCK.AIR,BLOCK.WATER].includes(id)}
  applyFortune(base,level){level=Math.max(0,Math.min(3,level|0));if(!level)return base;return Math.random()<1/(level+2)?base*(2+Math.floor(Math.random()*level)):base}
  randomRange([a,b]){a=Math.max(0,Number(a)||0);b=Math.max(a,Number(b)||a);return a+Math.floor(Math.random()*(b-a+1))}
  material(item){if(this.dropMaterials.has(item))return this.dropMaterials.get(item);const base=INFO[item]?.drop===item?item:0;const colors={ [BLOCK.DIRT]:0x76583b,[BLOCK.GRASS]:0x668447,[BLOCK.STONE]:0x777777,[BLOCK.COBBLE]:0x686868,[BLOCK.SAND]:0xc8b78a,[BLOCK.GRAVEL]:0x77736b,[BLOCK.LOG]:0x765b3d,[BLOCK.PLANKS]:0x92714a,[BLOCK.COAL]:0x303030,[BLOCK.IRON]:0x88857d,[BLOCK.COPPER]:0xa36f50,[BLOCK.OBSIDIAN]:0x242238,[BLOCK.DIAMOND_ORE]:0x6c8d9a,[130]:0x4bd7e8,[115]:0x879b52};const m=new THREE.MeshLambertMaterial({color:colors[item]??(base?0x999999:0xb0b0b0)});this.dropMaterials.set(item,m);return m}
  spawnDrop(item,count,p){for(let i=0;i<Math.min(64,count);i++){const m=new THREE.Mesh(this.dropGeometry,this.material(item));m.position.set(p.x+.5+(Math.random()-.5)*.35,p.y+.5+(Math.random()-.5)*.25,p.z+.5+(Math.random()-.5)*.35);m.userData={itemId:item,count:1,vel:new THREE.Vector3((Math.random()-.5)*2,2+Math.random()*1.5,(Math.random()-.5)*2),life:45};m.renderOrder=12;this.game.scene.add(m);this.drops.push(m)}}
  updateDrops(dt){if(!this.drops.length)return;const p=this.game.player.pos;for(let i=this.drops.length-1;i>=0;i--){const d=this.drops[i],u=d.userData;u.life-=dt;u.vel.y-=12*dt;d.position.addScaledVector(u.vel,dt);const below=this.game.world.getBlock(Math.floor(d.position.x),Math.floor(d.position.y-.12),Math.floor(d.position.z));if(INFO[below]?.solid&&u.vel.y<0){d.position.y=Math.floor(d.position.y)+.12;u.vel.y*=-.25;u.vel.x*=.72;u.vel.z*=.72}d.rotation.x+=dt*3;d.rotation.y+=dt*4;if(d.position.distanceTo(p)<1.45){if(this.game.inventory.add(u.itemId,u.count)){this.game.audio.pickup?.();this.removeDrop(i);continue}}if(u.life<=0)this.removeDrop(i)}}
  removeDrop(i){const d=this.drops[i];if(!d)return;this.game.scene.remove(d);this.drops.splice(i,1)}
  show(id){const el=document.getElementById("blockBreakProgress");if(!el)return;const pct=Math.round(this.currentProgress*100),stage=Math.min(9,Math.floor(this.currentProgress*10));el.classList.remove("hidden");el.dataset.stage=String(stage);el.innerHTML=`<div class="breakLabel">ДОБЫЧА • ${INFO[id]?.name||"Блок"} • ${pct}%</div><div class="breakTrack"><i style="width:${pct}%"></i></div>`;this.crackStage=stage}
}
