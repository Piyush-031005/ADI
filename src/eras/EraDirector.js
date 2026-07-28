import * as THREE from 'three';
import { gsap } from 'gsap';
import { EventBus, EVENTS } from '../utils/EventBus.js';
import { audioEngine } from '../audio/AudioEngine.js';
import { Timeline } from '../ui/Timeline.js';
import { EraTitle } from '../ui/EraTitle.js';
import { YearCounter } from '../ui/YearCounter.js';

import { Era0_Void }       from './Era0_Void.js';
import { Era1_Singularity} from './Era1_Singularity.js';
import { Era2_BigBang }    from './Era2_BigBang.js';
import { Era3_Stars }      from './Era3_Stars.js';
import { Era4_BlackHole }  from './Era4_BlackHole.js';
import { Era4_SolarSystem} from './Era4_SolarSystem.js';
import { Era5_Earth }      from './Era5_Earth.js';
import { Era6_Life }       from './Era6_Life.js';
import { Era7_Cambrian }   from './Era7_Cambrian.js';
import { Era8_Dinosaurs }  from './Era8_Dinosaurs.js';
import { Era9_Humans }     from './Era9_Humans.js';
import { Era10_Future }    from './Era10_Future.js';
import { Era11_Unknown }   from './Era11_Unknown.js';

export const ERA_DATA = [
  { index: 0,  name: 'THE VOID',        sub: 'Before time. Before space.',            year: '∞ Before',   color: '#ffffff',
    fact: 'Before the Big Bang, space and time did not exist. The concept of "before" loses physical meaning when there is no cosmic clock to measure it.' },
  { index: 1,  name: 'SINGULARITY',     sub: 'Everything. Compressed to a point.',    year: '13.8 BYA',   color: '#c8a96e',
    fact: 'All 2 trillion galaxies and 100 octillion stars in our observable universe were once compressed into a point 10²⁰ times smaller than a single subatomic proton.' },
  { index: 2,  name: 'THE BIG BANG',    sub: 'The universe. Born in a single instant.',year: '13.8 BYA',   color: '#ff6b35',
    fact: 'During cosmic inflation, space expanded faster than light, stretching the fabric of the universe by a factor of 10²⁶ in a fraction of a trillionth of a second.' },
  { index: 3,  name: 'FIRST STARS',     sub: 'Hydrogen collapses. Light ignites.',    year: '13.6 BYA',   color: '#7b8cde',
    fact: 'The first Population III stars were cosmic giants up to 300 times more massive than our Sun, burning pure hydrogen and shining millions of times brighter than any star today.' },
  { index: 4,  name: 'STELLAR DEATH',   sub: 'Gravity wins. A black hole is born.',   year: '10.0 BYA',   color: '#a855f7',
    fact: 'When a supermassive star dies in a hypernova explosion, its core collapses so violently that gravity bends spacetime until even light cannot escape.' },
  { index: 5,  name: 'SOLAR SYSTEM',    sub: 'Dust gathers. A star is born.',         year: '4.6 BYA',    color: '#e8923a',
    fact: 'Our Sun contains 99.86% of all mass in the Solar System. Earth, Jupiter, and all planets were built from the leftover 0.14% of solar nebular dust.' },
  { index: 6,  name: 'EARTH',           sub: 'Water. Oceans. The cradle of life.',    year: '4.4 BYA',    color: '#4a9eff',
    fact: '4.5 billion years ago, a Mars-sized planet named Theia collided with proto-Earth. The vaporized debris condensed in orbit to form our Moon.' },
  { index: 7,  name: 'FIRST LIFE',      sub: 'From the ocean. A single cell awakens.',year: '3.8 BYA',    color: '#4ade80',
    fact: 'Every living organism on Earth shares a single universal common ancestor (LUCA) that spawned near volcanic hydrothermal vents in deep primordial oceans.' },
  { index: 8,  name: 'CAMBRIAN',        sub: 'Life explodes into complexity.',        year: '540 MYA',    color: '#86efac',
    fact: 'During the Cambrian Explosion, animals developed eyes, shells, and claws for the first time, sparking the rapid evolutionary arms race of complex biodiversity.' },
  { index: 9,  name: 'DINOSAURS',       sub: 'Giants rule. Until fire falls from sky.',year: '230 MYA',   color: '#fbbf24',
    fact: 'Dinosaurs ruled Earth for 165 million years. The Chicxulub asteroid impact released energy equivalent to 10 billion atomic bombs, causing global firestorms.' },
  { index: 10, name: 'HUMANS',          sub: 'Curiosity. Fire. Cities. Stars.',       year: '300,000 YA', color: '#f0abfc',
    fact: 'Every human on Earth shares 99.9% identical DNA, and the iron atom in every red blood cell in your body was forged inside the core of a dying star.' },
  { index: 11, name: 'FUTURE',          sub: 'Technology and evolution merge.',       year: 'Tomorrow',   color: '#a855f7',
    fact: 'As artificial intelligence and cybernetics merge with human biology, humanity transcends planetary boundaries to sculpt orbital habitats and artificial intelligence.' },
  { index: 12, name: 'UNKNOWN WORLD',   sub: 'The future is not written in the stars. You are the author of what comes next.', year: '∞ Ahead', color: '#00ffff',
    fact: '13.8 billion years of cosmic evolution, star deaths, and planetary collisions led to this exact moment... led to you. You are the universe expressing itself as a human for a little while. Evolution never ended—you are standing on its latest chapter.' },
];

/**
 * EraDirector — Central coordinator for all eras.
 * Listens to ERA_CHANGE, fades eras in/out, updates UI.
 */
export class EraDirector {
  constructor(experience) {
    this.exp = experience;
    this.currentEra = null;
    this.currentIndex = -1;

    // UI systems
    this.timeline = new Timeline(ERA_DATA);
    this.eraTitle = new EraTitle();
    this.yearCounter = new YearCounter();
    this.audio = audioEngine;

    // Build all eras
    this.eras = [
      new Era0_Void(experience),
      new Era1_Singularity(experience),
      new Era2_BigBang(experience),
      new Era3_Stars(experience),
      new Era4_BlackHole(experience),
      new Era4_SolarSystem(experience),
      new Era5_Earth(experience),
      new Era6_Life(experience),
      new Era7_Cambrian(experience),
      new Era8_Dinosaurs(experience),
      new Era9_Humans(experience),
      new Era10_Future(experience),
      new Era11_Unknown(experience),
    ];

    // Hide all eras initially
    this.eras.forEach(e => e.hide(0));

    // Start at era 0
    this._transitionTo(0);

    EventBus.on(EVENTS.ERA_CHANGE, ({ index }) => {
      if (index !== this.currentIndex) {
        this._transitionTo(index);
      }
    });

    EventBus.on(EVENTS.SCROLL_PROGRESS, ({ eraIndex, eraT }) => {
      if (this.currentEra) this.currentEra.onScrollT(eraT);
      this.timeline.setProgress(eraIndex, eraT);
      this.yearCounter.setEra(eraIndex, eraT);

      // GPU PRE-WARM: When user is in Era 8 (Dinosaurs) and > 50% through,
      // pre-compile Era 9 (Humans) so there is ZERO stutter on transition.
      if (eraIndex === 9 && eraT > 0.5 && !this._era9PreWarmed) {
        this._era9PreWarmed = true;
        const era9 = this.eras[10]; // index 10 = Era9_Humans
        if (era9 && era9.group) {
          // Force render to GPU in the background — eliminates the 4-5s freeze
          requestAnimationFrame(() => {
            era9.group.visible = true;
            this.exp.renderer.instance.compile(era9.group, this.exp.camera.instance);
            era9.group.visible = false;
          });
        }
      }
    });
  }

  _transitionTo(index) {
    if (index === this.currentIndex) return;

    const isForward = this.currentIndex === -1 ? true : (index > this.currentIndex);

    const outEra = this.currentEra;
    const inEra  = this.eras[index];
    const data   = ERA_DATA[index];

    this.currentIndex = index;
    this.currentEra   = inEra;

    // Fade out old
    if (outEra) outEra.hide(0.5);

    // Set camera path
    const path = inEra.getCameraPath();
    if (path) this.exp.camera.setPath(path, isForward);

    // Fade in new immediately without artificial delay
    inEra.show(0.8);

    // Update UI
    this.eraTitle.setEra(data);
    this.timeline.setActive(index);
    this.audio.setEra(index);

    // Special: big bang flash
    if (index === 2) {
      setTimeout(() => {
        this.exp.renderer.flash(1.0);
      }, 50);
    }

    // Final message
    const finalMsg = document.getElementById('final-message');
    if (finalMsg) {
      finalMsg.classList.toggle('visible', index === 12);
    }
  }

  update() {
    const time = this.exp.time.elapsed;
    if (this.currentEra) this.currentEra.update(time);
  }
}
