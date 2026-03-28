export type WeaponType = 'projectile' | 'area' | 'orbit' | 'melee';

export interface WeaponLevel {
  damage: number;
  cooldown: number;      // ms between auto-fires
  count: number;         // projectile count or hit count
  pierce: number;        // how many enemies a projectile can hit
  area: number;          // area radius (for area / orbit weapons)
  speed: number;         // projectile speed
  duration: number;      // effect duration (ms)
  description: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  type: WeaponType;
  icon: string;          // emoji for UI
  color: number;
  maxLevel: number;
  levels: WeaponLevel[];
}

export const WEAPONS: Record<string, WeaponDef> = {
  magic_bolt: {
    id: 'magic_bolt',
    name: 'Magic Bolt',
    type: 'projectile',
    icon: '🔮',
    color: 0x6666ff,
    maxLevel: 8,
    levels: [
      { damage: 10, cooldown: 1200, count: 1, pierce: 1, area: 0, speed: 300, duration: 0, description: 'Fires a magic bolt at the nearest enemy' },
      { damage: 12, cooldown: 1100, count: 1, pierce: 1, area: 0, speed: 320, duration: 0, description: '+Damage, +Speed' },
      { damage: 14, cooldown: 1000, count: 2, pierce: 1, area: 0, speed: 340, duration: 0, description: '+1 Bolt' },
      { damage: 16, cooldown: 900, count: 2, pierce: 2, area: 0, speed: 360, duration: 0, description: '+Pierce' },
      { damage: 20, cooldown: 800, count: 3, pierce: 2, area: 0, speed: 380, duration: 0, description: '+1 Bolt, +Damage' },
      { damage: 24, cooldown: 700, count: 3, pierce: 3, area: 0, speed: 400, duration: 0, description: '+Pierce' },
      { damage: 28, cooldown: 600, count: 4, pierce: 3, area: 0, speed: 420, duration: 0, description: '+1 Bolt' },
      { damage: 35, cooldown: 500, count: 5, pierce: 4, area: 0, speed: 450, duration: 0, description: 'MAX: 5 Bolts, High Pierce' },
    ],
  },

  whip: {
    id: 'whip',
    name: 'Whip',
    type: 'melee',
    icon: '⚔️',
    color: 0xddaa44,
    maxLevel: 8,
    levels: [
      { damage: 15, cooldown: 1500, count: 1, pierce: 99, area: 80, speed: 0, duration: 200, description: 'Strikes in front of player' },
      { damage: 18, cooldown: 1400, count: 1, pierce: 99, area: 90, speed: 0, duration: 200, description: '+Damage, +Area' },
      { damage: 22, cooldown: 1300, count: 1, pierce: 99, area: 100, speed: 0, duration: 200, description: '+Damage, +Area' },
      { damage: 26, cooldown: 1200, count: 2, pierce: 99, area: 110, speed: 0, duration: 200, description: 'Strikes both sides' },
      { damage: 30, cooldown: 1100, count: 2, pierce: 99, area: 120, speed: 0, duration: 200, description: '+Damage, +Area' },
      { damage: 35, cooldown: 1000, count: 2, pierce: 99, area: 130, speed: 0, duration: 200, description: '+Damage' },
      { damage: 40, cooldown: 900, count: 2, pierce: 99, area: 150, speed: 0, duration: 200, description: '+Area' },
      { damage: 50, cooldown: 800, count: 2, pierce: 99, area: 170, speed: 0, duration: 250, description: 'MAX: Massive whip strikes' },
    ],
  },

  garlic: {
    id: 'garlic',
    name: 'Garlic',
    type: 'area',
    icon: '🧄',
    color: 0xeedd88,
    maxLevel: 8,
    levels: [
      { damage: 5, cooldown: 3000, count: 1, pierce: 99, area: 50, speed: 0, duration: 500, description: 'Damages nearby enemies' },
      { damage: 6, cooldown: 2800, count: 1, pierce: 99, area: 60, speed: 0, duration: 500, description: '+Area' },
      { damage: 8, cooldown: 2600, count: 1, pierce: 99, area: 70, speed: 0, duration: 500, description: '+Damage, +Area' },
      { damage: 10, cooldown: 2400, count: 1, pierce: 99, area: 80, speed: 0, duration: 600, description: '+Damage' },
      { damage: 12, cooldown: 2200, count: 1, pierce: 99, area: 90, speed: 0, duration: 600, description: '+Area' },
      { damage: 15, cooldown: 2000, count: 1, pierce: 99, area: 100, speed: 0, duration: 700, description: '+Damage' },
      { damage: 18, cooldown: 1800, count: 1, pierce: 99, area: 115, speed: 0, duration: 700, description: '+Area' },
      { damage: 22, cooldown: 1500, count: 1, pierce: 99, area: 130, speed: 0, duration: 800, description: 'MAX: Huge aura' },
    ],
  },

  holy_water: {
    id: 'holy_water',
    name: 'Holy Water',
    type: 'area',
    icon: '💧',
    color: 0x44aaff,
    maxLevel: 8,
    levels: [
      { damage: 8, cooldown: 4000, count: 1, pierce: 99, area: 45, speed: 0, duration: 2000, description: 'Drops a damaging pool' },
      { damage: 10, cooldown: 3800, count: 1, pierce: 99, area: 50, speed: 0, duration: 2200, description: '+Damage' },
      { damage: 12, cooldown: 3500, count: 1, pierce: 99, area: 55, speed: 0, duration: 2500, description: '+Duration' },
      { damage: 14, cooldown: 3200, count: 2, pierce: 99, area: 60, speed: 0, duration: 2800, description: '+1 Pool' },
      { damage: 16, cooldown: 3000, count: 2, pierce: 99, area: 65, speed: 0, duration: 3000, description: '+Damage' },
      { damage: 18, cooldown: 2800, count: 2, pierce: 99, area: 70, speed: 0, duration: 3200, description: '+Area' },
      { damage: 22, cooldown: 2500, count: 3, pierce: 99, area: 75, speed: 0, duration: 3500, description: '+1 Pool' },
      { damage: 28, cooldown: 2200, count: 3, pierce: 99, area: 85, speed: 0, duration: 4000, description: 'MAX: 3 large pools' },
    ],
  },

  orb: {
    id: 'orb',
    name: 'Arcane Orb',
    type: 'orbit',
    icon: '🔵',
    color: 0x44ffaa,
    maxLevel: 8,
    levels: [
      { damage: 8, cooldown: 0, count: 1, pierce: 99, area: 60, speed: 90, duration: 0, description: '1 orb orbits around you' },
      { damage: 10, cooldown: 0, count: 1, pierce: 99, area: 65, speed: 100, duration: 0, description: '+Damage, +Speed' },
      { damage: 10, cooldown: 0, count: 2, pierce: 99, area: 70, speed: 100, duration: 0, description: '+1 Orb' },
      { damage: 12, cooldown: 0, count: 2, pierce: 99, area: 80, speed: 110, duration: 0, description: '+Area, +Damage' },
      { damage: 14, cooldown: 0, count: 3, pierce: 99, area: 85, speed: 120, duration: 0, description: '+1 Orb' },
      { damage: 16, cooldown: 0, count: 3, pierce: 99, area: 90, speed: 130, duration: 0, description: '+Damage, +Speed' },
      { damage: 18, cooldown: 0, count: 4, pierce: 99, area: 95, speed: 140, duration: 0, description: '+1 Orb' },
      { damage: 22, cooldown: 0, count: 5, pierce: 99, area: 100, speed: 150, duration: 0, description: 'MAX: 5 fast orbs' },
    ],
  },

  lightning: {
    id: 'lightning',
    name: 'Lightning',
    type: 'projectile',
    icon: '⚡',
    color: 0xffff44,
    maxLevel: 8,
    levels: [
      { damage: 20, cooldown: 3000, count: 1, pierce: 1, area: 0, speed: 600, duration: 0, description: 'Strikes a random enemy' },
      { damage: 25, cooldown: 2800, count: 1, pierce: 1, area: 0, speed: 600, duration: 0, description: '+Damage' },
      { damage: 25, cooldown: 2500, count: 2, pierce: 1, area: 0, speed: 600, duration: 0, description: '+1 Strike' },
      { damage: 30, cooldown: 2300, count: 2, pierce: 2, area: 0, speed: 600, duration: 0, description: '+Pierce' },
      { damage: 35, cooldown: 2000, count: 3, pierce: 2, area: 0, speed: 600, duration: 0, description: '+1 Strike' },
      { damage: 40, cooldown: 1800, count: 3, pierce: 3, area: 0, speed: 600, duration: 0, description: '+Pierce, +Damage' },
      { damage: 45, cooldown: 1500, count: 4, pierce: 3, area: 0, speed: 600, duration: 0, description: '+1 Strike' },
      { damage: 55, cooldown: 1200, count: 5, pierce: 4, area: 0, speed: 600, duration: 0, description: 'MAX: Lightning storm' },
    ],
  },
};

/** Starting weapon pool for initial selection */
export const STARTING_WEAPONS = ['magic_bolt', 'whip', 'garlic'];
