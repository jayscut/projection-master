import * as THREE from 'three';

export function createRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x0A0A1A);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  return renderer;
}

export function createBackgroundGrid(_scene: THREE.Scene): void {
  // Background grid removed — clean dark background
}
