import { HitCallback, HitCallbackFilter, HitEvent } from '../types/GameTypes';

/**
 * HitCallbackEntry - Internal structure for storing registered callbacks
 */
interface HitCallbackEntry {
  callback: HitCallback;
  filter?: HitCallbackFilter;
  id: string;
  priority: number;  // Higher priority callbacks run first
  once: boolean;     // If true, callback is removed after first execution
}

/**
 * HitCallbackManager - Manages hit event callbacks for combat feedback
 *
 * This class provides a flexible system for registering and executing callbacks
 * when damage is dealt to enemies. It supports:
 * - Priority-based callback execution
 * - Optional filtering by damage type, amount, critical hits
 * - One-time callbacks that auto-remove after execution
 * - Easy registration/unregistration of callbacks
 *
 * Example usage:
 * ```typescript
 * const manager = new HitCallbackManager();
 *
 * // Register a callback for visual feedback
 * manager.register((event) => {
 *   console.log(`Hit for ${event.damage} damage!`);
 * }, { priority: 10 });
 *
 * // Register a callback that only responds to projectile hits
 * manager.register(
 *   (event) => spawnParticles(event.targetX, event.targetY),
 *   { filter: { damageType: ['projectile'] } }
 * );
 *
 * // Trigger all callbacks
 * manager.emitHitEvent({
 *   damage: 25,
 *   targetX: 100,
 *   targetY: 200,
 *   // ... other fields
 * });
 * ```
 */
export class HitCallbackManager {
  private callbacks: Map<string, HitCallbackEntry> = new Map();
  private nextId: number = 0;
  private static instance: HitCallbackManager | null = null;

  constructor() {
    // Empty constructor - instance pattern optional
  }

  /**
   * Get or create the singleton instance of HitCallbackManager
   */
  static getInstance(): HitCallbackManager {
    if (!HitCallbackManager.instance) {
      HitCallbackManager.instance = new HitCallbackManager();
    }
    return HitCallbackManager.instance;
  }

  /**
   * Register a hit callback
   *
   * @param callback - Function to call when a hit event occurs
   * @param options - Optional configuration (filter, priority, once)
   * @returns A function that can be called to unregister the callback
   */
  register(
    callback: HitCallback,
    options?: {
      filter?: HitCallbackFilter;
      priority?: number;
      once?: boolean;
    }
  ): () => void {
    const id = `callback_${this.nextId++}`;
    const entry: HitCallbackEntry = {
      id,
      callback,
      filter: options?.filter,
      priority: options?.priority ?? 0,
      once: options?.once ?? false
    };

    this.callbacks.set(id, entry);

    // Return unregister function
    return () => this.unregister(id);
  }

  /**
   * Unregister a callback by ID
   *
   * @param id - Callback ID to unregister
   * @returns true if callback was found and removed, false otherwise
   */
  unregister(id: string): boolean {
    return this.callbacks.delete(id);
  }

  /**
   * Unregister all callbacks
   */
  unregisterAll(): void {
    this.callbacks.clear();
  }

  /**
   * Emit a hit event to all registered callbacks
   *
   * Callbacks are executed in priority order (highest first).
   * Callbacks that don't match the filter are skipped.
   * One-time callbacks are removed after execution.
   *
   * @param event - Hit event data
   */
  emitHitEvent(event: HitEvent): void {
    // Get all callbacks and sort by priority (descending)
    const entries = Array.from(this.callbacks.entries())
      .sort((a, b) => b[1].priority - a[1].priority);

    const toRemove: string[] = [];

    for (const [id, entry] of entries) {
      // Check if callback matches filter
      if (entry.filter && !this.matchesFilter(event, entry.filter)) {
        continue;
      }

      // Execute callback
      try {
        entry.callback(event);
      } catch (error) {
        console.error(`Error in hit callback ${id}:`, error);
      }

      // Mark one-time callbacks for removal
      if (entry.once) {
        toRemove.push(id);
      }
    }

    // Remove one-time callbacks
    for (const id of toRemove) {
      this.callbacks.delete(id);
    }
  }

  /**
   * Check if a hit event matches a filter
   */
  private matchesFilter(event: HitEvent, filter: HitCallbackFilter): boolean {
    // Check damage type filter
    if (filter.damageType && !filter.damageType.includes(event.damageType)) {
      return false;
    }

    // Check minimum damage filter
    if (filter.minDamage !== undefined && event.damage < filter.minDamage) {
      return false;
    }

    // Check maximum damage filter
    if (filter.maxDamage !== undefined && event.damage > filter.maxDamage) {
      return false;
    }

    // Check critical hit filter
    if (filter.isCritical !== undefined && event.isCritical !== filter.isCritical) {
      return false;
    }

    return true;
  }

  /**
   * Get the number of registered callbacks
   */
  getCallbackCount(): number {
    return this.callbacks.size;
  }

  /**
   * Check if any callbacks are registered
   */
  hasCallbacks(): boolean {
    return this.callbacks.size > 0;
  }

  /**
   * Clear all callbacks and reset the manager
   */
  destroy(): void {
    this.unregisterAll();
    this.nextId = 0;
  }
}
