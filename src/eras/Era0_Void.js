import * as THREE from 'three';

/**
 * Era 0 — THE VOID
 * True 3D Volumetric Environment. No 2D screens.
 * Absolute darkness with deep scattered ancient dust.
 */
export class Era0_Void {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;
    this.group   = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this._buildVolumetricDust();
  }

  _buildVolumetricDust() {
    // Optimized 3D particle cloud filling the scene (reduced from 30k to 5k for GPU performance)
    const count = 5000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const baseColor = new THREE.Color(0xffd700); // Bright Gold/Void accent

    for (let i = 0; i < count; i++) {
      // Distribute points in a massive sphere but denser at center
      const r = 200 * Math.pow(Math.random(), 2.0) + 10;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3]     = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      positions[i * 3 + 2] = Math.cos(phi) * r;
      
      sizes[i] = Math.random();

      // Subtle color variation
      const c = baseColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.5);
      colors[i*3] = c.r;
      colors[i*3+1] = c.g;
      colors[i*3+2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Using standard PointsMaterial guarantees it renders perfectly on all GPUs
    // without risking custom shaders compiling into a single black dot on certain laptops.
    const mat = new THREE.PointsMaterial({
      size: 8.0, // Massively increased size so it is undeniably visible from far away
      vertexColors: true,
      transparent: true,
      opacity: 0.8, // High base opacity so it's not pitch black
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.dust = new THREE.Points(geo, mat);
    this.group.add(this.dust);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 20, 150),
      new THREE.Vector3(30, 0, 80),
      new THREE.Vector3(0, 0, 40),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.dust.material.opacity = t * 0.8;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const startOpacity = this.dust.material.opacity;
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.dust.material.opacity = startOpacity * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else this.group.visible = false;
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    // Pull the dust in towards the center as we approach singularity
    const scale = 1.0 - t * 0.5;
    this.dust.scale.setScalar(scale);
  }

  update(time) {
    if (!this.visible) return;
    this.dust.rotation.y = time * 0.05; // Standard rotation since vertex shader is gone
  }
}
