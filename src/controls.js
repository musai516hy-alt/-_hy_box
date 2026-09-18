// src/controls.js - Universal Input Manager (PC Keyboard/Mouse + Mobile/Tablet Touch)

export class Controls {
  constructor(canvas) {
    this.canvas = canvas;
    
    // Movement input vectors (-1 to 1)
    this.moveVector = { x: 0, z: 0 };
    this.jumpPressed = false;
    this.sprintActive = false;

    // Camera look delta
    this.cameraDelta = { yaw: 0, pitch: 0 };
    this.isPointerLocked = false;
    this.isMouseDown = false;
    this.lastMousePos = { x: 0, y: 0 };

    // Key states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false
    };

    // Touch controls state
    this.touchJoystick = {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      maxRadius: 55
    };

    this.touchLook = {
      active: false,
      touchId: null,
      lastX: 0,
      lastY: 0
    };

    this.initKeyboard();
    this.initMouse();
    this.initTouch();
  }

  // 1. Keyboard setup (PC & Tablet hardware keyboards)
  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Avoid scrolling on space/arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          this.keys.jump = true;
          this.jumpPressed = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
      }
      this.updateMovement();
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
      }
      this.updateMovement();
    });
  }

  // 2. Mouse look (Drag or Pointer Lock)
  initMouse() {
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        this.isMouseDown = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.canvas) {
        this.cameraDelta.yaw -= e.movementX * 0.0024;
        this.cameraDelta.pitch -= e.movementY * 0.0024;
      } else if (this.isMouseDown) {
        const dx = e.clientX - this.lastMousePos.x;
        const dy = e.clientY - this.lastMousePos.y;
        this.cameraDelta.yaw -= dx * 0.0035;
        this.cameraDelta.pitch -= dy * 0.0035;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
      }
    });

    // Optional pointer lock request on click
    const lockBtn = document.getElementById('btn-pointer-lock');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        if (!document.pointerLockElement) {
          this.canvas.requestPointerLock();
        } else {
          document.exitPointerLock();
        }
      });
    }

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
      const statusEl = document.getElementById('pointer-lock-status');
      if (statusEl) {
        statusEl.textContent = this.isPointerLocked ? 'Pointer: LOCKED (ESC to exit)' : 'Pointer: CLICK TO LOCK';
      }
    });
  }

  // 3. Mobile & Tablet Touch Controls
  initTouch() {
    const joyZone = document.getElementById('touch-joystick-zone');
    const joyKnob = document.getElementById('touch-joystick-knob');
    const jumpBtn = document.getElementById('btn-touch-jump');
    const sprintBtn = document.getElementById('btn-touch-sprint');
    const lookZone = document.getElementById('touch-look-zone');

    if (!joyZone || !jumpBtn) return;

    // A. Touch Joystick (Left Screen)
    joyZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const rect = joyZone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      this.touchJoystick.active = true;
      this.touchJoystick.touchId = touch.identifier;
      this.touchJoystick.startX = centerX;
      this.touchJoystick.startY = centerY;
      this.updateJoystick(touch.clientX, touch.clientY, joyKnob);
    }, { passive: false });

    joyZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchJoystick.touchId) {
          this.updateJoystick(touch.clientX, touch.clientY, joyKnob);
          break;
        }
      }
    }, { passive: false });

    const endJoy = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchJoystick.touchId) {
          this.touchJoystick.active = false;
          this.touchJoystick.touchId = null;
          if (joyKnob) {
            joyKnob.style.transform = 'translate(-50%, -50%)';
          }
          this.updateMovement();
          break;
        }
      }
    };

    joyZone.addEventListener('touchend', endJoy);
    joyZone.addEventListener('touchcancel', endJoy);

    // B. Jump Button Touch
    jumpBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.keys.jump = true;
      this.jumpPressed = true;
      jumpBtn.classList.add('active');
    }, { passive: false });

    jumpBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.keys.jump = false;
      jumpBtn.classList.remove('active');
    });

    // C. Sprint Toggle
    if (sprintBtn) {
      sprintBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.sprintActive = !this.sprintActive;
        sprintBtn.classList.toggle('active', this.sprintActive);
      }, { passive: false });
    }

    // D. Right-hand Look Touch Zone (Camera Rotation on Mobile)
    if (lookZone) {
      lookZone.addEventListener('touchstart', (e) => {
        const touch = e.changedTouches[0];
        if (!this.touchLook.active) {
          this.touchLook.active = true;
          this.touchLook.touchId = touch.identifier;
          this.touchLook.lastX = touch.clientX;
          this.touchLook.lastY = touch.clientY;
        }
      }, { passive: true });

      lookZone.addEventListener('touchmove', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.touchLook.touchId) {
            const dx = touch.clientX - this.touchLook.lastX;
            const dy = touch.clientY - this.touchLook.lastY;
            this.cameraDelta.yaw -= dx * 0.005;
            this.cameraDelta.pitch -= dy * 0.005;
            this.touchLook.lastX = touch.clientX;
            this.touchLook.lastY = touch.clientY;
            break;
          }
        }
      }, { passive: true });

      const endLook = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchLook.touchId) {
            this.touchLook.active = false;
            this.touchLook.touchId = null;
            break;
          }
        }
      };
      lookZone.addEventListener('touchend', endLook);
      lookZone.addEventListener('touchcancel', endLook);
    }
  }

  updateJoystick(clientX, clientY, knob) {
    const dx = clientX - this.touchJoystick.startX;
    const dy = clientY - this.touchJoystick.startY;
    const dist = Math.hypot(dx, dy);
    const maxR = this.touchJoystick.maxRadius;

    let clampedDist = Math.min(dist, maxR);
    let angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle) * (clampedDist / maxR);
    const ny = Math.sin(angle) * (clampedDist / maxR);

    if (knob) {
      const px = Math.cos(angle) * clampedDist;
      const py = Math.sin(angle) * clampedDist;
      knob.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
    }

    this.touchJoystick.normX = nx;
    this.touchJoystick.normY = ny;
    this.updateMovement();
  }

  updateMovement() {
    let x = 0;
    let z = 0;

    // Keyboard contribution
    if (this.keys.forward) z -= 1;
    if (this.keys.backward) z += 1;
    if (this.keys.left) x -= 1;
    if (this.keys.right) x += 1;

    // Normalize keyboard diagonal
    const mag = Math.hypot(x, z);
    if (mag > 0) {
      x /= mag;
      z /= mag;
    }

    // Touch joystick contribution (overrides or combines)
    if (this.touchJoystick.active && this.touchJoystick.normX !== undefined) {
      x = this.touchJoystick.normX;
      z = this.touchJoystick.normY;
    }

    this.moveVector.x = x;
    this.moveVector.z = z;
  }

  consumeJump() {
    const j = this.jumpPressed;
    this.jumpPressed = false;
    return j;
  }

  consumeCameraDelta() {
    const delta = { ...this.cameraDelta };
    this.cameraDelta.yaw = 0;
    this.cameraDelta.pitch = 0;
    return delta;
  }

  isSprinting() {
    return this.keys.sprint || this.sprintActive;
  }
}
