<div align="center">
  <img src="public/favicon.ico" alt="ADI Logo" width="100"/>
  <h1>ĀDI — Cosmic Evolution</h1>
  <h3><i>"The beginning is the end and the end is the beginning."</i></h3>
  <p><b>An Official Submission for the CodeStorm Hackathon</b></p>
</div>

---

## 🌌 The Experience

**ĀDI** (Sanskrit for "First" or "Beginning") is an interactive, cinematic, scroll-driven WebGL experience that takes you on a journey through **13.8 billion years** of cosmic and human evolution. 

From the total darkness of the pre-Big Bang Void, to the birth of the first stars, the reign of the dinosaurs, the rise of human civilization, and a glimpse into a cyberpunk future—every scroll moves you millions of years forward in time.

## 🚀 Technical Highlights
To achieve a smooth 60fps cinematic experience in the browser, this project utilizes advanced WebGL techniques:
- **Three.js & GSAP**: Orchestrated a complex `CatmullRomCurve3` camera flight path synchronized to the user's scroll percentage across 12 distinct eras.
- **Custom GLSL Shaders**: Wrote 100% custom vertex and fragment shaders for the Big Bang explosion, the Accretion Disk of the Black Hole, and the atmospheric scattering of Earth.
- **Staggered Concurrent Loading**: Implemented a custom asynchronous background model loader that guarantees zero main-thread lockups, allowing massive 3D cities and environments to load flawlessly while the user explores earlier eras.
- **Spatial Audio Engine**: Built a dynamic WebAudio API crossfading engine with dynamic GainNodes and Compression to seamlessly blend cinematic scores without audio clipping.

## 🛠️ Getting Started
Run the experience locally to witness the evolution:
```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production (Vercel ready)
npm run build
```

## ⏳ The 12 Eras
1. **The Void** (∞ Before)
2. **Singularity** (13.8 BYA)
3. **The Big Bang** (13.8 BYA)
4. **First Stars** (13.6 BYA)
5. **Stellar Death / Black Hole** (10.0 BYA)
6. **Solar System** (4.6 BYA)
7. **Earth** (4.4 BYA)
8. **First Life** (3.8 BYA)
9. **Cambrian Explosion** (540 MYA)
10. **Dinosaurs** (230 MYA)
11. **Humans** (300,000 YA)
12. **The Unknown Future** (∞ Ahead)

---
*Built with passion for CodeStorm.*
