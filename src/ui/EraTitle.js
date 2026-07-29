import { gsap } from 'gsap';

/**
 * EraTitle — Cinematic era name display, center-screen and lower-left fact.
 * Features typewriter text generation with futuristic audio click feedback.
 */
export class EraTitle {
  constructor() {
    this.title    = document.getElementById('era-title');
    this.subtitle = document.getElementById('era-subtitle');
    this.display  = document.getElementById('era-display');
    this.info     = document.getElementById('era-info');
    this.factDesc = document.getElementById('era-fact-desc');
    this._timer   = null;
    this.audioCtx = null;
  }

  _playTypewriterClick() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx && AudioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      const freq = 600 + Math.random() * 300;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.audioCtx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.03);
    } catch (e) {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  }

  _typeText(element, text, speed = 15, playSound = true, onComplete = null) {
    if (!element || !text) return;
    if (element._typeInterval) clearInterval(element._typeInterval);

    element.textContent = '';
    if (playSound && element === this.factDesc) {
      element.classList.add('typing');
    }

    let i = 0;
    element._typeInterval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        if (playSound && i % 2 === 0 && text.charAt(i) !== ' ' && text.charAt(i) !== '.') {
          this._playTypewriterClick();
        }
        i++;
      } else {
        clearInterval(element._typeInterval);
        element._typeInterval = null;
        if (playSound && element === this.factDesc) {
          element.classList.remove('typing');
        }
        if (onComplete) onComplete();
      }
    }, speed);
  }

  setEra(data) {
    if (!this.display) return;
    if (this._timer) clearTimeout(this._timer);

    // Kill any running tweens
    gsap.killTweensOf([this.display, this.info]);

    // Special case: Unknown World (Index 12) has the final full-screen message.
    // We completely hide the era title and info here so it doesn't overlap.
    if (data.index === 12) {
      gsap.to([this.display, this.info], { opacity: 0, duration: 0.5 });
      return;
    }

    // Fade in center title
    gsap.fromTo(this.display,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    );

    // Type out title & subtitle
    this._typeText(this.title, data.name, 35, false);
    this._typeText(this.subtitle, data.sub, 20, false);

    // Fade in lower-left fact and type out with audio
    if (this.info && this.factDesc && data.fact) {
      this.info.classList.add('visible');
      this.factDesc._lastFact = data.fact;
      gsap.fromTo(this.info,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power2.out', onComplete: () => {
          this._typeText(this.factDesc, data.fact, 16, true);
        }}
      );
    }

    // Auto fade out center title after 3.5s, keep lower-left fact visible
    this._timer = setTimeout(() => {
      gsap.to(this.display, { opacity: 0, y: -10, duration: 0.6, ease: 'power2.in' });
    }, 3500);
  }

  updateFact(newFactText) {
    if (!this.factDesc || !newFactText) return;
    if (this.factDesc._lastFact === newFactText) return;
    this.factDesc._lastFact = newFactText;
    this._typeText(this.factDesc, newFactText, 15, true);
  }
}
