import * as THREE from 'three';

/**
 * Era 9 — HUMANS (Pure 3D 4K Cinematic Evolution Scene)
 * 100% 3D WebGL Diorama — Zero 2D image/video quads or wireframe circles.
 * Features a continuous 3D journey through human evolution:
 * 1. Dawn of Man: Prehistoric Cave Monoliths & Volumetric Campfire with floating embers
 * 2. Ancient Civilizations: 3D Golden Pyramids, Roman Marble Columns & Golden Royal Crown
 * 3. Industrial & Modern Era: 3D Iron Gear Machine & Cyber Skyscraper Metropolis
 */
export class Era9_Humans {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this.clock = new THREE.Clock();

    this._buildEnvironment();
    this._buildDawnOfMan();
    this._buildAncientCivilizations();
    this._buildIndustrialAndModern();

    // Lighting setup for rich 3D shading
    const ambient = new THREE.AmbientLight(0xffeedd, 1.8);
    this.group.add(ambient);

    const sun = new THREE.DirectionalLight(0xffaa44, 3.5);
    sun.position.set(40, 50, 30);
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

  _buildDawnOfMan() {
    // 3D Stone Age Sanctuary (Z: 50 to 80)
    const stage = new THREE.Group();

    // Stone Monoliths
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x333338, roughness: 0.9, flatShading: true });
    for (let i = 0; i < 5; i++) {
      const h = 8 + Math.random() * 6;
      const mGeo = new THREE.BoxGeometry(3, h, 2);
      const m = new THREE.Mesh(mGeo, stoneMat);
      const angle = (i / 5) * Math.PI * 1.5 - Math.PI * 0.75;
      m.position.set(Math.cos(angle) * 16, -10 + h * 0.5, 65 + Math.sin(angle) * 8);
      m.rotation.y = Math.random() * 0.5;
      stage.add(m);
    }

    // 3D Volumetric Campfire
    const fireGeo = new THREE.ConeGeometry(2.5, 5, 16, 1, true);
    fireGeo.translate(0, 2.5, 0);
    this.fireMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.x += sin(p.y * 3.0 - uTime * 8.0) * 0.2 * (p.y * 0.2);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          vec3 core = vec3(1.0, 0.9, 0.2);
          vec3 edge = vec3(1.0, 0.2, 0.0);
          vec3 col = mix(core, edge, vUv.y);
          float alpha = smoothstep(1.0, 0.1, vUv.y);
          gl_FragColor = vec4(col * 2.5, alpha * 0.9);
        }
      `,
      transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
    });

    const fire = new THREE.Mesh(fireGeo, this.fireMat);
    fire.position.set(-6, -10, 65);
    stage.add(fire);

    // Fire embers
    const emberCount = 800;
    const emberPos = new Float32Array(emberCount * 3);
    for (let i = 0; i < emberCount; i++) {
      emberPos[i*3]   = -6 + (Math.random() - 0.5) * 4;
      emberPos[i*3+1] = -10 + Math.random() * 14;
      emberPos[i*3+2] = 65 + (Math.random() - 0.5) * 4;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.Float32BufferAttribute(emberPos, 3));
    stage.add(new THREE.Points(emberGeo, new THREE.PointsMaterial({
      color: 0xff6600, size: 0.4, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending
    })));

    this.group.add(stage);
  }

  _buildAncientCivilizations() {
    // 3D Empires & Civilizations (Z: 0 to 40)
    const stage = new THREE.Group();

    // 3D Egyptian Pyramids
    const pyrMat = new THREE.MeshStandardMaterial({ color: 0xd8ad58, roughness: 0.7, flatShading: true });
    const pyr1 = new THREE.Mesh(new THREE.ConeGeometry(18, 14, 4), pyrMat);
    pyr1.rotation.y = Math.PI * 0.25;
    pyr1.position.set(-25, -10 + 7, 20);
    stage.add(pyr1);

    const pyr2 = new THREE.Mesh(new THREE.ConeGeometry(12, 10, 4), pyrMat);
    pyr2.rotation.y = Math.PI * 0.25;
    pyr2.position.set(24, -10 + 5, 10);
    stage.add(pyr2);

    // 3D Roman Temple Columns
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.3 });
    const colGeo = new THREE.CylinderGeometry(0.9, 1.1, 16, 16);
    
    for (let i = 0; i < 6; i++) {
      const col = new THREE.Mesh(colGeo, marbleMat);
      const side = (i % 2 === 0) ? -10 : 10;
      const zPos = 30 - Math.floor(i / 2) * 12;
      col.position.set(side, -10 + 8, zPos);
      stage.add(col);
    }

    // 3D Golden Crown of Kings
    this.crownGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(3.5, 0.4, 16, 64);
    ringGeo.rotateX(Math.PI * 0.5);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.9 });
    this.crownGroup.add(new THREE.Mesh(ringGeo, goldMat));

    for (let i = 0; i < 5; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3, 4), goldMat);
      const angle = (i / 5) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 3.5, 1.5, Math.sin(angle) * 3.5);
      this.crownGroup.add(spike);

      const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), new THREE.MeshBasicMaterial({ color: 0xcc0022 }));
      jewel.position.set(Math.cos(angle) * 3.5, 3.0, Math.sin(angle) * 3.5);
      this.crownGroup.add(jewel);
    }
    this.crownGroup.position.set(0, 4, 15);
    stage.add(this.crownGroup);

    this.group.add(stage);
  }

  _buildIndustrialAndModern() {
    // 3D Modern & Cyber Era (Z: -60 to -10)
    const stage = new THREE.Group();

    // 3D Industrial Machine Gears
    this.gears = [];
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.8 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.4, metalness: 0.9 });

    const createGear = (radius, teeth, mat, x, y, z) => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 1.4, 32), mat));
      for (let i = 0; i < teeth; i++) {
        const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 1.8), mat);
        const angle = (i / teeth) * Math.PI * 2;
        tooth.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        tooth.rotation.y = -angle;
        g.add(tooth);
      }
      g.position.set(x, y, z);
      g.rotation.x = Math.PI * 0.5;
      this.gears.push(g);
      stage.add(g);
    };

    createGear(6, 16, ironMat, -16, -2, -15);
    createGear(4, 12, bronzeMat, -8, 4, -15);

    // 3D Skyscraper City Skyline
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x0a192f, roughness: 0.2, metalness: 0.9 });
    const winMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });

    for (let i = 0; i < 18; i++) {
      const h = 18 + Math.random() * 30;
      const w = 4 + Math.random() * 4;
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), bldgMat);
      const x = (i % 2 === 0 ? 1 : -1) * (14 + Math.random() * 20);
      const z = -20 - Math.floor(i / 2) * 8;
      bldg.position.set(x, -10 + h * 0.5, z);

      // Roof beacon
      const beacon = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.6, w * 0.8), winMat);
      beacon.position.y = h * 0.5 + 0.3;
      bldg.add(beacon);

      stage.add(bldg);
    }

    this.group.add(stage);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4, 75),    // Stage 0: Dawn of Man Campfire
      new THREE.Vector3(0, 6, 40),    // Stage 1: Ancient Pyramids & Crown
      new THREE.Vector3(0, 5, 0),     // Stage 2: Industrial Gears
      new THREE.Vector3(0, 3, -35),   // Stage 3: Modern Skyscrapers
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -50) };
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

    if (this.riverMat) this.riverMat.uniforms.uTime.value = time;
    if (this.fireMat) this.fireMat.uniforms.uTime.value = time;

    if (this.crownGroup) {
      this.crownGroup.rotation.y = time * 0.5;
      this.crownGroup.position.y = 4 + Math.sin(time * 2.0) * 0.6;
    }

    if (this.gears && this.gears.length > 0) {
      this.gears[0].rotation.y = time * 0.8;
      this.gears[1].rotation.y = -time * 1.2;
    }

    if (this.dust) {
      this.dust.rotation.y = time * 0.02;
    }
  }
}
