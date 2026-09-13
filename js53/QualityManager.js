import THREE from "./three.js";
export class QualityManager {
  constructor() {
    const mem = Number(navigator.deviceMemory || 4);
    const cores = Number(navigator.hardwareConcurrency || 4);
    const mobile = matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const veryLow = mem <= 2 || cores <= 2;
    const low = veryLow || mem <= 4 || cores <= 4;
    const saved = localStorage.getItem('vs_quality');
    this.tier = saved || (veryLow ? 'low' : low ? 'medium' : 'high');
    this.mobile = mobile;
    this.applyTier();
  }
  applyTier() {
    const presets = {
      low: { pixelRatio:.58, renderDistance:2, startupDistance:1, maxLights:3, particles:28, rain:25, clouds:4, shadows:false, maxMobs:4, shadowSize:256 },
      medium: { pixelRatio:.68, renderDistance:3, startupDistance:1, maxLights:6, particles:55, rain:45, clouds:6, shadows:false, maxMobs:7, shadowSize:512 },
      high: { pixelRatio:.82, renderDistance:4, startupDistance:1, maxLights:10, particles:90, rain:70, clouds:8, shadows:false, maxMobs:10, shadowSize:512 }
    };
    this.preset = presets[this.tier] || presets.medium;
    if(this.mobile) this.preset={...this.preset,pixelRatio:Math.min(this.preset.pixelRatio,.78),shadows:false};
  }
  configureRenderer(renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.preset.pixelRatio));
    renderer.shadowMap.enabled = this.preset.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  choose(tier, persist=true) {
    if(!['low','medium','high'].includes(tier)) return;
    this.tier=tier;if(persist)localStorage.setItem('vs_quality',tier);this.applyTier();
  }
}
