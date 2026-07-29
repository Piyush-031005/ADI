import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 9 — HUMANS
 * A 360-degree immersive civilization showcase.
 * Camera flies THROUGH history at eye-level. 
 * Cities surround the full 360° horizon.
 * All models are massive and properly grounded.
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
    this.models = [];
    this.FLOOR_Y = 0; // camera flies at Y=8, models ground at Y=0

    this._buildEnvironment();
    
    // Delay heavy model loading by 4 seconds to ensure the Void era starts flawlessly without lag
    setTimeout(() => {
      this._loadAllModels();
    }, 4000);
  }

  _buildEnvironment() {
    // Bright ambient so nothing is pitch black
    this.group.add(new THREE.AmbientLight(0xffeedd, 3.5));
    this.group.add(new THREE.HemisphereLight(0xffe0aa, 0x112244, 3.0));

    // Massive point lights at key positions to illuminate the whole scene
    const addLight = (x, y, z, color, intensity) => {
      const l = new THREE.PointLight(color, intensity, 600);
      l.position.set(x, y, z);
      this.group.add(l);
    };
    addLight(0,   80,  0,   0x4488ff, 6); // Central overhead
    addLight(200,  40,  0,   0xff6600, 5); // Right horizon
    addLight(-200, 40,  0,   0x00ccff, 5); // Left horizon
    addLight(0,   40,  200, 0xffaa00, 5); // Back
    addLight(0,   40, -200, 0x00ffcc, 5); // Front

    // Solid dark ground plane
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 1.0, metalness: 0.0 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = this.FLOOR_Y - 0.5;
    this.group.add(floor);
  }

  // Place a loaded model so its feet land exactly on FLOOR_Y
  _placeOnGround(model, x, z, scale, rotY) {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = scale / maxDim;
    model.scale.setScalar(s);
    model.updateMatrixWorld(true);

    const box2 = new THREE.Box3().setFromObject(model);
    model.position.set(x, this.FLOOR_Y - box2.min.y, z);
    model.rotation.y = rotY;

    model.traverse(c => {
      if (c.isMesh) {
        c.castShadow = false;
        c.receiveShadow = false;
        if (c.material) c.material.needsUpdate = true;
      }
    });

    this.group.add(model);
    this.models.push(model);
  }

  async _loadAllModels() {
    const loader = new GLTFLoader();
    const base = '/models/humans/';
    const delay = ms => new Promise(r => setTimeout(r, ms));

    const load = (file, x, z, scale, rotY = 0) => new Promise(resolve => {
      loader.load(base + file, gltf => {
        const model = gltf.scene;
        this._placeOnGround(model, x, z, scale, rotY);
        if (gltf.animations?.length) {
          const mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach(clip => mixer.clipAction(clip).play());
          this.mixers.push(mixer);
        }
        resolve();
      }, undefined, e => { console.warn('skip', file, e); resolve(); });
    });

    // ── LOAD ALL MODELS (Characters Restored) ──────
    await Promise.all([
      // Early Hominids & Tribes
      load('homo_heidelbergensis.glb',          0, 280, 20, 0),
      load('women_of_primitive_tribes.glb',   -20, 250, 18, 0.2),
      load('zulu.glb',                        -40, 190, 35, 0.5),

      // Ancient World & Warriors
      load('feathered_warrior_of_the_ancestors_3d_model.glb', 30, 200, 30, -0.4),
      load('hindu_temple.glb',                 -90, 100, 120, 0.6),
      load('hindu_warrior.glb',                -30, 110, 25,  0.5),
      load('warrior_monk_stylized_idle_animation.glb', 40, 120, 22, -0.3),
      
      // Antiquity
      load('greek_temple.glb',                 -120, 60,  130, 0.0),
      load('gladiator.glb',                    -20,  70,  20,  0.2),
      load('rigged_for_ue4_-_spartan_-_free.glb', 20, 50, 22, -0.1),

      // Medieval & Age of Discovery
      load('armored_king.glb',                  15,  20,  18, -0.2),
      load('queen_annes_revenge.glb',           50,  30,  50, -0.4),
      load('portuguese_sailor_b_fbx.glb',      -10,  10,  20,  0.3),

      // Modern Era & Wars
      load('t72m1.glb',                         40, -50, 55, -0.3),
      load('helicopter.glb',                   -40, -80, 55, 0.4),
      load('casual_weekend_outfit.glb',         10, -60, 20, -0.1),

      // Future / Cyberpunk
      load('ghost_in_the_shell_cyborg_head.glb', 0, -130, 40, 0.0),

      // CITIES: Surround the camera path with massive cities positioned carefully outside the path
      load('city.glb',                          0,  -250,  600, 0.0),
      load('apocalyptic_city.glb',              0,   550,  700, Math.PI),
      load('san_francisco_city.glb',          450,   150,  600, -Math.PI / 2),
      load('night_city_japan.glb',           -450,   150,  600,  Math.PI / 2),
      load('futuristic_city.glb',             350,  -150,  600, -Math.PI / 4),
      load('cyberpunk_city_-_1.glb',         -350,  -150,  600,  Math.PI / 4)
    ]);
  }

  getCameraPath() {
    // Camera flies at Y=25 (approx 2-3 story building level) so user looks DOWN at the history
    const Y = 25;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(  0, Y, 300),
      new THREE.Vector3(-10, Y, 200),
      new THREE.Vector3( 10, Y, 100),
      new THREE.Vector3(-15, Y, 0),
      new THREE.Vector3(  0, Y, -100),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, Y, -200) };
  }

  show() {
    this.visible = true;
    this.group.visible = true;
    
    // PROGRESSIVE REVEAL TO PREVENT LAG
    // If we make all 21 massive models visible on the exact same frame, WebGL stutters.
    // Instead, we hide them and quickly pop them in one by one over ~1 second.
    this.models.forEach(m => { m.visible = false; });
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < this.models.length) {
        this.models[index].visible = true;
        index++;
      } else {
        clearInterval(interval);
      }
    }, 40); // reveal one model every 40ms (~2 frames)
  }

  hide() {
    this.visible = false;
    this.group.visible = false;
  }

  onScrollT(t) {
    if (this.mixers?.length) {
      this.mixers.forEach(m => m.update(0.033));
    }
  }

  update(time) {
    if (!this.visible) return;
    const delta = this.clock.getDelta();
    this.mixers.forEach(m => m.update(delta));
    // Subtle slow rotation for living feel
    this.models.forEach((model, i) => {
      model.rotation.y += Math.sin(time * 0.3 + i) * 0.0003;
    });
  }
}
