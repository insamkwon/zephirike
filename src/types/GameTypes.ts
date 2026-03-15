export interface GameConfig {
  width: number;
  height: number;
  zoom: number;
}

export type RotationMode = 'ATTACK' | 'MOVEMENT';

export interface PlayerConfig {
  x: number;
  y: number;
  speed: number;
  hp: number;
  maxHp: number;
  attackSpeed: number;
  attackRange: number;
  damage: number;
  rotationMode?: RotationMode;
  level?: number;
  experience?: number;
  experienceToNextLevel?: number;
}

export interface WeaponUpgrade {
  id: string;
  name: string;
  description: string;
  type: AttackType;
  statBonus: {
    damage?: number;
    attackSpeed?: number;
    range?: number;
    projectileSpeed?: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LevelUpEvent {
  level: number;
  availableUpgrades: WeaponUpgrade[];
}

export interface ProjectileConfig {
  x: number;
  y: number;
  angle: number;
  speed: number;
  damage: number;
  duration: number;
}

export type EnemyType = 'slime' | 'skeleton' | 'bat';

export interface EnemyConfig {
  x: number;
  y: number;
  speed: number;
  hp: number;
  damage: number;
  type?: EnemyType;  // 적 타입 (기본값: slime)
  reactionConfig?: EnemyReactionConfig;
}

/**
 * Enemy state types for the hit state machine
 */
export enum EnemyState {
  IDLE = 'IDLE',           // Normal state, enemy can move and act
  KNOCKBACK = 'KNOCKBACK', // Being pushed back by damage
  STUN = 'STUN',           // Cannot move or act temporarily
  INVINCIBLE = 'INVINCIBLE', // Brief i-frames after taking damage
  DYING = 'DYING'          // Enemy is in death animation
}

/**
 * Configuration for enemy reactions to damage
 */
export interface EnemyReactionConfig {
  knockback: {
    enabled: boolean;        // Whether knockback is enabled
    force: number;          // Knockback force (velocity)
    duration: number;       // How long knockback lasts (ms)
    decay: number;          // How quickly knockback decays (0-1)
  };
  stun: {
    enabled: boolean;        // Whether stun is enabled
    duration: number;       // How long stun lasts (ms)
  };
  invincibility: {
    enabled: boolean;        // Whether i-frames are enabled
    duration: number;       // How long i-frames last (ms)
  };
  chainSequence: boolean;   // If true, chain: knockback → stun → i-frames
}

export interface BossConfig {
  x: number;
  y: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage: number;
  size: number;
  name: string;
  attackPattern: 'chase' | 'spray' | 'charge';
}

export enum BossState {
  SPAWNING = 'SPAWNING',
  ACTIVE = 'ACTIVE',
  CHARGING = 'CHARGING',
  DEAD = 'DEAD'
}

export interface AttackDirection {
  angle: number;
  isAttacking: boolean;
}

export type AttackType = 'projectile' | 'melee';

/**
 * Timer event data structure
 */
export interface TimerEventData {
  elapsedTime: number;      // Total elapsed time in milliseconds
  formattedTime: string;     // Formatted time string (MM:SS)
  seconds: number;           // Total seconds
  minutes: number;           // Total minutes
}

/**
 * Timer milestone event data (extends TimerEventData)
 */
export interface TimerMilestoneEventData extends TimerEventData {
  milestoneNumber: number;   // Which milestone (1, 2, 3, etc.)
  milestoneTime: number;     // Time of this milestone in seconds
}

/**
 * Hit event data structure
 * Contains information about a damage hit event
 */
export interface HitEvent {
  damage: number;              // Amount of damage dealt
  targetX: number;             // X position of the target (enemy)
  targetY: number;             // Y position of the target (enemy)
  sourceX: number;             // X position of damage source (projectile/player)
  sourceY: number;             // Y position of damage source
  isCritical?: boolean;        // Whether this was a critical hit
  damageType: 'projectile' | 'melee' | 'other';  // Type of damage
  targetId: string;            // Unique identifier of the target
  timestamp: number;           // When the hit occurred
}

/**
 * Hit callback function type
 * Called when a hit event occurs
 */
export type HitCallback = (event: HitEvent) => void;

/**
 * Hit callback filter options
 * Allows callbacks to filter which hits they respond to
 */
export interface HitCallbackFilter {
  damageType?: ('projectile' | 'melee' | 'other')[];  // Filter by damage type
  minDamage?: number;          // Minimum damage threshold
  maxDamage?: number;          // Maximum damage threshold
  isCritical?: boolean;        // Only critical hits
}

// Re-export HitCallbackManager for convenience
export { HitCallbackManager } from '../systems/HitCallbackManager';
