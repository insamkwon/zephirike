/**
 * Unit tests for HighScoreManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HighScoreManager, HighScore } from '../../src/systems/HighScoreManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      // Properly clear all keys
      Object.keys(store).forEach(key => delete store[key]);
    },
    getStore: () => store
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
});

describe('HighScoreManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    localStorage.clear();
  });

  describe('loadHighScores', () => {
    it('should return empty array when no scores exist', () => {
      const scores = HighScoreManager.loadHighScores();
      expect(scores).toEqual([]);
      expect(scores).toHaveLength(0);
    });

    it('should load and sort scores in descending order', () => {
      const scores: HighScore[] = [
        { score: 100, date: '2024-01-01T10:00:00.000Z', formattedDate: '2024-01-01 10:00' },
        { score: 300, date: '2024-01-03T10:00:00.000Z', formattedDate: '2024-01-03 10:00' },
        { score: 200, date: '2024-01-02T10:00:00.000Z', formattedDate: '2024-01-02 10:00' }
      ];

      localStorage.setItem(HighScoreManager['STORAGE_KEY'], JSON.stringify(scores));

      const loaded = HighScoreManager.loadHighScores();

      expect(loaded).toHaveLength(3);
      expect(loaded[0].score).toBe(300); // Highest score first
      expect(loaded[1].score).toBe(200);
      expect(loaded[2].score).toBe(100);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(HighScoreManager['STORAGE_KEY'], 'invalid json');

      const scores = HighScoreManager.loadHighScores();
      expect(scores).toEqual([]);
    });

    it('should handle non-array data gracefully', () => {
      localStorage.setItem(HighScoreManager['STORAGE_KEY'], JSON.stringify({ score: 100 }));

      const scores = HighScoreManager.loadHighScores();
      expect(scores).toEqual([]);
    });

    it('should filter out invalid score entries', () => {
      const invalidData = [
        { score: 100, date: '2024-01-01T10:00:00.000Z', formattedDate: '2024-01-01 10:00' },
        { score: 'invalid' as any, date: '2024-01-02T10:00:00.000Z', formattedDate: '2024-01-02 10:00' },
        null,
        { score: 200, date: '2024-01-03T10:00:00.000Z', formattedDate: '2024-01-03 10:00' }
      ];

      localStorage.setItem(HighScoreManager['STORAGE_KEY'], JSON.stringify(invalidData));

      const scores = HighScoreManager.loadHighScores();

      expect(scores).toHaveLength(2);
      expect(scores[0].score).toBe(200);
      expect(scores[1].score).toBe(100);
    });
  });

  describe('saveHighScore', () => {
    it('should save a valid score to localStorage', () => {
      const saved = HighScoreManager.saveHighScore(100);

      expect(saved).toBe(true);

      const stored = localStorage.getItem(HighScoreManager['STORAGE_KEY']);
      expect(stored).toBeTruthy();

      const scores = JSON.parse(stored!);
      expect(scores).toHaveLength(1);
      expect(scores[0].score).toBe(100);
      expect(scores[0].date).toBeTruthy();
      expect(scores[0].formattedDate).toBeTruthy();
    });

    it('should not save zero or negative scores', () => {
      expect(HighScoreManager.saveHighScore(0)).toBe(false);
      expect(HighScoreManager.saveHighScore(-100)).toBe(false);

      const stored = localStorage.getItem(HighScoreManager['STORAGE_KEY']);
      expect(stored).toBeNull();
    });

    it('should keep only top 5 scores', () => {
      // Save 7 scores
      for (let i = 1; i <= 7; i++) {
        HighScoreManager.saveHighScore(i * 100);
      }

      const scores = HighScoreManager.loadHighScores();
      expect(scores).toHaveLength(5);

      // Should keep the highest 5 scores
      expect(scores[0].score).toBe(700);
      expect(scores[1].score).toBe(600);
      expect(scores[2].score).toBe(500);
      expect(scores[3].score).toBe(400);
      expect(scores[4].score).toBe(300);
    });

    it('should return false if score does not make it to top 5', () => {
      // Fill top 5 with high scores
      for (let i = 1; i <= 5; i++) {
        HighScoreManager.saveHighScore(1000 * i);
      }

      // Try to save a low score (100, which is lower than all existing scores)
      const saved = HighScoreManager.saveHighScore(100);
      expect(saved).toBe(false);

      const scores = HighScoreManager.loadHighScores();
      expect(scores).toHaveLength(5);
      expect(scores[4].score).toBe(1000); // Should still be 1000, not 100
    });

    it('should return true if score makes it to top 5', () => {
      // Save 3 scores
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(200);
      HighScoreManager.saveHighScore(300);

      // Save a score that would rank 2nd
      const saved = HighScoreManager.saveHighScore(250);
      expect(saved).toBe(true);

      const scores = HighScoreManager.loadHighScores();
      expect(scores).toHaveLength(4);
      expect(scores[1].score).toBe(250);
    });

    it('should sort scores in descending order after saving', () => {
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(300);
      HighScoreManager.saveHighScore(200);

      const scores = HighScoreManager.loadHighScores();
      expect(scores[0].score).toBe(300);
      expect(scores[1].score).toBe(200);
      expect(scores[2].score).toBe(100);
    });
  });

  describe('isHighScore', () => {
    it('should return true for any positive score when no scores exist', () => {
      expect(HighScoreManager.isHighScore(1)).toBe(true);
      expect(HighScoreManager.isHighScore(100)).toBe(true);
    });

    it('should return true if score would make top 5', () => {
      // Save 3 scores
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(200);
      HighScoreManager.saveHighScore(300);

      expect(HighScoreManager.isHighScore(150)).toBe(true);
      expect(HighScoreManager.isHighScore(400)).toBe(true);
    });

    it('should return false if score would not make top 5', () => {
      // Fill top 5
      for (let i = 1; i <= 5; i++) {
        HighScoreManager.saveHighScore(i * 100);
      }

      expect(HighScoreManager.isHighScore(50)).toBe(false);
      expect(HighScoreManager.isHighScore(99)).toBe(false);
    });

    it('should return true if score equals the lowest top score', () => {
      // Save 5 scores: 100, 200, 300, 400, 500
      for (let i = 1; i <= 5; i++) {
        HighScoreManager.saveHighScore(i * 100);
      }

      expect(HighScoreManager.isHighScore(500)).toBe(true);
    });
  });

  describe('getScoreRank', () => {
    it('should return 0 for score that does not make top 5', () => {
      // Fill top 5
      for (let i = 1; i <= 5; i++) {
        HighScoreManager.saveHighScore(i * 1000);
      }

      expect(HighScoreManager.getScoreRank(100)).toBe(0);
    });

    it('should return correct rank for qualifying scores', () => {
      // Save scores: 100, 200, 300, 400, 500
      for (let i = 1; i <= 5; i++) {
        HighScoreManager.saveHighScore(i * 100);
      }

      expect(HighScoreManager.getScoreRank(600)).toBe(1);
      expect(HighScoreManager.getScoreRank(550)).toBe(1);
      expect(HighScoreManager.getScoreRank(450)).toBe(2);
      expect(HighScoreManager.getScoreRank(350)).toBe(3);
      expect(HighScoreManager.getScoreRank(250)).toBe(4);
    });

    it('should return 6th position when fewer than 5 scores exist', () => {
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(200);
      HighScoreManager.saveHighScore(300);

      expect(HighScoreManager.getScoreRank(50)).toBe(4);
    });
  });

  describe('clearHighScores', () => {
    it('should remove all scores from localStorage', () => {
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(200);
      HighScoreManager.saveHighScore(300);

      expect(HighScoreManager.loadHighScores()).toHaveLength(3);

      HighScoreManager.clearHighScores();

      const scores = HighScoreManager.loadHighScores();
      expect(scores).toHaveLength(0);
    });
  });

  describe('getHighestScore', () => {
    it('should return 0 when no scores exist', () => {
      expect(HighScoreManager.getHighestScore()).toBe(0);
    });

    it('should return the highest score', () => {
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(300);
      HighScoreManager.saveHighScore(200);

      expect(HighScoreManager.getHighestScore()).toBe(300);
    });
  });

  describe('getAverageScore', () => {
    it('should return 0 when no scores exist', () => {
      expect(HighScoreManager.getAverageScore()).toBe(0);
    });

    it('should calculate average correctly', () => {
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(200);
      HighScoreManager.saveHighScore(300);

      const average = HighScoreManager.getAverageScore();
      expect(average).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should round average to nearest integer', () => {
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(150);
      HighScoreManager.saveHighScore(200);

      const average = HighScoreManager.getAverageScore();
      expect(average).toBe(150); // (100 + 150 + 200) / 3 = 150
    });
  });

  describe('integration tests', () => {
    it('should handle complete workflow: save, load, check, clear', () => {
      // Initially empty
      expect(HighScoreManager.loadHighScores()).toHaveLength(0);
      expect(HighScoreManager.getHighestScore()).toBe(0);

      // Save scores
      expect(HighScoreManager.saveHighScore(100)).toBe(true);
      expect(HighScoreManager.saveHighScore(200)).toBe(true);
      expect(HighScoreManager.saveHighScore(150)).toBe(true);

      // Check rankings
      expect(HighScoreManager.isHighScore(175)).toBe(true);
      expect(HighScoreManager.getScoreRank(175)).toBe(2);

      // Load and verify
      const scores = HighScoreManager.loadHighScores();
      expect(scores).toHaveLength(3);
      expect(scores[0].score).toBe(200);

      // Get stats
      expect(HighScoreManager.getHighestScore()).toBe(200);
      expect(HighScoreManager.getAverageScore()).toBe(150);

      // Clear
      HighScoreManager.clearHighScores();
      expect(HighScoreManager.loadHighScores()).toHaveLength(0);
    });

    it('should persist scores across multiple save operations', () => {
      // Save scores in batches
      HighScoreManager.saveHighScore(100);
      HighScoreManager.saveHighScore(200);

      let scores = HighScoreManager.loadHighScores();
      expect(scores).toHaveLength(2);

      // Save more scores
      HighScoreManager.saveHighScore(300);
      HighScoreManager.saveHighScore(150);

      scores = HighScoreManager.loadHighScores();
      expect(scores).toHaveLength(4);
      expect(scores[0].score).toBe(300);
      expect(scores[3].score).toBe(100);
    });

    it('should handle top 5 scenario correctly', () => {
      // Save 10 different scores
      const testScores = [500, 100, 900, 300, 700, 200, 800, 400, 600, 150];

      testScores.forEach(score => HighScoreManager.saveHighScore(score));

      // Should only have top 5
      const scores = HighScoreManager.loadHighScores();
      expect(scores).toHaveLength(5);

      // Verify they are the top 5 and sorted
      expect(scores[0].score).toBe(900);
      expect(scores[1].score).toBe(800);
      expect(scores[2].score).toBe(700);
      expect(scores[3].score).toBe(600);
      expect(scores[4].score).toBe(500);
    });
  });
});
