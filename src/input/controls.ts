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
  private target: HTMLElement;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartRotX = 0;
  private dragStartRotY = 0;
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
