import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 9 — HUMANS (Pure 3D 4K Cinematic Evolution Scene)
 * 100% 3D WebGL Diorama using user-provided high-poly GLB models:
 * 1. Dawn of Man: homo_heidelbergensis, women_of_primitive_tribes
 * 2. Ancient Civilizations: greek_temple, feathered_warrior
 * 3. Age of Discovery & Industrial: queen_annes_revenge, t72m1
 * 4. Modern Era: casual_weekend_outfit
 */
export class Era9_Humans {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this.clock = new THREE.Clock();
    this.mixers = [];

    this._buildEnvironment();
    this._loadHumanEvolutionModels();

    // Lighting setup for rich 3D shading
    const ambient = new THREE.AmbientLight(0xffeedd, 1.8);
    this.group.add(ambient);

    const sun = new THREE.DirectionalLight(0xffaa44, 3.5);
    sun.position.set(40, 50, 30);
    sun.castShadow = true;
    this.group.add(sun);

    const rim = new THREE.DirectionalLight(0x00aaff, 2.5);
    rim.position.set(-40, 20, -30);
    this.group.add(rim);
  }

  _buildEnvironment() {
    // Terrain base
    const terrainGeo = new THREE.PlaneGeometry(120, 200, 64, 64);
    terrainGeo.rotateX(-Math.PI * 0.5);

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c23,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true
    });

    this.terrain = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrain.position.set(0, -10, 0);
    this.terrain.receiveShadow = true;
    this.group.add(this.terrain);

    // Glowing River of Time running through the center
    const riverGeo = new THREE.PlaneGeometry(14, 200, 32, 64);
    riverGeo.rotateX(-Math.PI * 0.5);

    this.riverMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float wave = sin(vUv.y * 40.0 - uTime * 3.0) * 0.5 + 0.5;
          vec3 c1 = vec3(0.0, 0.6, 1.0);
          vec3 c2 = vec3(0.8, 0.2, 1.0);
          vec3 color = mix(c1, c2, wave);
          float edge = sin(vUv.x * 3.14159);
          gl_FragColor = vec4(color * 2.0, edge * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const river = new THREE.Mesh(riverGeo, this.riverMat);
    river.position.set(0, -9.8, 0);
    this.group.add(river);

    // Ambient Stardust Fog
    const count = 5000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 120;
      pos[i*3+1] = -5 + Math.random() * 40;
      pos[i*3+2] = (Math.random() - 0.5) * 180;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
      size: 0.6, color: 0xffaa44, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
    }));
    this.group.add(this.dust);
  }

  _loadHumanEvolutionModels() {
    const loader = new GLTFLoader();
    const basePath = '/models/humans/';

    const loadModel = (filename, x, y, z, scale, rotY, callback) => {
      loader.load(basePath + filename, (gltf) => {
        const model = gltf.scene;
        
        // Auto-normalize scale
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = scale / maxDim;
        model.scale.setScalar(targetScale);

        model.position.set(x, y, z);
        model.rotation.y = rotY;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 1.5;
            }
          }
        });

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach(clip => mixer.clipAction(clip).play());
          this.mixers.push(mixer);
        }

        this.group.add(model);
        if (callback) callback(model);
      }, undefined, (e) => console.error("Error loading " + filename, e));
    };

    // --- STAGE 0: Dawn of Man (Z: 60) ---
    loadModel('homo_heidelbergensis.glb', -8, -10, 60, 6, Math.PI * 0.25);
    loadModel('women_of_primitive_tribes.glb', 8, -10, 60, 5.5, -Math.PI * 0.15);

    // --- STAGE 1: Ancient Civilizations (Z: 30) ---
    // A massive Greek Temple in the background
    loadModel('greek_temple.glb', -15, -10, 30, 20, Math.PI * 0.15);
    // Ancient warrior standing proud
    loadModel('feathered_warrior_of_the_ancestors_3d_model.glb', 10, -10, 35, 7, -Math.PI * 0.3);

    // --- STAGE 2: Age of Discovery / Conflict (Z: 0) ---
    // Pirate Ship / Galleon
    loadModel('queen_annes_revenge.glb', -12, -10, 5, 18, Math.PI * 0.4);
    // Modern Warfare / Tank
    loadModel('t72m1.glb', 14, -10, -5, 12, -Math.PI * 0.2);

    // --- STAGE 3: Modern Era (Z: -30) ---
    loadModel('casual_weekend_outfit.glb', 0, -10, -30, 6, 0);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4, 85),    // Entrance
      new THREE.Vector3(0, 4, 60),    // Stage 0: Primitive Man
      new THREE.Vector3(0, 5, 35),    // Stage 1: Ancient Temple & Warrior
      new THREE.Vector3(0, 5, 0),     // Stage 2: Ship & Tank
      new THREE.Vector3(0, 3, -20),   // Stage 3: Modern Human
    ]);
    return { curve, lookAt: new THREE.Vector3(0, -5, -60) };
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
    // Smooth camera progression handles transitions naturally
  }

  update(time) {
    if (!this.visible) return;
    const delta = this.clock.getDelta();

    if (this.riverMat) this.riverMat.uniforms.uTime.value = time;

    this.mixers.forEach(m => m.update(delta));

    if (this.dust) {
      this.dust.rotation.y = time * 0.02;
    }
  }
}
