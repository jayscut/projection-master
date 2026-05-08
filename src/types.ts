export interface CubeDef {
  x: number;
  y: number;
  z: number;
}

export interface MarkerDef {
  type: 'face' | 'cube';
  cubeIndex: number;
  face?: string;
  color: string;
}

export interface LevelData {
  id: number;
  name: string;
  cubes: [number, number, number][];
  targetRotation: [number, number, number, number];
  startRotation: [number, number, number, number];
  markers: MarkerDef[];
  tolerance: number;
}

export interface LevelStats {
  bestTime: number;
  rotations: number;
  completed: boolean;
}

export interface SaveData {
  highestUnlocked: number;
  levelStats: Record<string, LevelStats>;
  muted: boolean;
}

export type GameState = 'MENU' | 'CARD_FLIP' | 'PLAYING' | 'SUCCESS';

export const ISOMETRIC_ANGLE = {
  elevation: Math.atan(Math.SQRT1_2),
  azimuth: Math.PI / 4,
};
