// Setup file for Vitest to handle Phaser and other dependencies

// Mock Phaser for unit tests
global.Phaser = {
  GameObjects: {
    Container: class MockContainer {
      constructor(scene: any, x: number, y: number) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.alpha = 1;
        this.scale = 1;
      }
      add(obj: any) { return this; }
      setSize(w: number, h: number) { this.width = w; this.height = h; }
      setDepth(depth: number) { this.depth = depth; }
      setScrollFactor(x: number, y?: number) { this.scrollFactorX = x; this.scrollFactorY = y ?? x; }
      destroy() { this.active = false; }
      getData(key: string) { return this[key]; }
      setData(key: string, value: any) { this[key] = value; }
    },
    Sprite: class MockSprite {},
    Graphics: class MockGraphics {
      clear() { return this; }
      lineStyle() { return this; }
      fillStyle() { return this; }
      beginPath() { return this; }
      moveTo() { return this; }
      lineTo() { return this; }
      strokePath() { return this; }
      fillRect() { return this; }
      strokeRect() { return this; }
      strokeCircle() { return this; }
    }
  },
  Physics: {
    Arcade: {
      Body: class MockBody {
        velocity = { x: 0, y: 0 };
        setSize() { return this; }
        setCollideWorldBounds() { return this; }
        setDrag() { return this; }
        setVelocity(x?: number, y?: number) {
          if (x !== undefined) this.velocity.x = x;
          if (y !== undefined) this.velocity.y = y;
          return this;
        }
        setVelocityX(v: number) { this.velocity.x = v; return this; }
        setVelocityY(v: number) { this.velocity.y = v; return this; }
        setImmovable() { return this; }
      }
    }
  },
  Scene: class MockScene {},
  BlendModes: {
    ADD: 1,
    NORMAL: 0
  },
  Utils: {
    Objects: {
      GetValue: (obj: any, key: string, defaultValue: any) => {
        const keys = key.split('.');
        let current = obj;
        for (const k of keys) {
          if (current == null) return defaultValue;
          current = current[k];
        }
        return current ?? defaultValue;
      }
    }
  },
  Math: {
    Distance: {
      Between: (x1: number, y1: number, x2: number, y2: number) => {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      }
    },
    Easing: {
      Quadratic: {
        Out: (x: number) => x * (2 - x)
      },
      Back: {
        Out: (x: number) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
        }
      }
    },
    RadToDeg: (radians: number) => radians * (180 / Math.PI)
  }
};

// Mock window and canvas for tests
global.HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: () => {},
  clearRect: () => {},
  getImageData: () => ({ data: [] }),
  putImageData: () => {},
  createImageData: () => [],
  setTransform: () => {},
  drawImage: () => {},
  save: () => {},
  fillText: () => {},
  restore: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  closePath: () => {},
  stroke: () => {},
  translate: () => {},
  scale: () => {},
  rotate: () => {},
  arc: () => {},
  fill: () => {},
  measureText: () => ({ width: 0 }),
  transform: () => {},
  rect: () => {},
  clip: () => {},
});

// Mock performance.now
global.performance.now = () => Date.now();

// Helper function to create a test scene
export function createTestScene() {
  const mockScene: any = {
    add: {
      sprite: () => {
        const sprite = {
          setOrigin: (x: number) => {
            sprite.origin = x;
            return sprite;
          },
          setDisplaySize: (w: number, h: number) => {
            sprite.displayWidth = w;
            sprite.displayHeight = h;
            return sprite;
          },
          setAngle: (angle: number) => {
            sprite.angle = angle;
            return sprite;
          }
        };
        return sprite;
      },
      graphics: () => ({ clear: () => ({}), lineStyle: () => ({}), fillStyle: () => ({}) }),
      group: () => ({ add: () => ({}) }),
      text: () => ({ setOrigin: () => ({ setScrollFactor: () => ({ setDepth: () => ({}) }) }) }),
      rectangle: () => ({}),
      circle: () => ({}),
      existing: () => ({})
    },
    physics: {
      add: {
        existing: (obj: any) => {
          obj.body = {
            velocity: { x: 0, y: 0 },
            setSize: (w: number, h: number) => { obj.body.width = w; obj.body.height = h; return obj.body; },
            setCollideWorldBounds: () => obj.body,
            setDrag: (x: number, y: number) => obj.body,
            setVelocity: (vx?: number, vy?: number) => {
              if (vx !== undefined) obj.body.velocity.x = vx;
              if (vy !== undefined) obj.body.velocity.y = vy;
              return obj.body;
            }
          };
          return obj;
        }
      }
    },
    time: {
      now: Date.now(),
      delayedCall: () => ({})
    },
    tweens: {
      add: () => ({})
    },
    input: {
      keyboard: {
        addKey: () => ({ on: () => {} })
      }
    },
    cameras: {
      main: {
        width: 800,
        height: 600
      }
    },
    sys: {
      displays: {
        orientation: {
          match: () => true
        }
      }
    }
  };

  // Add event emitter functionality
  mockScene.events = {
    _listeners: {} as any,
    on(event: string, callback: Function) {
      if (!this._listeners[event]) {
        this._listeners[event] = [];
      }
      this._listeners[event].push(callback);
      return mockScene.events;
    },
    emit(event: string, ...args: any[]) {
      if (this._listeners[event]) {
        this._listeners[event].forEach((callback: Function) => callback(...args));
      }
    },
    removeListener(event: string, callback: Function) {
      if (this._listeners[event]) {
        this._listeners[event] = this._listeners[event].filter((cb: Function) => cb !== callback);
      }
    }
  };

  return mockScene;
}

console.log('✓ Test environment setup complete');
