import * as THREE from 'three';

function extractCentroid(points: THREE.Vector3[]): THREE.Vector3 {
  const center = new THREE.Vector3();
  for (const p of points) {
    center.add(p);
  }
  center.divideScalar(points.length);
  return center;
}

function normalizePoints(points: THREE.Vector3[], centroid: THREE.Vector3, scale: number): THREE.Vector3[] {
  const result: THREE.Vector3[] = [];
  for (const p of points) {
    result.push(p.clone().sub(centroid).multiplyScalar(1 / scale));
  }
  return result;
}

function computeScale(points: THREE.Vector3[], centroid: THREE.Vector3): number {
  let maxDist = 0;
  for (const p of points) {
    const d = p.distanceTo(centroid);
    if (d > maxDist) maxDist = d;
  }
  return maxDist;
}

function rmseScore(
  targetPoints: THREE.Vector3[],
  playerPoints: THREE.Vector3[],
  refScale: number,
  tolerance: number,
  centroid?: THREE.Vector3,
): number {
  if (targetPoints.length === 0 || playerPoints.length === 0) {
    return 1;
  }

  const targetCentroid = centroid ?? extractCentroid(targetPoints);
  const playerCentroid = centroid ?? extractCentroid(playerPoints);

  const normTarget = normalizePoints(targetPoints, targetCentroid, refScale);
  const normPlayer = normalizePoints(playerPoints, playerCentroid, refScale);

  let sumSqDist = 0;
  for (const playerPt of normPlayer) {
    let minDistSq = Infinity;
    for (const targetPt of normTarget) {
      const dSq = playerPt.distanceToSquared(targetPt);
      if (dSq < minDistSq) minDistSq = dSq;
    }
    sumSqDist += minDistSq;
  }

  const rmse = Math.sqrt(sumSqDist / playerPoints.length);
  return Math.max(0, 1 - rmse / tolerance);
}

export function computeMatchScore(
  targetCorners: THREE.Vector3[],
  playerCorners: THREE.Vector3[],
  targetMarkers: THREE.Vector3[],
  playerMarkers: THREE.Vector3[],
  tolerance: number
): number {
  if (targetCorners.length === 0 || playerCorners.length === 0) {
    return 0;
  }

  const targetCentroid = extractCentroid(targetCorners);
  const targetScale = computeScale(targetCorners, targetCentroid);
  const playerScale = computeScale(playerCorners, extractCentroid(playerCorners));
  const refScale = Math.max(targetScale, playerScale, 1e-6);

  const cornerScore = rmseScore(targetCorners, playerCorners, refScale, tolerance);

  let faceScore = 1;
  if (targetMarkers.length > 0) {
    faceScore = rmseScore(targetMarkers, playerMarkers, refScale, tolerance, targetCentroid);
  }

  return cornerScore * faceScore;
}
