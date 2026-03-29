/** Game-wide constants */

// -- Display --
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// -- World --
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;
export const WORLD_BOUND_MARGIN = 50;

// -- Player --
export const PLAYER_SPEED = 150;
export const PLAYER_MAX_HP = 100;
export const PLAYER_INVINCIBILITY_MS = 500;
export const PLAYER_PICKUP_RANGE = 60;
export const PLAYER_MAGNET_RANGE = 150;
export const DAMAGE_FLASH_DURATION = 100;
export const DIAGONAL_FACTOR = 1 / Math.SQRT2;

// -- XP / Leveling --
export const XP_BASE_REQUIRED = 10;
export const XP_GROWTH_FACTOR = 1.3;

// -- Time --
export const GAME_DURATION_SECONDS = 900; // 15 minutes

// -- Enemies --
export const MAX_ENEMIES_ON_SCREEN = 300;
export const ENEMY_SPAWN_MARGIN = 80;
export const ENEMY_DESPAWN_RANGE = 1200;
export const ENEMY_KNOCKBACK_SPEED = 100;
export const ENEMY_KNOCKBACK_MS = 100;
export const ENEMY_DAMAGE_FLASH_MS = 80;

// -- Drops --
export const DROP_MAGNET_SPEED = 400;
export const HEALTH_DROP_CHANCE = 0.05;
export const HEALTH_DROP_AMOUNT = 20;
export const HEALTH_PICKUP_RANGE = 40;
export const HEALTH_DROP_SCALING_INTERVAL = 180; // every 3 min, boost health drops

// -- Weapons --
export const PROJECTILE_POOL_SIZE = 100;
export const PROJECTILE_LIFETIME_MS = 3000;
export const PROJECTILE_OFFSCREEN_MARGIN = 200;
export const PROJECTILE_SPREAD_ANGLE = 0.15;
export const ORB_HIT_RADIUS = 20;
export const ORB_ANGULAR_SPEED_FACTOR = 0.003;
export const MELEE_VISUAL_HEIGHT = 30;
export const AREA_TICK_MS = 500;
export const AREA_OFFSET_RANGE = 100;
export const AREA_FADE_MS = 300;

// -- Map Objects --
export const MAP_PILLAR_COUNT = 40;
export const MAP_TORCH_COUNT = 60;
export const MAP_GRAVE_COUNT = 30;
export const MAP_SPAWN_EXCLUSION = 300;
export const TORCH_HP = 3;
export const BONE_PROJECTILE_SPEED = 200;
export const BONE_LIFETIME_MS = 2000;
export const BONE_HIT_RADIUS = 12;

// -- Boss --
export const BOSS_CHARGE_SPEED_MUL = 3;
export const BOSS_CHARGE_DURATION = 600;
export const BOSS_AOE_RADIUS = 120;
export const BOSS_AOE_DAMAGE = 25;
export const BOSS_SUMMON_COUNT = 5;
export const BOSS_PHASE_INTERVAL = 4000;

// -- UI --
export const DAMAGE_OVERLAY_ALPHA = 0.3;
export const DAMAGE_OVERLAY_FADE_MS = 200;
export const LEVEL_UP_CHOICES = 3;
export const REROLL_COST = 25;
