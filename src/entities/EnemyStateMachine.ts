import Phaser from 'phaser';
import { EnemyState, EnemyReactionConfig } from '../types/GameTypes';

/**
 * State data for each enemy state
 */
interface StateData {
  state: EnemyState;
  startTime: number;
  duration?: number;
  // Knockback-specific data
  knockbackVelocity?: { x: number; y: number };
  // Source of damage (for knockback direction)
  damageSource?: { x: number; y: number };
}

/**
 * Enemy State Machine
 *
 * Manages enemy reaction states including:
 * - Knockback: Pushed back by damage
 * - Stun: Temporary inability to move/act
 * - Invincibility: Brief i-frames after taking damage
 *
 * States can be chained (e.g., knockback → stun → i-frames)
 */
export class EnemyStateMachine {
  private currentState: EnemyState = EnemyState.IDLE;
  private previousState: EnemyState = EnemyState.IDLE;
  private stateHistory: StateData[] = [];
  private reactionConfig: EnemyReactionConfig;
  private scene: Phaser.Scene;

  // Callbacks for state changes
  private onStateChangeCallbacks: Map<EnemyState, () => void> = new Map();
  private onStateExitCallbacks: Map<EnemyState, () => void> = new Map();

  // Timer for current state
  private stateTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, config: EnemyReactionConfig) {
    this.scene = scene;
    this.reactionConfig = config;
  }

  /**
   * Update the state machine (call each frame)
   */
  update(): void {
    // State-specific update logic
    switch (this.currentState) {
      case EnemyState.KNOCKBACK:
        this.updateKnockback();
        break;
      case EnemyState.STUN:
        // Stun is timer-based, no per-frame update needed
        break;
      case EnemyState.INVINCIBLE:
        // Invincibility is timer-based, no per-frame update needed
        break;
      case EnemyState.DYING:
        // Dying is handled separately
        break;
      case EnemyState.IDLE:
      default:
        // Idle state, no special update logic
        break;
    }
  }

  /**
   * Apply damage to enemy with reaction effects
   * @param damageAmount Amount of damage dealt
   * @param damageSourceX X position of damage source
   * @param damageSourceY Y position of damage source
   * @returns Object containing information about the reaction
   */
  applyDamage(
    _damageAmount: number,
    damageSourceX: number,
    damageSourceY: number
  ): {
    knockbackApplied: boolean;
    stunApplied: boolean;
    invincibilityApplied: boolean;
    currentState: EnemyState;
  } {
    // Check if enemy is invincible
    if (this.currentState === EnemyState.INVINCIBLE) {
      return {
        knockbackApplied: false,
        stunApplied: false,
        invincibilityApplied: true,
        currentState: this.currentState
      };
    }

    // Determine if we should chain reactions
    if (this.reactionConfig.chainSequence) {
      return this.applyChainedReaction(damageSourceX, damageSourceY);
    } else {
      return this.applySingleReaction(damageSourceX, damageSourceY);
    }
  }

  /**
   * Apply chained reaction sequence (knockback → stun → i-frames)
   */
  private applyChainedReaction(
    damageSourceX: number,
    damageSourceY: number
  ): {
    knockbackApplied: boolean;
    stunApplied: boolean;
    invincibilityApplied: boolean;
    currentState: EnemyState;
  } {
    let knockbackApplied = false;
    let stunApplied = false;
    let invincibilityApplied = false;

    // Step 1: Apply knockback
    if (this.reactionConfig.knockback.enabled) {
      this.enterKnockback(damageSourceX, damageSourceY);
      knockbackApplied = true;

      // Schedule stun after knockback
      if (this.reactionConfig.stun.enabled) {
        this.scene.time.delayedCall(
          this.reactionConfig.knockback.duration,
          () => {
            if (this.currentState !== EnemyState.DYING) {
              this.enterStun();
              stunApplied = true;

              // Schedule invincibility after stun
              if (this.reactionConfig.invincibility.enabled) {
                this.scene.time.delayedCall(
                  this.reactionConfig.stun.duration,
                  () => {
                    if (this.currentState !== EnemyState.DYING) {
                      this.enterInvincibility();
                      invincibilityApplied = true;
                    }
                  }
                );
              }
            }
          }
        );
      }
    }

    return {
      knockbackApplied,
      stunApplied,
      invincibilityApplied,
      currentState: this.currentState
    };
  }

  /**
   * Apply single reaction (just knockback)
   */
  private applySingleReaction(
    damageSourceX: number,
    damageSourceY: number
  ): {
    knockbackApplied: boolean;
    stunApplied: boolean;
    invincibilityApplied: boolean;
    currentState: EnemyState;
  } {
    let knockbackApplied = false;

    // Apply knockback if enabled
    if (this.reactionConfig.knockback.enabled) {
      this.enterKnockback(damageSourceX, damageSourceY);
      knockbackApplied = true;
    }

    return {
      knockbackApplied,
      stunApplied: false,
      invincibilityApplied: false,
      currentState: this.currentState
    };
  }

  /**
   * Enter knockback state
   */
  private enterKnockback(damageSourceX: number, damageSourceY: number): void {
    this.changeState(EnemyState.KNOCKBACK);

    const currentStateData: StateData = {
      state: EnemyState.KNOCKBACK,
      startTime: this.scene.time.now,
      duration: this.reactionConfig.knockback.duration,
      damageSource: { x: damageSourceX, y: damageSourceY }
    };

    this.stateHistory.push(currentStateData);

    // Schedule transition back to IDLE
    this.stateTimer = this.scene.time.delayedCall(
      this.reactionConfig.knockback.duration,
      () => {
        if (this.currentState === EnemyState.KNOCKBACK) {
          this.changeState(EnemyState.IDLE);
        }
      }
    );
  }

  /**
   * Update knockback physics
   */
  private updateKnockback(): void {
    // Knockback logic is handled in the enemy's update method
    // This method is just for any additional per-frame logic
  }

  /**
   * Enter stun state
   */
  private enterStun(): void {
    this.changeState(EnemyState.STUN);

    const currentStateData: StateData = {
      state: EnemyState.STUN,
      startTime: this.scene.time.now,
      duration: this.reactionConfig.stun.duration
    };

    this.stateHistory.push(currentStateData);

    // Schedule transition back to IDLE
    this.stateTimer = this.scene.time.delayedCall(
      this.reactionConfig.stun.duration,
      () => {
        if (this.currentState === EnemyState.STUN) {
          this.changeState(EnemyState.IDLE);
        }
      }
    );
  }

  /**
   * Enter invincibility state
   */
  private enterInvincibility(): void {
    this.changeState(EnemyState.INVINCIBLE);

    const currentStateData: StateData = {
      state: EnemyState.INVINCIBLE,
      startTime: this.scene.time.now,
      duration: this.reactionConfig.invincibility.duration
    };

    this.stateHistory.push(currentStateData);

    // Schedule transition back to IDLE
    this.stateTimer = this.scene.time.delayedCall(
      this.reactionConfig.invincibility.duration,
      () => {
        if (this.currentState === EnemyState.INVINCIBLE) {
          this.changeState(EnemyState.IDLE);
        }
      }
    );
  }

  /**
   * Enter dying state
   */
  enterDying(): void {
    this.changeState(EnemyState.DYING);

    const currentStateData: StateData = {
      state: EnemyState.DYING,
      startTime: this.scene.time.now
    };

    this.stateHistory.push(currentStateData);

    // Clear any pending state timers
    if (this.stateTimer) {
      this.stateTimer.remove();
      this.stateTimer = undefined;
    }
  }

  /**
   * Change to a new state
   */
  private changeState(newState: EnemyState): void {
    // Call exit callback for previous state
    const exitCallback = this.onStateExitCallbacks.get(this.currentState);
    if (exitCallback) {
      exitCallback();
    }

    // Update state
    this.previousState = this.currentState;
    this.currentState = newState;

    // Call enter callback for new state
    const enterCallback = this.onStateChangeCallbacks.get(newState);
    if (enterCallback) {
      enterCallback();
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): EnemyState {
    return this.currentState;
  }

  /**
   * Get previous state
   */
  getPreviousState(): EnemyState {
    return this.previousState;
  }

  /**
   * Check if enemy is in a specific state
   */
  isState(state: EnemyState): boolean {
    return this.currentState === state;
  }

  /**
   * Check if enemy is idle (can move and act)
   */
  isIdle(): boolean {
    return this.currentState === EnemyState.IDLE;
  }

  /**
   * Check if enemy is being knocked back
   */
  isKnockback(): boolean {
    return this.currentState === EnemyState.KNOCKBACK;
  }

  /**
   * Check if enemy is stunned
   */
  isStunned(): boolean {
    return this.currentState === EnemyState.STUN;
  }

  /**
   * Check if enemy is invincible
   */
  isInvincible(): boolean {
    return this.currentState === EnemyState.INVINCIBLE;
  }

  /**
   * Check if enemy is dying
   */
  isDying(): boolean {
    return this.currentState === EnemyState.DYING;
  }

  /**
   * Check if enemy can move (not in knockback, stun, or dying)
   */
  canMove(): boolean {
    return this.currentState === EnemyState.IDLE || this.currentState === EnemyState.INVINCIBLE;
  }

  /**
   * Check if enemy can take damage (not invincible)
   */
  canTakeDamage(): boolean {
    return this.currentState !== EnemyState.INVINCIBLE && this.currentState !== EnemyState.DYING;
  }

  /**
   * Get knockback velocity for current frame
   * @param enemyX Current enemy X position
   * @param enemyY Current enemy Y position
   * @returns Knockback velocity {x, y} or null if not in knockback
   */
  getKnockbackVelocity(enemyX: number, enemyY: number): { x: number; y: number } | null {
    if (this.currentState !== EnemyState.KNOCKBACK) {
      return null;
    }

    const currentStateData = this.stateHistory[this.stateHistory.length - 1];
    if (!currentStateData || !currentStateData.damageSource) {
      return null;
    }

    // Calculate direction from damage source to enemy
    const dx = enemyX - currentStateData.damageSource.x;
    const dy = enemyY - currentStateData.damageSource.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      // If damage source is at same position, push in random direction
      const angle = Math.random() * Math.PI * 2;
      return {
        x: Math.cos(angle) * this.reactionConfig.knockback.force,
        y: Math.sin(angle) * this.reactionConfig.knockback.force
      };
    }

    // Normalize and apply force
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;

    // Calculate elapsed time for decay
    const elapsed = this.scene.time.now - currentStateData.startTime;
    const progress = Math.min(elapsed / (currentStateData.duration || 1000), 1);

    // Apply decay (linear interpolation)
    const decayFactor = 1 - (progress * this.reactionConfig.knockback.decay);

    return {
      x: normalizedX * this.reactionConfig.knockback.force * decayFactor,
      y: normalizedY * this.reactionConfig.knockback.force * decayFactor
    };
  }

  /**
   * Get time remaining in current state (ms)
   */
  getStateTimeRemaining(): number {
    const currentStateData = this.stateHistory[this.stateHistory.length - 1];
    if (!currentStateData || !currentStateData.duration) {
      return 0;
    }

    const elapsed = this.scene.time.now - currentStateData.startTime;
    return Math.max(0, currentStateData.duration - elapsed);
  }

  /**
   * Get state progress (0-1)
   */
  getStateProgress(): number {
    const currentStateData = this.stateHistory[this.stateHistory.length - 1];
    if (!currentStateData || !currentStateData.duration) {
      return 0;
    }

    const elapsed = this.scene.time.now - currentStateData.startTime;
    return Math.min(elapsed / currentStateData.duration, 1);
  }

  /**
   * Register callback for state entry
   */
  onStateEnter(state: EnemyState, callback: () => void): void {
    this.onStateChangeCallbacks.set(state, callback);
  }

  /**
   * Register callback for state exit
   */
  onStateExit(state: EnemyState, callback: () => void): void {
    this.onStateExitCallbacks.set(state, callback);
  }

  /**
   * Reset state machine to IDLE
   */
  reset(): void {
    // Clear any pending timers
    if (this.stateTimer) {
      this.stateTimer.remove();
      this.stateTimer = undefined;
    }

    // Reset state
    this.currentState = EnemyState.IDLE;
    this.previousState = EnemyState.IDLE;
    this.stateHistory = [];
  }

  /**
   * Destroy state machine (clean up)
   */
  destroy(): void {
    // Clear any pending timers
    if (this.stateTimer) {
      this.stateTimer.remove();
      this.stateTimer = undefined;
    }

    // Clear callbacks
    this.onStateChangeCallbacks.clear();
    this.onStateExitCallbacks.clear();
  }
}
