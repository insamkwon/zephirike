import Phaser from 'phaser';

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
 * Configuration for the GameTimer system
 */
export interface GameTimerConfig {
  updateInterval?: number;   // Event broadcast interval in milliseconds (default: 1000ms)
  enableMilestones?: boolean; // Enable milestone events (default: true)
  milestoneInterval?: number; // Milestone interval in seconds (default: 30s)
}

/**
 * GameTimer System - Tracks elapsed gameplay time and broadcasts events
 *
 * Features:
 * - Tracks elapsed time since game start
 * - Broadcasts time update events at regular intervals
 * - Supports pause/resume functionality
 * - Provides formatted time display (MM:SS)
 * - Emits milestone events for difficulty scaling
 *
 * Usage:
 * ```typescript
 * const timer = new GameTimer(scene, { updateInterval: 1000 });
 * timer.start();
 *
 * // Listen to time updates
 * scene.events.on('timer:update', (data: TimerEventData) => {
 *   console.log(`Time: ${data.formattedTime}`);
 * });
 *
 * // Get current time
 * const currentTime = timer.getElapsedTime();
 * ```
 */
export class GameTimer {
  private scene: Phaser.Scene;
  private config: Required<GameTimerConfig>;
  private gameStartTime: number = 0;
  private elapsedTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private pauseTime: number = 0;
  private totalPausedTime: number = 0;
  private lastMilestone: number = 0;
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  // Event names constants
  public static readonly EVENT_UPDATE = 'timer:update';
  public static readonly EVENT_MILESTONE = 'timer:milestone';
  public static readonly EVENT_PAUSE = 'timer:pause';
  public static readonly EVENT_RESUME = 'timer:resume';
  public static readonly EVENT_STOP = 'timer:stop';

  constructor(scene: Phaser.Scene, config: GameTimerConfig = {}) {
    this.scene = scene;

    // Apply default config
    this.config = {
      updateInterval: config.updateInterval ?? 1000,
      enableMilestones: config.enableMilestones ?? true,
      milestoneInterval: config.milestoneInterval ?? 30
    };
  }

  /**
   * Start the game timer
   */
  start(): void {
    if (this.isRunning) {
      console.warn('GameTimer is already running');
      return;
    }

    this.gameStartTime = this.scene.time.now;
    this.elapsedTime = 0;
    this.totalPausedTime = 0;
    this.lastMilestone = 0;
    this.isRunning = true;
    this.isPaused = false;

    // Set up periodic time update events
    this.timerEvent = this.scene.time.addEvent({
      delay: this.config.updateInterval,
      callback: this.onTimerUpdate,
      callbackScope: this,
      loop: true
    });

    console.log('GameTimer started');
  }

  /**
   * Pause the game timer
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.isPaused = true;
    this.pauseTime = this.scene.time.now;

    // Emit pause event
    this.emitEvent(GameTimer.EVENT_PAUSE, this.getEventData());
    console.log('GameTimer paused');
  }

  /**
   * Resume the game timer
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.totalPausedTime += this.scene.time.now - this.pauseTime;

    // Emit resume event
    this.emitEvent(GameTimer.EVENT_RESUME, this.getEventData());
    console.log('GameTimer resumed');
  }

  /**
   * Stop the game timer
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.isPaused = false;

    // Remove timer event
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }

    // Emit stop event
    this.emitEvent(GameTimer.EVENT_STOP, this.getEventData());
    console.log('GameTimer stopped');
  }

  /**
   * Get the current elapsed time in milliseconds
   */
  getElapsedTime(): number {
    if (!this.isRunning) {
      return this.elapsedTime;
    }

    if (this.isPaused) {
      return this.pauseTime - this.gameStartTime - this.totalPausedTime;
    }

    return this.scene.time.now - this.gameStartTime - this.totalPausedTime;
  }

  /**
   * Get formatted time string (MM:SS)
   */
  getFormattedTime(): string {
    const elapsed = this.getElapsedTime();
    const totalSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Get total seconds elapsed
   */
  getTotalSeconds(): number {
    return Math.floor(this.getElapsedTime() / 1000);
  }

  /**
   * Get total minutes elapsed
   */
  getTotalMinutes(): number {
    return Math.floor(this.getTotalSeconds() / 60);
  }

  /**
   * Check if timer is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Check if timer is paused
   */
  isTimerPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Internal handler for timer updates
   */
  private onTimerUpdate(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.elapsedTime = this.getElapsedTime();
    const eventData = this.getEventData();

    // Emit time update event
    this.emitEvent(GameTimer.EVENT_UPDATE, eventData);

    // Check for milestones
    if (this.config.enableMilestones) {
      this.checkMilestone(eventData.seconds);
    }
  }

  /**
   * Check and emit milestone events
   */
  private checkMilestone(currentSeconds: number): void {
    const currentMilestone = Math.floor(currentSeconds / this.config.milestoneInterval);

    if (currentMilestone > this.lastMilestone) {
      this.lastMilestone = currentMilestone;

      // Emit milestone event
      this.emitEvent(GameTimer.EVENT_MILESTONE, {
        ...this.getEventData(),
        milestoneNumber: currentMilestone,
        milestoneTime: currentMilestone * this.config.milestoneInterval
      });

      console.log(`Milestone reached: ${currentMilestone * this.config.milestoneInterval}s`);
    }
  }

  /**
   * Create event data object
   */
  private getEventData(): TimerEventData {
    const elapsed = this.getElapsedTime();
    const totalSeconds = Math.floor(elapsed / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);

    return {
      elapsedTime: elapsed,
      formattedTime: this.getFormattedTime(),
      seconds: totalSeconds,
      minutes: totalMinutes
    };
  }

  /**
   * Emit event to scene's event system
   */
  private emitEvent(eventName: string, data: TimerEventData & { milestoneNumber?: number; milestoneTime?: number }): void {
    this.scene.events.emit(eventName, data);
  }

  /**
   * Destroy the timer and clean up resources
   */
  destroy(): void {
    this.stop();
    console.log('GameTimer destroyed');
  }
}
