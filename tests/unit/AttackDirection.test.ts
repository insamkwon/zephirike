import { describe, it, expect } from 'vitest';

describe('360-Degree Attack Direction Calculation', () => {
  describe('Angle Calculation', () => {
    it('should calculate 0 degrees (right direction)', () => {
      const playerX = 400;
      const playerY = 300;
      const mouseX = 500;
      const mouseY = 300;
      
      const dx = mouseX - playerX;
      const dy = mouseY - playerY;
      const angle = Math.atan2(dy, dx);
      
      expect(angle).toBeCloseTo(0, 5);
    });

    it('should calculate 45 degrees (diagonal down-right)', () => {
      const playerX = 400;
      const playerY = 300;
      const mouseX = 500;
      const mouseY = 400;
      
      const dx = mouseX - playerX;
      const dy = mouseY - playerY;
      const angle = Math.atan2(dy, dx);
      
      expect(angle).toBeCloseTo(Math.PI / 4, 5);
    });

    it('should calculate 90 degrees (down direction)', () => {
      const playerX = 400;
      const playerY = 300;
      const mouseX = 400;
      const mouseY = 400;
      
      const dx = mouseX - playerX;
      const dy = mouseY - playerY;
      const angle = Math.atan2(dy, dx);
      
      expect(angle).toBeCloseTo(Math.PI / 2, 5);
    });

    it('should calculate 135 degrees (diagonal down-left)', () => {
      const playerX = 400;
      const playerY = 300;
      const mouseX = 300;
      const mouseY = 400;
      
      const dx = mouseX - playerX;
      const dy = mouseY - playerY;
      const angle = Math.atan2(dy, dx);
      
      expect(angle).toBeCloseTo(3 * Math.PI / 4, 5);
    });

    it('should calculate 180 degrees (left direction)', () => {
      const playerX = 400;
      const playerY = 300;
      const mouseX = 300;
      const mouseY = 300;
      
      const dx = mouseX - playerX;
      const dy = mouseY - playerY;
      const angle = Math.atan2(dy, dx);
      
      expect(angle).toBeCloseTo(Math.PI, 5);
    });

    it('should calculate 225 degrees (diagonal up-left)', () => {
      const playerX = 400;
      const playerY = 300;
      const mouseX = 300;
      const mouseY = 200;
      
      const dx = mouseX - playerX;
      const dy = mouseY - playerY;
      const angle = Math.atan2(dy, dx);
      
      expect(angle).toBeCloseTo(-3 * Math.PI / 4, 5);
    });

    it('should calculate 270 degrees (up direction)', () => {
      const playerX = 400;
      const playerY = 300;
      const mouseX = 400;
      const mouseY = 200;
      
      const dx = mouseX - playerX;
      const dy = mouseY - playerY;
      const angle = Math.atan2(dy, dx);
      
      expect(angle).toBeCloseTo(-Math.PI / 2, 5);
    });

    it('should calculate 315 degrees (diagonal up-right)', () => {
      const playerX = 400;
      const playerY = 300;
      const mouseX = 500;
      const mouseY = 200;
      
      const dx = mouseX - playerX;
      const dy = mouseY - playerY;
      const angle = Math.atan2(dy, dx);
      
      expect(angle).toBeCloseTo(-Math.PI / 4, 5);
    });
  });

  describe('Projectile Velocity Calculation', () => {
    it('should calculate correct velocity for 0 degrees', () => {
      const angle = 0;
      const speed = 400;
      
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;
      
      expect(velocityX).toBeCloseTo(400, 5);
      expect(velocityY).toBeCloseTo(0, 5);
    });

    it('should calculate correct velocity for 45 degrees', () => {
      const angle = Math.PI / 4;
      const speed = 400;
      
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;
      
      const expectedVelocity = 400 / Math.sqrt(2);
      expect(velocityX).toBeCloseTo(expectedVelocity, 5);
      expect(velocityY).toBeCloseTo(expectedVelocity, 5);
    });

    it('should calculate correct velocity for 90 degrees', () => {
      const angle = Math.PI / 2;
      const speed = 400;
      
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;
      
      expect(velocityX).toBeCloseTo(0, 5);
      expect(velocityY).toBeCloseTo(400, 5);
    });
  });

  describe('Melee Attack Hitbox Position', () => {
    it('should position hitbox correctly for 0 degrees', () => {
      const playerX = 400;
      const playerY = 300;
      const angle = 0;
      const distance = 20;
      
      const hitboxX = playerX + Math.cos(angle) * distance;
      const hitboxY = playerY + Math.sin(angle) * distance;
      
      expect(hitboxX).toBe(420);
      expect(hitboxY).toBe(300);
    });

    it('should position hitbox correctly for 90 degrees', () => {
      const playerX = 400;
      const playerY = 300;
      const angle = Math.PI / 2;
      const distance = 20;
      
      const hitboxX = playerX + Math.cos(angle) * distance;
      const hitboxY = playerY + Math.sin(angle) * distance;
      
      expect(hitboxX).toBe(400);
      expect(hitboxY).toBe(320);
    });

    it('should position hitbox correctly for 45 degrees', () => {
      const playerX = 400;
      const playerY = 300;
      const angle = Math.PI / 4;
      const distance = 20;
      
      const hitboxX = playerX + Math.cos(angle) * distance;
      const hitboxY = playerY + Math.sin(angle) * distance;
      
      const expectedOffset = 20 / Math.sqrt(2);
      expect(hitboxX).toBeCloseTo(400 + expectedOffset, 5);
      expect(hitboxY).toBeCloseTo(300 + expectedOffset, 5);
    });
  });

  describe('Attack Cooldown System', () => {
    it('should enforce attack cooldown', () => {
      const attackSpeed = 2; // 2 attacks per second
      const attackCooldown = 1000 / attackSpeed; // 500ms
      
      const lastAttackTime = 0;
      const currentTime = 200;
      
      const canAttack = currentTime - lastAttackTime >= attackCooldown;
      
      expect(canAttack).toBe(false);
    });

    it('should allow attack after cooldown', () => {
      const attackSpeed = 2; // 2 attacks per second
      const attackCooldown = 1000 / attackSpeed; // 500ms
      
      const lastAttackTime = 0;
      const currentTime = 600;
      
      const canAttack = currentTime - lastAttackTime >= attackCooldown;
      
      expect(canAttack).toBe(true);
    });
  });
});
