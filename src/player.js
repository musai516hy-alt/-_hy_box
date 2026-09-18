// src/player.js - Rigged Procedural 3D Character & Motion State Machine
import { sound } from './audio.js';

const THREE = window.THREE;

export const PlayerState = {
  IDLE: 'IDLE',
  WALK: 'WALK',
  RUN: 'RUN',
  JUMP_RISE: 'JUMP_RISE',
  FALL: 'FALL',
  LAND: 'LAND'
};

export class Player {
  constructor(scene) {
    this.scene = scene;
    
    // Transform & Physics
    this.position = new THREE.Vector3(0, 2, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationY = 0;
    this.targetRotationY = 0;

    // Movement parameters
    this.walkSpeed = 10;
    this.runSpeed = 18;
    this.jumpForce = 16.5;
    this.gravity = 36;
    this.currentFriction = 0.82;

    // States
    this.isGrounded = false;
    this.currentState = PlayerState.IDLE;
    this.stateTimer = 0;
    this.animCycle = 0;

    // Fall & Despair Tracking
    this.fallStartY = 0;
    this.fallDistance = 0;
    this.maxFallThisDrop = 0;
    this.hasTriggeredDespair = false;

    // Radius / Height for collision
    this.radius = 0.45;
    this.height = 1.85;

    this.buildRiggedMesh();
  }

  buildRiggedMesh() {
    this.root = new THREE.Group();

    // Palette: Celestial Adventurer (Marble White + Gold Runes + Emerald Eyes)
    const matBody = new THREE.MeshStandardMaterial({ 
      color: 0xf8fafc, 
      roughness: 0.3, 
      metalness: 0.2 
    });
    const matSuitAccent = new THREE.MeshStandardMaterial({ 
      color: 0xfacc15, 
      emissive: 0xd97706, 
      emissiveIntensity: 0.5, 
      roughness: 0.2 
    });
    const matVisor = new THREE.MeshStandardMaterial({ 
      color: 0x34d399, 
      emissive: 0x059669, 
      emissiveIntensity: 0.8, 
      roughness: 0.1 
    });
    const matJoint = new THREE.MeshStandardMaterial({ 
      color: 0x64748b, 
      roughness: 0.5 
    });

    // 1. Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.95;
    this.root.add(this.pelvis);

    const pelvisMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.28), matBody);
    pelvisMesh.castShadow = true;
    this.pelvis.add(pelvisMesh);

    // 2. Torso
    this.torso = new THREE.Group();
    this.torso.position.y = 0.15;
    this.pelvis.add(this.torso);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.32), matBody);
    chestMesh.position.y = 0.26;
    chestMesh.castShadow = true;
    this.torso.add(chestMesh);

    // Golden Rune Core on chest
    const coreMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), matSuitAccent);
    coreMesh.rotation.x = Math.PI / 2;
    coreMesh.position.set(0, 0.32, 0.17);
    this.torso.add(coreMesh);

    // 3. Head & Helmet Visor
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.58;
    this.torso.add(this.headGroup);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.34), matBody);
    headMesh.position.y = 0.18;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.12), matVisor);
    visorMesh.position.set(0, 0.18, 0.18);
    this.headGroup.add(visorMesh);

    // 4. Arms
    this.leftArm = this.createArm(matBody, matJoint, matSuitAccent, true);
    this.rightArm = this.createArm(matBody, matJoint, matSuitAccent, false);
    this.leftArm.position.set(0.32, 0.46, 0);
    this.rightArm.position.set(-0.32, 0.46, 0);
    this.torso.add(this.leftArm);
    this.torso.add(this.rightArm);

    // 5. Legs
    this.leftLeg = this.createLeg(matBody, matJoint, matSuitAccent, true);
    this.rightLeg = this.createLeg(matBody, matJoint, matSuitAccent, false);
    this.leftLeg.position.set(0.16, -0.1, 0);
    this.rightLeg.position.set(-0.16, -0.1, 0);
    this.pelvis.add(this.leftLeg);
    this.pelvis.add(this.rightLeg);

    this.scene.add(this.root);
  }

  createArm(matBody, matJoint, matAccent, isLeft) {
    const shoulder = new THREE.Group();
    const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.14), matBody);
    upperArm.position.y = -0.16;
    upperArm.castShadow = true;
    shoulder.add(upperArm);

    const elbow = new THREE.Group();
    elbow.position.y = -0.32;
    shoulder.add(elbow);

    const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), matBody);
    lowerArm.position.y = -0.15;
    lowerArm.castShadow = true;
    elbow.add(lowerArm);

    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), matAccent);
    hand.position.y = -0.32;
    elbow.add(hand);

    shoulder.elbow = elbow;
    return shoulder;
  }

  createLeg(matBody, matJoint, matAccent, isLeft) {
    const hip = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.18), matBody);
    thigh.position.y = -0.19;
    thigh.castShadow = true;
    hip.add(thigh);

    const knee = new THREE.Group();
    knee.position.y = -0.38;
    hip.add(knee);

    const calf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.16), matBody);
    calf.position.y = -0.19;
    calf.castShadow = true;
    knee.add(calf);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.1, 0.28), matAccent);
    foot.position.set(0, -0.4, 0.05);
    foot.castShadow = true;
    knee.add(foot);

    hip.knee = knee;
    return hip;
  }

  update(dt, cameraAngle, controls, physics) {
    this.stateTimer += dt;

    const move = controls.moveVector;
    const isSprinting = controls.isSprinting();
    const speed = isSprinting ? this.runSpeed : this.walkSpeed;

    const inputMag = Math.hypot(move.x, move.z);
    if (inputMag > 0.1) {
      const inputAngle = Math.atan2(move.x, move.z);
      this.targetRotationY = cameraAngle + inputAngle;

      let diff = this.targetRotationY - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.rotationY += diff * Math.min(1.0, dt * 14);

      const targetVx = Math.sin(this.targetRotationY) * speed * inputMag;
      const targetVz = Math.cos(this.targetRotationY) * speed * inputMag;

      const accelRate = this.isGrounded ? (this.currentFriction < 0.1 ? 4 : 20) : 6;
      this.velocity.x += (targetVx - this.velocity.x) * Math.min(1.0, dt * accelRate);
      this.velocity.z += (targetVz - this.velocity.z) * Math.min(1.0, dt * accelRate);

      this.animCycle += dt * (isSprinting ? 14 : 9) * inputMag;
    } else {
      const friction = this.isGrounded ? this.currentFriction : 0.98;
      this.velocity.x *= Math.pow(friction, dt * 30);
      this.velocity.z *= Math.pow(friction, dt * 30);
      if (Math.abs(this.velocity.x) < 0.05) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.05) this.velocity.z = 0;
    }

    if (controls.consumeJump() && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.currentState = PlayerState.JUMP_RISE;
      sound.playJump();
    }

    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
      if (this.velocity.y < -55) this.velocity.y = -55;
    }

    sound.updateWind(-this.velocity.y);

    const prevGrounded = this.isGrounded;
    physics.resolveMovement(this, dt);

    if (!this.isGrounded) {
      if (this.velocity.y < 0) {
        this.fallDistance = Math.max(0, this.fallStartY - this.position.y);
        if (this.fallDistance > this.maxFallThisDrop) {
          this.maxFallThisDrop = this.fallDistance;
        }

        if (this.fallDistance >= 800 && !this.hasTriggeredDespair) {
          this.hasTriggeredDespair = true;
          physics.triggerDespairFall(this);
        }
      }
    } else {
      if (!prevGrounded) {
        sound.playLand(this.maxFallThisDrop > 25);
        this.currentState = PlayerState.LAND;
        this.stateTimer = 0;
      }
      this.fallStartY = this.position.y;
      this.fallDistance = 0;
      this.maxFallThisDrop = 0;
      this.hasTriggeredDespair = false;
    }

    this.updateAnimationState(inputMag, isSprinting);
    this.animateBones(dt);

    this.root.position.copy(this.position);
    this.root.rotation.y = this.rotationY;
  }

  updateAnimationState(inputMag, isSprinting) {
    if (!this.isGrounded) {
      if (this.velocity.y > 2) {
        this.currentState = PlayerState.JUMP_RISE;
      } else {
        this.currentState = PlayerState.FALL;
      }
    } else {
      if (this.currentState === PlayerState.LAND && this.stateTimer < 0.18) {
        return;
      }
      if (inputMag > 0.1) {
        this.currentState = isSprinting ? PlayerState.RUN : PlayerState.WALK;
      } else {
        this.currentState = PlayerState.IDLE;
      }
    }
  }

  animateBones(dt) {
    const cycle = this.animCycle;
    const s = Math.sin(cycle);

    this.torso.rotation.set(0, 0, 0);
    this.torso.position.y = 0.15;
    this.headGroup.rotation.set(0, 0, 0);
    this.pelvis.position.y = 0.95;

    switch (this.currentState) {
      case PlayerState.IDLE: {
        const breathe = Math.sin(this.stateTimer * 2.5);
        this.torso.position.y = 0.15 + breathe * 0.015;
        this.headGroup.rotation.x = breathe * 0.03;
        
        this.leftArm.rotation.set(0.05, 0, 0.08);
        this.rightArm.rotation.set(0.05, 0, -0.08);
        this.leftArm.elbow.rotation.x = -0.15;
        this.rightArm.elbow.rotation.x = -0.15;

        this.leftLeg.rotation.set(0, 0, 0.04);
        this.rightLeg.rotation.set(0, 0, -0.04);
        this.leftLeg.knee.rotation.x = 0;
        this.rightLeg.knee.rotation.x = 0;
        break;
      }

      case PlayerState.WALK: {
        this.torso.position.y = 0.15 + Math.abs(s) * 0.04;
        this.torso.rotation.y = -s * 0.1;
        this.torso.rotation.x = 0.08;

        this.leftArm.rotation.x = -s * 0.7;
        this.rightArm.rotation.x = s * 0.7;
        this.leftArm.elbow.rotation.x = -Math.max(0.1, s * 0.4);
        this.rightArm.elbow.rotation.x = -Math.max(0.1, -s * 0.4);

        this.leftLeg.rotation.x = s * 0.75;
        this.rightLeg.rotation.x = -s * 0.75;
        this.leftLeg.knee.rotation.x = s < 0 ? Math.abs(s) * 0.9 : 0.05;
        this.rightLeg.knee.rotation.x = s > 0 ? Math.abs(s) * 0.9 : 0.05;
        break;
      }

      case PlayerState.RUN: {
        this.torso.position.y = 0.15 + Math.abs(s) * 0.08;
        this.torso.rotation.y = -s * 0.18;
        this.torso.rotation.x = 0.28;

        this.leftArm.rotation.x = -s * 1.2;
        this.rightArm.rotation.x = s * 1.2;
        this.leftArm.elbow.rotation.x = -0.6 - Math.abs(s) * 0.4;
        this.rightArm.elbow.rotation.x = -0.6 - Math.abs(s) * 0.4;

        this.leftLeg.rotation.x = s * 1.15;
        this.rightLeg.rotation.x = -s * 1.15;
        this.leftLeg.knee.rotation.x = s < 0 ? Math.abs(s) * 1.4 : 0.1;
        this.rightLeg.knee.rotation.x = s > 0 ? Math.abs(s) * 1.4 : 0.1;
        break;
      }

      case PlayerState.JUMP_RISE: {
        this.torso.rotation.x = -0.15;
        this.headGroup.rotation.x = -0.25;

        this.leftArm.rotation.set(-2.2, 0, 0.35);
        this.rightArm.rotation.set(-2.2, 0, -0.35);
        this.leftArm.elbow.rotation.x = -0.4;
        this.rightArm.elbow.rotation.x = -0.4;

        this.leftLeg.rotation.x = -0.5;
        this.rightLeg.rotation.x = -0.3;
        this.leftLeg.knee.rotation.x = 1.1;
        this.rightLeg.knee.rotation.x = 0.9;
        break;
      }

      case PlayerState.FALL: {
        const panicWiggle = Math.sin(this.stateTimer * 16);
        this.torso.rotation.x = 0.25;
        this.torso.rotation.z = panicWiggle * 0.12;
        this.headGroup.rotation.x = 0.4;

        this.leftArm.rotation.set(-1.4 + panicWiggle * 0.6, 0, 0.7);
        this.rightArm.rotation.set(-1.4 - panicWiggle * 0.6, 0, -0.7);
        this.leftArm.elbow.rotation.x = -0.8 + panicWiggle * 0.4;
        this.rightArm.elbow.rotation.x = -0.8 - panicWiggle * 0.4;

        this.leftLeg.rotation.set(0.4 + panicWiggle * 0.3, 0, 0.2);
        this.rightLeg.rotation.set(0.2 - panicWiggle * 0.3, 0, -0.2);
        this.leftLeg.knee.rotation.x = 0.6 + Math.abs(panicWiggle) * 0.4;
        this.rightLeg.knee.rotation.x = 0.6 + Math.abs(panicWiggle) * 0.4;
        break;
      }

      case PlayerState.LAND: {
        this.pelvis.position.y = 0.75;
        this.torso.rotation.x = 0.3;
        this.headGroup.rotation.x = -0.15;

        this.leftArm.rotation.set(-0.6, 0, 0.5);
        this.rightArm.rotation.set(-0.6, 0, -0.5);

        this.leftLeg.rotation.x = -0.3;
        this.rightLeg.rotation.x = -0.3;
        this.leftLeg.knee.rotation.x = 1.0;
        this.rightLeg.knee.rotation.x = 1.0;
        break;
      }
    }
  }

  teleport(pos) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.isGrounded = false;
    this.fallStartY = pos.y;
    this.fallDistance = 0;
    this.maxFallThisDrop = 0;
    this.hasTriggeredDespair = false;
  }
}
