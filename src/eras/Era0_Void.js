import * as THREE from 'three';

/**
 * Era 0 — THE VOID
 * True 3D Volumetric Environment. Dense golden dust fills the camera's view.
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
    // Dense particle cloud: camera starts at Z=80, so we fill Z range -20..140
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Fill the space directly visible to the camera
      positions[i * 3]     = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 2] = Math.random() * 160 - 20;

      // Gold/amber particles with brightness variation
      const bright = 0.5 + Math.random() * 0.5;
      colors[i * 3]     = bright * 1.0;
      colors[i * 3 + 1] = bright * 0.78;
      colors[i * 3 + 2] = bright * 0.1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));

    // sizeAttenuation: false = guaranteed pixel size regardless of camera distance
    const mat = new THREE.PointsMaterial({
      size: 3.0,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: false,
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

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
    this.dust.material.opacity = 1.0; // immediately fully visible
  }

  hide(duration = 0.6) {
    this.visible = false;
    this.group.visible = false;
  }

  onScrollT(t) {
    const scale = 1.0 - t * 0.4;
    this.dust.scale.setScalar(scale);
  }

  update(time) {
    if (!this.visible) return;
    this.dust.rotation.y = time * 0.02;
    this.dust.rotation.x = Math.sin(time * 0.01) * 0.05;
  }
}
