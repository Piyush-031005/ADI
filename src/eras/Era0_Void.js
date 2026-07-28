import * as THREE from 'three';

/**
 * Era 0 — THE VOID
 * Deep space: pure black with tiny, soft, barely-visible dust motes.
 * Inspired by real void imagery — NOT colorful, NOT many.
 * Also renders a 2D fiber/energy system on a canvas overlay for cinematic quality.
 */
export class Era0_Void {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;
    this.group   = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this._buildStarField();
    this._buildFiberCanvas();
  }

  _buildStarField() {
    // --- Tiny, barely-visible silver-white dust motes (real void feel) ---
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Fill camera-view box: camera at Z=80, looking toward Z=0
      positions[i * 3]     = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = Math.random() * 180 - 10;

      // Silver/white only — no rainbow, this is the VOID (empty space)
      const brightness = 0.15 + Math.random() * 0.6; // mostly dim, some bright
      const tint = Math.random() > 0.85 ? 0.85 : 1.0; // occasional slight blue tint
      colors[i * 3]     = brightness * tint;
      colors[i * 3 + 1] = brightness * tint;
      colors[i * 3 + 2] = brightness;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));

    // Use a circular sprite texture for round (non-square) particles
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0,    'rgba(255,255,255,1)');
    grd.addColorStop(0.3,  'rgba(200,220,255,0.8)');
    grd.addColorStop(1.0,  'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);

    const mat = new THREE.PointsMaterial({
      size: 0.8,              // Very small world-space size
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,  // Particles scale with distance (natural depth)
      map: texture,           // Round sprite — no Minecraft squares!
      alphaTest: 0.01,
    });

    this.dust = new THREE.Points(geo, mat);
    this.group.add(this.dust);
  }

  _buildFiberCanvas() {
    // 2D canvas overlay — SPECIMEN-style glowing fiber lines
    this.fiberCanvas = document.createElement('canvas');
    this.fiberCanvas.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      pointer-events: none;
      z-index: 2;
      opacity: 0;
      transition: opacity 1.5s ease;
    `;
    document.body.appendChild(this.fiberCanvas);
    this.fiberCtx = this.fiberCanvas.getContext('2d');
    this._resizeFiberCanvas();

    // Generate fibers
    this._fibers = [];
    this._initFibers();
    this._fiberTime = 0;

    window.addEventListener('resize', () => this._resizeFiberCanvas());
  }

  _resizeFiberCanvas() {
    this.fiberCanvas.width  = window.innerWidth;
    this.fiberCanvas.height = window.innerHeight;
    this._initFibers();
  }

  _initFibers() {
    this._fibers = [];
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const count = 120;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 80 + Math.random() * Math.min(cx, cy) * 0.6;
      const isRed = Math.random() < 0.35;

      this._fibers.push({
        angle,
        radius,
        cpOffset: (Math.random() - 0.5) * 200,
        speed: 0.2 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        isRed,
        lineWidth: 0.3 + Math.random() * 1.2,
        opacity: 0.04 + Math.random() * 0.18,
      });
    }
  }

  _drawFibers(time) {
    if (!this.fiberCtx) return;
    const ctx = this.fiberCtx;
    const W = this.fiberCanvas.width;
    const H = this.fiberCanvas.height;
    const cx = W / 2;
    const cy = H / 2;

    // Fade trail
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, W, H);

    for (const f of this._fibers) {
      const t = time * f.speed + f.phase;
      const angle = f.angle + Math.sin(t * 0.4) * 0.3;
      const r = f.radius + Math.sin(t * 0.7) * 30;

      const ex = cx + Math.cos(angle) * r;
      const ey = cy + Math.sin(angle) * r;

      // Control point for quadratic bezier
      const cpAngle = angle + f.cpOffset * 0.005;
      const cpR = r * 0.5;
      const cpx = cx + Math.cos(cpAngle) * cpR;
      const cpy = cy + Math.sin(cpAngle) * cpR;

      const color = f.isRed
        ? `rgba(220,60,60,${f.opacity})`
        : `rgba(80,140,255,${f.opacity})`;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      ctx.strokeStyle = color;
      ctx.lineWidth = f.lineWidth;
      ctx.stroke();
    }
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 80),
      new THREE.Vector3(15, 0, 40),
      new THREE.Vector3(0, 0, 10),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    this.dust.material.opacity = 0.9;
    if (this.fiberCanvas) this.fiberCanvas.style.opacity = '1';
  }

  hide(duration = 0.6) {
    this.visible = false;
    this.group.visible = false;
    if (this.fiberCanvas) this.fiberCanvas.style.opacity = '0';
    // Clear fiber canvas
    if (this.fiberCtx) {
      this.fiberCtx.clearRect(0, 0, this.fiberCanvas.width, this.fiberCanvas.height);
    }
  }

  onScrollT(t) {
    // Particles converge toward center as we approach Big Bang
    const scale = 1.0 - t * 0.4;
    this.dust.scale.setScalar(scale);
  }

  update(time) {
    if (!this.visible) return;
    this.dust.rotation.y = time * 0.015;
    this._fiberTime = time;
    this._drawFibers(time);
  }
}
