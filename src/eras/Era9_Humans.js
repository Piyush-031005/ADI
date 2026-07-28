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

  _loadColossalEvolutionModels() {
    const loader = new GLTFLoader();
    const basePath = '/models/humans/';

    const loadModelWithSpotlight = (filename, x, y, z, scale, rotY, lightColor, lightIntensity) => {
      loader.load(basePath + filename, (gltf) => {
        const model = gltf.scene;
        
        // Auto-normalize scale to make them Colossal
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = scale / maxDim;
        model.scale.setScalar(targetScale);

        // MUST update matrix world AFTER scaling, otherwise the bounding box math is completely broken!
        model.updateMatrixWorld(true);

        // Normalize origin so they sit perfectly on the floor (Y axis aligned)
        const boxAfterScale = new THREE.Box3().setFromObject(model);
        const bottomY = boxAfterScale.min.y;
        
        // Set all models to be perfectly aligned at Y = -15 minus their intrinsic bottom offset
        model.position.set(x, y - (bottomY - model.position.y), z);
        model.rotation.y = rotY;

        // Ensure rich PBR material rendering
        model.traverse((child) => {
          if (child.isMesh) {
            // Disabled per-model shadows to massively boost GPU performance
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

        // Add dramatic cinematic spotlight pointing exactly at this model
        const spotLight = new THREE.SpotLight(lightColor, lightIntensity);
        spotLight.position.set(x + 10, y + 25, z + 15);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        spotLight.decay = 1.5;
        spotLight.distance = 100;
        // Shadow mapping disabled for performance
        spotLight.castShadow = false;
        
        const target = new THREE.Object3D();
        target.position.set(x, y, z);
        this.group.add(target);
        spotLight.target = target;
        
        this.group.add(spotLight);
        
        // Subtle rim light from below
        const rimLight = new THREE.PointLight(0xffffff, lightIntensity * 0.4, 40);
        rimLight.position.set(x - 5, y - 10, z - 10);
        this.group.add(rimLight);

        this.group.add(model);
        this.models.push(model);
      }, undefined, (e) => console.error("Error loading " + filename, e));
    };

    // All models sit perfectly on the Y=-15 "floor" plane so they never float randomly.

    // --- STAGE 0: Dawn of Man (Z: 140 to 110) ---
    loadModelWithSpotlight('homo_heidelbergensis.glb', -12, -15, 140, 20, Math.PI * 0.15, 0xff5500, 200);
    loadModelWithSpotlight('women_of_primitive_tribes.glb', 12, -15, 110, 22, -Math.PI * 0.2, 0xff7700, 200);

    // --- STAGE 1: Ancient Civilizations (Z: 80 to 50) ---
    loadModelWithSpotlight('hindu_temple.glb', -18, -15, 80, 40, Math.PI * 0.25, 0xffaa55, 300);
    loadModelWithSpotlight('greek_temple.glb', 18, -15, 50, 35, -Math.PI * 0.2, 0xffddaa, 300);

    // --- STAGE 2: Age of Empires & Discovery (Z: 20 to -10) ---
    loadModelWithSpotlight('feathered_warrior_of_the_ancestors_3d_model.glb', -15, -15, 20, 25, Math.PI * 0.3, 0xffcc88, 250);
    loadModelWithSpotlight('queen_annes_revenge.glb', 16, -15, -10, 30, -Math.PI * 0.3, 0x88ccff, 250);

    // --- STAGE 3: Industrial / Modern Cities (Z: -40 to -90) ---
    loadModelWithSpotlight('t72m1.glb', -16, -15, -40, 28, Math.PI * 0.25, 0x4488ff, 300);
    loadModelWithSpotlight('casual_weekend_outfit.glb', 12, -15, -65, 20, -Math.PI * 0.1, 0x00f3ff, 250);
    
    // --- Massive 360-Degree Cyber City Surround ---
    // Instead of loading 4 different massive city files (which causes a 10+ second transition freeze),
    // we load one high-quality city and clone it instantly in memory to surround the entire horizon!
    loader.load(basePath + 'city.glb', (gltf) => {
      const baseCity = gltf.scene;
      
      const cityScale = 120; // Massive scale
      const box = new THREE.Box3().setFromObject(baseCity);
      const size = new THREE.Vector3();
      box.getSize(size);
      const targetScale = cityScale / Math.max(size.x, size.y, size.z);
      baseCity.scale.setScalar(targetScale);
      baseCity.updateMatrixWorld(true);
      
      const bottomY = new THREE.Box3().setFromObject(baseCity).min.y;

      // Ensure rich PBR material rendering without shadow casting for massive performance
      baseCity.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });

      // Clone and place 4 cities in a massive ring around the user (radius 180)
      const radius = 180;
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2;
        const cityClone = baseCity.clone();
        
        // Center the ring around the middle of the transition path (Z = 20)
        const cx = Math.cos(angle) * radius;
        const cz = 20 + Math.sin(angle) * radius;
        
        cityClone.position.set(cx, -15 - bottomY, cz);
        
        // Face inwards towards the center
        cityClone.rotation.y = -angle - Math.PI / 2;
        
        this.group.add(cityClone);
        this.models.push(cityClone);
      }
      
      // Add a massive blue ambient glow specifically for the 360 city
      const cityLight = new THREE.PointLight(0x0088ff, 5.0, 500);
      cityLight.position.set(0, 50, 20);
      this.group.add(cityLight);
      
    }, undefined, (e) => console.error("Error loading city", e));
  }

  getCameraPath() {
    // A perfectly horizontal, cinematic flight path weaving *through* the colossal 3D holograms
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 180),   // Far entrance
      new THREE.Vector3(5, 0, 140),   // Fly past Heidelbergensis
      new THREE.Vector3(-5, 0, 110),  // Fly past Primitive Women
      new THREE.Vector3(8, 0, 80),    // Fly past Hindu Temple
      new THREE.Vector3(-8, 0, 50),   // Fly past Greek Temple
      new THREE.Vector3(6, 0, 20),    // Fly past Warrior
      new THREE.Vector3(-6, 0, -10),  // Fly past Ship
      new THREE.Vector3(5, 0, -40),   // Fly past Tank
      new THREE.Vector3(-5, 0, -65),  // Fly past Modern Human
      new THREE.Vector3(0, 5, -120),  // Rise up and look down at the Cyber City
    ]);
    // The camera lookAt target glides smoothly horizontally
    return { curve, lookAt: new THREE.Vector3(0, 0, -140) };
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
    // Models slowly rotate or float based on scroll to feel alive
    this.models.forEach((model, idx) => {
      model.position.y += Math.sin(t * Math.PI * 4 + idx) * 0.05;
    });
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
