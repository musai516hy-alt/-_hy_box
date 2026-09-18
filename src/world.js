// src/world.js - Celestial Mythic Fantasy Climbing Course Generator (0m to 1,500m+)

const THREE = window.THREE;

export class World {
  constructor(scene) {
    this.scene = scene;
    this.platforms = [];
    this.movingPlatforms = [];
    this.buildWorld();
  }

  buildWorld() {
    this.materials = {
      marbleBase: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.1 }),
      ancientRuin: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7, metalness: 0.1 }),
      goldRune: new THREE.MeshStandardMaterial({ 
        color: 0xfacc15, 
        emissive: 0xd97706, 
        emissiveIntensity: 0.6, 
        metalness: 0.8,
        roughness: 0.2 
      }),

      skyCrystal: new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.3 }),
      iceRune: new THREE.MeshStandardMaterial({ 
        color: 0xa5f3fc, 
        roughness: 0.03, 
        metalness: 0.2, 
        transparent: true, 
        opacity: 0.88 
      }),
      runeBounce: new THREE.MeshStandardMaterial({ 
        color: 0xfacc15, 
        emissive: 0xeab308, 
        emissiveIntensity: 0.8,
        roughness: 0.2 
      }),

      celestialStone: new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3, metalness: 0.7 }),
      magentaRune: new THREE.MeshStandardMaterial({ 
        color: 0xf472b6, 
        emissive: 0xdb2777, 
        emissiveIntensity: 0.7 
      }),
      cyanRune: new THREE.MeshStandardMaterial({ 
        color: 0x22d3ee, 
        emissive: 0x0891b2, 
        emissiveIntensity: 0.7 
      }),
      crumbleRune: new THREE.MeshStandardMaterial({ 
        color: 0xf87171, 
        emissive: 0xdc2626, 
        emissiveIntensity: 0.5,
        roughness: 0.8 
      }),

      checkpointBase: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }),
      checkpointGlow: new THREE.MeshStandardMaterial({ 
        color: 0x34d399, 
        emissive: 0x059669, 
        emissiveIntensity: 0.9 
      }),
      starGateGold: new THREE.MeshStandardMaterial({ 
        color: 0xfacc15, 
        emissive: 0xca8a04, 
        emissiveIntensity: 0.8, 
        metalness: 0.95, 
        roughness: 0.1 
      })
    };

    this.createPlatform(0, -1, 0, 45, 2, 45, this.materials.marbleBase, 'normal');
    this.createPlatform(0, 0.5, -4, 5, 1, 5, this.materials.goldRune, 'normal');

    this.generateZone1Ascent();
    this.createCheckpoint(0, 500, 0, 10, 10, 500);

    this.generateZone2Ethereal();
    this.createCheckpoint(0, 1000, 0, 10, 10, 1000);

    this.generateZone3StarGate();
    this.createStarGateApex(0, 1500, 0);

    this.platforms.sort((a, b) => a.box.min.y - b.box.min.y);
  }

  generateZone1Ascent() {
    let currY = 2;
    let currX = 0;
    let currZ = 0;

    for (let i = 0; i < 24; i++) {
      const angle = i * 0.45;
      const radius = 6 + (i % 4) * 2;
      currX = Math.sin(angle) * radius;
      currZ = Math.cos(angle) * radius;
      currY += 3.2;

      const mat = (i % 3 === 0) ? this.materials.goldRune : 
                  (i % 3 === 1) ? this.materials.marbleBase : this.materials.ancientRuin;
      
      const width = 4.2 - (i * 0.05);
      const depth = 4.2 - (i * 0.05);
      this.createPlatform(currX, currY, currZ, width, 1.2, depth, mat, 'normal');
    }

    this.createPlatform(currX, currY + 1, currZ, 3.0, 0.4, 3.0, this.materials.runeBounce, 'jumpPad');
    currY += 28;

    let angle = 0;
    for (let i = 0; i < 35; i++) {
      angle += 0.35;
      const dist = 8 + Math.sin(i * 0.8) * 4;
      currX = Math.cos(angle) * dist;
      currZ = Math.sin(angle) * dist;
      currY += 3.8;

      const w = 3.5;
      const d = 3.5;
      const mat = (i % 2 === 0) ? this.materials.marbleBase : this.materials.ancientRuin;
      this.createPlatform(currX, currY, currZ, w, 0.8, d, mat, 'normal');
    }

    this.createPlatform(currX, currY + 0.8, currZ, 3.0, 0.4, 3.0, this.materials.runeBounce, 'jumpPad');
    currY += 28;

    for (let i = 0; i < 48; i++) {
      currX += (Math.sin(i * 0.6) * 5.5);
      currZ += (Math.cos(i * 0.6) * 5.5);
      currY += 4.2;

      if (Math.abs(currX) > 25) currX *= 0.5;
      if (Math.abs(currZ) > 25) currZ *= 0.5;

      const w = 2.8;
      const d = 2.8;
      this.createPlatform(currX, currY, currZ, w, 0.6, d, this.materials.marbleBase, 'normal');
    }

    this.createPlatform(currX * 0.5, 492, currZ * 0.5, 5, 1, 5, this.materials.goldRune, 'normal');
    this.createPlatform(0, 496, 0, 6, 1, 6, this.materials.goldRune, 'normal');
  }

  generateZone2Ethereal() {
    let currY = 505;
    let currX = 0;
    let currZ = 0;

    for (let i = 0; i < 45; i++) {
      const angle = i * 0.5;
      const r = 9 + Math.cos(i * 0.7) * 4;
      currX = Math.sin(angle) * r;
      currZ = Math.cos(angle) * r;
      currY += 4.6;

      const isIce = (i % 3 === 0);
      const mat = isIce ? this.materials.iceRune : this.materials.skyCrystal;
      const type = isIce ? 'ice' : 'normal';

      const w = isIce ? 3.8 : 2.6;
      const d = isIce ? 3.8 : 2.6;
      this.createPlatform(currX, currY, currZ, w, 0.8, d, mat, type);
    }

    this.createPlatform(currX, currY + 0.8, currZ, 3.2, 0.4, 3.2, this.materials.runeBounce, 'jumpPad');
    currY += 30;

    for (let i = 0; i < 42; i++) {
      const angle = i * 0.6;
      const r = 10 + (i % 3) * 3;
      currX = Math.cos(angle) * r;
      currZ = Math.sin(angle) * r;
      currY += 5.2;

      if (i % 4 === 0) {
        this.createMovingPlatform(currX, currY, currZ, 3.5, 0.8, 3.5, this.materials.skyCrystal, (i % 2 === 0 ? 'x' : 'z'), 6, 1.5);
      } else if (i % 4 === 2) {
        this.createPlatform(currX, currY, currZ, 2.8, 0.6, 2.8, this.materials.iceRune, 'ice');
      } else {
        this.createPlatform(currX, currY, currZ, 2.4, 0.6, 2.4, this.materials.skyCrystal, 'normal');
      }
    }

    this.createPlatform(currX * 0.4, 990, currZ * 0.4, 5, 1, 5, this.materials.skyCrystal, 'normal');
    this.createPlatform(0, 996, 0, 6, 1, 6, this.materials.skyCrystal, 'normal');
  }

  generateZone3StarGate() {
    let currY = 1008;
    let currX = 0;
    let currZ = 0;

    for (let i = 0; i < 50; i++) {
      const angle = i * 0.52;
      const r = 8 + Math.sin(i * 0.9) * 5;
      currX = Math.sin(angle) * r;
      currZ = Math.cos(angle) * r;
      currY += 5.5;

      const isCrumble = (i % 4 === 1);
      const isNeon = (i % 4 === 2);
      const mat = isCrumble ? this.materials.crumbleRune : 
                  isNeon ? this.materials.cyanRune : this.materials.celestialStone;
      const type = isCrumble ? 'crumble' : 'normal';

      const w = 2.2;
      const d = 2.2;
      this.createPlatform(currX, currY, currZ, w, 0.6, d, mat, type);
    }

    this.createPlatform(currX, currY + 0.8, currZ, 3.0, 0.4, 3.0, this.materials.runeBounce, 'jumpPad');
    currY += 32;

    for (let i = 0; i < 30; i++) {
      const angle = i * 0.7;
      const r = 7 + (i % 3) * 2.5;
      currX = Math.cos(angle) * r;
      currZ = Math.sin(angle) * r;
      currY += 5.6;

      if (i % 3 === 0) {
        this.createMovingPlatform(currX, currY, currZ, 3.0, 0.6, 3.0, this.materials.magentaRune, 'x', 5, 2.2);
      } else if (i % 3 === 1) {
        this.createPlatform(currX, currY, currZ, 2.0, 0.5, 2.0, this.materials.crumbleRune, 'crumble');
      } else {
        this.createPlatform(currX, currY, currZ, 2.0, 0.5, 2.0, this.materials.iceRune, 'ice');
      }
    }

    this.createPlatform(currX * 0.5, 1492, currZ * 0.5, 4, 1, 4, this.materials.celestialStone, 'normal');
    this.createPlatform(0, 1496, 0, 6, 1, 6, this.materials.cyanRune, 'normal');
  }

  createPlatform(x, y, z, w, h, d, material, type = 'normal') {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    const plat = {
      mesh,
      box,
      type,
      originalPos: mesh.position.clone(),
      isMoving: false,
      isInactive: false,
      crumbleStarted: false
    };

    this.platforms.push(plat);
    return plat;
  }

  createMovingPlatform(x, y, z, w, h, d, material, axis = 'x', distance = 6, speed = 1.5) {
    const plat = this.createPlatform(x, y, z, w, h, d, material, 'normal');
    plat.isMoving = true;
    plat.axis = axis;
    plat.distance = distance;
    plat.speed = speed;
    plat.time = Math.random() * Math.PI * 2;
    plat.deltaMove = new THREE.Vector3();
    this.movingPlatforms.push(plat);
    return plat;
  }

  createCheckpoint(x, y, z, w, d, altitudeMeters) {
    const base = this.createPlatform(x, y, z, w, 1.2, d, this.materials.checkpointBase, 'checkpoint');
    base.checkpointAltitude = altitudeMeters;

    const ringGeo = new THREE.CylinderGeometry(w * 0.45, w * 0.45, 0.15, 32);
    const ringMesh = new THREE.Mesh(ringGeo, this.materials.checkpointGlow);
    ringMesh.position.set(x, y + 1.25, z);
    this.scene.add(ringMesh);

    const beaconLight = new THREE.PointLight(0x34d399, 3, 25);
    beaconLight.position.set(x, y + 3, z);
    this.scene.add(beaconLight);
    base.beaconLight = beaconLight;

    return base;
  }

  createStarGateApex(x, y, z) {
    const plat = this.createPlatform(x, y, z, 14, 2, 14, this.materials.starGateGold, 'checkpoint');
    plat.checkpointAltitude = 1500;
    plat.isGoal = true;

    const torusGeo = new THREE.TorusGeometry(3.5, 0.4, 16, 48);
    this.starGateMesh = new THREE.Mesh(torusGeo, this.materials.starGateGold);
    this.starGateMesh.position.set(x, y + 6, z);
    this.scene.add(this.starGateMesh);

    const goalLight = new THREE.PointLight(0xfacc15, 5, 40);
    goalLight.position.set(x, y + 6, z);
    this.scene.add(goalLight);
  }

  getNearbyPlatforms(playerY, range = 25) {
    const minY = playerY - range;
    const maxY = playerY + range;
    const result = [];

    for (let i = 0; i < this.platforms.length; i++) {
      const p = this.platforms[i];
      if (p.box.max.y < minY) continue;
      if (p.box.min.y > maxY) break;
      result.push(p);
    }
    return result;
  }

  update(dt) {
    for (let i = 0; i < this.movingPlatforms.length; i++) {
      const p = this.movingPlatforms[i];
      p.time += dt * p.speed;

      const offset = Math.sin(p.time) * p.distance;
      const prevPos = p.mesh.position.clone();

      if (p.axis === 'x') {
        p.mesh.position.x = p.originalPos.x + offset;
      } else {
        p.mesh.position.z = p.originalPos.z + offset;
      }

      p.deltaMove.subVectors(p.mesh.position, prevPos);
      p.box.setFromObject(p.mesh);
    }

    if (this.starGateMesh) {
      this.starGateMesh.rotation.y += dt * 0.8;
      this.starGateMesh.rotation.z += dt * 0.4;
    }
  }
}
