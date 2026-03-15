// Import types from GameTypes first
import { EnemyConfig } from './GameTypes';

// Re-export from GameTypes
export * from './GameTypes';

// Re-export from WeaponTypes
export * from './WeaponTypes';

// Additional type definitions for Player
export interface Position {
  x: number;
  y: number;
}

export enum AttackMode {
  MOUSE = 'MOUSE',
  AUTO = 'AUTO'
}

export interface WeaponData {
  name: string;
  damage: number;
  fireRate: number; // attacks per second
  range: number;
  projectileSpeed: number;
}

// Alias for compatibility
export type EnemyData = EnemyConfig;
