import { MetaProgressionData, MetaStatBonuses } from '../types/GameTypes';
import { META_UPGRADES, getUpgradeCost } from '../data/MetaUpgrades';

export class MetaProgressionManager {
  static readonly STORAGE_KEY = 'zephirike_meta_progression';

  static load(): MetaProgressionData {
    try {
      const raw = localStorage.getItem(MetaProgressionManager.STORAGE_KEY);
      if (!raw) return { gold: 0, upgradeLevels: {} };

      const data = JSON.parse(raw);
      if (
        typeof data !== 'object' ||
        data === null ||
        typeof data.gold !== 'number' ||
        typeof data.upgradeLevels !== 'object'
      ) {
        return { gold: 0, upgradeLevels: {} };
      }

      return {
        gold: Math.max(0, Math.floor(data.gold)),
        upgradeLevels: data.upgradeLevels as Record<string, number>
      };
    } catch {
      return { gold: 0, upgradeLevels: {} };
    }
  }

  static save(data: MetaProgressionData): void {
    try {
      localStorage.setItem(MetaProgressionManager.STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage full or unavailable
    }
  }

  static getGold(): number {
    return MetaProgressionManager.load().gold;
  }

  static addGold(amount: number): void {
    const data = MetaProgressionManager.load();
    data.gold += Math.max(0, Math.floor(amount));
    MetaProgressionManager.save(data);
  }

  static getUpgradeLevel(upgradeId: string): number {
    const data = MetaProgressionManager.load();
    return data.upgradeLevels[upgradeId] || 0;
  }

  static purchaseUpgrade(upgradeId: string): boolean {
    const def = META_UPGRADES.find(u => u.id === upgradeId);
    if (!def) return false;

    const data = MetaProgressionManager.load();
    const currentLevel = data.upgradeLevels[upgradeId] || 0;

    if (currentLevel >= def.maxLevel) return false;

    const cost = getUpgradeCost(def, currentLevel);
    if (data.gold < cost) return false;

    data.gold -= cost;
    data.upgradeLevels[upgradeId] = currentLevel + 1;
    MetaProgressionManager.save(data);
    return true;
  }

  static getStatBonuses(): MetaStatBonuses {
    const data = MetaProgressionManager.load();
    const bonuses: MetaStatBonuses = {
      maxHp: 0,
      damage: 0,
      speed: 0,
      attackSpeed: 0,
      attackRange: 0
    };

    for (const def of META_UPGRADES) {
      const level = data.upgradeLevels[def.id] || 0;
      if (level > 0) {
        bonuses[def.stat] += def.baseValue * level;
      }
    }

    return bonuses;
  }

  static reset(): void {
    try {
      localStorage.removeItem(MetaProgressionManager.STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
