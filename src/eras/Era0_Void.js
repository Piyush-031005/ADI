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
    geo.setAttribute('aSize',    new THREE.Float32BufferAttribute(sizes, 1));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        attribute float aSize;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = color;
          vec3 p = position;
          // Very slow orbit
          float angle = uTime * 0.05 / (length(p) * 0.05 + 1.0);
          float s = sin(angle);
          float c = cos(angle);
          p.xz = mat2(c, -s, s, c) * p.xz;
          
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          // Massively increased point size to compensate for lower particle count
          gl_PointSize = (120.0 * aSize) / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
          
          // Fade edges
          vAlpha = smoothstep(200.0, 50.0, length(position));
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          // Circular particle
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if (ll > 0.5) discard;
          
          float glow = (0.5 - ll) * 2.0;
          // Drastically boosted brightness and opacity multiplier so the Void pops!
          gl_FragColor = vec4(vColor * 1.8, glow * vAlpha * uOpacity * 2.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
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
      this.dust.material.uniforms.uOpacity.value = t;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const startOpacity = this.dust.material.uniforms.uOpacity.value;
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.dust.material.uniforms.uOpacity.value = startOpacity * (1 - t);
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
    this.dust.material.uniforms.uTime.value = time;
  }
}
