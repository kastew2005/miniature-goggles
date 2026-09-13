import THREE from '../three.js';
import {Entity} from './Entity.js';
import {INFO,ITEM,BLOCK} from '../world/Block.js';
import {MobAI} from './MobAI.js';

const TYPES={
  chicken:{health:4,speed:1.4,body:0xffffff,accent:0xd9d9d9,drop:[[ITEM.FEATHER,1,3],[ITEM.RAW_CHICKEN,1,2]]},
  pig:{health:10,speed:1.15,body:0xf29aa4,accent:0xe27f8c,drop:[[ITEM.RAW_PORK,1,2]]},
  sheep:{health:8,speed:1.05,body:0xf0f0e7,accent:0xb8b8b0,drop:[[ITEM.WOOL,1,3],[ITEM.RAW_MUTTON,1,2]]},
  cow:{health:12,speed:.95,body:0x4b3a31,accent:0xf0e8dc,drop:[[ITEM.RAW_BEEF,1,3],[ITEM.LEATHER,0,2]]}
};

export class FriendlyMob extends Entity {
  constructor(scene,world,x,y,z,type='cow'){
    super(x,y,z);this.world=world;this.type=type;this.data=TYPES[type]||TYPES.cow;
    this.health=this.data.health;this.ai=new MobAI(this);this.sheared=false;this.attackFlash=0;
    this.group=new THREE.Group();this.buildModel();this.group.position.copy(this.pos);scene.add(this.group);
  }
  buildModel(){
    const d=this.data,mat=new THREE.MeshLambertMaterial({color:d.body}),accent=new THREE.MeshLambertMaterial({color:d.accent});
    const body=new THREE.Mesh(new THREE.BoxGeometry(.8,.65,1.05),mat);body.position.y=.95;
    const head=new THREE.Mesh(new THREE.BoxGeometry(.58,.58,.58),accent);head.position.set(0,1.35,-.62);
    this.group.add(body,head);
    for(const sx of [-.28,.28])for(const sz of [-.35,.35]){
      const leg=new THREE.Mesh(new THREE.BoxGeometry(.18,.65,.18),mat);leg.position.set(sx,.42,sz);this.group.add(leg);
    }
    if(this.type==='cow'||this.type==='sheep'){
      const hornMat=new THREE.MeshLambertMaterial({color:0xeee8d8});
      if(this.type==='cow'){for(const sx of [-.22,.22]){const h=new THREE.Mesh(new THREE.BoxGeometry(.11,.2,.11),hornMat);h.position.set(sx,1.7,-.62);this.group.add(h)}}
    }
    if(this.type==='chicken'){
      const beak=new THREE.Mesh(new THREE.BoxGeometry(.18,.12,.2),new THREE.MeshLambertMaterial({color:0xe5a32a}));beak.position.set(0,1.35,-.92);this.group.add(beak);
    }
    this.group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
  }
  solid(x,y,z){return !!INFO[this.world.getBlock(Math.floor(x),Math.floor(y),Math.floor(z))]?.solid}
  update(dt,player){if(!this.alive)return false;this.ai.update(dt,player);this.groundY();this.group.position.copy(this.pos);return false}
  groundY(){
    for(let y=Math.min(this.world.cfg.WORLD.HEIGHT-1,Math.floor(this.pos.y)+3);y>=0;y--)if(this.solid(this.pos.x,y,this.pos.z)){this.pos.y+=(y+1-this.pos.y)*.3;break}
  }
  hit(d,player){
    this.health-=d;this.ai.hurtFrom(player);this.attackFlash=.15;
    if(this.health<=0){this.alive=false;return true}return false;
  }
  shear(inv){
    if(this.type!=='sheep'||this.sheared)return false;
    if(!inv?.has?.(ITEM.SHEARS,1))return false;
    if(!inv.remove(ITEM.SHEARS,1))return false;
    inv.add(ITEM.WOOL,1+Math.floor(Math.random()*3));this.sheared=true;return true;
  }
  drops(){
    if(this.type==='sheep'&&this.sheared)return [[ITEM.RAW_MUTTON,1+Math.floor(Math.random()*2)]];
    return this.data.drop.map(([id,a,b])=>[id,a+(Math.random()*(b-a+1)|0)]).filter(x=>x[1]>0);
  }
  dispose(){this.group.parent?.remove(this.group);this.group.traverse(o=>o.geometry?.dispose?.())}
}
