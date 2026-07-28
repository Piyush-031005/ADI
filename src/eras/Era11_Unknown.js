import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 11 — THE UNKNOWN WORLD (Award-Winning Pure 3D 4K Quantum Singularity)
 * 100% Pure 3D WebGL Environment — Zero 2D image quads or wireframe circles.
 * Features:
 * 1. 20,000-Particle Alex Grey-inspired Visionary Cosmic Being of Light
 * 2. Interstellar Gravitational Lensing Wormhole Core
 * 3. Relativistic Plasma Accretion Disk & Cosmic Dust Streams
 * 4. High-Detail 3D Space Station / Satellite Core (space.glb)
 */
export class Era11_Unknown {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this.clock = new THREE.Clock();
    this.mixers = [];

    this._buildCosmicBeingOfLight();
    this._buildWormholeCore();
    this._buildRelativisticRings();
    this._buildCosmicDustStreams();
    this._loadSpaceModel();

    const ambient = new THREE.AmbientLight(0xffffff, 2.0);
    this.group.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x00f3ff, 3.5);
    dirLight.position.set(50, 60, 40);
    this.group.add(dirLight);
  }

  _buildCosmicBeingOfLight() {
    // Optimized: 6,000 bioluminescent quantum particles (down from 20k) for GPU performance
    const count = 6000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cWhite = new THREE.Color(0xffffff);
    const cCyan  = new THREE.Color(0x00ffff);
    const cGold  = new THREE.Color(0xffd700);
    const cPink  = new THREE.Color(0xff0088);

    for (let i = 0; i < count; i++) {
      const t = Math.random();
      let x = 0, y = 0, z = 0;
      let chosenCol = cCyan;

      if (t < 0.15) { // Head (Perfect Sphere)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = Math.random() * 2.5;
        x = Math.sin(phi) * Math.cos(theta) * r;
        y = 15 + Math.cos(phi) * r;
        z = Math.sin(phi) * Math.sin(theta) * r;
        chosenCol = Math.random() > 0.3 ? cWhite : cCyan;
      } else if (t < 0.55) { // Torso (V-shape tapering down)
        const h = (Math.random()) * 14; 
        const r = (1.0 - (h / 14.0) * 0.5) * (1.5 + Math.random() * 2.5); // Tapers at waist
        const theta = Math.random() * Math.PI * 2;
        x = Math.cos(theta) * r;
        y = 13 - h; // From neck (13) down to waist (-1)
        z = Math.sin(theta) * r * 0.6; // Flatter chest
        chosenCol = Math.random() > 0.4 ? cGold : cPink;
      } else if (t < 0.75) { // Arms (hanging down naturally)
        const side = Math.random() > 0.5 ? 1 : -1;
        const armL = Math.random() * 12;
        x = side * (4.0 + armL * 0.2) + (Math.random() - 0.5) * 1.5;
        y = 12 - armL; // Shoulders at 12, hands at 0
        z = (Math.random() - 0.5) * 1.5;
        chosenCol = cCyan;
      } else { // Legs (Straight down)
        const side = Math.random() > 0.5 ? 1.5 : -1.5;
        const legL = Math.random() * 15;
        x = side + (Math.random() - 0.5) * 1.8;
        y = -1 - legL; // Waist at -1, feet at -16
        z = (Math.random() - 0.5) * 1.8;
        chosenCol = Math.random() > 0.5 ? cGold : cCyan;
      }

      pos[i*3]   = x;
      pos[i*3+1] = y;
      pos[i*3+2] = z;

      col[i*3]   = chosenCol.r * 2.8;
      col[i*3+1] = chosenCol.g * 2.8;
      col[i*3+2] = chosenCol.b * 2.8;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));

    this.cosmicMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec3 p = position;
          float pulse = sin(uTime * 2.5 + p.y * 0.4 + p.x * 0.3) * 0.4;
          p += normal * pulse;
          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
          // Boosted size to compensate for lower particle count
          gl_PointSize = (350.0 / -mvPos.z);
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
          gl_FragColor = vec4(vColor * glow * 2.0, glow);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.cosmicBeing = new THREE.Points(geo, this.cosmicMat);
    this.cosmicBeing.position.set(0, 0, 10);
    this.group.add(this.cosmicBeing);
  }

  _buildWormholeCore() {
    const geo = new THREE.SphereGeometry(22, 64, 64);
    this.coreMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = dot(viewDir, normal);
          fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
          
          vec3 rimColor1 = vec3(0.0, 0.95, 1.0);
          vec3 rimColor2 = vec3(0.9, 0.0, 1.0);
          vec3 rim = mix(rimColor1, rimColor2, sin(uTime * 2.0 + fresnel * 10.0) * 0.5 + 0.5);
          
          float alpha = pow(fresnel, 2.0);
          vec3 finalCol = rim * pow(fresnel, 1.5) * 3.0;
          
          gl_FragColor = vec4(finalCol, alpha + 0.15);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.coreMesh = new THREE.Mesh(geo, this.coreMat);
    this.coreMesh.position.z = -25;
    this.group.add(this.coreMesh);
  }

  _buildRelativisticRings() {
    this.ringsGroup = new THREE.Group();
    
    for (let i = 0; i < 4; i++) {
      const radius = 28 + i * 8;
      const ringGeo = new THREE.RingGeometry(radius, radius + 4, 128);
      const ringMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uIndex: { value: i }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPos;
          void main() {
            vUv = uv;
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uIndex;
          varying vec2 vUv;
          varying vec3 vPos;
          void main() {
            float angle = atan(vPos.y, vPos.x);
            float dist = length(vPos);
            
            float speed = (uIndex + 1.0) * 1.5;
            float pattern = sin(angle * 12.0 + uTime * speed) * cos(dist * 0.5 - uTime * 2.0);
            pattern = smoothstep(0.0, 1.0, pattern * 0.5 + 0.5);
            
            vec3 col1 = vec3(0.0, 1.0, 0.9);
            vec3 col2 = vec3(1.0, 0.2, 0.8);
            vec3 color = mix(col1, col2, sin(uTime + uIndex) * 0.5 + 0.5);
            
            float fade = sin(vUv.x * 3.14159);
            gl_FragColor = vec4(color * 2.0, pattern * fade * 0.75);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2 + (i * 0.2 - 0.3);
      ringMesh.rotation.y = i * 0.15;
      this.ringsGroup.add(ringMesh);
    }

    this.ringsGroup.position.z = -25;
    this.group.add(this.ringsGroup);
  }

  _buildCosmicDustStreams() {
    // Optimized down to 3000 from 8000
    const count = 3000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 25 + Math.random() * 150;
      const y = (Math.random() - 0.5) * 80;
      pos[i*3]   = Math.cos(theta) * r;
      pos[i*3+1] = y;
      pos[i*3+2] = Math.sin(theta) * r - 20;
      
      const c = Math.random() > 0.5 ? new THREE.Color(0x00ffff) : new THREE.Color(0xff00aa);
      col[i*3]   = c.r * 2.0;
      col[i*3+1] = c.g * 2.0;
      col[i*3+2] = c.b * 2.0;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    
    // Increased size to compensate for lower count
    this.dust = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.5, vertexColors: true, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending
    }));
    this.group.add(this.dust);
  }

  _loadSpaceModel() {
    const loader = new GLTFLoader();
    loader.load('/models/space.glb', (gltf) => {
      this.spaceModel = gltf.scene;
      this.spaceModel.position.set(0, 0, -140);
      this.spaceModel.scale.set(65, 65, 65); 
      
      this.spaceModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          child.matrixAutoUpdate = false;
          child.updateMatrix();
          if (child.material) {
            child.material.envMapIntensity = 2.0;
            child.material.needsUpdate = true;
          }
        }
      });
      this.group.add(this.spaceModel);
      
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.spaceModel);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
    }, undefined, (e) => console.error("Error loading space.glb", e));
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2, 85),
      new THREE.Vector3(-10, 2, 55),
      new THREE.Vector3(10, 2, 35),
      new THREE.Vector3(0, 2, 22), 
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 2, 0) };
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
    if (this.cosmicBeing) {
      this.cosmicBeing.position.y = Math.sin(t * Math.PI * 2) * 1.5;
    }
  }

  update(time) {
    if (!this.visible) return;
    const delta = this.clock.getDelta();
    
    if (this.cosmicMat) this.cosmicMat.uniforms.uTime.value = time;
    if (this.coreMat) this.coreMat.uniforms.uTime.value = time;
    
    if (this.cosmicBeing) {
      this.cosmicBeing.rotation.y = Math.sin(time * 0.4) * 0.25;
    }

    if (this.ringsGroup) {
      this.ringsGroup.children.forEach((ring, idx) => {
        if (ring.material && ring.material.uniforms) {
          ring.material.uniforms.uTime.value = time;
        }
        ring.rotation.z = time * (0.1 + idx * 0.05);
      });
      this.ringsGroup.rotation.y = time * 0.08;
    }

    if (this.dust) this.dust.rotation.y = time * -0.04;
    this.mixers.forEach(m => m.update(delta));
    if (this.spaceModel) this.spaceModel.rotation.y = time * 0.03;
  }
}
