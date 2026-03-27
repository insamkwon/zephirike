/**
 * System Index
 * Central exports for all game systems
 */

export * from './GameTimer';
export * from './WeaponPool';
export * from './WeaponSelector';
export * from './ParticleManager';
export * from './HighScoreManager';
export * from './HitCallbackManager';
export * from './AssetLoader';
export * from './MetaProgressionManager';

// Re-export types for convenience (using 'export type' for isolatedModules compatibility)
export type {
  Weapon,
  WeaponRarity,
  WeaponType,
  WeaponCategory,
  DamageType,
  WeaponDefinition,
  WeaponPoolConfig,
  WeaponOption,
  WeaponSelectionResult
} from '../types/WeaponTypes';
