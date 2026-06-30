REFRACTION THROUGH TOTALITY  
Glitches Reveal Hidden Systems

Live version: https://nika-akin.github.io/thewrong-26/

---

## Concept

During a total solar eclipse, the impossible becomes visible: the Sun’s corona burns at ~2 million Kelvin while the surface below glows at ~5,800 K. This inversion – the Coronal Heating Problem – has puzzled astrophysicists for nearly a century.

**REFRACTION THROUGH TOTALITY** is an audiovisual web work that treats the eclipse not as occlusion, but as revelation. The Moon’s shadow acts as a debugging tool: by temporarily removing the Sun’s overwhelming brightness, it exposes hidden layers of structure. In the same way, glitches reveal underlying systems normally concealed by smooth operation.

The piece stages the eclipse as a sequence of phase transitions, where each transition exposes a different stratum of the sound and image engine. Errors are not failures but portals: bit-crushed edges, spectral smears, time-stretched phrasings and phase-shifted visual rings all make audible and visible the machinery that usually remains backgrounded.

The work is conceived for **The Wrong 2026 — Digital Musics & Sound Art**, and is designed to be experienced in a browser as a self-contained micro-environment.

---

## Experience

On launch, the visitor lands in a minimal textual interface: an eclipse icon pulses at the center, framed by a short exposition about the Coronal Heating Problem and a diagram of four phases. The interface announces itself as a system rather than a static page.

Pressing **[ ENTER ECLIPSE ]** fades the text layer and activates the audiovisual surface. From here, the work unfolds as a performative navigation through four distinct states:

1. **PHOTOSPHERIC**  
   Baseline activity. Dry signals, clear attacks, minimal spatial processing. The sonic field behaves as “expected”; the system appears stable.

2. **TRANSITION**  
   Lensing begins. Pitch bends, spectral stretching, spatial widening and subtle temporal smearing introduce uncertainty. Glitches start to mark the boundaries of the system.

3. **TOTALITY**  
   Coronal revelation. Ethereal pitch shifts, heavy chorus, extended reverbs and destabilized rhythms. The halo of the underlying engine is exposed; the piece lives in its own artifacts.

4. **RECOVERY**  
   Return transformed. Some processing recedes, but the memory of the hidden persists. The system never fully returns to its initial condition.

Throughout, the mouse acts as an improvised lens, scanning across the visual field to reveal additional coronal structures during totality. Sonic events and visual glitches are bound together so that every gesture leaks information about the architecture running underneath.

---

## Interaction

All interactions take place directly in the browser.

- **[SPACE]** – Advance through eclipse phases (Photospheric → Transition → Totality → Recovery).  
- **[D]** – Trigger a “Diamond Ring” glitch burst, a short, bright event at the edge of totality.  
- **Mouse / touch** – During totality, move across the screen to reveal and disturb coronal textures; small positional changes nudge both spatialisation and glitch behaviour.

The piece is designed to be both:

- **Playable** by a single visitor discovering the controls intuitively.  
- **Performable** by an operator who deliberately navigates phases and triggers events in response to an audience or context.

---

## Materials

The sound world is built from a small, focused set of close-mic recordings from a personal desk environment:

- **Percussive objects** – spoons, receipts, contact hits, body/desk impacts.  
- **Guitar fragments** – single notes, fifths, octave stacks, scraped textures.  
- **Rings and resonances** – bell-like decays and metallic tails.  
- **Voice grains** – short vocal fragments, breaths and broken syllables.

These samples are treated as particles that can be folded, stretched and scattered across the eclipse phases. Rather than simulating astrophysical sound, the work creates an **intimate, desktop-scale cosmos**, where the studio itself becomes a model of larger systemic behaviour: a small ecosystem of objects repeatedly refracted by the same algorithms.

---

## Technical Overview

**Platform**  
Browser-based, running entirely client-side.

**Core libraries**

- [`Tone.js`](https://tonejs.github.io/) – timing, scheduling, audio routing and effects.  
- [`p5.js`](https://p5js.org/) – drawing, animation and real-time visual response.

**Main files**

- `index.html` – text-based landing screen, global layout and entry logic.
- `audio_eclipse.js` – audio engine, sample loading, phase logic, glitch and effect routing.
- `sketch_eclipse.js` – p5.js sketch, eclipse rendering, coronal fields, visual glitching.
- `samples/` – all source audio materials organised into folders (`mydesk/`, `test/`, etc.).

The piece uses no server-side components; once loaded, all computation happens locally in the visitor’s browser.

---

## Running the Work

### 1. Online (recommended)

Visit the live link in a recent desktop browser:

- **URL:** https://nika-akin.github.io/thewrong-26/

Recommended: Chrome, Firefox or Edge, with headphones.

### 2. Local preview

To run the project locally from this repository:

1. Download or clone the repository.  
2. Serve the directory via a simple static server (to allow audio sample loading):

   ```bash
   # from the project root
   python -m http.server 8000
   # or using Node
   npx serve .
   ```

3. Open `http://localhost:8000` in a browser.

Because of browser autoplay policies, you may need to click `[ ENTER ECLIPSE ]` or `[ INITIALIZE ECLIPSE SYSTEM ]` before audio begins.

---

## Exhibition Notes

- **Duration**: Open-ended; the piece loops structurally but the path through phases can be continuously varied via performance.  
- **Mode**: Single-screen, interactive; suitable for both individual headphones and small space loudspeaker presentation.  
- **Ideal setup**: 1 laptop or dedicated machine, stable internet (if using the hosted version) or local server, stereo output, and a pointing device (mouse or trackpad).

For installations, the work can be left in an attractor state on the landing screen, inviting visitors to press `[ ENTER ECLIPSE ]` and start their own traversal through the eclipse.

---

## Credits

Concept, sound, and code: Veronika Akın  
Presented as part of **The Wrong 2026 – Digital Musics & Sound Art**.
