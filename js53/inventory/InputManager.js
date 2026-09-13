export class InputManager{
  constructor(){this.pointerType="mouse";this.keys=new Set();this.shift=false;this.bound=[]}
  attachKeyboard(target=window){const down=e=>{this.keys.add(e.code);this.shift=e.shiftKey};const up=e=>{this.keys.delete(e.code);this.shift=e.shiftKey};target.addEventListener("keydown",down);target.addEventListener("keyup",up);this.bound.push(()=>{target.removeEventListener("keydown",down);target.removeEventListener("keyup",up)})}
  bindPointer(el,handlers={}){
    const down=e=>{this.pointerType=e.pointerType||"mouse";handlers.down?.(e)};
    const up=e=>{handlers.up?.(e)};
    const cancel=e=>{handlers.cancel?.(e)};
    el.addEventListener("pointerdown",down,{passive:false});el.addEventListener("pointerup",up,{passive:false});el.addEventListener("pointercancel",cancel,{passive:false});
    const unbind=()=>{el.removeEventListener("pointerdown",down);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",cancel)};this.bound.push(unbind);return unbind;
  }
  isTouch(e){return e.pointerType==="touch"||e.pointerType==="pen"}
  destroy(){for(const fn of this.bound)fn();this.bound=[];this.keys.clear()}
}
