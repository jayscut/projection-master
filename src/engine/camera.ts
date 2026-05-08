import * as THREE from 'three';
import { ISOMETRIC_ANGLE } from '../types';

export function createOrthoCamera(
  frustumSize: number,
  aspect: number
): THREE.OrthographicCamera {
  const half = frustumSize / 2;
  const camera = new THREE.OrthographicCamera(
    -half * aspect,
    half * aspect,
    half,
    -half,
    0.1,
    100
  );

  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  return camera;
}

export function setIsometricAngle(camera: THREE.OrthographicCamera): void {
  const dist = 10;
  const el = ISOMETRIC_ANGLE.elevation;
  const az = ISOMETRIC_ANGLE.azimuth;

  camera.position.set(
    dist * Math.cos(el) * Math.cos(az),
    dist * Math.sin(el),
    dist * Math.cos(el) * Math.sin(az)
  );
  camera.lookAt(0, 0, 0);
}

export function setFrustumSize(camera: THREE.OrthographicCamera, size: number): void {
  const aspect = camera.right / camera.top;
  const half = size / 2;
  camera.left = -half * aspect;
  camera.right = half * aspect;
  camera.top = half;
  camera.bottom = -half;
  camera.updateProjectionMatrix();
}
