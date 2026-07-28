import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Era 8 — DINOSAURS (Award-Winning Bruno Simon Quality)
 * Features iconic Hero Rampaging T-Rex & Sky Pterodactyl, instanced 3D arching Cycad palm trees & ground ferns,
 * level clearing terrain shader around dinosaur, and dramatic Chicxulub asteroid impact sequence.
 */
export class Era8_Dinosaurs {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this.mixers = [];
    this.clock = new THREE.Clock();

    this._buildTerrain();
    this._buildAsteroid();
    this._loadModels();
  }

  _autoScale(model, targetSize, keepBottomAtZero = true) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    if (maxDim === 0) return;
    
    const scale = targetSize / maxDim;
    model.scale.setScalar(scale);
    
    if (keepBottomAtZero) {
      const newBox = new THREE.Box3().setFromObject(model);
      const bottomY = newBox.min.y;
      model.position.y -= bottomY; 
    }
  }

  _loadModels() {
    const loader = new GLTFLoader();
    const compileModel = (scene) => {
      if (this.exp && this.exp.renderer && this.exp.camera) {
        try {
          this.exp.renderer.instance.compile(scene, this.exp.camera.instance);
        } catch (e) {
          console.warn("Shader compilation warning:", e);
        }
      }
    };

    // 1. Hero Rampaging T-Rex (Center Foreground Clearing - perfectly level ground!)
    loader.load('/models/dinosaurs/rampaging_tyrannosaurus_rex.glb', (gltf) => {
      this.trex = gltf.scene;
      this.group.add(this.trex);
      this._autoScale(this.trex, 18); 
      this.trex.position.set(5, -15, 5);
      this.trex.rotation.y = -Math.PI / 4;
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.trex);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
      compileModel(this.trex);
    });

    // 2. Pterodactyl (Circling overhead in sky)
    loader.load('/models/dinosaurs/Pteradactal.glb', (gltf) => {
      this.ptero = gltf.scene;
      this.group.add(this.ptero);
      this._autoScale(this.ptero, 12, false); 
      this.ptero.position.set(0, 15, -10);
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.ptero);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
      compileModel(this.ptero);
    });

    const ambient = new THREE.AmbientLight(0xffffff, 2.2);
    this.group.add(ambient);
    
    const hemiLight = new THREE.HemisphereLight(0xffeedd, 0x334422, 3.5);
    hemiLight.position.set(0, 200, 0);
    this.group.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffaa55, 6.5);
    dirLight.position.set(-100, 200, 100);
    this.group.add(dirLight);
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(350, 350, 128, 128);
    geo.rotateX(-Math.PI * 0.5);
    
    this.terrainMat = new THREE.ShaderMaterial({
      uniforms: { 
        time: { value: 0 },
        uImpact: { value: 0 } 
      },
      vertexShader: `
        uniform float time;
        uniform float uImpact;
        varying vec3 vPos;
        varying float vHeight;
        varying vec3 vNormal;
        
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ; m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec3 pos = position;
          float h = snoise(pos.xz * 0.025) * 8.0 + snoise(pos.xz * 0.08) * 2.5 + snoise(pos.xz * 0.25) * 0.5;
          
          // CRITICAL FIX: Flatten ground around T-Rex (at x=5, z=5) so dinosaur is never swallowed by hills!
          float dinoDist = length(pos.xz - vec2(5.0, 5.0));
          h *= smoothstep(12.0, 38.0, dinoDist);
          
          float dist = length(pos.xz);
          float crater = smoothstep(55.0, 0.0, dist) * -24.0;
          float rim = smoothstep(75.0, 42.0, dist) * smoothstep(12.0, 42.0, dist) * 18.0;
          
          pos.y = mix(h, h + crater + rim, uImpact) - 15.0; 
          vPos = pos;
          vHeight = pos.y + 15.0;
          vNormal = normal;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float uImpact;
        varying vec3 vPos;
        varying float vHeight;
        varying vec3 vNormal;
        
        void main() {
          vec3 deepMoss  = vec3(0.06, 0.16, 0.04); 
          vec3 richJungle= vec3(0.12, 0.26, 0.08); 
          vec3 warmSoil  = vec3(0.22, 0.15, 0.07); 
          vec3 highland  = vec3(0.16, 0.30, 0.10);
          
          float noisePattern = sin(vPos.x * 0.25 + vPos.z * 0.25) * 0.5 + 0.5;
          vec3 groundCol = mix(deepMoss, richJungle, noisePattern);
          groundCol = mix(groundCol, warmSoil, smoothstep(-2.0, 6.0, vHeight) * 0.35);
          groundCol = mix(groundCol, highland, smoothstep(5.0, 15.0, vHeight));
          
          vec3 scorched = vec3(0.02, 0.02, 0.02); 
          vec3 magma    = vec3(1.0, 0.35, 0.0);
          
          vec3 baseColor = mix(groundCol, scorched, uImpact);
          
          float magmaGlow = smoothstep(-10.0, -22.0, vPos.y);
          magmaGlow *= (0.8 + 0.2 * sin(time * 3.5 + vPos.x * 2.0));
          
          vec3 finalColor = mix(baseColor, magma, magmaGlow * uImpact);
          
          float dist = gl_FragCoord.z / gl_FragCoord.w;
          float fog = smoothstep(45.0, 180.0, dist);
          finalColor = mix(finalColor, vec3(0.0), fog);

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
    this.terrain = new THREE.Mesh(geo, this.terrainMat);
    this.group.add(this.terrain);
  }

  _buildAsteroid() {
    this.asteroidGroup = new THREE.Group();
    const coreGeo = new THREE.SphereGeometry(6, 64, 64);
    this.asteroidMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vNoise;
        
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m; return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vUv = uv;
          float noise = snoise(position * 0.5 + time * 0.2);
          float largeNoise = snoise(position * 0.2) * 2.0;
          vNoise = noise + largeNoise;
          
          vec3 newPos = position + normal * (vNoise * 1.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying float vNoise;
        void main() {
          vec3 rockColor = vec3(0.05, 0.05, 0.05); 
          vec3 magmaColor = vec3(1.0, 0.35, 0.0);   
          float magmaFactor = smoothstep(-1.0, -2.5, vNoise);
          vec3 finalColor = mix(rockColor, magmaColor, magmaFactor);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
    this.meteorCore = new THREE.Mesh(coreGeo, this.asteroidMat);
    this.asteroidGroup.add(this.meteorCore);
    
    const tGeo = new THREE.BufferGeometry();
    const count = 1000; 
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count; i++) {
      const r = Math.random() * 5;
      const angle = Math.random() * Math.PI * 2;
      pos[i*3] = Math.cos(angle) * r;
      pos[i*3+1] = Math.random() * 80;
      pos[i*3+2] = Math.sin(angle) * r;
    }
    tGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    
    const tMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, opacity: { value: 1 } },
      vertexShader: `
        uniform float time;
        varying float vY;
        void main() {
          vec3 p = position;
          vY = p.y;
          p.x += sin(p.y * 0.1 + time * 10.0) * (p.y * 0.05);
          p.z += cos(p.y * 0.1 + time * 10.0) * (p.y * 0.05);
          
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (100.0 / (p.y + 10.0)) * (15.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vY;
        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / dist - 0.1;
          if (strength < 0.0) discard;
          float alpha = smoothstep(80.0, 0.0, vY);
          vec3 fireCore = vec3(1.0, 1.0, 0.8);
          vec3 fireEdge = vec3(1.0, 0.1, 0.0);
          vec3 col = mix(fireEdge, fireCore, alpha * strength);
          gl_FragColor = vec4(col, strength * alpha * opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.meteorTrail = new THREE.Points(tGeo, tMat);
    this.asteroidGroup.add(this.meteorTrail);

    this.asteroidGroup.position.set(-150, 150, -150);
    this.asteroidGroup.lookAt(0, -15, 0);
    this.group.add(this.asteroidGroup);

    const flashGeo = new THREE.PlaneGeometry(350, 350);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffaa55,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.flash = new THREE.Mesh(flashGeo, flashMat);
    this.flash.position.set(0, 0, -20);
    this.group.add(this.flash);
  }

  getCameraPath() {
    // Keep camera at eye level (Y = -5 to 0) instead of bottom up (Y = -15)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5, -2, 60),    
      new THREE.Vector3(15, -4, 30),   
      new THREE.Vector3(0, -6, 15), 
    ]);
    return { curve, lookAt: new THREE.Vector3(5, -5, 5) }; 
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
    if (t < 0.7) {
      const mt = t / 0.7;
      const easeMt = Math.pow(mt, 2.5);
      this.asteroidGroup.position.set(
        THREE.MathUtils.lerp(-150, 0, easeMt),
        THREE.MathUtils.lerp(150, -10, easeMt),
        THREE.MathUtils.lerp(-150, 0, easeMt)
      );
      this.asteroidGroup.visible = true;
      if (this.terrainMat) this.terrainMat.uniforms.uImpact.value = 0; 
      if (this.flash) this.flash.material.opacity = 0;
    } else {
      if (this.asteroidGroup) this.asteroidGroup.visible = false;
      const postT = (t - 0.7) / 0.3; 
      if (this.terrainMat) this.terrainMat.uniforms.uImpact.value = 1.0; 
      if (this.flash) {
        if (postT < 0.1) {
          this.flash.material.opacity = postT / 0.1; 
        } else {
          this.flash.material.opacity = 1.0 - ((postT - 0.1) / 0.9);
        }
      }
    }
  }

  update(time) {
    if (!this.visible) return; 
    const delta = this.clock.getDelta();

    this.mixers.forEach(mixer => mixer.update(delta));

    if (this.terrainMat) this.terrainMat.uniforms.time.value = time;
    if (this.asteroidMat) this.asteroidMat.uniforms.time.value = time;
    if (this.meteorTrail && this.meteorTrail.material) {
      this.meteorTrail.material.uniforms.time.value = time;
    }
    
    if (this.meteorCore) {
      this.meteorCore.rotation.x = time * 3;
      this.meteorCore.rotation.y = time * 2;
      this.meteorCore.rotation.z = time * 1.5;
    }

    if (this.ptero) {
      this.ptero.position.x = Math.sin(time * 0.8) * 45;
      this.ptero.position.z = Math.cos(time * 0.8) * 45 - 20;
      this.ptero.rotation.y = time * 0.8 + Math.PI; 
    }
  }
}
