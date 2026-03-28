import { WeaponDef } from './weaponConfig';

export interface EvolutionRecipe {
  weapon1: string;
  weapon2: string;
  result: WeaponDef;
}

/**
 * When both weapons reach max level, they can evolve into a super weapon.
 * Presented as a special option during level-up.
 */
export const EVOLUTIONS: EvolutionRecipe[] = [
  {
    weapon1: 'magic_bolt',
    weapon2: 'lightning',
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
    weapon1: 'whip',
    weapon2: 'garlic',
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
    weapon1: 'holy_water',
    weapon2: 'orb',
    result: {
      id: 'divine_shield',
      name: 'Divine Shield',
      type: 'orbit',
      icon: '🛡️',
      color: 0x44ffff,
      maxLevel: 1,
      levels: [{
        damage: 30, cooldown: 0, count: 6, pierce: 99, area: 120,
        speed: 200, duration: 0,
        description: '6 divine orbs that obliterate everything they touch',
      }],
    },
  },
];
