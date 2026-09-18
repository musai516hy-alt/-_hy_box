// src/main.js - Core Three.js Engine, Dynamic Atmosphere, Camera Rig & Game Loop
import { Player } from './player.js';
import { Controls } from './controls.js';
import { World } from './world.js';
import { Physics } from './physics.js';
import { sound } from './audio.js';

const THREE = window.THREE;

class GameApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.clock = new THREE.Clock();
    
    this.cameraYaw = 0;
    this.cameraPitch = 0.25;
    this.cameraDist = 6.0;
    this.cameraTarget = new THREE.Vector3();

    this.maxAltitude = 0;

    this.initThree();
    this.initAtmosphere();
    this.initWorldAndPlayer();
    this.initUI();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initThree() {
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true, 
      powerPreference: 'high-performance' 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.2, 1200);

    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.7);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    this.sunLight.position.set(60, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 250;
    this.sunLight.shadow.camera.left = -35;
    this.sunLight.shadow.camera.right = 35;
    this.sunLight.shadow.camera.top = 35;
    this.sunLight.shadow.camera.bottom = -35;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  initAtmosphere() {
    this.scene.fog = new THREE.FogExp2(0x9cd2ff, 0.0035);

    const starCount = 3000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 500 + Math.random() * 300;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = 800 + Math.random() * 1200;
      starPos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      transparent: true,
      opacity: 0.0,
      sizeAttenuation: true
    });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.stars);

    const earthGeo = new THREE.SphereGeometry(180, 32, 32);
    const earthMat = new THREE.MeshBasicMaterial({ color: 0x1d4e89 });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.position.set(0, -350, 0);
    this.scene.add(this.earthMesh);
  }

  initWorldAndPlayer() {
    this.world = new World(this.scene);
    this.physics = new Physics(this.world);
    this.player = new Player(this.scene);
    this.controls = new Controls(this.canvas);

    this.physics.setCheckpointCallback((alt) => {
      this.showToast(`✨ CHECKPOINT: ${alt}m REACHED!`);
    });

    this.physics.setDespairCallback((fallDist) => {
      this.triggerDespairUI(fallDist);
    });
  }

  initUI() {
    this.uiAltitude = document.getElementById('hud-altitude');
    this.uiSpeed = document.getElementById('hud-speed');
    this.uiMaxAlt = document.getElementById('hud-max-alt');
    this.uiZone = document.getElementById('hud-zone');
    this.uiFallBox = document.getElementById('hud-fall-box');
    this.uiFallDist = document.getElementById('hud-fall-dist');
    this.uiToast = document.getElementById('hud-toast');
    this.despairOverlay = document.getElementById('despair-overlay');

    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        muteBtn.textContent = isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
      });
    }

    const resetBtn = document.getElementById('btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.physics.respawnAtCheckpoint(this.player);
      });
    }
  }

  showToast(msg) {
    if (!this.uiToast) return;
    this.uiToast.textContent = msg;
    this.uiToast.classList.add('visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.uiToast.classList.remove('visible');
    }, 3500);
  }

  triggerDespairUI(fallDist) {
    if (!this.despairOverlay) return;
    this.despairOverlay.classList.add('active');
    const msgEl = document.getElementById('despair-fall-number');
    if (msgEl) {
      msgEl.textContent = `${Math.round(fallDist)}m`;
    }

    setTimeout(() => {
      this.despairOverlay.classList.remove('active');
    }, 2800);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateCamera(dt) {
    const delta = this.controls.consumeCameraDelta();
    this.cameraYaw += delta.yaw;
    this.cameraPitch = Math.max(-0.45, Math.min(1.2, this.cameraPitch + delta.pitch));

    const target = this.player.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    this.cameraTarget.lerp(target, Math.min(1.0, dt * 18));

    const cosP = Math.cos(this.cameraPitch);
    const sinP = Math.sin(this.cameraPitch);
    const sinY = Math.sin(this.cameraYaw);
    const cosY = Math.cos(this.cameraYaw);

    const cx = this.cameraTarget.x - sinY * cosP * this.cameraDist;
    const cy = this.cameraTarget.y + sinP * this.cameraDist;
    const cz = this.cameraTarget.z - cosY * cosP * this.cameraDist;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.cameraTarget);

    this.sunLight.position.set(
      this.player.position.x + 60,
      this.player.position.y + 100,
      this.player.position.z + 50
    );
    this.sunLight.target.position.copy(this.player.position);
  }

  updateAtmosphere(y) {
    let skyColor, fogColor, fogDensity, starOpacity;

    if (y < 300) {
      const t = Math.max(0, y / 300);
      skyColor = new THREE.Color(0x73b8ff).lerp(new THREE.Color(0xffaa77), t * 0.5);
      fogColor = skyColor;
      fogDensity = 0.0035;
      starOpacity = 0.0;
    } else if (y < 800) {
      const t = (y - 300) / 500;
      skyColor = new THREE.Color(0xff8855).lerp(new THREE.Color(0x4a2e75), t);
      fogColor = skyColor;
      fogDensity = 0.0028 - t * 0.001;
      starOpacity = t * 0.4;
    } else if (y < 1200) {
      const t = (y - 800) / 400;
      skyColor = new THREE.Color(0x231a47).lerp(new THREE.Color(0x060914), t);
      fogColor = skyColor;
      fogDensity = 0.0015 - t * 0.0009;
      starOpacity = 0.4 + t * 0.6;
    } else {
      skyColor = new THREE.Color(0x020409);
      fogColor = skyColor;
      fogDensity = 0.0003;
      starOpacity = 1.0;
    }

    this.renderer.setClearColor(skyColor);
    this.scene.fog.color.copy(fogColor);
    this.scene.fog.density = fogDensity;
    this.starMat.opacity = starOpacity;
  }

  updateHUD() {
    const y = Math.max(0, this.player.position.y);
    if (y > this.maxAltitude) {
      this.maxAltitude = y;
    }

    const horizSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z) * 3.6;

    if (this.uiAltitude) this.uiAltitude.textContent = `${y.toFixed(1)} m`;
    if (this.uiSpeed) this.uiSpeed.textContent = `${Math.round(horizSpeed)} km/h`;
    if (this.uiMaxAlt) this.uiMaxAlt.textContent = `BEST: ${this.maxAltitude.toFixed(0)}m`;

    if (this.uiZone) {
      if (y < 500) {
        this.uiZone.textContent = 'ZONE 1 : THE ASCENT (0~500m)';
        this.uiZone.className = 'hud-zone zone-1';
      } else if (y < 1200) {
        this.uiZone.textContent = 'ZONE 2 : TURBULENCE (501~1200m)';
        this.uiZone.className = 'hud-zone zone-2';
      } else {
        this.uiZone.textContent = 'ZONE 3 : THE COSMIC VOID (1201m+)';
        this.uiZone.className = 'hud-zone zone-3';
      }
    }

    if (this.uiFallBox && this.uiFallDist) {
      const drop = this.player.fallDistance;
      if (drop > 15) {
        this.uiFallBox.classList.add('active');
        this.uiFallDist.textContent = `-${Math.round(drop)}m (FATAL: 800m)`;
        if (drop >= 600) {
          this.uiFallBox.classList.add('critical');
        } else {
          this.uiFallBox.classList.remove('critical');
        }
      } else {
        this.uiFallBox.classList.remove('active');
        this.uiFallBox.classList.remove('critical');
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(0.05, this.clock.getDelta());

    this.player.update(dt, this.cameraYaw, this.controls, this.physics);
    this.updateCamera(dt);
    this.world.update(dt);
    this.updateAtmosphere(this.player.position.y);
    this.updateHUD();

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
