import {BLOCK} from './Block.js';

/** Seeded 2D gradient Perlin noise. Returns values in [0,1]. */
export class BiomeGenerator {
  constructor(seed=1){ this.seed=seed|0; this.perm=this._permutation(this.seed); }
  _permutation(seed){
    const a=Array.from({length:256},(_,i)=>i);
    let s=(seed|0)>>>0;
    const rnd=()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296};
    for(let i=255;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a.concat(a);
  }
  _fade(t){return t*t*t*(t*(t*6-15)+10)}
  _grad(h,x,y){switch(h&3){case 0:return x+y;case 1:return -x+y;case 2:return x-y;default:return -x-y}}
  noise2(x,y){
    const X=Math.floor(x)&255,Y=Math.floor(y)&255,xf=x-Math.floor(x),yf=y-Math.floor(y);
    const u=this._fade(xf),v=this._fade(yf),p=this.perm;
    const aa=p[p[X]+Y],ab=p[p[X]+Y+1],ba=p[p[X+1]+Y],bb=p[p[X+1]+Y+1];
    const x1=this._lerp(this._grad(aa,xf,yf),this._grad(ba,xf-1,yf),u);
    const x2=this._lerp(this._grad(ab,xf,yf-1),this._grad(bb,xf-1,yf-1),u);
    return (this._lerp(x1,x2,v)+1)/2;
  }
  _lerp(a,b,t){return a+(b-a)*t}
  fbm(x,y,oct=4,lac=2,gain=.5){
    let amp=1,f=1,sum=0,n=0;for(let i=0;i<oct;i++){sum+=this.noise2(x*f,y*f)*amp;n+=amp;f*=lac;amp*=gain}return sum/n;
  }
  height(x,z){
    const continental=this.fbm(x*.012,z*.012,4,2,.5);
    const detail=this.fbm(x*.055,z*.055,3,2,.5);
    const ridge=1-Math.abs(this.fbm(x*.022,z*.022,3,2,.55)*2-1);
    return Math.max(3,Math.min(94,Math.floor(32+continental*17+detail*5+ridge*22)));
  }
  biome(x,z,h=this.height(x,z)){
    const temp=this.fbm(x*.004+41,z*.004-17,4,2,.5);
    const moisture=this.fbm(x*.004-73,z*.004+29,4,2,.5);
    if(h>=68) return 'mountains';
    if(temp<.28 && moisture>.48) return 'birch_grove';
    if(temp>.72 && moisture<.38) return 'desert';
    if(temp>.63 && moisture>.67) return 'jungle';
    if(moisture>.57) return 'mixed_forest';
    return 'plains';
  }
  random(x,z,salt=0){let n=(Math.imul(x|0,374761393)+Math.imul(z|0,668265263)+Math.imul((this.seed+salt)|0,1442695041))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296}
  get(x,y,z,seaLevel=45){return this.getWithHeight(x,y,z,this.height(x,z),seaLevel)}
  getWithHeight(x,y,z,h,seaLevel=45){
    const b=this.biome(x,z,h);
    if(y===0)return BLOCK.BEDROCK;
    if(y>h)return y<=seaLevel?BLOCK.WATER_L4:BLOCK.AIR;
    if(b==='mountains'){
      if(y>=h-1 && h>78)return BLOCK.SNOW;
      if(y>=h-2 && h>70)return BLOCK.SNOW;
    }
    if(b==='desert' && y>=h-3)return BLOCK.SAND;
    if(b==='plains' && y===h)return BLOCK.GRASS;
    if(b!=='desert' && y===h)return BLOCK.GRASS;
    if(y>h-4)return b==='desert'?BLOCK.SAND:BLOCK.DIRT;
    // Mountains deliberately bias valuable ores.
    const bonus=b==='mountains'?1.65:1;
    if(y<15 && this.random(x*11+y*3,z*13-y*5,501)<.008*bonus)return BLOCK.DIAMOND_ORE;
    if(y<28 && this.random(x*3+y,z*5-y,99)<.032*bonus)return BLOCK.IRON;
    if(y<42 && this.random(x*7+y,z*3-y,77)<.065*bonus)return BLOCK.COAL;
    if(y<58 && this.random(x+y*2,z-y*3,51)<.018*bonus)return BLOCK.GOLD_ORE;
    if(y<18 && this.random(x*17+y,z*19-y*2,601)<.003)return BLOCK.OBSIDIAN;
    return BLOCK.STONE;
  }
  decorateColumn(x,z,y,api){
    if(y<1||y>=94)return;
    const b=this.biome(x,z,y), r=this.random(x,z,900);
    const place=(dx,dy,dz,id)=>{if(api.getBlock?.(x+dx,y+dy,z+dz)===BLOCK.AIR)api.setBlock(x+dx,y+dy,z+dz,id)};
    if(b==='desert'){if(r<.045)for(let i=0;i<2+(r*80|0)%3;i++)place(0,i,0,BLOCK.CACTUS);else if(r<.085)place(0,0,0,BLOCK.DEAD_BUSH);return}
    if(b==='jungle' && r<.085){this.tree(x,y+1,z,api,'jungle');return}
    if(b==='birch_grove' && r<.12){this.tree(x,y+1,z,api,'birch');return}
    if(b==='mixed_forest' && r<.08){this.tree(x,y+1,z,api,['oak','birch','spruce'][(this.random(x,z,901)*3)|0]);return}
    if(b==='plains' && r<.018){this.tree(x,y+1,z,api,'oak');return}
    if(b==='plains' && r<.42){place(0,0,0,r<.10?BLOCK.FLOWER_POPPY:(r<.20?BLOCK.FLOWER_DANDELION:BLOCK.GRASS_LOW));return}
    if(b==='plains' && r<.55){place(0,0,0,BLOCK.GRASS_HIGH_BOTTOM);place(0,1,0,BLOCK.GRASS_HIGH_TOP);return}
    if(b==='birch_grove' && r<.58){place(0,0,0,BLOCK.GRASS_HIGH_BOTTOM);place(0,1,0,BLOCK.GRASS_HIGH_TOP);return}
    if(b==='mixed_forest' && r<.45){place(0,0,0,BLOCK.GRASS_LOW);return}
    if(b==='jungle' && r<.16){place(0,0,0,BLOCK.WATERMELON);return}
    if(b==='jungle' && r<.52){place(0,0,0,BLOCK.VINE);return}
  }
  tree(x,y,z,api,type='oak'){
    const spec={oak:[BLOCK.LOG,BLOCK.LEAVES,5],birch:[BLOCK.BIRCH_LOG,BLOCK.BIRCH_LEAVES,5],spruce:[BLOCK.SPRUCE_LOG,BLOCK.SPRUCE_LEAVES,7],jungle:[BLOCK.JUNGLE_LOG,BLOCK.JUNGLE_LEAVES,8]}[type]||[BLOCK.LOG,BLOCK.LEAVES,5];
    const [log,leaf,h]=spec;
    for(let i=0;i<h;i++)api.setBlock(x,y+i,z,log);
    const radius=type==='spruce'?2:3;
    for(let dy=1;dy<=3;dy++)for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
      const dist=Math.abs(dx)+Math.abs(dz)+(dy===1?1:0);
      if(dist<=radius+1 && api.getBlock?.(x+dx,y+h-4+dy,z+dz)===BLOCK.AIR)api.setBlock(x+dx,y+h-4+dy,z+dz,leaf);
    }
    if(type==='jungle')for(let i=1;i<h-1;i++)if(this.random(x+i,z-i,970)<.38)api.setBlock(x+1,y+i,z,BLOCK.VINE);
  }
}
export class Generator extends BiomeGenerator {}
