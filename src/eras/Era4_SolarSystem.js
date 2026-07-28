import * as THREE from 'three';
import planetVertex   from '../shaders/planet/vertex.glsl';
import planetFragment from '../shaders/planet/fragment.glsl';
import atmosphereVertex   from '../shaders/atmosphere/vertex.glsl';
import atmosphereFragment from '../shaders/atmosphere/fragment.glsl';

import sunVertex from '../shaders/sun/vertex.glsl';
import sunFragment from '../shaders/sun/fragment.glsl';

/**
 * Era 4 — SOLAR SYSTEM (Award-Winning Bruno Simon Quality)
 * Volumetric glowing Sun with coronal ejections, realistic asteroid debris belt,
 * cooling molten lava planet with rich atmospheric scattering.
 */
export class Era4_SolarSystem {
  constructor(experience) {
    this.exp     = experience;
    this.visible = false;

    this._buildSun();
    this._buildPlanet();
    this._buildDebrisRing();
    this._buildStarfield();
  }

  _buildSun() {
    this.sunUniforms = { uTime: { value: 0 } };
    const geo = new THREE.SphereGeometry(2.2, 64, 64);
    const mat = new THREE.RawShaderMaterial({
      vertexShader: sunVertex,
      fragmentShader: sunFragment,
      uniforms: this.sunUniforms,
      glslVersion: THREE.GLSL3,
    });
    this.sun = new THREE.Mesh(geo, mat);
    this.sun.position.set(35, 12, -70);

    // Multi-layered coronal glow
    const glowGeo1 = new THREE.SphereGeometry(3.5, 64, 64);
    const glowMat1 = new THREE.MeshBasicMaterial({
      color: 0xffaa33, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
    });
    const glow1 = new THREE.Mesh(glowGeo1, glowMat1);
    this.sun.add(glow1);

    const glowGeo2 = new THREE.SphereGeometry(6.0, 64, 64);
    const glowMat2 = new THREE.MeshBasicMaterial({
      color: 0xff4400, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide
    });
    const glow2 = new THREE.Mesh(glowGeo2, glowMat2);
    this.sun.add(glow2);

    this.sun.visible = false;
    this.exp.scene.add(this.sun);
  }

  _buildPlanet() {
    this.planetUniforms = {
      uTime:         { value: 0 },
      uCoolProgress: { value: 0.0 },   
      uOceanProgress:{ value: 0.0 },
      uSunDirection: { value: new THREE.Vector3(1, 0.4, 0.3).normalize() },
      tDiffuse:      { value: null },
      tSpecular:     { value: null },
      tNormal:       { value: null }
    };

    const geo = new THREE.SphereGeometry(2.5, 128, 128);
    const mat = new THREE.RawShaderMaterial({
      vertexShader:   planetVertex,
      fragmentShader: planetFragment,
      uniforms:       this.planetUniforms,
      glslVersion:    THREE.GLSL3,
    });

    this.planet = new THREE.Mesh(geo, mat);
    this.planet.visible = false;
    this.exp.scene.add(this.planet);

    // Enhanced atmosphere shell with dramatic Fresnel scattering
    const atmoGeo = new THREE.SphereGeometry(2.7, 64, 64);
    const atmoMat = new THREE.RawShaderMaterial({
      vertexShader:   atmosphereVertex,
      fragmentShader: atmosphereFragment,
      uniforms: {
        uSunDirection:       { value: this.planetUniforms.uSunDirection.value },
        uAtmosphereColor:    { value: new THREE.Color('#ff6622') }, // Warm volcanic magma glow
        uAtmosphereStrength: { value: 0.5 },
      },
      glslVersion:  THREE.GLSL3,
      transparent:  true,
      depthWrite:   false,
      side:         THREE.FrontSide,
      blending:     THREE.AdditiveBlending,
    });
    this.atmoUniforms = atmoMat.uniforms;
    this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.atmosphere.visible = false;
    this.exp.scene.add(this.atmosphere);
  }

  _buildDebrisRing() {
    // Multi-layered dynamic asteroid debris ring
    const count = 5000;
    const geo = new THREE.DodecahedronGeometry(0.08, 1);
    const mat = new THREE.MeshStandardMaterial({ 
      color: 0xaa9988, roughness: 0.8, metalness: 0.2, emissive: 0x221100 
    });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4.0 + Math.random() * 3.5;
      const tilt   = (Math.random() - 0.5) * 0.6;
      dummy.position.set(
        Math.cos(angle) * radius,
        tilt,
        Math.sin(angle) * radius
      );
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      dummy.scale.setScalar(0.4 + Math.random() * 1.2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.debris = mesh;
    this.debris.visible = false;
    this.exp.scene.add(this.debris);
    
    // Gas Giant & Ice World companions
    this.otherPlanets = new THREE.Group();
    this.exp.scene.add(this.otherPlanets);
    this.otherPlanets.visible = false;
    
    // Gas Giant
    const gasGeo = new THREE.SphereGeometry(4.5, 64, 64);
    const gasMat = new THREE.MeshStandardMaterial({
      color: 0xd4b886, roughness: 0.7, metalness: 0.1, emissive: 0x110d05
    });
    const gasGiant = new THREE.Mesh(gasGeo, gasMat);
    gasGiant.position.set(-35, -8, -50);
    this.otherPlanets.add(gasGiant);
    
    // Gas Giant Rings
    const ringGeo = new THREE.RingGeometry(6.0, 10.0, 128);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc4b299, transparent: true, opacity: 0.75, side: THREE.DoubleSide
    });
    const gasRing = new THREE.Mesh(ringGeo, ringMat);
    gasRing.rotation.x = Math.PI / 2 + 0.3;
    gasRing.rotation.y = 0.15;
    gasGiant.add(gasRing);
    
    // Ice planet
    const iceGeo = new THREE.SphereGeometry(1.6, 64, 64);
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff, roughness: 0.3, metalness: 0.4, emissive: 0x001133
    });
    const icePlanet = new THREE.Mesh(iceGeo, iceMat);
    icePlanet.position.set(22, 10, -32);
    this.otherPlanets.add(icePlanet);
    
    this.ambientLight = new THREE.AmbientLight(0x444455, 1.5);
    this.ambientLight.visible = false;
    this.exp.scene.add(this.ambientLight);
    
    this.sunLight = new THREE.DirectionalLight(0xffeedd, 5.0);
    this.sunLight.position.set(35, 12, -70);
    this.sunLight.visible = false;
    this.exp.scene.add(this.sunLight);
  }

  _buildStarfield() {
    this.bgGroup = new THREE.Group();
    this.exp.scene.add(this.bgGroup);
    
    const count = 8000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 180 + Math.random() * 120;
      pos[i*3]   = Math.sin(phi) * Math.cos(theta) * r;
      pos[i*3+1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i*3+2] = Math.cos(phi) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.bgStars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.5, color: 0xffffff, transparent: true, opacity: 0 }));
    this.bgGroup.add(this.bgStars);
    this.bgGroup.visible = false;
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(12,  5,  12),
      new THREE.Vector3(8,   2,  8),
      new THREE.Vector3(5,   0.5, 5),
      new THREE.Vector3(3.5, 0.2, 3.5),
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, 0) };
  }

  show(duration = 1.0) {
    this.visible = true;
    this.planet.visible = true;
    this.atmosphere.visible = true;
    this.debris.visible = true;
    this.sun.visible = true;
    this.bgGroup.visible = true;
    this.otherPlanets.visible = true;
    this.ambientLight.visible = true;
    this.sunLight.visible = true;

    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bgStars.material.opacity = t * 0.8;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  hide(duration = 0.6) {
    this.visible = false;
    const start = performance.now();
    const tick = () => {
      const t = Math.min((performance.now() - start) / (duration * 1000), 1);
      this.bgStars.material.opacity = 0.8 * (1 - t);
      if (t < 1) requestAnimationFrame(tick);
      else {
        this.planet.visible = false;
        this.atmosphere.visible = false;
        this.debris.visible = false;
        this.sun.visible = false;
        this.bgGroup.visible = false;
        this.otherPlanets.visible = false;
        this.ambientLight.visible = false;
        this.sunLight.visible = false;
      }
    };
    requestAnimationFrame(tick);
  }

  onScrollT(t) {
    this.planetUniforms.uCoolProgress.value = t * 0.5;
    this.atmoUniforms.uAtmosphereStrength.value = 0.5 + t * 0.4;
  }

  update(time) {
    if (!this.visible) return;
    this.planetUniforms.uTime.value = time;
    if (this.sunUniforms) this.sunUniforms.uTime.value = time;
    
    this.planet.rotation.y = time * 0.08;
    this.atmosphere.rotation.y = time * 0.08;
    this.debris.rotation.y = time * 0.12;
    
    if (this.otherPlanets) {
      this.otherPlanets.children.forEach((p, i) => {
        p.rotation.y = time * (0.03 + i * 0.015);
        p.position.y += Math.sin(time * 0.5 + i) * 0.015;
      });
    }
  }
}
