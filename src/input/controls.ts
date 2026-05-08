import * as THREE from 'three';

export interface ControlsState {
  rotationX: number;
  rotationY: number;
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
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartRotX = 0;
  private dragStartRotY = 0;

  constructor(target: HTMLElement) {
    this.state = {
      rotationX: 0,
      rotationY: 0,
      isDragging: false,
      mouseX: 0,
      mouseY: 0,
      onReset: () => {},
      onHint: () => {},
      onToggleMute: () => {},
      onZoom: () => {},
    };

    target.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    target.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    window.addEventListener('keydown', this.onKeyDown.bind(this));
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

  private onMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return;
    this.state.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.dragStartRotX = this.state.rotationX;
    this.dragStartRotY = this.state.rotationY;
  }

  private onMouseMove(e: MouseEvent): void {
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;

    if (this.state.isDragging) {
      const dx = e.clientX - this.dragStartX;
      const dy = e.clientY - this.dragStartY;
      this.state.rotationX = this.dragStartRotX - dy * 0.005;
      this.state.rotationY = this.dragStartRotY + dx * 0.005;
    }
  }

  private onMouseUp(): void {
    this.state.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.state.onZoom(e.deltaY > 0 ? 1 : -1);
  }

  private onKeyDown(e: KeyboardEvent): void {
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
      case 'ARROWUP':
        this.state.rotationX -= Math.PI / 8;
        break;
      case 'ARROWDOWN':
        this.state.rotationX += Math.PI / 8;
        break;
      case 'ARROWLEFT':
        this.state.rotationY -= Math.PI / 8;
        break;
      case 'ARROWRIGHT':
        this.state.rotationY += Math.PI / 8;
        break;
      case 'Q':
        this.state.rotationY -= Math.PI / 8;
        break;
      case 'E':
        this.state.rotationY += Math.PI / 8;
        break;
    }
  }

  updateRotation(shapeRotation: THREE.Quaternion): void {
    const euler = new THREE.Euler(this.state.rotationX, this.state.rotationY, 0, 'YXZ');
    shapeRotation.setFromEuler(euler);
  }
}
