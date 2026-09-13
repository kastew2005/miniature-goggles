import {SaveManager} from "../save/SaveManager.js";
export class Menu{
 constructor(game){this.game=game;this.main=document.getElementById("mainMenu");this.pause=document.getElementById("pauseMenu");const q=id=>document.getElementById(id);
  // Robust mobile menu input: use Pointer Events as the single source of truth.
  // This avoids iOS Safari firing touchend + click twice and also works with
  // mouse, stylus and touch without relying on a particular browser event.
  const bind=(id,fn)=>{
    const el=q(id);
    if(!el)return;
    el.type="button";
    let lastPointer=0;
    const run=(e)=>{
      if(e){e.preventDefault();e.stopPropagation();}
      const now=performance.now();
      if(now-lastPointer<350)return;
      lastPointer=now;
      try{fn(e)}catch(err){console.error("Menu action failed:",id,err)}
    };
    // pointerdown is the most reliable activation event on iPhone/iPad.
    // Keep click as a fallback for older WebViews/mouse input and suppress
    // the synthetic click generated after a touch pointer event.
    el.addEventListener("pointerdown",run,{passive:false});
    el.addEventListener("click",e=>run(e),{passive:false});
  };
  bind("playButton",()=>this.openMode());bind("settingsButton",()=>q("settingsPanel")?.classList.remove("hidden"));bind("creditsButton",()=>q("creditsPanel")?.classList.remove("hidden"));
  bind("modeBackButton",()=>this.closeAllSub());bind("singleplayerChoice",()=>this.openWorlds());bind("multiplayerChoice",()=>this.openMultiplayer());bind("singleBackButton",()=>this.openMode());bind("newWorldButton",()=>this.openCreateWorld());bind("newWorldBackButton",()=>this.openWorlds());bind("createWorldButton",()=>this.createWorld());
  bind("closeSettings",()=>q("settingsPanel")?.classList.add("hidden"));bind("closeCredits",()=>q("creditsPanel")?.classList.add("hidden"));bind("closeMultiplayer",()=>this.openMode());
  const rd=q("renderDistance"),rv=q("renderValue"),sen=q("sensitivity"),sv=q("sensitivityValue"),quality=q("qualitySelect");if(rd)rd.oninput=()=>{rv.textContent=rd.value;this.game.world.cfg.WORLD.RENDER_DISTANCE=+rd.value;this.game.world.lastCenter=""};if(sen)sen.oninput=()=>{sv.textContent=sen.value;this.game.controls.sensitivity=+sen.value*.0003125};quality?.addEventListener("change",e=>this.game.setQuality(e.target.value));q("reducedMotion")?.addEventListener("change",e=>this.game.reducedMotion=e.target.checked);
 }
 closeAllSub(){for(const id of ["modeSelectPanel","singleplayerPanel","newWorldPanel","multiplayerPanel"])document.getElementById(id)?.classList.add("hidden");this.showMain()}
 openMode(){this.main.classList.add("hidden");for(const id of ["singleplayerPanel","newWorldPanel","multiplayerPanel"])document.getElementById(id)?.classList.add("hidden");document.getElementById("modeSelectPanel")?.classList.remove("hidden")}
 openMultiplayer(){document.getElementById("modeSelectPanel")?.classList.add("hidden");document.getElementById("multiplayerPanel")?.classList.remove("hidden")}
 openWorlds(){document.getElementById("modeSelectPanel")?.classList.add("hidden");document.getElementById("newWorldPanel")?.classList.add("hidden");document.getElementById("singleplayerPanel")?.classList.remove("hidden");this.renderWorlds()}
 openCreateWorld(){document.getElementById("singleplayerPanel")?.classList.add("hidden");document.getElementById("newWorldPanel")?.classList.remove("hidden");setTimeout(()=>document.getElementById("newWorldName")?.focus(),40)}
 createWorld(){const name=document.getElementById("newWorldName")?.value.trim()||`Новый мир ${SaveManager.listWorlds().length+1}`;const seed=document.getElementById("newWorldSeed")?.value.trim()||"";this.game.newWorld(name,seed)}
 renderWorlds(){const list=document.getElementById("worldList"),empty=document.getElementById("worldEmpty");if(!list)return;list.innerHTML="";const worlds=SaveManager.listWorlds();empty?.classList.toggle("hidden",worlds.length>0);for(const w of worlds){const item=document.createElement("div");item.className="worldItem45";const d=new Date(w.updated||w.created||Date.now());item.innerHTML='<div><div class="worldName"></div><div class="worldMeta"></div></div><div class="worldActions"><button class="worldAction45 load">ИГРАТЬ</button><button class="worldAction45 delete">✕</button></div>';item.querySelector(".worldName").textContent=w.name;item.querySelector(".worldMeta").textContent=`СИД ${w.seed} • ${d.toLocaleDateString("ru-RU")}`;item.querySelector(".load").onclick=()=>{SaveManager.setActive(w.id);this.game.launchWorld(w.id)};item.querySelector(".delete").onclick=()=>{if(confirm(`Удалить мир «${w.name}»?`)){SaveManager.deleteWorld(w.id);this.renderWorlds()}};list.appendChild(item)}}
 showPause(){this.pause.classList.remove("hidden")}hidePause(){this.pause.classList.add("hidden")}showMain(){this.main.classList.remove("hidden")}hideMain(){this.main.classList.add("hidden")}
}
