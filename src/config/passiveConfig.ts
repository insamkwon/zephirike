export interface PassiveDef {
  id: string;
  name: string;
  icon: string;
  maxLevel: number;
  descriptions: string[];
  effect: (level: number) => number;
}

export const PASSIVES: Record<string, PassiveDef> = {
  armor: {
    id: 'armor',
    name: 'Armor',
    icon: '🛡️',
    maxLevel: 5,
    descriptions: [
      'Reduces damage taken by 5%',
      'Reduces damage taken by 10%',
      'Reduces damage taken by 15%',
      'Reduces damage taken by 20%',
      'Reduces damage taken by 25%',
    ],
    effect: (level) => level * 0.05,
  },
  haste: {
    id: 'haste',
    name: 'Haste',
    icon: '⏱️',
    maxLevel: 5,
    descriptions: [
      'Reduces weapon cooldown by 5%',
      'Reduces weapon cooldown by 10%',
      'Reduces weapon cooldown by 15%',
      'Reduces weapon cooldown by 20%',
      'Reduces weapon cooldown by 25%',
    ],
    effect: (level) => level * 0.05,
  },
  luck: {
    id: 'luck',
    name: 'Luck',
    icon: '🍀',
    maxLevel: 3,
    descriptions: [
      'Doubles health drop chance',
      'Triples health drop chance',
      '+50% gold drops',
    ],
    effect: (level) => level,
  },
  might: {
    id: 'might',
    name: 'Might',
    icon: '💪',
    maxLevel: 5,
    descriptions: [
      '+10% damage',
      '+20% damage',
      '+30% damage',
      '+40% damage',
      '+50% damage',
    ],
    effect: (level) => level * 0.10,
  },
  recovery: {
    id: 'recovery',
    name: 'Recovery',
    icon: '💚',
    maxLevel: 3,
    descriptions: [
      'Regenerate 1 HP every 5s',
      'Regenerate 1 HP every 3s',
      'Regenerate 2 HP every 3s',
    ],
    effect: (level) => level,
  },
};
