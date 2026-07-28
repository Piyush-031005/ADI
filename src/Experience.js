import * as THREE from 'three';
import { Time, Sizes } from './utils/Time.js';
import { EventBus, EVENTS } from './utils/EventBus.js';

import { Renderer } from './Renderer.js';
import { Camera } from './Camera.js';
import { ScrollController } from './ScrollController.js';
import { EraDirector } from './eras/EraDirector.js';

/**
 * Experience — Singleton root. Owns all systems.
 * Pattern: identical to Simon Bröer's architecture.
 */
export class Experience {
  static instance = null;

  constructor(canvas) {
    if (Experience.instance) return Experience.instance;
    Experience.instance = this;

    this.canvas = canvas;
    this.time   = new Time();
    this.sizes  = new Sizes();

    this.setScenes();
    this.setCamera();
    this.setRenderer();
    this.setScroll();
    this.setEras();
    this.bindResize();
    this.startLoop();
  }

  setScenes() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.glowScene = new THREE.Scene();
    this.glowScene.background = new THREE.Color(0x000000);
    this.overlayScene = new THREE.Scene();
    this.distortionScene = new THREE.Scene(); // Used by Black Hole for gravitational lensing
  }

  setCamera() {
    this.camera = new Camera(this);
  }

  setRenderer() {
    this.renderer = new Renderer(this);
  }

  setScroll() {
    this.scroll = new ScrollController(this);
  }

  setEras() {
    this.eras = new EraDirector(this);
  }

  bindResize() {
    EventBus.on(EVENTS.RESIZE, () => {
      this.camera.resize();
      this.renderer.resize();
    });
  }

  startLoop() {
    const loop = () => {
      this.time.tick();
      if (this.scroll && this.scroll.update) {
        this.scroll.update(this.time.delta);
      }
      this.eras.update();
      this.camera.update();
      this.renderer.render();
      EventBus.emit(EVENTS.RENDER_TICK, { elapsed: this.time.elapsed, delta: this.time.delta });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}
