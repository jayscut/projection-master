import * as THREE from 'three';

const TRACKBALL_RADIUS = 0.8;
const DRAG_SPEED = 2.5;

function project(x: number, y: number): THREE.Vector3 {
  const d = Math.sqrt(x * x + y * y);
  const r = TRACKBALL_RADIUS;
  if (d < r * 0.7071) {
    return new THREE.Vector3(x, y, Math.sqrt(r * r - d * d));
  } else {
    const t = r / Math.SQRT2;
    return new THREE.Vector3(x, y, t * t / d);
  }
}

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
  private lastPoint = new THREE.Vector3();
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseUp: () => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnKeyDown: (e: KeyboardEvent) => void;

  constructor(target: HTMLElement) {
    this.target = target;

    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

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
  }

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
  }

  reset(): void {
    this.accumulatedQuat.identity();
  }

  private normalizeFromEvent(e: MouseEvent): THREE.Vector3 {
    const rect = this.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 2 - 1) * (rect.width / rect.height);
    const y = -((e.clientY - rect.top) / rect.height * 2 - 1);
    return project(x, y);
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.state.isDragging = true;
    this.lastPoint.copy(this.normalizeFromEvent(e));
  }

  private onMouseMove(e: MouseEvent): void {
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;

    if (!this.state.isDragging) return;

    const cur = this.normalizeFromEvent(e);
    const axis = new THREE.Vector3().crossVectors(this.lastPoint, cur);
    const len = axis.length();
    if (len < 1e-6) return;

    const angle = Math.asin(Math.min(len, 1)) * DRAG_SPEED;
    axis.normalize();

    const delta = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    this.accumulatedQuat.premultiply(delta);
    this.accumulatedQuat.normalize();
    this.lastPoint.copy(cur);
  }

  private onMouseUp(): void {
    this.state.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.state.onZoom(e.deltaY > 0 ? 1 : -1);
  }

  private onKeyDown(e: KeyboardEvent): void {
    const STEP = Math.PI / 8;
    switch (e.key.toUpperCase()) {
      case 'R':
        this.state.onReset();
        break;
      case 'H':
        this.state.onHint();
        break;
      case 'M':
        this.state.onToggleMute();
        break;
      case 'ARROWUP': {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -STEP);
        this.accumulatedQuat.premultiply(q);
        break;
      }
      case 'ARROWDOWN': {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), STEP);
        this.accumulatedQuat.premultiply(q);
        break;
      }
      case 'ARROWLEFT': {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -STEP);
        this.accumulatedQuat.premultiply(q);
        break;
      }
      case 'ARROWRIGHT': {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), STEP);
        this.accumulatedQuat.premultiply(q);
        break;
      }
      case 'Q': {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), STEP);
        this.accumulatedQuat.premultiply(q);
        break;
      }
      case 'E': {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -STEP);
        this.accumulatedQuat.premultiply(q);
        break;
      }
    }
  }

  updateRotation(shapeRotation: THREE.Quaternion): void {
    shapeRotation.copy(this.accumulatedQuat);
  }
}
