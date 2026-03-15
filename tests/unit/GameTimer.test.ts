import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameTimer, TimerEventData } from '../../src/systems/GameTimer';
import Phaser from 'phaser';

// Mock Phaser Scene
const createMockScene = () => {
  const mockScene = {
    time: {
      now: 0,
      addEvent: vi.fn()
    },
    events: {
      emit: vi.fn()
    }
  } as any;

  return mockScene;
};

describe('GameTimer', () => {
  let mockScene: any;
  let timer: GameTimer;

  beforeEach(() => {
    mockScene = createMockScene();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      timer = new GameTimer(mockScene);

      expect(timer).toBeInstanceOf(GameTimer);
      expect(timer.isActive()).toBe(false);
    });

    it('should initialize with custom config', () => {
      const customConfig = {
        updateInterval: 500,
        enableMilestones: true,
        milestoneInterval: 60
      };

      timer = new GameTimer(mockScene, customConfig);

      expect(timer).toBeInstanceOf(GameTimer);
    });

    it('should have default update interval of 1000ms', () => {
      timer = new GameTimer(mockScene);
      timer.start();

      expect(mockScene.time.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          delay: 1000,
          loop: true
        })
      );
    });
  });

  describe('Timer Lifecycle', () => {
    it('should start the timer', () => {
      timer = new GameTimer(mockScene);
      timer.start();

      expect(timer.isActive()).toBe(true);
      expect(mockScene.time.addEvent).toHaveBeenCalled();
    });

    it('should not start timer if already running', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      const firstCallCount = mockScene.time.addEvent.mock.calls.length;

      timer.start();
      const secondCallCount = mockScene.time.addEvent.mock.calls.length;

      expect(firstCallCount).toBe(secondCallCount);
    });

    it('should stop the timer', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.stop();

      expect(timer.isActive()).toBe(false);
    });

    it('should not stop timer if not running', () => {
      timer = new GameTimer(mockScene);
      timer.stop();

      expect(timer.isActive()).toBe(false);
    });

    it('should pause the timer', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.pause();

      expect(timer.isTimerPaused()).toBe(true);
    });

    it('should resume the timer', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.pause();
      timer.resume();

      expect(timer.isTimerPaused()).toBe(false);
    });

    it('should not pause if already paused', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.pause();
      const firstEmitCallCount = mockScene.events.emit.mock.calls.length;

      timer.pause();
      const secondEmitCallCount = mockScene.events.emit.mock.calls.length;

      expect(firstEmitCallCount).toBe(secondEmitCallCount);
    });

    it('should not resume if not paused', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      const emitCallCountBeforeResume = mockScene.events.emit.mock.calls.length;

      timer.resume();
      const emitCallCountAfterResume = mockScene.events.emit.mock.calls.length;

      expect(emitCallCountBeforeResume).toBe(emitCallCountAfterResume);
    });
  });

  describe('Time Tracking', () => {
    it('should return elapsed time in milliseconds', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 5000ms
      mockScene.time.now = 5000;

      const elapsed = timer.getElapsedTime();

      expect(elapsed).toBe(5000);
    });

    it('should track time correctly with pauses', () => {
      mockScene.time.now = 0;
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 5000ms
      mockScene.time.now = 5000;

      // Pause at 5000ms
      timer.pause();

      // Advance time while paused
      mockScene.time.now = 10000;

      // Resume
      timer.resume();

      // Advance time to 15000ms (5000ms more)
      mockScene.time.now = 15000;

      const elapsed = timer.getElapsedTime();

      // Should be 5000ms (before pause) + 5000ms (after resume) = 10000ms
      expect(elapsed).toBe(10000);
    });

    it('should return zero when not started', () => {
      timer = new GameTimer(mockScene);

      const elapsed = timer.getElapsedTime();

      expect(elapsed).toBe(0);
    });

    it('should return zero when stopped', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.stop();

      const elapsed = timer.getElapsedTime();

      expect(elapsed).toBe(0);
    });

    it('should return frozen time when paused', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 10000ms
      mockScene.time.now = 10000;
      let elapsed = timer.getElapsedTime();
      expect(elapsed).toBe(10000);

      // Pause
      timer.pause();

      // Advance time while paused
      mockScene.time.now = 20000;
      elapsed = timer.getElapsedTime();

      // Time should be frozen at pause point
      expect(elapsed).toBe(10000);
    });
  });

  describe('Time Formatting', () => {
    it('should format time as MM:SS', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 65000ms (1 minute 5 seconds)
      mockScene.time.now = 65000;

      const formatted = timer.getFormattedTime();

      expect(formatted).toBe('01:05');
    });

    it('should pad single digit seconds', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 5000ms (5 seconds)
      mockScene.time.now = 5000;

      const formatted = timer.getFormattedTime();

      expect(formatted).toBe('00:05');
    });

    it('should pad single digit minutes', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 65000ms (1 minute 5 seconds)
      mockScene.time.now = 65000;

      const formatted = timer.getFormattedTime();

      expect(formatted).toBe('01:05');
    });

    it('should handle times over 10 minutes', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 615000ms (10 minutes 15 seconds)
      mockScene.time.now = 615000;

      const formatted = timer.getFormattedTime();

      expect(formatted).toBe('10:15');
    });

    it('should handle zero time', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      const formatted = timer.getFormattedTime();

      expect(formatted).toBe('00:00');
    });
  });

  describe('Time Units', () => {
    it('should return total seconds', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 65000ms (1 minute 5 seconds = 65 seconds)
      mockScene.time.now = 65000;

      const seconds = timer.getTotalSeconds();

      expect(seconds).toBe(65);
    });

    it('should return total minutes', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 180000ms (3 minutes)
      mockScene.time.now = 180000;

      const minutes = timer.getTotalMinutes();

      expect(minutes).toBe(3);
    });

    it('should floor seconds correctly', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 59999ms (59.999 seconds)
      mockScene.time.now = 59999;

      const seconds = timer.getTotalSeconds();

      expect(seconds).toBe(59);
    });

    it('should floor minutes correctly', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 179999ms (2.999 minutes)
      mockScene.time.now = 179999;

      const minutes = timer.getTotalMinutes();

      expect(minutes).toBe(2);
    });
  });

  describe('Event Broadcasting', () => {
    it('should emit timer:update event', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time to 5000ms
      mockScene.time.now = 5000;

      // Simulate timer update callback
      const timerEvent = mockScene.time.addEvent.mock.calls[0][0];
      timerEvent.callback.call(timerEvent.callbackScope);

      expect(mockScene.events.emit).toHaveBeenCalledWith(
        'timer:update',
        expect.objectContaining({
          elapsedTime: 5000,
          formattedTime: '00:05',
          seconds: 5,
          minutes: 0
        })
      );
    });

    it('should emit timer:milestone event', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene, {
        milestoneInterval: 30
      });
      timer.start();

      // Advance time past the first milestone (30s)
      mockScene.time.now = 31000; // 31 seconds

      // Simulate timer update callback with correct scope
      const timerEvent = mockScene.time.addEvent.mock.calls[0][0];
      timerEvent.callback.call(timerEvent.callbackScope);

      expect(mockScene.events.emit).toHaveBeenCalledWith(
        'timer:milestone',
        expect.objectContaining({
          milestoneNumber: 1,
          milestoneTime: 30
        })
      );
    });

    it('should emit timer:pause event', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.pause();

      expect(mockScene.events.emit).toHaveBeenCalledWith(
        'timer:pause',
        expect.any(Object)
      );
    });

    it('should emit timer:resume event', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.pause();
      timer.resume();

      expect(mockScene.events.emit).toHaveBeenCalledWith(
        'timer:resume',
        expect.any(Object)
      );
    });

    it('should emit timer:stop event', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.stop();

      expect(mockScene.events.emit).toHaveBeenCalledWith(
        'timer:stop',
        expect.any(Object)
      );
    });

    it('should not emit events when timer is paused', () => {
      mockScene.time.now = 5000;
      timer = new GameTimer(mockScene);
      timer.start();
      timer.pause();

      // Simulate timer update callback while paused
      const timerEvent = mockScene.time.addEvent.mock.calls[0][0];
      timerEvent.callback.call(timerEvent.callbackScope);

      // Should not emit update event when paused
      expect(mockScene.events.emit).not.toHaveBeenCalledWith(
        'timer:update',
        expect.any(Object)
      );
    });
  });

  describe('Milestone System', () => {
    it('should track milestones at default 30 second intervals', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene);
      timer.start();

      // Advance time past two milestones (60s)
      mockScene.time.now = 61000; // 61 seconds

      // Simulate timer update callback
      const timerEvent = mockScene.time.addEvent.mock.calls[0][0];
      timerEvent.callback.call(timerEvent.callbackScope);

      // Should emit milestone event for 30s and 60s
      expect(mockScene.events.emit).toHaveBeenCalledWith(
        'timer:milestone',
        expect.objectContaining({
          milestoneNumber: 2,
          milestoneTime: 60
        })
      );
    });

    it('should use custom milestone interval', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene, {
        milestoneInterval: 60 // 60 second intervals
      });
      timer.start();

      // Advance time past two milestones (120s)
      mockScene.time.now = 121000; // 121 seconds

      // Simulate timer update callback
      const timerEvent = mockScene.time.addEvent.mock.calls[0][0];
      timerEvent.callback.call(timerEvent.callbackScope);

      expect(mockScene.events.emit).toHaveBeenCalledWith(
        'timer:milestone',
        expect.objectContaining({
          milestoneNumber: 2,
          milestoneTime: 120
        })
      );
    });

    it('should not emit milestones when disabled', () => {
      mockScene.time.now = 0; // Start at time 0
      timer = new GameTimer(mockScene, {
        enableMilestones: false
      });
      timer.start();

      // Advance time
      mockScene.time.now = 61000; // 61 seconds

      // Simulate timer update callback
      const timerEvent = mockScene.time.addEvent.mock.calls[0][0];
      timerEvent.callback.call(timerEvent.callbackScope);

      // Should not emit milestone event
      expect(mockScene.events.emit).not.toHaveBeenCalledWith(
        'timer:milestone',
        expect.any(Object)
      );
    });
  });

  describe('Timer Event Constants', () => {
    it('should have EVENT_UPDATE constant', () => {
      expect(GameTimer.EVENT_UPDATE).toBe('timer:update');
    });

    it('should have EVENT_MILESTONE constant', () => {
      expect(GameTimer.EVENT_MILESTONE).toBe('timer:milestone');
    });

    it('should have EVENT_PAUSE constant', () => {
      expect(GameTimer.EVENT_PAUSE).toBe('timer:pause');
    });

    it('should have EVENT_RESUME constant', () => {
      expect(GameTimer.EVENT_RESUME).toBe('timer:resume');
    });

    it('should have EVENT_STOP constant', () => {
      expect(GameTimer.EVENT_STOP).toBe('timer:stop');
    });
  });

  describe('Destroy', () => {
    it('should destroy the timer', () => {
      timer = new GameTimer(mockScene);
      timer.start();
      timer.destroy();

      expect(timer.isActive()).toBe(false);
    });
  });
});
