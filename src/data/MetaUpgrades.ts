import { MetaUpgradeDefinition } from '../types/GameTypes';

export const META_UPGRADES: MetaUpgradeDefinition[] = [
  {
    id: 'meta_max_hp',
    name: '체력 강화',
    description: '최대 체력 +{value}',
    stat: 'maxHp',
    baseValue: 10,
    baseCost: 50,
    costScaling: 1.5,
    maxLevel: 10,
    icon: '❤️'
  },
  {
    id: 'meta_damage',
    name: '공격력 강화',
    description: '공격력 +{value}',
    stat: 'damage',
    baseValue: 3,
    baseCost: 75,
    costScaling: 1.6,
    maxLevel: 10,
    icon: '⚔️'
  },
  {
    id: 'meta_speed',
    name: '이동속도 강화',
    description: '이동속도 +{value}',
    stat: 'speed',
    baseValue: 10,
    baseCost: 60,
    costScaling: 1.4,
    maxLevel: 8,
    icon: '👟'
  },
  {
    id: 'meta_attack_speed',
    name: '공격속도 강화',
    description: '공격속도 +{value}',
    stat: 'attackSpeed',
    baseValue: 0.15,
    baseCost: 80,
    costScaling: 1.5,
    maxLevel: 8,
    icon: '⚡'
  },
  {
    id: 'meta_attack_range',
    name: '사거리 강화',
    description: '사거리 +{value}',
    stat: 'attackRange',
    baseValue: 15,
    baseCost: 70,
    costScaling: 1.5,
    maxLevel: 6,
    icon: '🎯'
  }
];

export function getUpgradeCost(def: MetaUpgradeDefinition, currentLevel: number): number {
  return Math.floor(def.baseCost * Math.pow(def.costScaling, currentLevel));
}
