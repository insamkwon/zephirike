import Phaser from 'phaser';

export class GoldCoin extends Phaser.GameObjects.Container {
  private value: number;
  private isMagneted: boolean = false;
  private coinSprite: Phaser.GameObjects.Image;
  private glowGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    super(scene, x, y);

    this.value = value;

    // Glow effect behind coin
    this.glowGraphics = scene.add.graphics();
    this.glowGraphics.fillStyle(0xFFD700, 0.25);
    this.glowGraphics.fillCircle(0, 0, 12);
    this.glowGraphics.fillStyle(0xFFD700, 0.1);
    this.glowGraphics.fillCircle(0, 0, 18);
    this.add(this.glowGraphics);

    // Coin sprite (bigger for visibility)
    this.coinSprite = scene.add.image(0, 0, 'gold_coin');
    this.coinSprite.setDisplaySize(20, 20);
    this.add(this.coinSprite);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(20, 20);
    body.setOffset(-10, -10);

    // Spawn: pop out with arc trajectory
    this.setScale(0);
    const spawnAngle = Math.random() * Math.PI * 2;
    const spawnDist = 15 + Math.random() * 25;
    const targetX = x + Math.cos(spawnAngle) * spawnDist;
    const targetY = y + Math.sin(spawnAngle) * spawnDist;

    // Arc up then settle
    scene.tweens.add({
      targets: this,
      x: targetX,
      y: targetY - 20, // arc up
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => {
        // Fall down and settle
        scene.tweens.add({
          targets: this,
          y: targetY,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: Phaser.Math.Easing.Bounce.Out
        });
      }
    });

    // Floating bob animation (delayed to start after spawn)
    scene.time.delayedCall(400, () => {
      if (!this.active) return;
      scene.tweens.add({
        targets: this,
        y: '-=4',
        duration: 600 + Math.random() * 200,
        yoyo: true,
        repeat: -1,
        ease: Phaser.Math.Easing.Sine.InOut
      });
    });

    // Glow pulse
    scene.tweens.add({
      targets: this.glowGraphics,
      alpha: 0.4,
      duration: 500 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut
    });

    // Coin rotation simulation (squash/stretch)
    scene.tweens.add({
      targets: this.coinSprite,
      scaleX: 0.3,
      duration: 400 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: Phaser.Math.Easing.Sine.InOut,
      delay: Math.random() * 400
    });
  }

  getValue(): number {
    return this.value;
  }

  updateCoin(playerX: number, playerY: number, magnetRadius: number): boolean {
    if (!this.active) return false;

    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);

    if (distance < magnetRadius) {
      this.isMagneted = true;
    }

    if (this.isMagneted) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
      // Accelerate more aggressively as it gets closer
      const speed = Math.min(500, 180 + (magnetRadius - distance) * 4);
      body.setVelocity(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      );

      // Scale down as it approaches (sucked in feel)
      if (distance < 40) {
        const shrink = distance / 40;
        this.setScale(Math.max(0.3, shrink));
      }
    }

    // Collected when very close
    if (distance < 24) {
      this.createCollectEffect();
      return true;
    }

    return false;
  }

  private createCollectEffect(): void {
    const scene = this.scene;

    // Sparkle particles at collection point
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const sparkle = scene.add.graphics();
      sparkle.fillStyle(0xFFD700, 1);
      sparkle.fillCircle(0, 0, 2);
      sparkle.setPosition(this.x, this.y);
      sparkle.setDepth(this.depth + 1);

      scene.tweens.add({
        targets: sparkle,
        x: this.x + Math.cos(angle) * 20,
        y: this.y + Math.sin(angle) * 20,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 250,
        ease: Phaser.Math.Easing.Quadratic.Out,
        onComplete: () => sparkle.destroy()
      });
    }

    // +Gold floating text
    const floatText = scene.add.text(this.x, this.y, `+${this.value}`, {
      fontSize: '14px',
      color: '#FFD700',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    });
    floatText.setOrigin(0.5);
    floatText.setDepth(this.depth + 1);

    scene.tweens.add({
      targets: floatText,
      y: this.y - 30,
      alpha: 0,
      duration: 500,
      ease: Phaser.Math.Easing.Quadratic.Out,
      onComplete: () => floatText.destroy()
    });
  }
}
