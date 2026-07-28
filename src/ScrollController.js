import { EventBus, EVENTS } from './utils/EventBus.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ERA_COUNT = 13; // 0-12

/**
 * ScrollController — Maps scroll progress → era index + within-era t.
 * Synchronized with Experience render loop for buttery smooth, zero-stutter camera movement.
 */
export class ScrollController {
  constructor(experience) {
    this.exp         = experience;
    this.totalScroll = 0;
    
    this.targetProgress = 0; // Where the scrollbar is
    this.progress       = 0; // Lerped value
    
    this.eraIndex    = 0;
    this.eraT        = 0;   // 0-1 within era

    const container = document.getElementById('scroll-container');
    if (!container) return;

    container.addEventListener('scroll', () => this._onScroll(container), { passive: true });
  }

  _onScroll(container) {
    const scrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;

    if (maxScroll <= 0) return;
    this.targetProgress = Math.min(scrollTop / maxScroll, 1.0);
  }
  
  update(delta) {
    // Frame-rate independent exponential smoothing (eliminates micro-oscillations and jitter)
    const factor = 1.0 - Math.exp(-12.0 * delta);
    this.progress += (this.targetProgress - this.progress) * factor;
    
    // Map to era
    const eraFloat = this.progress * ERA_COUNT;
    const newEra   = Math.min(Math.floor(eraFloat), ERA_COUNT - 1);
    this.eraT      = eraFloat - newEra;

    // Camera curve t (0-1 within era)
    this.exp.camera.setScrollT(this.eraT);

    // Emit scroll progress synchronously with render loop
    EventBus.emit(EVENTS.SCROLL_PROGRESS, {
      progress: this.progress,
      eraIndex: newEra,
      eraT:     this.eraT,
    });

    // Era change
    if (newEra !== this.eraIndex) {
      this.eraIndex = newEra;
      EventBus.emit(EVENTS.ERA_CHANGE, { index: newEra, t: this.eraT });
    }
  }
}
