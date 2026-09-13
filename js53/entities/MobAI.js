import THREE from '../three.js';

/** Simple deterministic-friendly steering AI shared by passive animals. */
export class MobAI {
  constructor(mob){this.mob=mob;this.timer=0;this.dir=new THREE.Vector3();this.flee=0;this.turn=.5+Math.random()*2}
  hurtFrom(player){
    this.flee=3.5;
    const d=this.mob.pos.clone().sub(player.pos);d.y=0;
    if(d.lengthSq()<.001)d.set(Math.random()-.5,0,Math.random()-.5);
    this.dir.copy(d.normalize());
  }
  update(dt,player){
    this.timer-=dt;
    if(this.flee>0)this.flee-=dt;
    if(this.timer<=0){
      this.timer=.8+Math.random()*2.8;
      const a=Math.random()*Math.PI*2;
      this.dir.set(Math.sin(a),0,Math.cos(a));
    }
    let v=this.flee>0?this.dir.clone().multiplyScalar(2.4):this.dir.clone().multiplyScalar(.65);
    const nx=this.mob.pos.x+v.x*dt,nz=this.mob.pos.z+v.z*dt;
    if(!this.mob.solid(nx,this.mob.pos.y+.35,nz))this.mob.pos.set(nx,this.mob.pos.y,nz);
    else this.timer=0;
    this.mob.group.rotation.y=Math.atan2(v.x,v.z);
  }
}
