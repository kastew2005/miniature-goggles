import {INFO} from "../world/Block.js";

// Minecraft-style shaped crafting. Empty cells are represented by null.
// A recipe is valid only when its pattern fits completely inside the active grid.
export const RECIPES_2X2=[
 {name:"Доски ×4",out:{id:10,count:4},pattern:[[6]]},
 {name:"Палки ×4",out:{id:101,count:4},pattern:[[10],[10]]},
 {name:"Верстак",out:{id:128,count:1},pattern:[[10,10],[10,10]]},
 {name:"Факел ×4",out:{id:109,count:4},pattern:[[8],[101]]}
];
export const RECIPES_3X3=[
 {name:"Каменная кирка",out:{id:103,count:1},pattern:[[3,3,3],[null,101,null],[null,101,null]]},
 {name:"Железная кирка",out:{id:104,count:1},pattern:[[118,118,118],[null,101,null],[null,101,null]]},
 {name:"Деревянная кирка",out:{id:102,count:1},pattern:[[10,10,10],[null,101,null],[null,101,null]]},
 {name:"Каменный топор",out:{id:106,count:1},pattern:[[3,3,null],[3,101,null],[null,101,null]]},
 {name:"Деревянный топор",out:{id:105,count:1},pattern:[[10,10,null],[10,101,null],[null,101,null]]},
 {name:"Меч",out:{id:107,count:1},pattern:[[3],[3],[101]]},
 {name:"Мотыга",out:{id:119,count:1},pattern:[[10,10],[null,101],[null,101]]},
 {name:"Факел ×4",out:{id:109,count:4},pattern:[[8],[101]]},
 {name:"Печь",out:{id:24,count:1},pattern:[[3,3,3],[3,null,3],[3,3,3]]},
 {name:"Сундук",out:{id:113,count:1},pattern:[[10,10,10],[10,null,10],[10,10,10]]},
 {name:"Хлеб",out:{id:111,count:1},pattern:[[116,116,116]]},
 {name:"Кровать",out:{id:127,count:1},pattern:[[126,126,126],[10,10,10]]},
];

function trimPattern(pattern){let top=0,bottom=pattern.length-1,left=Infinity,right=-1;for(let y=0;y<pattern.length;y++)for(let x=0;x<pattern[y].length;x++)if(pattern[y][x]!=null){left=Math.min(left,x);right=Math.max(right,x);}
 if(right<0)return [[null]];const out=[];for(let y=top;y<=bottom;y++)out.push(pattern[y].slice(left,right+1));return out;}
function matchesAt(grid,size,pattern,ox,oy){const p=trimPattern(pattern),ph=p.length,pw=p[0].length;if(ox+pw>size||oy+ph>size)return false;for(let y=0;y<size;y++)for(let x=0;x<size;x++){const expected=(x>=ox&&x<ox+pw&&y>=oy&&y<oy+ph)?p[y-oy][x-ox]:null;const actual=grid[y*size+x]?.id||null;if((expected||null)!==(actual||null))return false;}return true}
export function getCraftResult(grid,recipes){const size=Math.sqrt(grid.length);for(const recipe of recipes){for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(matchesAt(grid,size,recipe.pattern,x,y))return {recipe};}return null}
export function craftGrid(grid,recipe,inv){const result=getCraftResult(grid,[recipe]);if(!result)return false;const size=Math.sqrt(grid.length),p=trimPattern(recipe.pattern),pw=p[0].length,ph=p.length;let ox=0,oy=0,found=false;for(let y=0;y<size&&!found;y++)for(let x=0;x<size&&!found;x++)if(matchesAt(grid,size,recipe.pattern,x,y)){ox=x;oy=y;found=true;}
 for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const slot=grid[(oy+y)*size+ox+x];if(slot?.id){slot.count--;if(slot.count<=0)slot.id=0;}}
 if(!inv.add(recipe.out.id,recipe.out.count)){for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){const id=p[y][x];if(id!=null){const slot=grid[(oy+y)*size+ox+x];slot.id=id;slot.count=(slot.count||0)+1}}return false;}return true}
