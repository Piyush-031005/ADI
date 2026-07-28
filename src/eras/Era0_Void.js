import * as THREE from 'three';

/**
 * Era 0 — THE VOID
 * Black space with fine round silver dust that CONVERGES toward the center
 * as the user scrolls — visually "collecting" into a singularity.
 */
export class Era0_Void {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;
    this.group   = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this._buildRoundDust();
    this._originalPositions = null;
  }

  _makeRoundSprite() {
    // Round soft-glow sprite texture — guarantees no Minecraft squares
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,    'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(200,220,255,0.85)');
    g.addColorStop(0.6,  'rgba(140,170,255,0.3)');
    g.addColorStop(1.0,  'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  _buildRoundDust() {
    const count = 5000;
    this._posArray = new Float32Array(count * 3); // store originals for convergence

    for (let i = 0; i < count; i++) {
      // Spherical distribution — void fills all around the camera
      const r = 20 + Math.pow(Math.random(), 0.5) * 130;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);

      this._posArray[i * 3]     = Math.sin(phi) * Math.cos(theta) * r;
      this._posArray[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      this._posArray[i * 3 + 2] = Math.cos(phi) * r;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this._posArray.slice(), 3));

    const mat = new THREE.PointsMaterial({
      size: 1.8,
      color: 0xc8d8ff,          // cool silver-blue, not rainbow
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      map: this._makeRoundSprite(),
      alphaTest: 0.01,
    });

    this.dust = new THREE.Points(geo, mat);
    this.group.add(this.dust);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 80),
      new THREE.Vector3(15, 0, 40),
      new THREE.Vector3(0, 0, 10),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show() {
    this.visible = true;
    this.group.visible = true;
    this.dust.material.opacity = 0.75;
  }

  hide() {
    this.visible = false;
    this.group.visible = false;
  }

  onScrollT(t) {
    // CONVERGENCE: pull every particle toward (0,0,0) based on scroll
    // At t=0: all particles at original positions
    // At t=1: all particles collapsed toward origin (becoming the singularity!)
    const pos = this.dust.geometry.attributes.position;
    const src = this._posArray;
    const ease = t * t; // quadratic ease-in for dramatic effect

    for (let i = 0; i < pos.count; i++) {
      const ox = src[i * 3];
      const oy = src[i * 3 + 1];
      const oz = src[i * 3 + 2];
      pos.setXYZ(i, ox * (1 - ease), oy * (1 - ease), oz * (1 - ease));
    }
    pos.needsUpdate = true;

    // Fade opacity slightly as they collapse
    this.dust.material.opacity = 0.75 * (1 - ease * 0.6);
  }

  update(time) {
    if (!this.visible) return;
    // Slow rotation gives the Void a breathing, living quality
    this.dust.rotation.y = time * 0.012;
    this.dust.rotation.x = Math.sin(time * 0.008) * 0.04;
  }
}
