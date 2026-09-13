import {Generator} from './Generator.js';

self.onmessage = (e) => {
  const {id, seed, cx, cz, size, height, seaLevel} = e.data;
  try {
    const gen = new Generator(seed);
    const blocks = new Uint8Array(size * size * height);
    const index = (x,y,z) => x + size * (z + size * y);
    for(let x=0;x<size;x++){
      for(let z=0;z<size;z++){
        const wx=cx*size+x, wz=cz*size+z, top=gen.height(wx,wz);
        for(let y=0;y<height;y++) blocks[index(x,y,z)] = gen.getWithHeight(wx,y,wz,top,seaLevel);
        if(top>=seaLevel+1){
          gen.decorateColumn(wx,wz,top,{getBlock:(a,b,d)=>{
            const lx=a-cx*size,lz=d-cz*size;
            return (lx>=0&&lx<size&&lz>=0&&lz<size&&b>=0&&b<height)?blocks[index(lx,b,lz)]:0;
          },setBlock:(a,b,d,v)=>{
            const lx=a-cx*size,lz=d-cz*size;
            if(lx>=0&&lx<size&&lz>=0&&lz<size&&b>=0&&b<height)blocks[index(lx,b,lz)]=v;
          }});
        }
      }
    }
    self.postMessage({id,cx,cz,buffer:blocks.buffer},[blocks.buffer]);
  } catch(err) {
    self.postMessage({id,error:String(err?.stack||err)});
  }
};
