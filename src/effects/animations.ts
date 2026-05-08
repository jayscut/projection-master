import gsap from 'gsap';
import * as THREE from 'three';

export function animateMatchRing(
  ringMesh: THREE.Mesh,
  fromRatio: number,
  toRatio: number,
  duration: number
): gsap.core.Tween {
  const target = { progress: fromRatio };
  return gsap.to(target, {
    progress: toRatio,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      ringMesh.scale.set(target.progress, target.progress, target.progress);
    },
  });
}

export function animateCardFlip(
  element: HTMLElement,
  onComplete: () => void
): gsap.core.Timeline {
  const tl = gsap.timeline({
    onComplete,
  });

  tl.to(element, {
    rotationY: 90,
    duration: 0.3,
    ease: 'power2.in',
  });
  tl.to(element, {
    rotationY: 180,
    duration: 0.3,
    ease: 'power2.out',
  }, 0.3);
  tl.to(element, {
    rotationY: 0,
    duration: 0.4,
    ease: 'power2.out',
    onComplete,
  });

  return tl;
}

export function animateSuccessBurst(
  shape: THREE.Group,
  onComplete: () => void
): void {
  const cubes = shape.children;
  const positions = cubes.map(c => c.position.clone());

  cubes.forEach((cube, i) => {
    const x = (Math.random() - 0.5) * 3;
    const y = (Math.random() - 0.5) * 3;
    const z = (Math.random() - 0.5) * 3;

    gsap.to(cube.position, {
      x,
      y,
      z,
      duration: 0.5,
      delay: i * 0.03,
      ease: 'power2.out',
    });

    gsap.to(cube.position, {
      x: positions[i].x,
      y: positions[i].y,
      z: positions[i].z,
      duration: 0.6,
      delay: 0.6 + i * 0.03,
      ease: 'elastic.out(1, 0.5)',
      onComplete: i === cubes.length - 1 ? onComplete : undefined,
    });
  });
}

export function animateTransition(
  element: HTMLElement,
  direction: 'in' | 'out'
): gsap.core.Tween {
  return gsap.to(element, {
    opacity: direction === 'in' ? 1 : 0,
    duration: 0.4,
    ease: 'power2.inOut',
  });
}
