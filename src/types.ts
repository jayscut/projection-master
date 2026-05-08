export type QuaternionTuple = [number, number, number, number];

export type MarkerDef =
  | { type: 'face'; cubeIndex: number; face: string; color: string }
  | { type: 'cube'; cubeIndex: number; color: string };

export interface LevelData {
  readonly id: number;
  readonly name: string;
  readonly cubes: readonly [number, number, number][];
  readonly targetRotation: QuaternionTuple;
  readonly startRotation: QuaternionTuple;
  readonly markers: readonly MarkerDef[];
  readonly tolerance: number;
}

export interface LevelStats {
  bestTime: number;
  rotations: number;
  completed: boolean;
}

export interface SaveData {
  highestUnlocked: number;
  levelStats: Record<number, LevelStats>;
  muted: boolean;
}

export type GameState = 'MENU' | 'CARD_FLIP' | 'PLAYING' | 'SUCCESS';

export const ISOMETRIC_ANGLE = {
  elevation: Math.atan(Math.SQRT1_2),
  azimuth: Math.PI / 4,
};
