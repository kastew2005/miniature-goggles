import {BLOCK,INFO} from './Block.js';

/** Lightweight voxel liquid simulation. Water level 4 is a source/full block. */
export class WaterPhysics {
  constructor(game){
    this.game=game; this.acc=0; this.flowTimer=0; this.breathTimer=0;
    this.maxSteps=32; this.sourceRadius=10;
    this._lastWaterState=false;
  }
  isWater(id){return id===BLOCK.WATER||!!INFO[id]?.liquid}
  level(id){return id===BLOCK.WATER?4:(INFO[id]?.waterLevel||4)}
  isSubmerged(player){
    const x=Math.floor(player.pos.x), z=Math.floor(player.pos.z);
    const feet=this.isWater(this.game.world.getBlock(x,Math.floor(player.pos.y),z));
    const head=this.isWater(this.game.world.getBlock(x,Math.floor(player.pos.y+1.35),z));
    return {feet,head,water:feet||head};
  }
  tick(dt){
    const g=this.game, p=g.player, state=this.isSubmerged(p);
    p.inWater=state.feet; p.submerged=state.head;
    // Swimming / buoyancy. Holding jump is handled without hijacking the jump button.
    if(state.feet){
      p.vel.y += (p.controls.keys.Space ? 10 : 2.8)*dt;
      if(p.vel.y>3.5)p.vel.y=3.5;
      p.vel.y -= 5.2*dt;
    }
    if(state.head){
      p.air=Math.max(0,(p.air??20)-dt);
      if(p.air<=0){
        this.breathTimer-=dt;
        if(this.breathTimer<=0){this.breathTimer=1; p.damage(2)}
      }
    }else{
      p.air=Math.min(20,(p.air??20)+dt*8);
      this.breathTimer=0;
    }
    this.flowTimer+=dt;
    if(this.flowTimer<.55)return;
    this.flowTimer=0;
    this.flow();
    this.animate(dt);
  }
  flow(){
    const w=this.game.world,p=this.game.player,px=Math.floor(p.pos.x),py=Math.floor(p.pos.y),pz=Math.floor(p.pos.z);
    let done=0;
    for(let x=px-this.sourceRadius;x<=px+this.sourceRadius && done<this.maxSteps;x++)
      for(let z=pz-this.sourceRadius;z<=pz+this.sourceRadius && done<this.maxSteps;z++)
        for(let y=Math.max(1,py-5);y<=Math.min(w.cfg.WORLD.HEIGHT-2,py+8)&&done<this.maxSteps;y++){
          const id=w.getBlock(x,y,z); if(!this.isWater(id))continue;
          const level=this.level(id);
          const below=w.getBlock(x,y-1,z);
          if(below===BLOCK.AIR){this.setWater(w,x,y-1,z,Math.max(1,level));done++;continue}
          if(level<=1)continue;
          const next=level-1;
          for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
            if(w.getBlock(x+dx,y,z+dz)===BLOCK.AIR){this.setWater(w,x+dx,y,z+dz,next);done++;break}
          }
        }
  }
  setWater(w,x,y,z,level){
    const id=[BLOCK.WATER_L1,BLOCK.WATER_L2,BLOCK.WATER_L3,BLOCK.WATER_L4][Math.max(1,Math.min(4,level))-1];
    w.setBlock(x,y,z,id);
  }
  animate(dt){
    const mats=this.game.world.materials;
    for(const id of [BLOCK.WATER,BLOCK.WATER_L1,BLOCK.WATER_L2,BLOCK.WATER_L3,BLOCK.WATER_L4]){
      const m=mats[id]; if(m?.userData)m.userData.waveTime=(m.userData.waveTime||0)+dt;
    }
  }
}
