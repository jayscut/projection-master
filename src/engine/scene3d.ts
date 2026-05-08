import * as THREE from 'three';
import { createOrthoCamera, setIsometricAngle } from './camera';
import { createBackgroundGrid } from './renderer';
import { Shape } from '../shapes/shape';

export interface ViewportScene {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  frustumSize: number;
}

export function createViewportScene(
  frustumSize: number,
  aspect: number
): ViewportScene {
  const scene = new THREE.Scene();
  const camera = createOrthoCamera(frustumSize, aspect);
  setIsometricAngle(camera);

  createBackgroundGrid(scene);

  return { scene, camera, frustumSize };
}

export function addShapeToScene(scene: THREE.Scene, shape: Shape): void {
  scene.add(shape.group);
}

export function renderViewport(
  viewport: ViewportScene,
  renderer: THREE.WebGLRenderer,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const { scene, camera } = viewport;
  const aspect = width / height;

  const half = viewport.frustumSize / 2;
  camera.left = -half * aspect;
  camera.right = half * aspect;
  camera.top = half;
  camera.bottom = -half;
  camera.updateProjectionMatrix();

  renderer.setViewport(x, y, width, height);
  renderer.setScissor(x, y, width, height);
  renderer.setScissorTest(true);
  renderer.render(scene, camera);
  renderer.setScissorTest(false);
}

export function zoomViewport(
  viewport: ViewportScene,
  delta: number
): void {
  viewport.frustumSize = Math.max(2, Math.min(16, viewport.frustumSize + delta * 0.5));
}
