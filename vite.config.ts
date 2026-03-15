import { defineConfig } from 'vite';

export default defineConfig({
  base: '/zephirike/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    mock: {
      'phaser': {
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
            setSize(w: number, h: number) { this.width = w; this.height = h; return this; }
            setDepth(depth: number) { this.depth = depth; return this; }
            setScrollFactor(x: number, y?: number) { this.scrollFactorX = x; this.scrollFactorY = y ?? x; return this; }
            destroy() { this.active = false; }
            getData(key: string) { return this[key]; }
            setData(key: string, value: any) { this[key] = value; return this; }
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
      }
    }
  }
});
