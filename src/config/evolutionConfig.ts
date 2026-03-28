import { WeaponDef } from './weaponConfig';

export interface EvolutionRecipe {
  /** Primary weapon — must be at max level */
  weapon: string;
  /** Required passive — any level */
  passive: string;
  result: WeaponDef;
}

/**
 * Evolution: max-level weapon + specific passive = super weapon.
 * Much more accessible than requiring two max-level weapons.
 */
export const EVOLUTIONS: EvolutionRecipe[] = [
  {
    weapon: 'magic_bolt',
    passive: 'haste',
    result: {
      id: 'arcane_storm',
      name: 'Arcane Storm',
      type: 'projectile',
      icon: '🌀',
      color: 0xaa44ff,
      maxLevel: 1,
      levels: [{
        damage: 60, cooldown: 400, count: 8, pierce: 5, area: 0,
        speed: 500, duration: 0,
        description: 'A storm of arcane bolts that pierce everything',
      }],
    },
  },
  {
    weapon: 'whip',
    passive: 'might',
    result: {
      id: 'soul_eater',
      name: 'Soul Eater',
      type: 'melee',
      icon: '💀',
      color: 0xff44ff,
      maxLevel: 1,
      levels: [{
        damage: 80, cooldown: 600, count: 2, pierce: 99, area: 200,
        speed: 0, duration: 300,
        description: 'Devastating cleave that devours souls in a huge area',
      }],
    },
  },
  {
    weapon: 'garlic',
    passive: 'recovery',
    result: {
      id: 'soul_drain',
      name: 'Soul Drain',
      type: 'area',
      icon: '💜',
      color: 0xaa44aa,
      maxLevel: 1,
      levels: [{
        damage: 25, cooldown: 1200, count: 1, pierce: 99, area: 160,
        speed: 0, duration: 3000,
        description: 'Drains life from all nearby enemies, healing you',
      }],
    },
  },
  {
    weapon: 'holy_water',
    passive: 'luck',
    result: {
      id: 'divine_flood',
      name: 'Divine Flood',
      type: 'area',
      icon: '🌊',
      color: 0x2288ff,
      maxLevel: 1,
      levels: [{
        damage: 35, cooldown: 2000, count: 4, pierce: 99, area: 100,
        speed: 0, duration: 4000,
        description: '4 massive holy pools that slow and devastate',
      }],
    },
  },
  {
    weapon: 'orb',
    passive: 'armor',
    result: {
      id: 'divine_shield',
      name: 'Divine Shield',
      type: 'orbit',
      icon: '✨',
      color: 0x44ffff,
      maxLevel: 1,
      levels: [{
        damage: 30, cooldown: 0, count: 6, pierce: 99, area: 120,
        speed: 200, duration: 0,
        description: '6 divine orbs that obliterate everything they touch',
      }],
    },
  },
  {
    weapon: 'lightning',
    passive: 'might',
    result: {
      id: 'thunder_god',
      name: 'Thunder God',
      type: 'projectile',
      icon: '⛈️',
      color: 0xffff00,
      maxLevel: 1,
      levels: [{
        damage: 80, cooldown: 800, count: 6, pierce: 3, area: 0,
        speed: 800, duration: 0,
        description: 'Rains divine lightning across the battlefield',
      }],
    },
  },
];
