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
    // 1. Dramatic Lighting
    const ambient = new THREE.AmbientLight(0x0a1526, 2.0); // Deep cinematic blue ambient
    this.group.add(ambient);

    // 2. Swirling DNA / Neural Particle Matrix (Replaces flat terrain)
    const count = 15000;
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
          gl_PointSize = (40.0 / -mvPos.z);
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
          gl_FragColor = vec4(vColor * glow * 1.5, glow * 0.8);
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

        model.position.set(x, y, z);
        model.rotation.y = rotY;

        // Ensure rich PBR material rendering
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
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
        spotLight.castShadow = true;
        
        const target = new THREE.Object3D();
        target.position.set(x, y, z);
        this.group.add(target);
        spotLight.target = target;
        
        this.group.add(spotLight);
        
        // Subtle rim light from below
        const rimLight = new THREE.PointLight(0xffffff, lightIntensity * 0.3, 40);
        rimLight.position.set(x - 5, y - 10, z - 10);
        this.group.add(rimLight);

        this.group.add(model);
        this.models.push(model);
      }, undefined, (e) => console.error("Error loading " + filename, e));
    };

    // --- STAGE 0: Dawn of Man (Z: 120 to 100) ---
    // Floating colossal primitive hominid lit by warm fire light
    loadModelWithSpotlight('homo_heidelbergensis.glb', -12, -5, 120, 20, Math.PI * 0.15, 0xff5500, 200);
    loadModelWithSpotlight('women_of_primitive_tribes.glb', 12, -8, 100, 22, -Math.PI * 0.2, 0xff7700, 200);

    // --- STAGE 1: Ancient Civilizations (Z: 70 to 50) ---
    // Massive majestic Greek Temple illuminated by god rays (bright gold/white)
    loadModelWithSpotlight('greek_temple.glb', -18, -12, 70, 35, Math.PI * 0.2, 0xffddaa, 300);
    // Colossal Feathered Warrior standing guard
    loadModelWithSpotlight('feathered_warrior_of_the_ancestors_3d_model.glb', 15, -15, 50, 25, -Math.PI * 0.3, 0xffcc88, 250);

    // --- STAGE 2: Age of Discovery & Industrial Conflict (Z: 20 to 0) ---
    // Ghostly massive galleon ship 
    loadModelWithSpotlight('queen_annes_revenge.glb', -16, -10, 20, 30, Math.PI * 0.3, 0x88ccff, 250);
    // Imposing brutalist tank lit by harsh cool light
    loadModelWithSpotlight('t72m1.glb', 16, -12, 0, 28, -Math.PI * 0.25, 0x4488ff, 300);

    // --- STAGE 3: Modern Era (Z: -30) ---
    // Modern human silhouetted against glowing cyan/neon light
    loadModelWithSpotlight('casual_weekend_outfit.glb', 0, -15, -30, 22, 0, 0x00f3ff, 250);
  }

  getCameraPath() {
    // A buttery smooth, cinematic flight path weaving *through* the colossal 3D holograms
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 160),   // Far entrance
      new THREE.Vector3(5, -2, 120),  // Fly past Heidelbergensis
      new THREE.Vector3(-5, 0, 90),   // Fly past Primitive Women
      new THREE.Vector3(8, -5, 60),   // Fly past Greek Temple
      new THREE.Vector3(-8, 2, 35),   // Fly past Warrior
      new THREE.Vector3(6, -4, 10),   // Fly past Ship
      new THREE.Vector3(-6, 2, -15),  // Fly past Tank
      new THREE.Vector3(0, 5, -45),   // Rise up and look down at Modern Human
    ]);
    // The camera lookAt target glides smoothly ahead of the camera
    return { curve, lookAt: new THREE.Vector3(0, -2, -60) };
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
