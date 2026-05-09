import * as THREE from 'three';

const DRAG_SPEED = 3.0;
const TOUCH_DRAG_SPEED = 1.5;
const KEY_ROTATE_SPEED = 30 * (Math.PI / 180); // 30 deg/sec in radians
const INERTIA_THRESHOLD = 0.0005;

const AXIS_KEYS: [string[], THREE.Vector3, number][] = [
  [['ArrowUp', 'w', 'W'], null!, -1],
  [['ArrowDown', 's', 'S'], null!, 1],
  [['ArrowLeft', 'a', 'A'], null!, -1],
  [['ArrowRight', 'd', 'D'], null!, 1],
  [['q', 'Q'], null!, 1],
  [['e', 'E'], null!, -1],
];

export interface ControlsState {
  isDragging: boolean;
  mouseX: number;
  mouseY: number;
  onReset: () => void;
  onHint: () => void;
  onToggleMute: () => void;
  onZoom: (delta: number) => void;
}

export class Controls {
  private state: ControlsState;
  private target: HTMLElement;
  private accumulatedQuat = new THREE.Quaternion();
  private dragStartQuat = new THREE.Quaternion();
  private dragStartX = 0;
  private dragStartY = 0;
  private lastDragX = 0;
  private lastDragY = 0;
  private inertiaVelX = 0;
  private inertiaVelY = 0;
  private inertiaActive = false;
  private lastTouchAngle = 0;
  private screenRight = new THREE.Vector3();
  private screenUp = new THREE.Vector3();
  private screenForward = new THREE.Vector3();
  private pressedKeys = new Set<string>();
  private targetQuat = new THREE.Quaternion();
  private targetDragStartQuat = new THREE.Quaternion();
  private targetDragStartX = 0;
  private targetDragStartY = 0;
  private isTargetDragging = false;
  private targetNeedsSnap = false;
  private wasTouchDrag = false;
  private cachedRect: DOMRect | null = null;
  private _tmpQuat = new THREE.Quaternion();
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: () => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;
  private boundOnTouchStart: (e: TouchEvent) => void;
  private boundOnTouchMove: (e: TouchEvent) => void;
  private boundOnTouchEnd: (e: TouchEvent) => void;

  constructor(target: HTMLElement, camera: THREE.Camera) {
    this.target = target;

    const back = new THREE.Vector3();
    camera.matrixWorld.extractBasis(this.screenRight, this.screenUp, back);
    this.screenForward.copy(back).negate();

    AXIS_KEYS[0][1] = this.screenRight;
    AXIS_KEYS[1][1] = this.screenRight;
    AXIS_KEYS[2][1] = this.screenUp;
    AXIS_KEYS[3][1] = this.screenUp;
    AXIS_KEYS[4][1] = this.screenForward;
    AXIS_KEYS[5][1] = this.screenForward;

    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchEnd = this.onTouchEnd.bind(this);

    this.state = {
      isDragging: false,
      mouseX: 0,
      mouseY: 0,
      onReset: () => {},
      onHint: () => {},
      onToggleMute: () => {},
      onZoom: () => {},
    };

    target.addEventListener('mousedown', this.boundOnMouseDown);
    window.addEventListener('mousemove', this.boundOnMouseMove);
    window.addEventListener('mouseup', this.boundOnMouseUp);
    target.addEventListener('wheel', this.boundOnWheel, { passive: false });
    window.addEventListener('keydown', this.boundOnKeyDown);
    window.addEventListener('keyup', this.boundOnKeyUp);
    target.addEventListener('touchstart', this.boundOnTouchStart, { passive: false });
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundOnTouchEnd);
    window.addEventListener('resize', this.updateCachedRect);
  }

  private updateCachedRect = (): void => {
    this.cachedRect = this.target.getBoundingClientRect();
  };

  getState(): ControlsState {
    return this.state;
  }

  setCallbacks(callbacks: {
    onReset: () => void;
    onHint: () => void;
    onToggleMute: () => void;
  }): void {
    this.state.onReset = callbacks.onReset;
    this.state.onHint = callbacks.onHint;
    this.state.onToggleMute = callbacks.onToggleMute;
  }

  destroy(): void {
    this.target.removeEventListener('mousedown', this.boundOnMouseDown);
    window.removeEventListener('mousemove', this.boundOnMouseMove);
    window.removeEventListener('mouseup', this.boundOnMouseUp);
    this.target.removeEventListener('wheel', this.boundOnWheel);
    window.removeEventListener('keydown', this.boundOnKeyDown);
    window.removeEventListener('keyup', this.boundOnKeyUp);
    this.target.removeEventListener('touchstart', this.boundOnTouchStart);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchEnd);
    window.removeEventListener('resize', this.updateCachedRect);
    this.pressedKeys.clear();
  }

  reset(): void {
    this.accumulatedQuat.identity();
    this.targetQuat.identity();
  }

  getTargetQuat(target: THREE.Quaternion): void {
    target.copy(this.targetQuat);
  }

  needsTargetSnap(): boolean {
    return this.targetNeedsSnap;
  }

  isDraggingTarget(): boolean {
    return this.isTargetDragging;
  }

  consumeTargetSnap(): void {
    this.targetNeedsSnap = false;
    this.targetQuat.identity();
  }

  update(dt: number): void {
    if (this.inertiaActive) {
      const decay = Math.pow(0.02, dt);
      this.inertiaVelX *= decay;
      this.inertiaVelY *= decay;

      if (Math.abs(this.inertiaVelX) < INERTIA_THRESHOLD && Math.abs(this.inertiaVelY) < INERTIA_THRESHOLD) {
        this.inertiaActive = false;
        this.inertiaVelX = 0;
        this.inertiaVelY = 0;
      } else {
        const inertiaSpeed = this.wasTouchDrag ? TOUCH_DRAG_SPEED : DRAG_SPEED;
        this._tmpQuat.setFromAxisAngle(this.screenUp, -this.inertiaVelX * inertiaSpeed);
        const qX = new THREE.Quaternion().setFromAxisAngle(this.screenRight, this.inertiaVelY * inertiaSpeed);
        this.accumulatedQuat.premultiply(qX).premultiply(this._tmpQuat);
        this.accumulatedQuat.normalize();
      }
    }

    if (this.pressedKeys.size === 0) return;

    const step = KEY_ROTATE_SPEED * dt;
    for (const [keys, axis, sign] of AXIS_KEYS) {
      for (const k of keys) {
        if (this.pressedKeys.has(k)) {
          this._tmpQuat.setFromAxisAngle(axis, step * sign);
          this.accumulatedQuat.premultiply(this._tmpQuat);
          break;
        }
      }
    }
    this.accumulatedQuat.normalize();
  }

  private getRect(): DOMRect {
    if (!this.cachedRect) this.updateCachedRect();
    return this.cachedRect!;
  }

  private normalizePos(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.getRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 2 - 1,
      y: -(((clientY - rect.top) / rect.height) * 2 - 1),
    };
  }

  private isInLeftHalf(clientX: number): boolean {
    const rect = this.getRect();
    return (clientX - rect.left) < rect.width / 2;
  }

  private isInTopHalf(clientY: number): boolean {
    const rect = this.getRect();
    return (clientY - rect.top) < rect.height / 2;
  }

  private startDrag(clientX: number, clientY: number): void {
    const rect = this.getRect();
    const isNarrow = rect.width < 768;

    if (isNarrow ? !this.isInTopHalf(clientY) : this.isInLeftHalf(clientX)) {
      this.isTargetDragging = true;
      this.targetNeedsSnap = false;
      this.targetDragStartQuat.copy(this.targetQuat);
      const p = this.normalizePos(clientX, clientY);
      this.targetDragStartX = p.x;
      this.targetDragStartY = p.y;
    } else {
      this.inertiaActive = false;
      this.state.isDragging = true;
      this.dragStartQuat.copy(this.accumulatedQuat);
      const p = this.normalizePos(clientX, clientY);
      this.dragStartX = p.x;
      this.dragStartY = p.y;
      this.lastDragX = p.x;
      this.lastDragY = p.y;
    }
  }

  private continueDrag(clientX: number, clientY: number): void {
    const speed = this.wasTouchDrag ? TOUCH_DRAG_SPEED : DRAG_SPEED;
    if (this.isTargetDragging) {
      const p = this.normalizePos(clientX, clientY);
      const dx = this.targetDragStartX - p.x;
      const dy = this.targetDragStartY - p.y;
      this._tmpQuat.setFromAxisAngle(this.screenUp, -dx * speed);
      const qX = new THREE.Quaternion().setFromAxisAngle(this.screenRight, +dy * speed);
      this.targetQuat.copy(this._tmpQuat).multiply(qX).multiply(this.targetDragStartQuat);
      return;
    }
    if (!this.state.isDragging) return;
    const p = this.normalizePos(clientX, clientY);
    this.inertiaVelX = p.x - this.lastDragX;
    this.inertiaVelY = p.y - this.lastDragY;
    this.lastDragX = p.x;
    this.lastDragY = p.y;

    const dx = this.dragStartX - p.x;
    const dy = this.dragStartY - p.y;

    this._tmpQuat.setFromAxisAngle(this.screenUp, -dx * speed);
    const qX = new THREE.Quaternion().setFromAxisAngle(this.screenRight, dy * speed);

    this.accumulatedQuat.copy(this._tmpQuat).multiply(qX).multiply(this.dragStartQuat);
  }

  private getTouchAngle(e: TouchEvent): number {
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.atan2(dy, dx);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.wasTouchDrag = false;
    this.startDrag(e.clientX, e.clientY);
  }

  private onMouseMove(e: MouseEvent): void {
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;
    this.continueDrag(e.clientX, e.clientY);
  }

  private onMouseUp(): void {
    if (this.isTargetDragging) {
      this.isTargetDragging = false;
      this.targetNeedsSnap = true;
      return;
    }
    this.state.isDragging = false;
    const speed = this.inertiaVelX * this.inertiaVelX + this.inertiaVelY * this.inertiaVelY;
    if (speed > INERTIA_THRESHOLD) {
      this.inertiaActive = true;
    }
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.wasTouchDrag = true;
    if (e.touches.length === 1) {
      this.state.mouseX = e.touches[0].clientX;
      this.state.mouseY = e.touches[0].clientY;
      this.startDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      this.isTargetDragging = false;
      this.state.isDragging = false;
      this.lastTouchAngle = this.getTouchAngle(e);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.state.mouseX = e.touches[0].clientX;
      this.state.mouseY = e.touches[0].clientY;
      this.continueDrag(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      this.isTargetDragging = false;
      const angle = this.getTouchAngle(e);
      const delta = angle - this.lastTouchAngle;
      this.lastTouchAngle = angle;
      this._tmpQuat.setFromAxisAngle(this.screenForward, delta);
      this.accumulatedQuat.premultiply(this._tmpQuat);
      this.accumulatedQuat.normalize();
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    if (this.isTargetDragging && e.touches.length === 0) {
      this.isTargetDragging = false;
      this.targetNeedsSnap = true;
      return;
    }
    if (e.touches.length === 0) {
      this.state.isDragging = false;
      this.lastTouchAngle = 0;
      const speed = this.inertiaVelX * this.inertiaVelX + this.inertiaVelY * this.inertiaVelY;
      if (speed > INERTIA_THRESHOLD) {
        this.inertiaActive = true;
      }
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.state.onZoom(e.deltaY > 0 ? 1 : -1);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = e.key;

    if (key.startsWith('Arrow') || key === 'w' || key === 'W' ||
        key === 'a' || key === 'A' || key === 's' || key === 'S' ||
        key === 'd' || key === 'D' || key === 'q' || key === 'Q' ||
        key === 'e' || key === 'E') {
      e.preventDefault();
      this.inertiaActive = false;
      this.pressedKeys.add(key);
      return;
    }

    switch (key) {
      case 'r':
      case 'R':
        this.state.onReset();
        break;
      case 'h':
      case 'H':
        this.state.onHint();
        break;
      case 'm':
      case 'M':
        this.state.onToggleMute();
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.pressedKeys.delete(e.key);
  }

  updateRotation(shapeRotation: THREE.Quaternion): void {
    shapeRotation.copy(this.accumulatedQuat);
  }
}
