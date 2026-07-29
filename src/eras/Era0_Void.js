import * as THREE from 'three';

/**
 * Era 0 — THE VOID
 * Particles clustered near the center of view — a dense core of ancient dust
 * that converges even tighter as you scroll toward the Big Bang.
 */
export class Era0_Void {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;
    this.group   = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this._buildCenteredDust();
  }

  _makeRoundSprite() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,    'rgba(200,220,255,1)');
    g.addColorStop(0.3,  'rgba(140,170,255,0.7)');
    g.addColorStop(0.7,  'rgba(80,100,200,0.2)');
    g.addColorStop(1.0,  'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  _buildCenteredDust() {
    const count = 6000;
    this._posArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Gaussian cluster centered at origin — dense core, thin halo
      // Box-Muller transform for Gaussian distribution
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      const mag = Math.sqrt(-2.0 * Math.log(u1));
      const gx  = mag * Math.cos(2 * Math.PI * u2);
      const gy  = mag * Math.sin(2 * Math.PI * u2);
      const gz  = (Math.sqrt(-2.0 * Math.log(Math.max(1e-6, Math.random()))) *
                   Math.cos(2 * Math.PI * Math.random()));

      // Spread: sigma=2 so particles form an incredibly tight speck in the middle
      // Camera is at Z=80, cluster is around Z=20.
      const sigma = 2;
      this._posArray[i * 3]     = gx * sigma;
      this._posArray[i * 3 + 1] = gy * sigma;
      this._posArray[i * 3 + 2] = gz * sigma * 0.7 + 20; // Z offset toward camera
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this._posArray.slice(), 3));

    this.dust = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.08, // Very small particles
      color: 0x444444, // Subtle grey so black dominates
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      map: this._makeRoundSprite(),
      alphaTest: 0.01,
    }));

    this.group.add(this.dust);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 80),
      new THREE.Vector3(10, 0, 40),
      new THREE.Vector3(0, 0, 10),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show() {
    this.visible = true;
    this.group.visible = true;
    this.dust.material.opacity = 0.85;
  }

  hide() {
    this.visible = false;
    this.group.visible = false;
  }

  onScrollT(t) {
    // Particles converge toward (0,0,0) — becoming the singularity
    const pos = this.dust.geometry.attributes.position;
    const src = this._posArray;
    const ease = t * t * t; // cubic ease = dramatic acceleration near end

    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        src[i * 3]     * (1 - ease),
        src[i * 3 + 1] * (1 - ease),
        src[i * 3 + 2] * (1 - ease)
      );
    }
    pos.needsUpdate = true;
    this.dust.material.opacity = 0.85 * (0.3 + (1 - ease) * 0.7);
  }

  update(time) {
    if (!this.visible) return;
    this.dust.rotation.y = time * 0.01;
    this.dust.rotation.x = Math.sin(time * 0.007) * 0.03;
  }
}
