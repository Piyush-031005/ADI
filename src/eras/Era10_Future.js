import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Era 10 — THE FUTURE
 * Optimized for performance: Loads only the massive Wheel and the Hovercar.
 * Forced emissive lighting to prevent pitch-black rendering.
 */
export class Era10_Future {
  constructor(experience) {
    this.exp = experience;
    this.visible = false;
    this.group = new THREE.Group();
    this.group.visible = false;
    this.exp.scene.add(this.group);
    
    this.mixers = [];
    this.clock = new THREE.Clock();

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

  // Forces the model to be bright and emissive regardless of missing PBR maps
  // Forces the model to be bright and emissive regardless of missing PBR maps, and freezes matrices
  _forceVisibility(model, emissiveColorHex, freezeMatrices = false) {
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (freezeMatrices) {
          child.matrixAutoUpdate = false;
          child.updateMatrix();
        }
        if (child.material) {
          child.material.envMapIntensity = 2.0;
          child.material.depthWrite = true;
          child.material.roughness = 0.5;
          if (!child.material.emissive) {
            child.material.emissive = new THREE.Color(emissiveColorHex);
          } else {
            child.material.emissive.add(new THREE.Color(emissiveColorHex));
          }
          child.material.needsUpdate = true;
        }
      }
    });
  }

  _loadModels() {
    const loader = new GLTFLoader();

    // 1. Cyberpunk Wheel Environment (Massive scale)
    loader.load('/models/future/space_station_3.glb', (gltf) => {
      this.city = gltf.scene;
      this.group.add(this.city);

      this._autoScale(this.city, 800, false); // Insanely massive zoom
      this.city.position.set(0, 50, -200); 
      this.city.rotation.x = Math.PI / 8; 
      
      this._forceVisibility(this.city, 0x113344, false); // Cyberpunk blue glow

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.city);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
      if (this.exp && this.exp.renderer && this.exp.camera) {
        this.exp.renderer.instance.compile(this.city, this.exp.camera.instance);
      }
    });

    // 2. Flying Hovercar
    loader.load('/models/future/free_cyberpunk_hovercar.glb', (gltf) => {
      this.car = gltf.scene;
      this.group.add(this.car);
      
      this._autoScale(this.car, 20, false); 
      this.car.position.set(-20, 10, -20);
      
      this._forceVisibility(this.car, 0x332211, false); // Warm glow

      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(this.car);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }
    });

    // 3. Ground Cyberpunk City (Static Background to prevent lag)
    loader.load('/models/future/cyberpunk_city_-_1.glb', (gltf) => {
      this.groundCity = gltf.scene;
      this.group.add(this.groundCity);
      
      this._autoScale(this.groundCity, 1000, true); 
      this.groundCity.position.set(0, -300, -300); 
      
      this._forceVisibility(this.groundCity, 0x001122, true); 

      // OPTIMIZATION: Freeze matrices and precompile shaders
      this.groundCity.matrixAutoUpdate = false;
      this.groundCity.updateMatrix();
      if (this.exp && this.exp.renderer && this.exp.camera) {
        this.exp.renderer.instance.compile(this.groundCity, this.exp.camera.instance);
      }
    });
    
    // Cyberpunk Lighting Setup (Stronger for PBR Models)
    const ambient = new THREE.AmbientLight(0xffffff, 5.0); 
    this.group.add(ambient);

    const hemiLight = new THREE.HemisphereLight(0xffaaee, 0x002244, 5.0);
    hemiLight.position.set(0, 200, 0);
    this.group.add(hemiLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 10.0);
    mainLight.position.set(100, 200, 100);
    this.group.add(mainLight);
    
    const blueSpot = new THREE.SpotLight(0x00aaff, 100.0, 500, Math.PI/4, 0.5, 1);
    blueSpot.position.set(50, 150, 50);
    blueSpot.lookAt(100,-50,-100); // Point at station
    this.group.add(blueSpot);

    const pinkSpot = new THREE.SpotLight(0xff00ff, 100.0, 500, Math.PI/4, 0.5, 1);
    pinkSpot.position.set(-50, 150, -50);
    pinkSpot.lookAt(100,-50,-100);
    this.group.add(pinkSpot);
  }

  getCameraPath() {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-100, 50, 150),   // Start wide, seeing ground city below
      new THREE.Vector3(0, 0, 50),        // Zooming towards the massive wheel
      new THREE.Vector3(50, -20, 0),      // Flying under the wheel
      new THREE.Vector3(0, 30, -50),      // Arriving inside the wheel hub
    ]);
    return { curve, lookAt: new THREE.Vector3(0, 0, -200) }; // Look at the massive station core
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
    // Timeline logic
  }

  update(time) {
    if (!this.visible) return; // Prevent lag by skipping updates when hidden
    const delta = this.clock.getDelta();

    this.mixers.forEach(mixer => mixer.update(delta));

    // Animate Hovercar flying in front of the station
    if (this.car) {
      this.car.position.x = Math.sin(time * 0.5) * 60 + 20;
      this.car.position.z = Math.cos(time * 0.5) * 60 - 50;
      this.car.position.y = 10 + Math.sin(time * 2.0) * 5.0; 
      
      const targetX = Math.sin((time + 0.1) * 0.5) * 60 + 20;
      const targetZ = Math.cos((time + 0.1) * 0.5) * 60 - 50;
      this.car.lookAt(targetX, this.car.position.y, targetZ);
    }
    
    // Rotate massive wheel environment slowly
    if (this.city) {
      this.city.rotation.y = time * -0.05;
      this.city.rotation.z = time * 0.02; // Tumbling slightly
    }
  }
}
