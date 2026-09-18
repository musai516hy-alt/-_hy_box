// src/physics.js - Fast 3D Collision Detection & Platform Mechanics Engine
import { sound } from './audio.js';

const THREE = window.THREE;

export class Physics {
  constructor(world) {
    this.world = world;
    this.activeCheckpoint = new THREE.Vector3(0, 3, 0);
    this.onCheckpointReached = null;
    this.onDespairFall = null;
    this.currentPlatform = null;
  }

  setCheckpointCallback(cb) {
    this.onCheckpointReached = cb;
  }

  setDespairCallback(cb) {
    this.onDespairFall = cb;
  }

  resolveMovement(player, dt) {
    if (this.currentPlatform && this.currentPlatform.isMoving && this.currentPlatform.deltaMove) {
      player.position.add(this.currentPlatform.deltaMove);
    }

    const nearby = this.world.getNearbyPlatforms(player.position.y, 25);
    
    player.position.x += player.velocity.x * dt;
    player.position.z += player.velocity.z * dt;
    this.resolveHorizontalCollisions(player, nearby);

    const oldY = player.position.y;
    player.position.y += player.velocity.y * dt;

    let landed = false;
    player.currentFriction = 0.82;

    const playerBottom = player.position.y;
    const playerTop = player.position.y + player.height;
    const r = player.radius;

    for (let i = 0; i < nearby.length; i++) {
      const plat = nearby[i];
      if (plat.isInactive) continue;

      const box = plat.box;
      if (
        player.position.x + r > box.min.x &&
        player.position.x - r < box.max.x &&
        player.position.z + r > box.min.z &&
        player.position.z - r < box.max.z
      ) {
        if (player.velocity.y <= 0 && oldY >= box.max.y - 0.4 && playerBottom <= box.max.y) {
          player.position.y = box.max.y;
          player.velocity.y = 0;
          landed = true;
          this.currentPlatform = plat;

          this.handlePlatformEffects(plat, player);
          break;
        } 
        else if (player.velocity.y > 0 && playerTop >= box.min.y && oldY + player.height <= box.min.y + 0.3) {
          player.position.y = box.min.y - player.height;
          player.velocity.y = -2;
        }
      }
    }

    player.isGrounded = landed;
    if (!landed) {
      this.currentPlatform = null;
    }

    if (player.position.y < -15) {
      this.respawnAtCheckpoint(player);
    }
  }

  handlePlatformEffects(plat, player) {
    switch (plat.type) {
      case 'jumpPad':
        player.velocity.y = 38.0;
        player.isGrounded = false;
        sound.playBouncePad();
        if (plat.mesh) {
          plat.mesh.scale.set(1.2, 0.4, 1.2);
          setTimeout(() => {
            if (plat.mesh) plat.mesh.scale.set(1, 1, 1);
          }, 150);
        }
        break;

      case 'ice':
        player.currentFriction = 0.03;
        sound.playIceSlide();
        break;

      case 'crumble':
        if (!plat.crumbleStarted) {
          plat.crumbleStarted = true;
          plat.shakeTime = 0.8;
          setTimeout(() => {
            plat.isInactive = true;
            if (plat.mesh) plat.mesh.visible = false;
            setTimeout(() => {
              plat.isInactive = false;
              plat.crumbleStarted = false;
              if (plat.mesh) {
                plat.mesh.visible = true;
                plat.mesh.position.copy(plat.originalPos);
              }
            }, 3200);
          }, 1000);
        }
        break;

      case 'checkpoint':
        if (!plat.activated) {
          plat.activated = true;
          this.activeCheckpoint.set(plat.mesh.position.x, plat.box.max.y + 0.5, plat.mesh.position.z);
          sound.playCheckpoint();
          if (this.onCheckpointReached) {
            this.onCheckpointReached(plat.checkpointAltitude);
          }
          if (plat.beaconLight) {
            plat.beaconLight.color.setHex(0x34d399);
          }
        }
        break;

      default:
        player.currentFriction = 0.82;
        break;
    }
  }

  resolveHorizontalCollisions(player, platforms) {
    const r = player.radius;
    const yBot = player.position.y;
    const yTop = player.position.y + player.height;

    for (let i = 0; i < platforms.length; i++) {
      const plat = platforms[i];
      if (plat.isInactive) continue;
      const b = plat.box;

      if (yBot < b.max.y - 0.25 && yTop > b.min.y + 0.25) {
        const cx = Math.max(b.min.x, Math.min(player.position.x, b.max.x));
        const cz = Math.max(b.min.z, Math.min(player.position.z, b.max.z));

        const dx = player.position.x - cx;
        const dz = player.position.z - cz;
        const distSq = dx * dx + dz * dz;

        if (distSq < r * r && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const overlap = r - dist;
          player.position.x += (dx / dist) * overlap;
          player.position.z += (dz / dist) * overlap;
        }
      }
    }
  }

  triggerDespairFall(player) {
    sound.playDespair();
    this.activeCheckpoint.set(0, 3, 0);

    if (this.onDespairFall) {
      this.onDespairFall(player.fallDistance);
    }

    setTimeout(() => {
      player.teleport(this.activeCheckpoint);
    }, 1200);
  }

  respawnAtCheckpoint(player) {
    player.teleport(this.activeCheckpoint);
  }
}
