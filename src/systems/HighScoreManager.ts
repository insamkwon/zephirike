/**
 * HighScoreManager - Manages high score storage and retrieval using Local Storage
 * Stores the top 5 scores with timestamps
 */

export interface HighScore {
  score: number;
  date: string; // ISO date string
  formattedDate: string; // Human-readable date
}

export class HighScoreManager {
  private static readonly STORAGE_KEY = 'zephirike_highscores';
  private static readonly MAX_SCORES = 5;

  /**
   * Load high scores from Local Storage
   * @returns Array of high scores, sorted by score (descending)
   */
  static loadHighScores(): HighScore[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const scores: HighScore[] = JSON.parse(stored);

      // Validate and sanitize data
      if (!Array.isArray(scores)) {
        console.warn('Invalid high scores data in localStorage');
        return [];
      }

      // Filter out invalid entries
      const validScores = scores.filter(
        (score): score is HighScore =>
          typeof score === 'object' &&
          score !== null &&
          typeof score.score === 'number' &&
          typeof score.date === 'string' &&
          typeof score.formattedDate === 'string'
      );

      // Sort by score (descending)
      validScores.sort((a, b) => b.score - a.score);

      return validScores;
    } catch (error) {
      console.error('Error loading high scores:', error);
      return [];
    }
  }

  /**
   * Save a new high score if it qualifies for the top 5
   * @param score The score to save
   * @returns true if the score was saved (made it to top 5), false otherwise
   */
  static saveHighScore(score: number): boolean {
    if (score <= 0) {
      return false;
    }

    try {
      // Load existing scores
      const scores = this.loadHighScores();

      // Create new score entry
      const now = new Date();
      const newScore: HighScore = {
        score,
        date: now.toISOString(),
        formattedDate: this.formatDate(now)
      };

      // Create a new array with the new score (avoid mutating original)
      const allScores = [...scores, newScore];
      allScores.sort((a, b) => b.score - a.score);

      // Keep only top 5
      const topScores = allScores.slice(0, this.MAX_SCORES);

      // Check if the new score made it to top 5 by comparing score values
      // (not dates, because multiple saves can have the same timestamp)
      const lowestTopScore = topScores[topScores.length - 1];
      const madeIt = !lowestTopScore || score >= lowestTopScore.score;

      // Only save to Local Storage if the score made it to top 5
      if (madeIt) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(topScores));
      }

      return madeIt;
    } catch (error) {
      console.error('Error saving high score:', error);
      return false;
    }
  }

  /**
   * Check if a score qualifies for the top 5
   * @param score The score to check
   * @returns true if the score would make it to top 5
   */
  static isHighScore(score: number): boolean {
    const scores = this.loadHighScores();

    if (scores.length < this.MAX_SCORES) {
      return score > 0;
    }

    // Check if score is higher than the lowest top score
    const lowestTopScore = scores[scores.length - 1].score;
    return score > lowestTopScore;
  }

  /**
   * Get the rank position a score would achieve
   * @param score The score to check
   * @returns Rank position (1-5) or 0 if not in top 5
   */
  static getScoreRank(score: number): number {
    const scores = this.loadHighScores();

    for (let i = 0; i < scores.length; i++) {
      if (score > scores[i].score) {
        return i + 1;
      }
    }

    if (scores.length < this.MAX_SCORES) {
      return scores.length + 1;
    }

    return 0;
  }

  /**
   * Clear all high scores from Local Storage
   */
  static clearHighScores(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing high scores:', error);
    }
  }

  /**
   * Format a date for display
   * @param date The date to format
   * @returns Formatted date string
   */
  private static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * Get the highest score ever recorded
   * @returns The highest score or 0 if no scores exist
   */
  static getHighestScore(): number {
    const scores = this.loadHighScores();
    return scores.length > 0 ? scores[0].score : 0;
  }

  /**
   * Get the average of all high scores
   * @returns Average score or 0 if no scores exist
   */
  static getAverageScore(): number {
    const scores = this.loadHighScores();
    if (scores.length === 0) {
      return 0;
    }

    const total = scores.reduce((sum, score) => sum + score.score, 0);
    return Math.round(total / scores.length);
  }
}
