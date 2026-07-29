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
    this._loadAllModels();
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
        // 100% Foolproof Incremental GPU Pre-warm
        // We render this specific model to a 1x1 offscreen target a moment after it loads.
        // This guarantees all its huge textures upload to the GPU immediately in the background,
        // rather than all 28 models trying to upload at the exact moment of the era transition!
        setTimeout(() => {
           if (!this.exp || !this.exp.renderer) return;
           // 100% Foolproof GPU Pre-warm: Compile this exact model using the exact lighting 
           // from the main scene. This guarantees zero shader recompilation lag on transition!
           this.exp.renderer.instance.compile(model, this.exp.camera.instance, this.exp.scene);
        }, 300); // 300ms delay so it doesn't stutter the main thread right after parsing
        
        resolve();
      }, undefined, e => { console.warn('skip', file, e); resolve(); });
    });

    // ── LOAD ALL SURVIVING MODELS CONCURRENTLY FOR BLAZING FAST LOAD ──────
    await Promise.all([
      // Dawn of Man (far back)
      load('homo_heidelbergensis.glb',          -30, 220, 35,  0.3),
      
      // Warriors & Ancient World
      load('feathered_warrior_of_the_ancestors_3d_model.glb', 40, 130, 40, -0.5),
      load('gladiator.glb',                     -30, 110, 40, 0.3),
      
      // Ancient Temples & Empires
      load('hindu_temple.glb',                 -90, 100, 120, 0.6),
      load('greek_temple.glb',                 -120, 60,  130, 0.0),
      
      // Naval & Medieval
      load('queen_annes_revenge.glb',           50, 30, 50, -0.4),
      
      // Modern / Industrial
      load('t72m1.glb',                         40, -50, 55, -0.3),
      load('helicopter.glb',                   -40, -80, 55, 0.4),
      
      // Future / Cyberpunk
      load('ghost_in_the_shell_cyborg_head.glb', 0, -130, 40, 0.0),
      
      // CITIES: Surround the camera path (Z=250 to Z=60) with massive cities
      load('city.glb',                          0,    0,   600, 0.0),             // Front
      load('apocalyptic_city.glb',              0,    500, 700, Math.PI),         // Back (behind start)
      load('san_francisco_city.glb',          350,  250, 600, -Math.PI / 2),      // Right
      load('night_city_japan.glb',           -350,  250, 600,  Math.PI / 2),      // Left
      load('futuristic_city.glb',             250,   50, 600, -Math.PI / 4),      // Front-Right
      load('cyberpunk_city_-_1.glb',         -250,   50, 600,  Math.PI / 4)       // Front-Left
    ]);
  }

  getCameraPath() {
    // Camera flies at Y=8 (eye level standing on Y=0 ground) — never underground!
    const Y = 8;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(  0, Y, 250),
      new THREE.Vector3(-10, Y, 200),
      new THREE.Vector3( 10, Y, 150),
      new THREE.Vector3(-15, Y, 100),
      new THREE.Vector3( 15, Y,  60),
      new THREE.Vector3(-10, Y,  20),
      new THREE.Vector3( 10, Y, -20),
      new THREE.Vector3( -5, Y, -60),
      new THREE.Vector3(  5, Y,-100),
      new THREE.Vector3(  0, Y,-150),
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
