import THREE from "./three.js";
import {CONFIG} from "./config.js";import {QualityManager} from "./QualityManager.js";import {World} from "./world/World.js";import {Player} from "./player/Player.js";import {Controls} from "./player/Controls.js";import {MobManager} from "./entities/Mob.js";import {Particles} from "./rendering/Particles.js";import {Lighting} from "./rendering/Lighting.js";import {Effects} from "./rendering/Effects.js";import {Weather} from "./rendering/Weather.js";import {AudioManager} from "./audio/AudioManager.js";import {Inventory} from "./inventory/Inventory.js";import {RECIPES_2X2,RECIPES_3X3,craftGrid,getCraftResult} from "./inventory/Crafting.js";import {HUD} from "./ui/HUD.js";import {Menu} from "./ui/Menu.js";import {SaveManager} from "./save/SaveManager.js";import {BLOCK,INFO,ITEM,ICON} from "./world/Block.js";import {Chunk} from "./world/Chunk.js";import {MiningSystem} from "./world/MiningSystem.js";import {SurvivalSystems} from "./systems/SurvivalSystems.js";import {NetworkManager} from "./network/NetworkManager.js";import {DebugConsole} from "./debug/DebugConsole.js";
class Game{
 constructor(){this.skipUnloadSave=false;const save=SaveManager.loadActive();if(save?.seed)CONFIG.WORLD.SEED=save.seed;this.quality=new QualityManager();CONFIG.QUALITY=this.quality.preset;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x87c9ef);this.scene.add(new THREE.HemisphereLight(0xffffff,0x4f5f45,1.35));this.scene.add(new THREE.AmbientLight(0xffffff,0.35));const vp0={w:Math.max(1,Math.round(window.visualViewport?.width||window.innerWidth||1)),h:Math.max(1,Math.round(window.visualViewport?.height||window.innerHeight||1))};this.camera=new THREE.PerspectiveCamera(CONFIG.RENDER.FOV,vp0.w/vp0.h,.05,CONFIG.RENDER.FAR);try{this.renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:this.quality.tier==="low"?"low-power":"high-performance",stencil:false,depth:true,preserveDrawingBuffer:false});}catch(e){throw new Error("WebGL недоступен на этом устройстве: "+(e?.message||e))}this.quality.configureRenderer(this.renderer);if(this.quality.tier==="low")this.renderer.toneMapping=THREE.NoToneMapping;this.resizeRenderer();this.renderer.setScissorTest(false);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.shadowMap.enabled=this.quality.preset.shadows;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.toneMapping=this.quality.tier==="low"?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=this.quality.tier==="low"?1:1.05;document.getElementById("game").appendChild(this.renderer.domElement);
  this.controls=new Controls(this.camera,this.renderer.domElement);this.controls.loadTouchSensitivity();this.world=new World(this.scene,CONFIG);this.world.loadChanges(save?.changes||[]);this.player=new Player(this.camera,this.world,this.controls,CONFIG);this.inventory=new Inventory();this.player.setInventory(this.inventory);if(!save?.inventory){this.inventory.add(ITEM.SEEDS,8);this.inventory.add(ITEM.HOE,1);this.inventory.add(BLOCK.GRASS,32);this.inventory.add(BLOCK.DIRT,64);this.inventory.add(BLOCK.STONE,64);this.inventory.add(BLOCK.LOG,16);this.inventory.add(BLOCK.PLANKS,32);this.inventory.add(BLOCK.SAND,32);this.inventory.add(ITEM.APPLE,3)}
  this.hud=new HUD(this.player,this.inventory);this.mobs=new MobManager(this.scene,this.world,CONFIG.QUALITY);this.particles=new Particles(this.scene,CONFIG.QUALITY);this.light=null;this.weather=null;this.effects=new Effects(this.renderer);this.audio=new AudioManager();this.menu=new Menu(this);this.systems=new SurvivalSystems(this);this.mining=new MiningSystem(this);this.hud.systems=this.systems;this.network=new NetworkManager(this);this.debug=new DebugConsole(this);this.THREE=THREE;this.vec=(x,y,z)=>new THREE.Vector3(x,y,z);this.running=false;this.inventoryOpen=false;this.mode="singleplayer";this.respawnPoint=null;this.bedRespawnKey=null;this.reducedMotion=false;this.installPrompt=null;this.lastFootstep=0;this.lastPlayerX=0;this.lastPlayerZ=0;this.breakProgress=0;this.miningHeld=false;this.breakTargetKey="";this.breakTargetId=0;this.breakTime=0;this.perfFrames=0;this.perfTime=0;this.perfCooldown=0;this.perfStable=0;this.dynamicPixelRatio=this.quality.preset.pixelRatio;this.outline=this.makeOutline();this.time=save?.time||180;this.last=performance.now();this.mobTimer=0;this.saveTimer=0;this.mineTimer=0;this.worldStreamTimer=0;this.fallTimer=0;this.smokeTimer=0;this.raycastTimer=0;this.cachedTarget=null;this.chunkTickTimer=0;this.meshFrameSkip=0;const qv=document.getElementById("qualityValue"),qs=document.getElementById("qualitySelect");if(qv)qv.textContent=this.quality.tier.toUpperCase();if(qs)qs.value=this.quality.tier;this.setupInput();this.setupTouchLayout();this.setupInventory();this.setupInstall();if(save?.inventory){try{this.inventory.deserialize(save.inventory)}catch(e){console.warn("Inventory save ignored",e)}}if(save?.systems){try{this.systems.deserialize(save.systems)}catch(e){console.warn("Old systems save ignored",e)}}if(save?.respawnPoint){this.respawnPoint=save.respawnPoint;this.bedRespawnKey=save.bedRespawnKey||null}if(save?.player){this.player.xp=Number(save.player.xp||0);this.player.level=Math.max(1,Number(save.player.level||1));this.player.stamina=Math.max(0,Math.min(100,Number(save.player.stamina??100)));const x=Number(save.player.x),y=Number(save.player.y),z=Number(save.player.z);if([x,y,z].every(Number.isFinite)){this.player.pos.set(x,Math.max(1,Math.min(CONFIG.WORLD.HEIGHT-2,y)),z)}}this.bindViewportResize();this.resize();this.setModeBadge();this.setGameUI(false);this.loop()}
 setGameUI(visible){
  const hud=document.getElementById("hud"),mobile=document.getElementById("mobileControls"),pause=document.getElementById("pauseGameButton");
  if(hud)hud.classList.toggle("gameActive",!!visible);
  if(mobile)mobile.classList.toggle("gameActive",!!visible);
  if(pause)pause.style.display=visible?"block":"none";
 }
 async start(){
  if(this.starting)return;
  this.starting=true;
  const boot=document.getElementById("bootSplash"),bar=document.getElementById("bootProgress"),status=document.getElementById("bootStatus");
  const setBoot=(pct,text)=>{if(bar)bar.style.width=pct+"%";if(status)status.textContent=text};
  try{
    // iOS Safari can leave Screen Orientation.lock() pending. Never block world startup on it.
    this.requestLandscape();
    this.mode="singleplayer";
    this.network.disconnect();
    this.setModeBadge();
    try{this.audio.start()}catch(e){console.warn("Audio disabled",e)}
    this.menu.hideMain();
    this.running=false;
    setBoot(8,"Запускаем мир…");
    this.world.cfg.WORLD.RENDER_DISTANCE=Math.min(1,this.quality.preset.startupDistance);
    this.world.lastCenter="";
    const s=this.world.cfg.WORLD.CHUNK_SIZE;
    const cx=Math.floor(this.player.pos.x/s),cz=Math.floor(this.player.pos.z/s);
    setBoot(20,"Создаём стартовый участок…");
    if(!this.world.chunks.has(this.world.key(cx,cz))){
      // Safari-safe startup: generation and mesh building are isolated so one bad
      // chunk/material cannot abort the entire world launch.
      try{ this.world.generateChunk(cx,cz,false); }
      catch(genErr){
        console.error("START CHUNK GENERATION FAILED",genErr);
        const safe=new Chunk(cx,cz,s,this.world.cfg.WORLD.HEIGHT);
        for(let x=0;x<s;x++)for(let z=0;z<s;z++){
          safe.set(x,0,z,BLOCK.BEDROCK); safe.set(x,1,z,BLOCK.STONE); safe.set(x,2,z,BLOCK.DIRT); safe.set(x,3,z,BLOCK.GRASS);
        }
        this.world.chunks.set(this.world.key(cx,cz),safe);
        try{this.world.queueRebuild(safe)}catch(e){console.warn("SAFE CHUNK QUEUE FAILED",e)}
      }
    }
    this.world.ensureStarterVisual(cx,cz);
    setBoot(48,"Строим первый участок…");
    try{ this.world.processMeshQueue(this.quality.mobile?6:18); }
    catch(meshErr){ console.error("START MESH FAILED",meshErr); }
    setBoot(70,"Настраиваем персонажа…");
    const save=SaveManager.loadActive();
    if(save?.player){
      this.player.health=Number.isFinite(Number(save.player.health))?Math.max(0,Math.min(20,Number(save.player.health))):20;
      this.player.hunger=Number.isFinite(Number(save.player.hunger))?Math.max(0,Math.min(20,Number(save.player.hunger))):20;
    }else{
      this.player.pos.y=this.findGround(this.player.pos.x,this.player.pos.z)+.02;
    }
    this.camera.position.set(this.player.pos.x,this.player.pos.y+1.62,this.player.pos.z);
    // Start with a slight downward view so the terrain is immediately visible.
    this.controls.pitch=-0.28;
    this.controls.updateCamera();
    this.world.cfg.WORLD.RENDER_DISTANCE=this.quality.preset.renderDistance;
    this.world.lastCenter="";
    // The first playable frame must not depend on optional systems or workers.
    setBoot(88,"Запускаем игровой кадр…");
    this.running=true;
    this.setGameUI(true);
    requestAnimationFrame(()=>this.world.processMeshQueue(this.quality.mobile?4:10));
    setBoot(100,"Мир готов");
    // Initialize heavy optional systems after the first visible frame.
    setTimeout(()=>{
      try{
        if(this.running && this.world.chunks.size>0 && this.world.meshes.size===0){
          console.warn("No chunk mesh after startup; forcing rebuild");
          for(const c of this.world.chunks.values()) this.world.queueRebuild(c);
          this.world.processMeshQueue(this.quality.mobile?4:12);
          if(this.world.meshes.size>0)this.world.removeStarterVisual();
        }
      }catch(e){console.error("Chunk recovery failed",e)}
    },1500);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      try{this.light=new Lighting(this.scene,this.world,CONFIG)}catch(e){console.warn("Lighting disabled",e);this.light=null}
      try{this.weather=new Weather(this.scene,CONFIG.QUALITY)}catch(e){console.warn("Weather disabled",e);this.weather=null}
      // Expand the world only after gameplay is already responsive.
      requestAnimationFrame(()=>this.world.generateAround(this.player.pos.x,this.player.pos.z));
    }));
    if(!matchMedia("(pointer:coarse)").matches) this.renderer.domElement.requestPointerLock?.();
  }catch(err){
    // Never throw the player back to the main menu. Keep the game alive even if
    // an optional startup subsystem fails on iOS/Safari.
    console.error("WORLD START RECOVERED",err);
    try{
      this.running=true;
      this.setGameUI(true);
      this.camera.position.set(this.player.pos.x,this.player.pos.y+1.62,this.player.pos.z);
      if(status)status.textContent="Мир запущен в безопасном режиме";
    }catch(recoveryErr){
      console.error("WORLD RECOVERY FAILED",recoveryErr);
      if(status)status.textContent="Не удалось запустить мир";
      this.setGameUI(false);
    }
  }finally{
    this.starting=false;
  }
 }
 findGround(x,z){for(let y=CONFIG.WORLD.HEIGHT-1;y>=0;y--)if(INFO[this.world.getBlock(Math.floor(x),y,Math.floor(z))]?.solid)return y+1;return 70}
 launchWorld(id){if(!id)return false;try{const data=SaveManager.readAll();const world=data.worlds?.[id];if(!world?.save)return false;SaveManager.setActive(id);for(const k of ["vs_launch_world_v75","vs_launch_world_v71","vs_launch_world_v70","vs_launch_world_v69","vs_launch_world_v68","vs_launch_world_v67"])try{sessionStorage.removeItem(k)}catch{}try{sessionStorage.setItem("vs_launch_world_v75",id)}catch{}location.reload();return true}catch(e){console.error("WORLD LAUNCH FAILED",e);return false}}
 newWorld(name="Новый мир",seed=""){this.skipUnloadSave=true;this.running=false;this.network.disconnect();const id=SaveManager.createWorld(name,seed);try{sessionStorage.setItem("vs_launch_world_v75",id)}catch(e){}location.reload()}
 hostLAN(){this.save();const u=`${location.protocol==="https:"?"wss":"ws"}://${location.host}/ws`;this.mode="lan-host";this.setModeBadge();this.menu.hideMain();this.network.connect(u,true);this.network.chatLine("★ Локальная игра открыта для друзей");this.network.syncHostWorld();this.running=true;if(!matchMedia("(pointer:coarse)").matches)this.renderer.domElement.requestPointerLock?.()}
 connectLAN(){const v=document.getElementById("lanAddress"),u=v?.value.trim();if(!u){this.network.chatLine("Укажи адрес LAN-сервера");return}this.mode="lan-client";this.setModeBadge();this.menu.hideMain();this.network.connect(u,false);this.running=true;if(!matchMedia("(pointer:coarse)").matches)this.renderer.domElement.requestPointerLock?.()}
 resume(){this.menu.hidePause();this.running=true;this.setGameUI(true);this.renderer.domElement.requestPointerLock?.()}
 save(){const ok=SaveManager.save({systems:this.systems.serialize(),seed:CONFIG.WORLD.SEED,time:this.time,player:{x:this.player.pos.x,y:this.player.pos.y,z:this.player.pos.z,health:this.player.health,hunger:this.player.hunger,xp:this.player.xp,level:this.player.level,stamina:this.player.stamina},inventory:this.inventory.serialize(),changes:this.world.serializeChanges(),respawnPoint:this.respawnPoint,bedRespawnKey:this.bedRespawnKey});if(ok){const t=document.getElementById("saveToast");t.textContent="✓ Мир сохранён";t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1200)}}
 toMenu(){this.save();this.network.disconnect();this.mode="singleplayer";this.setModeBadge();this.running=false;this.setGameUI(false);document.exitPointerLock?.();this.menu.hidePause();this.menu.showMain()}
 toggleInventory(){this.inventoryOpen=!this.inventoryOpen;const panel=document.getElementById("inventoryPanel");if(!panel)return;panel.classList.toggle("hidden",!this.inventoryOpen);if(this.inventoryOpen){this.running=false;document.exitPointerLock?.();this.renderInventory()}else{this.returnCraftGrid(this.craftMode==="table"?this.craftGrid3:this.craftGrid2);this.craftMode="player";this.running=true;if(!matchMedia("(pointer:coarse)").matches)this.renderer.domElement.requestPointerLock?.()}}
 setupInventory(){
  this.craftGrid2=Array.from({length:4},()=>({id:0,count:0}));
  this.craftGrid3=Array.from({length:9},()=>({id:0,count:0}));
  this.craftMode="player";
  this.renderInventory();
 }
 openCraftingTable(){
  this.craftMode="table";
  const p=document.getElementById("inventoryPanel");if(!p)return;
  p.classList.remove("hidden");this.inventoryOpen=true;this.running=false;document.exitPointerLock?.();
  this.renderInventory();
 }
 returnCraftGrid(grid){
  if(!grid)return;
  for(const s of grid){if(s.id&&s.count){if(!this.inventory.add(s.id,s.count))return false;s.id=0;s.count=0}}
  return true;
 }
 closeCraftingUI(){
  this.returnCraftGrid(this.craftMode==="table"?this.craftGrid3:this.craftGrid2);
  this.craftMode="player";this.inventoryOpen=false;
 }
 addToCraftGrid(index,id,count=1){
  const grid=this.craftMode==="table"?this.craftGrid3:this.craftGrid2,slot=grid[index];
  if(!slot||!id||!this.inventory.has(id,count))return false;
  if(slot.id&&slot.id!==id)return false;
  slot.id=id;slot.count=Math.min(64,slot.count+count);this.inventory.remove(id,count);return true;
 }
 takeFromCraftGrid(index){
  const grid=this.craftMode==="table"?this.craftGrid3:this.craftGrid2,slot=grid[index];
  if(!slot?.id)return false;
  if(!this.inventory.add(slot.id,1))return false;
  slot.count--;if(slot.count<=0)slot.id=0;return true;
 }
 getCurrentRecipes(){return this.craftMode==="table"?RECIPES_3X3:RECIPES_2X2}
 renderCraftGrid(){
  const gridEl=document.getElementById("craftGrid");if(!gridEl)return;
  const grid=this.craftMode==="table"?this.craftGrid3:this.craftGrid2;
  gridEl.innerHTML="";gridEl.className="craftGrid "+(this.craftMode==="table"?"grid3":"grid2");
  grid.forEach((s,i)=>{const b=document.createElement("button");b.type="button";b.className="craftCell";b.innerHTML=`<span>${s.id?ICON[s.id]||"·":""}</span><small>${s.count||""}</small>`;b.onclick=()=>{if(this.takeFromCraftGrid(i))this.renderInventory()};gridEl.appendChild(b)});
  const out=getCraftResult(grid,this.getCurrentRecipes()),o=document.getElementById("craftOutput");
  if(o){o.innerHTML=out?`<span>${ICON[out.recipe.out.id]||"·"}</span><strong>${INFO[out.recipe.out.id]?.name||"Предмет"}</strong><small>×${out.recipe.out.count}</small>`:`<span>→</span><strong>Нет результата</strong>`;o.classList.toggle("ready",!!out);o.onclick=()=>{if(!out)return;if(craftGrid(grid,out.recipe,this.inventory)){this.audio.block();this.renderInventory()}}}
  const title=document.getElementById("craftTitle");if(title)title.textContent=this.craftMode==="table"?"ВЕРСТАК • 3×3":"КРАФТ • 2×2";
 }
 setupCraftingInventoryInteractions(){
  const grid=document.getElementById("inventoryGrid");if(!grid)return;
  grid.querySelectorAll(".invSlot").forEach((d,i)=>{
    d.onclick=()=>{
      const s=this.inventory.slots[i];
      if(!s?.id)return;
      const g=this.craftMode==="table"?this.craftGrid3:this.craftGrid2;
      const idx=g.findIndex(x=>!x.id||x.id===s.id);
      if(idx>=0&&this.addToCraftGrid(idx,s.id,1)){this.audio.block();this.renderInventory();return}
      this.inventory.selected=i;this.renderInventory();
    };
    d.ondblclick=()=>{const s=this.inventory.slots[i];if(this.inventory.equipFromInventory(i,this.equipmentSlotForItem(s?.id))){this.audio.block();this.renderInventory()}}
  });
 }
 renderInventory(){
  const grid=document.getElementById("inventoryGrid");if(!grid)return;
  const icon=id=>ICON[id]||"·";grid.innerHTML="";
  for(let i=0;i<36;i++){const s=this.inventory.slots[i],d=document.createElement("button");d.type="button";d.className="invSlot"+(i===this.inventory.selected?" selected":"");d.innerHTML=`<span class="slotIcon">${icon(s.id)}</span><small>${s.count||""}</small>`;grid.appendChild(d)}
  const eq=document.getElementById("equipmentGrid");if(eq){eq.querySelectorAll("[data-equip-slot]").forEach(el=>{const slot=el.dataset.equipSlot,id=this.inventory.equipmentItem(slot);el.innerHTML=`<span class="equipmentIcon">${id?icon(id):"＋"}</span><small>${id?(INFO[id]?.name||"Предмет"):el.dataset.empty}</small>`;el.classList.toggle("filled",!!id);el.onclick=()=>{if(this.inventory.unequip(slot)){this.audio.block();this.renderInventory()}}})}
  const selectedName=INFO[this.inventory.selectedItem()?.id]?.name||"Пусто",selectedInfo=document.getElementById("inventorySelectedInfo");if(selectedInfo)selectedInfo.textContent=selectedName;
  const armor=this.getArmorValue();const av=document.getElementById("armorValue");if(av)av.textContent=`ЗАЩИТА ${armor}`;
  const hand=document.getElementById("inventoryHandItem"),eqHead=document.getElementById("inventoryHeadItem"),eqBody=document.getElementById("inventoryBodyItem"),eqLegs=document.getElementById("inventoryLegsItem"),eqFeet=document.getElementById("inventoryFeetItem"),eqOff=document.getElementById("inventoryOffhandItem");
  const selected=this.inventory.selectedItem();if(hand)hand.textContent=selected?.id?icon(selected.id):"";const held=document.getElementById("inventoryHeldName");if(held)held.textContent=`Рука: ${selected?.id?(INFO[selected.id]?.name||"предмет"):"пусто"}`;
  if(eqHead)eqHead.textContent=this.inventory.equipment.head?icon(this.inventory.equipment.head):"";if(eqBody)eqBody.textContent=this.inventory.equipment.body?icon(this.inventory.equipment.body):"";if(eqLegs)eqLegs.textContent=this.inventory.equipment.legs?icon(this.inventory.equipment.legs):"";if(eqFeet)eqFeet.textContent=this.inventory.equipment.feet?icon(this.inventory.equipment.feet):"";if(eqOff)eqOff.textContent=this.inventory.equipment.offhand?icon(this.inventory.equipment.offhand):"";
  this.renderCraftGrid();this.setupCraftingInventoryInteractions();
 }
 equipmentSlotForItem(id){const info=INFO[id];if(!info)return null;if(info.tool||info.tool==="sword")return info.tool==="sword"?"weapon":"tool";if(info.armorSlot)return info.armorSlot;return null}
 getArmorValue(){return Object.values(this.inventory.equipment||{}).reduce((sum,id)=>sum+(INFO[id]?.armor||0),0)}

 setupTouchLayout(){
  this.touchLayoutKey="vs_touch_layout_v75";this.touchActionKey="vs_touch_action_mode_v75";this.touchActionMode=localStorage.getItem(this.touchActionKey)||localStorage.getItem("vs_touch_action_mode_v74")||"mine";
  this.touchDefaults={
    joystick:{x:2.5,y:67,size:104},jump:{x:75,y:58,size:62},attack:{x:87,y:58,size:62},use:{x:75,y:76,size:62},inventory:{x:87,y:76,size:62},pause:{x:50,y:2,size:48}
  };
  try{this.touchLayout=JSON.parse(localStorage.getItem(this.touchLayoutKey)||"null")||JSON.parse(JSON.stringify(this.touchDefaults))}catch{this.touchLayout=JSON.parse(JSON.stringify(this.touchDefaults))}
  this.editingControls=false;this.selectedControl=null;this.applyTouchLayout();this.updateTouchHint();
  const q=id=>document.getElementById(id),range=q("controlSizeRange"),value=q("controlSizeValue"),selected=q("controlSelected"),camRange=q("cameraSensitivityRange"),camValue=q("cameraSensitivityValue"),actionMode=q("touchActionMode");
  if(actionMode){actionMode.value=this.touchActionMode;actionMode.addEventListener("change",()=>{this.touchActionMode=actionMode.value==="place"?"place":"mine";try{localStorage.setItem(this.touchActionKey,this.touchActionMode)}catch{};this.updateTouchHint()})}
  try{const saved=Number(localStorage.getItem("vs_camera_sensitivity_v73") || localStorage.getItem("vs_camera_sensitivity_v71"));if(Number.isFinite(saved))this.controls.touchSensitivity=this.controls.touchPitchSensitivity=Math.max(.004,Math.min(.018,saved))}catch{}
  if(camRange){camRange.value=Math.round(this.controls.touchSensitivity*1000);if(camValue)camValue.textContent=(this.controls.touchSensitivity*1000).toFixed(0)}
  camRange?.addEventListener("input",()=>{const v=Math.max(.004,Math.min(.018,Number(camRange.value)/1000));this.controls.touchSensitivity=v;this.controls.touchPitchSensitivity=v;try{localStorage.setItem("vs_camera_sensitivity_v73",String(v))}catch{}if(camValue)camValue.textContent=Math.round(v*1000)});
  q("controlsEditButton")?.addEventListener("click",()=>this.openControlsEditor());
  q("controlsDone")?.addEventListener("click",()=>this.closeControlsEditor());
  q("controlsReset")?.addEventListener("click",()=>{this.touchLayout=JSON.parse(JSON.stringify(this.touchDefaults));this.applyTouchLayout();if(range)range.value=this.selectedControl?(this.touchLayout[this.selectedControl]?.size||82):82;if(value)value.textContent=range?.value||82});
  range?.addEventListener("input",()=>{if(!this.selectedControl)return;this.touchLayout[this.selectedControl].size=Number(range.value);this.applyTouchLayout();if(value)value.textContent=range.value;this.persistTouchLayout()});
  const controls=["joystick","jump","attack","use","inventory","pause"];
  for(const key of controls){const el=key==="pause"?q("pauseGameButton"):document.querySelector(`[data-control="${key}"]`);if(!el)continue;
    el.addEventListener("pointerdown",e=>{if(!this.editingControls)return;e.preventDefault();e.stopPropagation();this.selectControl(key);el.setPointerCapture?.(e.pointerId);const r=el.getBoundingClientRect();el._drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};el.classList.add("editing")},{passive:false});
    el.addEventListener("pointermove",e=>{if(!this.editingControls||!el._drag||el._drag.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();const x=Math.max(0,Math.min(this.getViewportSize().w-el.offsetWidth,e.clientX-el._drag.dx)),y=Math.max(0,Math.min(this.getViewportSize().h-el.offsetHeight,e.clientY-el._drag.dy));const vp=this.getViewportSize();this.touchLayout[key].x=x/vp.w*100;this.touchLayout[key].y=y/vp.h*100;this.applyTouchLayout(false)},{passive:false});
    const end=e=>{if(el._drag?.id!==e.pointerId)return;el._drag=null;el.classList.remove("editing");this.persistTouchLayout()};el.addEventListener("pointerup",end);el.addEventListener("pointercancel",end);
  }
 }
 updateTouchHint(){const el=document.getElementById("hintBar");if(el)el.textContent=this.touchActionMode==="place"?"СВОБОДНАЯ ЗОНА: КАСАНИЕ — ПОСТАВИТЬ • СДВИГ ПАЛЬЦЕМ — КАМЕРА • ⚔ ДОБЫЧА":"СВОБОДНАЯ ЗОНА: УДЕРЖИВАЙ КАСАНИЕ — ДОБЫЧА • СДВИГ ПАЛЬЦЕМ — КАМЕРА • ▣ ПОСТАВИТЬ"}
 selectControl(key){this.selectedControl=key;const q=id=>document.getElementById(id),r=q("controlSizeRange"),v=q("controlSizeValue"),s=q("controlSelected"),item=this.touchLayout[key]||this.touchDefaults[key];if(r)r.value=item.size;if(v)v.textContent=item.size;if(s)s.textContent="Выбрано: "+({joystick:"Джойстик",jump:"Прыжок",attack:"Атака",use:"Использовать",inventory:"Инвентарь",pause:"Пауза"}[key]||key)}
 applyTouchLayout(save=true){
  
  const root=document.body;
  const isTouch=matchMedia("(pointer:coarse)").matches;
  const vp=this.getViewportSize();
  const maxButton=isTouch&&vp.h<520?74:86;
  const minButton=isTouch?58:48;
  const maxJoy=isTouch&&vp.h<520?118:132;
  const minJoy=isTouch?92:100;
  for(const [key,item] of Object.entries(this.touchLayout||{})){
    const el=key==="pause"?document.getElementById("pauseGameButton"):document.querySelector(`[data-control="${key}"]`);
    if(!el)continue;
    const sourceSize=Number(item.size)||68;
    const size=key==="joystick"?Math.max(minJoy,Math.min(maxJoy,sourceSize)):Math.max(minButton,Math.min(maxButton,sourceSize));
    el.style.left=Math.max(0,Math.min(100,item.x))+"%";
    el.style.top=Math.max(0,Math.min(100,item.y))+"%";
    el.style.right="auto";el.style.bottom="auto";
    el.style.width=size+"px";el.style.height=size+"px";
    el.style.fontSize=Math.max(18,size*.30)+"px";
  }
  if(save)this.persistTouchLayout()}
 persistTouchLayout(){try{localStorage.setItem(this.touchLayoutKey,JSON.stringify(this.touchLayout))}catch{}}
 openControlsEditor(){this.running=false;this.editingControls=true;document.body.classList.add("controls-editor-active");this.menu.hidePause();document.getElementById("controlsEditor")?.classList.remove("hidden");document.getElementById("mobileControls")?.classList.add("editorVisible","gameActive");this.applyTouchLayout(false);}
 closeControlsEditor(){this.editingControls=false;document.body.classList.remove("controls-editor-active");document.getElementById("controlsEditor")?.classList.add("hidden");document.getElementById("mobileControls")?.classList.remove("editorVisible","gameActive");this.persistTouchLayout();this.menu.showPause();}
 pauseGame(){if(!this.running)return;this.running=false;this.setGameUI(false);this.menu.showPause();document.exitPointerLock?.();}
 setupInput(){document.getElementById("multiplayerButton")?.addEventListener("click",()=>document.getElementById("multiplayerPanel")?.classList.remove("hidden"));document.getElementById("closeMultiplayer")?.addEventListener("click",()=>document.getElementById("multiplayerPanel")?.classList.add("hidden"));document.getElementById("connectButton")?.addEventListener("click",()=>{const v=document.getElementById("serverAddress");let u=v?.value.trim();if(!u)u=`${location.protocol==="https:"?"wss":"ws"}://${location.host}/ws`;this.mode="multiplayer";this.setModeBadge();this.network.connect(u)});document.getElementById("disconnectButton")?.addEventListener("click",()=>this.network.disconnect());document.getElementById("chatSend")?.addEventListener("click",()=>{const i=document.getElementById("chatInput");this.network.chat(i.value);i.value=""});document.getElementById("chatInput")?.addEventListener("keydown",e=>{if(e.key==="Enter"){this.network.chat(e.target.value);e.target.value=""}});addEventListener("keydown",e=>{if(e.code==="Escape"){if(this.inventoryOpen){this.toggleInventory();return}if(this.running){this.running=false;this.menu.showPause();document.exitPointerLock?.()}return}if(e.code==="KeyE")this.toggleInventory();if(e.code.startsWith("Digit")){const n=+e.code.slice(5)-1;if(n>=0&&n<9)this.inventory.selected=n}if(e.code==="KeyF"&&this.player.eat()){this.audio.block();this.particles.burst(this.player.pos.clone().add(new THREE.Vector3(0,1,0)),0xff5533,8)}});
  addEventListener("mousedown",e=>{if(!this.running)return;if(e.button===0){this.miningHeld=true;this.attackOrBreak()}if(e.button===2)this.placeBlock()});addEventListener("mouseup",e=>{if(e.button===0)this.stopMining()});addEventListener("blur",()=>this.stopMining());addEventListener("contextmenu",e=>e.preventDefault());addEventListener("wheel",e=>{this.inventory.selected=(this.inventory.selected+(e.deltaY>0?1:-1)+9)%9});const bindTouchAction=(id,fn)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener("pointerdown",e=>{if(this.editingControls||!this.running)return;e.preventDefault();e.stopPropagation();el.setPointerCapture?.(e.pointerId);fn()},{passive:false})};bindTouchAction("jumpButton",()=>{if(this.player.jump()){this.audio.jump()}});bindTouchAction("attackButton",()=>{this.miningHeld=true;this.attackOrBreak()});bindTouchAction("useButton",()=>this.useSelected());bindTouchAction("inventoryButton",()=>this.toggleInventory());
  // Free camera zone: Minecraft-like touch interaction. Mine mode uses hold-to-break;
  // Place mode uses a short tap to place the selected block against the aimed face.
  const canvas=this.renderer.domElement;let worldTouch=null;
  const uiTouch=e=>e.target?.closest?.("#mobileControls,#hud,.screen,.debugScreen,#controlsEditor");
  canvas.addEventListener("pointerdown",e=>{if(this.editingControls||!this.running||e.pointerType!=="touch"||uiTouch(e))return;worldTouch={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};try{canvas.setPointerCapture(e.pointerId)}catch{};if(this.touchActionMode==="mine"){this.miningHeld=true;this.attackOrBreak()}e.preventDefault()},{passive:false});
  canvas.addEventListener("pointermove",e=>{if(!worldTouch||worldTouch.id!==e.pointerId)return;const dx=e.clientX-worldTouch.x,dy=e.clientY-worldTouch.y;if(Math.hypot(dx,dy)>14){worldTouch.moved=true;if(this.touchActionMode==="mine")this.stopMining()}},{passive:false});
  const endWorldTouch=e=>{if(!worldTouch||worldTouch.id!==e.pointerId)return;const tap=!worldTouch.moved;const mode=this.touchActionMode;worldTouch=null;if(mode==="place"&&tap&&this.running)this.placeBlock();else if(mode==="mine")this.stopMining();try{canvas.releasePointerCapture?.(e.pointerId)}catch{}};
  canvas.addEventListener("pointerup",endWorldTouch,{passive:false});canvas.addEventListener("pointercancel",e=>{if(worldTouch?.id===e.pointerId){worldTouch=null;this.stopMining()}},{passive:false});
  addEventListener("pointerup",()=>this.stopMining());addEventListener("pointercancel",()=>this.stopMining());const pauseBtn=document.getElementById("pauseGameButton");pauseBtn?.addEventListener("pointerdown",e=>{if(!this.running)return;e.preventDefault();e.stopPropagation();this.pauseGame()},{passive:false});const bindPause=(id,fn)=>{const b=document.getElementById(id);if(!b)return;b.addEventListener("pointerdown",e=>{e.stopPropagation()},{passive:true});b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();fn()})};bindPause("resumeButton",()=>this.resume());bindPause("saveButton",()=>this.save());bindPause("fullscreenPauseButton",()=>this.toggleFullscreen());bindPause("debugPauseButton",()=>this.debug?.show?.());bindPause("controlsEditButton",()=>this.openControlsEditor());bindPause("menuButton",()=>this.toMenu());const closeInv=document.getElementById("closeInventory");if(closeInv)closeInv.onclick=()=>{if(this.inventoryOpen){this.returnCraftGrid(this.craftMode==="table"?this.craftGrid3:this.craftGrid2);this.toggleInventory()}};const closeContainer=document.getElementById("closeContainer");if(closeContainer)closeContainer.onclick=()=>this.systems.close();const depositContainer=document.getElementById("depositContainer");if(depositContainer)depositContainer.onclick=()=>this.systems.depositToChest();const depositAll=document.getElementById("depositAllContainer");if(depositAll)depositAll.onclick=()=>this.systems.depositAllToChest();
  const joy=document.getElementById("joystick"),knob=document.getElementById("joystickKnob");let joyId=null;
  const updateJoy=e=>{const r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.min(r.width*.32,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);knob.style.transform=`translate(${Math.cos(a)*l}px,${Math.sin(a)*l}px)`;this.controls.keys.KeyW=dy<-15;this.controls.keys.KeyS=dy>15;this.controls.keys.KeyA=dx<-15;this.controls.keys.KeyD=dx>15};
  joy.addEventListener("pointerdown",e=>{if(this.editingControls||!this.running||joyId!==null)return;e.preventDefault();e.stopPropagation();joyId=e.pointerId;joy.setPointerCapture?.(e.pointerId);updateJoy(e)},{passive:false});
  joy.addEventListener("pointermove",e=>{if(e.pointerId!==joyId||this.editingControls)return;e.preventDefault();e.stopPropagation();updateJoy(e)},{passive:false});
  const stopJoy=e=>{if(e&&e.pointerId!==joyId)return;if(e)e.stopPropagation();joyId=null;knob.style.transform="";for(const k of ["KeyW","KeyA","KeyS","KeyD"])this.controls.keys[k]=false};joy.addEventListener("pointerup",stopJoy);joy.addEventListener("pointercancel",stopJoy);joy.addEventListener("lostpointercapture",()=>stopJoy());

 }
 useSelected(){const s=this.inventory.selectedItem(),info=s?.id?INFO[s.id]:null;if(info?.food){if(this.player.eat())this.audio.block();return}if(s?.id===ITEM.HOE){const hit=this.player.raycast();if(hit&&[BLOCK.DIRT,BLOCK.GRASS].includes(hit.id)&&this.world.getBlock(hit.block.x,hit.block.y+1,hit.block.z)===BLOCK.AIR){this.world.setBlock(hit.block.x,hit.block.y,hit.block.z,BLOCK.FARMLAND);this.audio.block();this.particles.dust(new THREE.Vector3(hit.block.x+.5,hit.block.y+.5,hit.block.z+.5),0x7a4c2b,8);this.systems.award(2,"Первая грядка")}return}if(info?.place||info?.solid)this.placeBlock()}
  attackOrBreak(){const target=this.player.raycast();if(this.systems.interact(target))return;const result=this.mobs.attack(this.player);if(result.hit){this.audio.hit();this.effects.hit();this.stopMining();if(result.dead){this.inventory.add(ITEM.RAW_MEAT,1);if(Math.random()<.25)this.inventory.add(ITEM.APPLE,1);this.systems.award(20,"Охотник на нежить");this.particles.burst(this.player.pos.clone().add(new THREE.Vector3(0,1,0)),0xb84b4b,20);}return}this.beginMining(target)}
  beginMining(hit){return this.mining.begin(hit)}
  stopMining(){this.mining.stop();this.breakProgress=0}
  updateMining(dt){this.mining.update(dt);this.breakProgress=this.mining.currentProgress}
  finishMining(hit){const t=this.mining.tool();this.mining.finish(hit,t,this.mining.canHarvest(hit.id,t))}
  showBreakProgress(name){this.mining.show(this.breakTargetId||this.cachedTarget?.id)}
  hideBreakProgress(){this.mining.reset()}
  breakBlock(){const hit=this.player.raycast();return hit?this.beginMining(hit):false}
 placeBlock(){const hit=this.player.raycast();if(!hit?.previous)return;const p=hit.previous,s=this.inventory.selectedItem(),id=s?.id,info=INFO[id];if(!id||(!info?.solid&&!info?.place))return;let blockId=info.place||id;if(id===ITEM.SEEDS){if(this.world.getBlock(p.x,p.y-1,p.z)!==BLOCK.FARMLAND&&this.world.getBlock(p.x,p.y-1,p.z)!==BLOCK.DIRT)return;blockId=BLOCK.WHEAT}if(this.player.collides({x:p.x+.5,y:p.y,z:p.z+.5}))return;if(!this.inventory.remove(id,1))return;if(!this.world.setBlock(p.x,p.y,p.z,blockId)){this.inventory.add(id,1);return}this.network.blockChanged(p.x,p.y,p.z,blockId);this.audio.block();this.systems.placed(blockId,p);this.systems.award(1,blockId===BLOCK.CHEST?"Строитель":"");this.particles.burst(new THREE.Vector3(p.x+.5,p.y+.5,p.z+.5),0xffffff,5);if(this.light)this.light.lastScan=""}
 loop(){requestAnimationFrame(()=>this.loop());const now=performance.now(),dt=Math.min(.05,(now-this.last)/1000);this.last=now;this.debug?.update(dt);this.perfFrames++;this.perfTime+=dt;if(this.perfTime>2){const fps=this.perfFrames/this.perfTime;this.perfFrames=0;this.perfTime=0;this.perfCooldown=Math.max(0,this.perfCooldown-2);if(fps<30&&this.perfCooldown<=0){this.perfCooldown=8;this.dynamicPixelRatio=Math.max(.54,this.dynamicPixelRatio-.08);this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.dynamicPixelRatio))}else if(fps>55){this.perfStable+=2;if(this.perfStable>=12){this.perfStable=0;this.dynamicPixelRatio=Math.min(this.quality.preset.pixelRatio,this.dynamicPixelRatio+.03);this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.dynamicPixelRatio))}}else this.perfStable=0}this.effects.update(dt);this.mineTimer=Math.max(0,this.mineTimer-dt);this.raycastTimer-=dt;if(this.raycastTimer<=0){this.raycastTimer=.055;this.cachedTarget=this.player.raycast()}const target=this.cachedTarget;if(this.running&&!this.inventoryOpen){this.updateMining(dt);this.time+=dt;this.controls.updateCamera();this.player.move(dt);const moved=Math.hypot(this.player.pos.x-this.lastPlayerX,this.player.pos.z-this.lastPlayerZ);if(moved>.001)this.audio.step();this.lastPlayerX=this.player.pos.x;this.lastPlayerZ=this.player.pos.z;const shake=this.reducedMotion?0:this.effects.consumeShake();if(shake){this.camera.position.x+=(Math.random()-.5)*shake;this.camera.position.y+=(Math.random()-.5)*shake}this.mobTimer+=dt;this.saveTimer+=dt;const phase=(this.time%CONFIG.DAY.LENGTH)/CONFIG.DAY.LENGTH,night=phase<.25||phase>.75;if(this.mobTimer>3){this.mobTimer=0;if(night&&this.mobs.mobs.length<this.mobs.max+(this.player.level>3?3:0)&&Math.random()<(.55+phase*0.25)){const a=Math.random()*Math.PI*2,r=16+Math.random()*22,x=this.player.pos.x+Math.cos(a)*r,z=this.player.pos.z+Math.sin(a)*r,y=this.findGround(x,z);this.mobs.spawn(x,y,z)}}const oldHealth=this.player.health;if(this.mobs.update(dt,this.player)&&this.player.health<oldHealth){this.effects.damage();this.audio.hurt()}if(this.player.health<=0)this.handleDeath();this.fallTimer+=dt;this.smokeTimer+=dt;this.worldStreamTimer+=dt;if(this.fallTimer>.9){this.fallTimer=0;this.world.tickFalling(this.player)}if(this.smokeTimer>.3){this.smokeTimer=0;this.emitCampfireSmoke()}this.particles.update(dt);this.mining.updateDrops(dt);this.systems.tick(dt);if(this.light)this.light.update(this.time/CONFIG.DAY.LENGTH*Math.PI*2,this.player,dt);this.network.tick(dt);this.network.update(dt);if(this.weather)this.weather.update(dt,this.player,this.time);if(target){this.outline.visible=true;this.outline.position.set(target.block.x+.5,target.block.y+.5,target.block.z+.5);const op=this.outline.material;op.opacity=.42+this.breakProgress*.48;this.outline.scale.setScalar(1+this.breakProgress*.035)}else{this.outline.visible=false;this.outline.scale.setScalar(1)}if(this.saveTimer>25){this.saveTimer=0;this.save();if(this.network.hosting)this.network.syncHostWorld()}if(this.worldStreamTimer>(this.quality.mobile?2.2:(this.quality.tier==='low'?1.4:.9))){this.worldStreamTimer=0;this.world.generateAround(this.player.pos.x,this.player.pos.z)}}this.hud.update(target,this.time,dt);this.renderer.render(this.scene,this.camera);if(this.world.meshQueue.length){this.meshFrameSkip=(this.meshFrameSkip+1)%3;if(!this.quality.mobile||this.meshFrameSkip===0){this.world.processMeshQueue(this.quality.mobile?.38:(this.quality.tier==='low'?1.25:this.quality.tier==='medium'?2:2.8))}}if(this.world.meshes.size>0&&this.world.starterVisual)this.world.removeStarterVisual()}
 handleDeath(){this.particles.burst(this.player.pos.clone().add(new THREE.Vector3(0,1,0)),0xffffff,35);this.player.health=CONFIG.PLAYER.HEALTH;this.player.hunger=CONFIG.PLAYER.HUNGER;if(this.respawnPoint){this.player.pos.set(this.respawnPoint.x,this.respawnPoint.y,this.respawnPoint.z)}else{this.player.pos.set(0,this.findGround(0,0)+.02,0)}this.mobs.mobs.forEach(m=>m.alive=false);this.save()}
 makeOutline(){const g=new THREE.BoxGeometry(1.01,1.01,1.01),m=new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.8,depthTest:false});const o=new THREE.Mesh(g,m);o.visible=false;o.renderOrder=50;this.scene.add(o);return o}
 emitCampfireSmoke(){const p=this.player.pos;for(const [k] of this.systems.furnaces){const [x,y,z]=k.split(",").map(Number);if(Math.hypot(x-p.x,z-p.z)<18&&this.world.getBlock(x,y,z)===BLOCK.CAMPFIRE)this.particles.smoke(new THREE.Vector3(x+.5,y+1,z+.5),2)}}
 setupInstall(){window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();this.installPrompt=e;const b=document.getElementById("installButton");if(b)b.textContent="⬇ УСТАНОВИТЬ ПРИЛОЖЕНИЕ"});window.addEventListener("appinstalled",()=>{this.installPrompt=null;const b=document.getElementById("installButton");if(b)b.textContent="✓ ПРИЛОЖЕНИЕ УСТАНОВЛЕНО"});document.addEventListener("fullscreenchange",()=>{const active=!!document.fullscreenElement;for(const id of ["fullscreenButton","fullscreenPauseButton"]){const b=document.getElementById(id);if(b)b.textContent=active?"⛶ ВЫЙТИ ИЗ ПОЛНОГО ЭКРАНА":"⛶ ПОЛНЫЙ ЭКРАН"}})}
 showInstall(){const panel=document.getElementById("installPanel"),text=document.getElementById("installText"),btn=document.getElementById("nativeInstallButton");panel?.classList.remove("hidden");const standalone=window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone;if(standalone){text.textContent="Игра уже запущена как приложение. Можно включить полный экран из меню паузы.";if(btn)btn.classList.add("hidden");return}if(this.installPrompt){if(btn){btn.textContent="УСТАНОВИТЬ ПРИЛОЖЕНИЕ";btn.classList.remove("hidden")}}else{if(btn)btn.classList.add("hidden");const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);text.textContent=ios?"На iPhone/iPad: нажми «Поделиться» в Safari → «На экран Домой» → «Добавить». После этого игра откроется как отдельное приложение без адресной строки.":"Если браузер поддерживает установку, появится системная кнопка установки. Иначе открой меню браузера и выбери «Установить приложение» или «Добавить на главный экран»."}}
 async installApp(){if(this.installPrompt){this.installPrompt.prompt();const result=await this.installPrompt.userChoice;if(result.outcome!=="accepted")this.showInstall();this.installPrompt=null;return}this.showInstall()}
 async requestLandscape(){try{if(screen.orientation?.lock)await screen.orientation.lock("landscape");}catch(e){} }
async toggleFullscreen(){try{if(document.fullscreenElement){await document.exitFullscreen();return}const el=document.documentElement;if(el.requestFullscreen)await el.requestFullscreen({navigationUI:"hide"});else{const ios=window.navigator.standalone||/iphone|ipad|ipod/i.test(navigator.userAgent);if(ios){const t=document.getElementById("saveToast");t.textContent="Для полноэкранного режима добавь игру на экран Домой";t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}}}catch(e){}}
 setModeBadge(){const e=document.getElementById("modeBadge");if(e){e.textContent=this.mode==="multiplayer"?"ONLINE":this.mode.startsWith("lan-")?"LAN CO-OP":"SINGLEPLAYER";e.className=this.mode==="multiplayer"?"online":this.mode.startsWith("lan-")?"lan":"offline"}}
 setQuality(tier,persist=true){if(!['low','medium','high'].includes(tier))return;this.quality.choose(tier,persist);CONFIG.QUALITY=this.quality.preset;this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.quality.preset.pixelRatio));this.renderer.toneMapping=this.quality.tier==="low"?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;this.renderer.shadowMap.enabled=this.quality.preset.shadows;if(this.light)this.light.maxLights=this.quality.preset.maxLights;this.particles.maxItems=this.quality.preset.particles;this.world.cfg.WORLD.RENDER_DISTANCE=this.quality.preset.renderDistance;this.world.lastCenter="";const v=document.getElementById("qualityValue");if(v)v.textContent=this.quality.tier.toUpperCase()}

 getViewportSize(){const vv=window.visualViewport;const w=Math.max(1,Math.round(vv?.width||window.innerWidth||document.documentElement.clientWidth||1));const h=Math.max(1,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||1));return {w,h}}
 resizeRenderer(){const {w,h}=this.getViewportSize();this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.dynamicPixelRatio||this.quality?.preset?.pixelRatio||1));this.renderer.setSize(w,h,false);const c=this.renderer.domElement;c.style.width="100%";c.style.height="100%"}
 bindViewportResize(){let raf=0;const refresh=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>this.resize())};window.addEventListener("resize",refresh,{passive:true});window.addEventListener("orientationchange",()=>setTimeout(refresh,80),{passive:true});window.visualViewport?.addEventListener("resize",refresh,{passive:true});window.visualViewport?.addEventListener("scroll",refresh,{passive:true})}
 resize(){this.resizeRenderer();this.applyTouchLayout(false)}
}
const game=new Game();
globalThis.__voxelGame=game;
try{const launchKeys=["vs_launch_world_v75","vs_launch_world_v72","vs_launch_world_v71","vs_launch_world_v70","vs_launch_world_v69","vs_launch_world_v68","vs_launch_world_v67"];const key=launchKeys.find(k=>{try{return !!sessionStorage.getItem(k)}catch{return false}});if(key){let id=null;try{id=sessionStorage.getItem(key);sessionStorage.removeItem(key)}catch{}if(id)SaveManager.setActive(id);requestAnimationFrame(()=>setTimeout(()=>game.start(),120))}}catch(e){console.warn("Auto world launch skipped",e)}
const boot=document.getElementById("bootSplash"),bar=document.getElementById("bootProgress"),status=document.getElementById("bootStatus");
requestAnimationFrame(()=>{if(bar)bar.style.width="100%";if(status)status.textContent="Готово";setTimeout(()=>boot?.classList.add("done"),80)});
addEventListener("beforeunload",()=>{if(!game.skipUnloadSave)game.save()});
