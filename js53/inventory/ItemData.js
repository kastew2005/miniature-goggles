import {INFO,ICON} from "../world/Block.js";

export const ItemData=Object.freeze(Object.fromEntries(Object.entries(INFO).map(([id,info])=>[Number(id),Object.freeze({
  id:Number(id),name:info?.name||`Предмет ${id}`,icon:ICON[id]||"·",max_stack:Math.max(1,Number(info?.maxStack||64))
})])));

export function getItemData(id){return ItemData[id]||{id:Number(id)||0,name:"Предмет",icon:"·",max_stack:64}}

export class ItemStack{
  constructor(id=0,count=0){const d=getItemData(id);this.id=Number(id)||0;this.count=Math.max(0,Math.min(d.max_stack,Number(count)||0))}
  get empty(){return !this.id||this.count<=0}
  get max_stack(){return getItemData(this.id).max_stack}
  clone(){return new ItemStack(this.id,this.count)}
}
export function createItemStack(id=0,count=0){return new ItemStack(id,count)}
export function cloneItemStack(stack){return new ItemStack(stack?.id||0,stack?.count||0)}
