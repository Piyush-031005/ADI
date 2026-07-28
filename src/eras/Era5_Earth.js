import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 5 — EARTH (Award-Winning 4K Photorealistic Earth GLB Model)
 * Replaces old procedural shader with user-provided high-poly 4K earth.glb model.
 * Features realistic lighting, Moon system, and removed the sky blue ring as requested.
 */
export class Era5_Earth {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;
    this.group   = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);

    this.mixers = [];
    this._loadEarthModel();
    this._buildMoon();
    this._buildStarfield();

    // Lighting for 4K PBR Materials
    const ambient = new THREE.AmbientLight(0xffffff, 1.8);
    this.group.add(ambient);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 4.5);
    this.sunLight.position.set(50, 20, 30);
    this.group.add(this.sunLight);
  }

  _loadEarthModel() {
    const loader = new GLTFLoader();
    loader.load('/models/earth.glb', (gltf) => {
      this.earthModel = gltf.scene;
      
      // Auto-center and normalize scale
      const box = new THREE.Box3().setFromObject(this.earthModel);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = 5.0 / maxDim; // Normalize to 5 units sphere diameter
      this.earthModel.scale.setScalar(targetScale);

      this.earthModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.roughness = 0.4;
            child.material.metalness = 0.1;
            child.material.envMapIntensity = 2.0;
            child.material.needsUpdate = true;
          }
        }
      });

      this.group.add(this.earthModel);

      if (gltf.animations && gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.earthModel);
        gltf.animations.forEach(clip => mixer.clipAction(clip).play());
        this.mixers.push(mixer);
      }

      if (this.exp && this.exp.renderer && this.exp.camera) {
        this.exp.renderer.instance.compile(this.earthModel, this.exp.camera.instance);
      }
    }, undefined, (e) => console.error("Error loading earth.glb:", e));
  }

  _buildMoon() {
    const geo = new THREE.SphereGeometry(0.65, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xdddddd, roughness: 0.9, metalness: 0.1
    });
    
    this.moon = new THREE.Mesh(geo, mat);
    this.moon.position.set(6.5, 1.2, -2.0);
    this.group.add(this.moon);
  }

  _buildStarfield() {
    const count = 8000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      const r = 200 + Math.random() * 100;
      pos[i*3]   = Math.sin(p) * Math.cos(t) * r;
      pos[i*3+1] = Math.sin(p) * Math.sin(t) * r;
      pos[i*3+2] = Math.cos(p) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.bgStars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.6, color: 0xffffff, transparent: true, opacity: 0.85,
    }));
    this.group.add(this.bgStars);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(8,  3.5, 8),
      new THREE.Vector3(5.5, 1.8, 5.5),
      new THREE.Vector3(3.8, 0.8, 4),
      new THREE.Vector3(3.0, 0.3, 3.2),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.group.visible = true;
  }

  hide(duration = 0.6) {
    this.visible = false;
    this.group.visible = false;
  }

  onScrollT(t) {
    const angle = t * Math.PI * 2;
    if (this.moon) {
      this.moon.position.set(Math.cos(angle) * 7.5, Math.sin(angle * 0.4) * 1.8, Math.sin(angle) * 7.5);
    }
  }

  update(time) {
    if (!this.visible) return;

    if (this.earthModel) {
      this.earthModel.rotation.y = time * 0.05;
    }
    if (this.moon) {
      this.moon.rotation.y = time * 0.03;
    }
  }
}
