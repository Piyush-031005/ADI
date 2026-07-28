import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 9 — HUMANS (Award-Winning 4K Cinematic Evolution Experience)
 * A dramatic, awe-inspiring flight through the void of human history.
 * No cheap flat terrain planes. Instead, colossal 3D models float in deep 
 * space, illuminated by intense cinematic spotlights and volumetric stardust.
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

    this._buildCinematicEnvironment();
    this._loadColossalEvolutionModels();
  }

  _buildCinematicEnvironment() {
    // 1. Dramatic Lighting (Hemisphere + Ambient ensures zero pitch black areas on models)
    const ambient = new THREE.AmbientLight(0x405060, 5.0); // Very bright cool ambient
    this.group.add(ambient);
    
    // Hemisphere light provides a gradient of light from sky (warm) to ground (cool)
    const hemiLight = new THREE.HemisphereLight(0xffddaa, 0x0a1526, 4.0); 
    this.group.add(hemiLight);

    // 2. Swirling DNA / Neural Particle Matrix (Optimized from 15k to 4k for GPU)
    const count = 4000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Create a double helix / neural path stretching along the Z axis
      const t = Math.random() * 200 - 40; // Z from -40 to 160
      const radius = 15 + Math.random() * 10;
      const angle = t * 0.1 + (Math.random() > 0.5 ? 0 : Math.PI);
      
      // Scatter particles around the helix
      pos[i*3]   = Math.cos(angle) * radius + (Math.random() - 0.5) * 15;
      pos[i*3+1] = Math.sin(angle) * radius + (Math.random() - 0.5) * 15;
      pos[i*3+2] = t;

      // Color gradient: Warm orange/gold at the start (Dawn of Man) to cool cyan/magenta at the end (Modern)
      const mixFactor = (160 - t) / 200; 
      const color = new THREE.Color().lerpColors(
        new THREE.Color(0x00f3ff), // Modern (Cyan)
        new THREE.Color(0xffaa00), // Ancient (Gold/Fire)
        mixFactor
      );
      
      // Add random intense bright sparks
      if (Math.random() > 0.95) color.setHex(0xffffff);

      col[i*3]   = color.r;
      col[i*3+1] = color.g;
      col[i*3+2] = color.b;
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    dustGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));

    this.stardustMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec3 p = position;
          // Gentle pulsing breathing effect
          p.x += sin(p.z * 0.05 + uTime) * 2.0;
          p.y += cos(p.z * 0.05 + uTime) * 2.0;
          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          // Boosted size to compensate for lower particle count
          gl_PointSize = (90.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float dist = length(xy);
          if (dist > 0.5) discard;
          float glow = smoothstep(0.5, 0.0, dist);
          // Boosted particle brightness
          gl_FragColor = vec4(vColor * glow * 2.0, glow * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.dust = new THREE.Points(dustGeo, this.stardustMat);
    this.group.add(this.dust);
  }

  async _loadColossalEvolutionModels() {
    const loader = new GLTFLoader();
    const basePath = '/models/humans/';

    // Add a massive solid ground plane so no model feels like it's floating in the sky
    const floorGeo = new THREE.PlaneGeometry(1000, 1000);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x03060a, roughness: 0.9, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -15.1; // Slightly below the model bases
    this.group.add(floor);

    const loadModelWithSpotlight = (filename, x, y, z, scale, rotY, lightColor, lightIntensity) => {
      return new Promise((resolve) => {
        loader.load(basePath + filename, (gltf) => {
          const model = gltf.scene;
          
          const box = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = scale / maxDim;
          model.scale.setScalar(targetScale);

          // MUST update matrix world AFTER scaling, otherwise the bounding box math is completely broken!
          model.updateMatrixWorld(true);

          const boxAfterScale = new THREE.Box3().setFromObject(model);
          const bottomY = boxAfterScale.min.y;
          
          // Set all models to be perfectly aligned at Y = -15 minus their intrinsic bottom offset
          model.position.set(x, y - (bottomY - model.position.y), z);
          model.rotation.y = rotY;

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = false;
              child.receiveShadow = false;
              if (child.material) {
                child.material.envMapIntensity = 1.0;
                child.material.needsUpdate = true;
              }
            }
          });

          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach(clip => mixer.clipAction(clip).play());
            this.mixers.push(mixer);
          }

          const spotLight = new THREE.SpotLight(lightColor, lightIntensity);
          spotLight.position.set(x + 10, y + 25, z + 15);
          spotLight.angle = Math.PI / 4;
          spotLight.penumbra = 0.5;
          spotLight.decay = 1.5;
          spotLight.distance = 100;
          spotLight.castShadow = false;
          
          const target = new THREE.Object3D();
          target.position.set(x, y, z);
          this.group.add(target);
          spotLight.target = target;
          
          this.group.add(spotLight);
          
          const rimLight = new THREE.PointLight(0xffffff, lightIntensity * 0.4, 40);
          rimLight.position.set(x - 5, y - 10, z - 10);
          this.group.add(rimLight);

          this.group.add(model);
          this.models.push(model);
          resolve();
        }, undefined, (e) => {
          console.error("Error loading " + filename, e);
          resolve(); // Resolve anyway so it doesn't block the chain
        });
      });
    };

    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    // Staggered loading: Yield to the main thread between massive models to completely eliminate the 3-second UI freeze!

    // --- STAGE 0: Dawn of Man ---
    await loadModelWithSpotlight('homo_heidelbergensis.glb', -12, -15, 140, 20, Math.PI * 0.15, 0xff5500, 200);
    await delay(100);
    await loadModelWithSpotlight('women_of_primitive_tribes.glb', 12, -15, 110, 22, -Math.PI * 0.2, 0xff7700, 200);
    await delay(100);

    // --- STAGE 1: Ancient Civilizations ---
    await loadModelWithSpotlight('hindu_temple.glb', -18, -15, 80, 40, Math.PI * 0.25, 0xffaa55, 300);
    await delay(100);
    await loadModelWithSpotlight('greek_temple.glb', 18, -15, 50, 35, -Math.PI * 0.2, 0xffddaa, 300);
    await delay(100);

    // --- STAGE 2: Age of Empires ---
    await loadModelWithSpotlight('feathered_warrior_of_the_ancestors_3d_model.glb', -15, -15, 20, 25, Math.PI * 0.3, 0xffcc88, 250);
    await delay(100);
    await loadModelWithSpotlight('queen_annes_revenge.glb', 16, -15, -10, 30, -Math.PI * 0.3, 0x88ccff, 250);
    await delay(100);

    // --- STAGE 3: Industrial / Modern Cities ---
    await loadModelWithSpotlight('t72m1.glb', -16, -15, -40, 28, Math.PI * 0.25, 0x4488ff, 300);
    await delay(100);
    await loadModelWithSpotlight('casual_weekend_outfit.glb', 12, -15, -65, 20, -Math.PI * 0.1, 0x00f3ff, 250);
    await delay(100);
    
    // --- Massive 360-Degree Surround Cities (As Requested) ---
    // Load different cities to surround the user
    await loadModelWithSpotlight('city.glb', 0, -15, -120, 80, 0, 0x00aaff, 400); // Forward City
    await delay(100);
    await loadModelWithSpotlight('san_francisco_city.glb', 100, -15, -20, 100, -Math.PI/2, 0xffaa00, 400); // Right City
    await delay(100);
    await loadModelWithSpotlight('ccity_building_set_1.glb', -100, -15, -20, 100, Math.PI/2, 0x00ffff, 400); // Left City
  }

  getCameraPath() {
    // A perfectly horizontal, cinematic flight path weaving through the models
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 180),   
      new THREE.Vector3(5, 0, 140),   
      new THREE.Vector3(-5, 0, 110),  
      new THREE.Vector3(8, 0, 80),    
      new THREE.Vector3(-8, 0, 50),   
      new THREE.Vector3(6, 0, 20),    
      new THREE.Vector3(-6, 0, -10),  
      new THREE.Vector3(5, 0, -40),   
      new THREE.Vector3(-5, 0, -65),  
      new THREE.Vector3(0, 5, -100),  // Look out over the Forward City
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -160) };
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
    if (!this.mixers || this.mixers.length === 0) return;
    const scrollDelta = 0.05;
    this.mixers.forEach(m => m.update(scrollDelta));
    
    // Deliberately removed model.position.y manipulation here because it caused 
    // a cumulative float bug where models eventually drifted high into the sky!
  }

  update(time) {
    if (!this.visible) return;
    const delta = this.clock.getDelta();

    if (this.stardustMat) {
      this.stardustMat.uniforms.uTime.value = time;
    }

    this.mixers.forEach(m => m.update(delta));

    // Very slow majestic rotation of the colossal models
    this.models.forEach((model, idx) => {
      // Subtle hovering effect
      model.rotation.y += Math.sin(time * 0.5 + idx) * 0.001;
    });
  }
}
