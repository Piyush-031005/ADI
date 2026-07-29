/**
 * AudioEngine — Cinematic DJ Mix Engine
 * Manages playback of curated MP3 tracks with seamless crossfading.
 * Boosts volume cleanly via Compressor to prevent digital distortion.
 */
import { gsap } from 'gsap';

export class AudioEngine {
  constructor() {
    this.currentEra = -1;
    this.tracks = {}; // Cache of { audio, gainNode }
    this.activeTrackUrl = null;
    this.activeTrackObj = null;

    // Track mapping with ?v=2 cache buster to force browser to grab updated MP3s
    this.eraToTrack = {
      0: '/music/void.mp3?v=2',
      1: '/music/singularity.mp3?v=2',
      2: '/music/bigbang.mp3?v=2',
      3: '/music/stars.mp3?v=2',
      4: '/music/black hole.mp3?v=2',
      5: '/music/rise of soalr system and earth.mp3?v=2',
      6: '/music/rise of soalr system and earth.mp3?v=2',
      7: '/music/camprian perod.mp3?v=2',
      8: '/music/dinosaur.mp3?v=2',
      9: '/music/human.mp3?v=2',
      10: '/music/cyberpunk future.mp3?v=2',
      11: '/music/unknown last era.mp3?v=2'
    };
    
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this._initialized = false;
  }

  // Must be called on user click to unlock AudioContext
  _init() {
    if (this._initialized) return;
    this._initialized = true;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();
    
    // Immediately resume the context
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.5; 
    
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-15, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    const urls = [...new Set(Object.values(this.eraToTrack))];
    urls.forEach(url => {
      const audio = new Audio(url);
      audio.loop = true;
      audio.crossOrigin = "anonymous";
      
      const trackGain = this.ctx.createGain();
      trackGain.gain.value = 0; // Start silenced
      
      try {
        const source = this.ctx.createMediaElementSource(audio);
        source.connect(trackGain);
        trackGain.connect(this.masterGain);
      } catch(e) {
        console.warn("Could not create media element source", e);
      }

      // Cut human era track in half to avoid the rap section, fade it and loop it
      if (url.includes('human.mp3')) {
        let isFading = false;
        audio.addEventListener('timeupdate', () => {
          if (audio.currentTime > 45 && !isFading && trackGain.gain.value > 0.1) {
            isFading = true;
            gsap.to(trackGain.gain, { 
              value: 0, 
              duration: 2, 
              ease: 'power2.inOut',
              onComplete: () => {
                audio.currentTime = 0;
                gsap.to(trackGain.gain, { 
                  value: 0.8, 
                  duration: 2, 
                  ease: 'power2.inOut',
                  onComplete: () => { isFading = false; }
                });
              }
            });
          }
        });
      }

      this.tracks[url] = { audio, gainNode: trackGain };
    });
  }

  setEra(index) {
    if (!this._initialized) this._init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (index === this.currentEra) return;
    this.currentEra = index;
    
    const targetUrl = this.eraToTrack[index];
    if (!targetUrl) return;

    if (this.activeTrackUrl === targetUrl) {
      return; 
    }

    this._fadeTo(targetUrl, index);
  }

  _fadeTo(targetUrl, eraIndex) {
    const nextTrack = this.tracks[targetUrl];
    if (!nextTrack) return;

    // Fade out previous rapidly to prevent sound lingering across era boundaries
    if (this.activeTrackObj && this.activeTrackObj !== nextTrack) {
      const prev = this.activeTrackObj;
      gsap.killTweensOf(prev.gainNode.gain);
      gsap.to(prev.gainNode.gain, {
        value: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          prev.audio.pause();
        }
      });
    }

    this.activeTrackUrl = targetUrl;
    this.activeTrackObj = nextTrack;
    gsap.killTweensOf(nextTrack.gainNode.gain);

    // Special track timings
    if (eraIndex === 1) {
      nextTrack.audio.currentTime = 3.0;
    } else if (eraIndex === 2) {
      nextTrack.audio.currentTime = 0; // Start Big Bang immediately at 0s
    }

    // Ensure it's playing
    const playPromise = nextTrack.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.warn("Audio play failed:", e);
      });
    }

    // Fade in: Big Bang (era 2) hits instantaneously at full volume, others fade smoothly over 1.2s
    const fadeDuration = (eraIndex === 2) ? 0.05 : 1.2;
    if (eraIndex === 2) {
      nextTrack.gainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);
    }
    gsap.to(nextTrack.gainNode.gain, {
      value: 1.0,
      duration: fadeDuration,
      ease: 'power2.out'
    });
  }
}

export const audioEngine = new AudioEngine();
