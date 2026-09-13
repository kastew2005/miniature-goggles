export class Controls{
constructor(camera,dom){
  this.camera=camera;this.dom=dom;this.keys={};this.yaw=0;this.pitch=0;
  this.sensitivity=.0065;
  this.touchSensitivity=.0058;
  this.touchPitchSensitivity=.0054;
  this.locked=false;
  this.lookPointerId=null;this.lastX=0;this.lastY=0;
  const keyDown=e=>{this.keys[e.code]=true;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault?.()};
  const keyUp=e=>{this.keys[e.code]=false};
  addEventListener("keydown",keyDown,{passive:false});addEventListener("keyup",keyUp,{passive:true});
  dom.addEventListener("click",()=>{if(matchMedia("(pointer:fine)").matches)dom.requestPointerLock?.()});
  document.addEventListener("pointerlockchange",()=>this.locked=document.pointerLockElement===dom);
  document.addEventListener("mousemove",e=>{if(!this.locked)return;this.applyLook(e.movementX,e.movementY,this.sensitivity,this.sensitivity)});
  const isTouchLook=e=>e.pointerType==="touch"&&!e.target?.closest?.("#mobileControls,#hotbar,#pauseGameButton,.screen,.debugScreen,#controlsEditor");
  dom.addEventListener("pointerdown",e=>{
    if(e.pointerType!=="touch"||!isTouchLook(e)||this.lookPointerId!==null)return;
    this.lookPointerId=e.pointerId;this.lastX=e.clientX;this.lastY=e.clientY;
    try{dom.setPointerCapture(e.pointerId)}catch{}
    e.preventDefault();
  },{passive:false});
  dom.addEventListener("pointermove",e=>{
    if(e.pointerType!=="touch"||e.pointerId!==this.lookPointerId)return;
    const dx=e.clientX-this.lastX,dy=e.clientY-this.lastY;this.lastX=e.clientX;this.lastY=e.clientY;
    this.applyLook(dx,dy,this.touchSensitivity,this.touchPitchSensitivity);e.preventDefault();
  },{passive:false});
  const end=e=>{if(e.pointerId!==this.lookPointerId)return;this.lookPointerId=null;try{dom.releasePointerCapture(e.pointerId)}catch{}};
  dom.addEventListener("pointerup",end,{passive:true});dom.addEventListener("pointercancel",end,{passive:true});dom.addEventListener("lostpointercapture",()=>{this.lookPointerId=null},{passive:true});
  addEventListener("blur",()=>{this.lookPointerId=null;for(const k of Object.keys(this.keys))this.keys[k]=false},{passive:true});
}
applyLook(dx,dy,yawSensitivity,pitchSensitivity){
  this.yaw-=dx*yawSensitivity;this.pitch-=dy*pitchSensitivity;
  const limit=Math.PI/2-.08;this.pitch=Math.max(-limit,Math.min(limit,this.pitch));
}
setTouchSensitivity(v){const n=Math.max(.0025,Math.min(.009,Number(v)||.0058));this.touchSensitivity=n;this.touchPitchSensitivity=n*.93;try{localStorage.setItem("vs_camera_sensitivity_v73",String(n))}catch{}}
loadTouchSensitivity(){try{const n=Number(localStorage.getItem("vs_camera_sensitivity_v73"));if(Number.isFinite(n)&&n>0)this.setTouchSensitivity(n)}catch{}}
updateCamera(){this.camera.rotation.order="YXZ";this.camera.rotation.y=this.yaw;this.camera.rotation.x=this.pitch}
forward(){return {x:-Math.sin(this.yaw),z:-Math.cos(this.yaw)}}
right(){return {x:Math.cos(this.yaw),z:-Math.sin(this.yaw)}}
}
