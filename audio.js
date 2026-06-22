// ============================================================
// AUDIO ENGINE — Robust version with loading states & debug
// For The Wrong 2026 — Tone.js
// ============================================================

const SAMPLE_DEFS = {
  "contrabass-C2.wav": "C2",
  "piccolo-C4.wav": "C4",
  // ...
};

const AudioEngine = {
  sampler: null,
  isPlaying: false,
  isLoaded: false,
  analyser: null,

  async start() {
    if (this.isPlaying) return;

    const btn = document.getElementById('start');
    btn.textContent = '[ LOADING SAMPLES... ]';

    // 1. Start the AudioContext (browser requires user gesture)
    await Tone.start();
    console.log('AudioContext started:', Tone.context.state);

    // 1. Global effects — created first so samplers can route into them
    this.masterReverb  = new Tone.Reverb({ decay: 4, wet: 0.4 });
    await this.masterReverb.ready;
    this.masterLimiter = new Tone.Limiter(-0.1);  // -2dB, just catches peaks

    // Chain global bus → destination
    this.masterReverb.chain(this.masterLimiter, Tone.Destination);

    try {
      // Promise.all waits for every sampler to finish loading
      this.samplers = await Promise.all(
        Object.entries(SAMPLE_DEFS).map(async ([file, note]) => {
          const entry = await this._createSamplerEntry(note, file);
          return { ...entry, name: file };  // name = "contrabass-C2.wav"
        })
      );
      
      this.isLoaded = true;
      console.log(`${this.samplers.length} samplers loaded`);
      this._beginPlayback();
    } catch (err) {
      console.error('Sample load error:', err);
      btn.textContent = '[ ERROR WHEN CREATING SAMPLERS ]';
    }

    // 3. Optional: Add an analyser for spectral sync
    // TODO connect to global output
    this.analyser = new Tone.Analyser("fft", 1024);
    //this.sampler.connect(this.analyser);

    // 4. If samples are cached/fast, onload might fire before we reach here.
    // So also check after a tick:
    //setTimeout(() => {
    //  if (this.sampler.loaded && !this.isLoaded) {
    //    this.isLoaded = true;
    //    console.log('Samples already loaded (cached)');
    //    this._beginPlayback();
    //  }
    //}, 100);
  },
  
_createSamplerEntry(note, file) {
  return new Promise(async (resolve, reject) => {
    // Each entry gets its own independent effects
    // list of effect parameters:
    // https://tonejs.github.io/docs/r13/Reverb
    const delay = new Tone.FeedbackDelay(0.2, 0.0); // delayTime, feedback
    const panner = new Tone.Panner()
    panner.pan.value = Math.random() * 2.0 - 1.0  // Range: -1 (left) to 1 (right), 0 is center
    const distortion = new Tone.Distortion() // distortion
    distortion.distortion.value = 0.5
    distortion.wet.value = 0.0
    const crusher = new Tone.BitCrusher()
    crusher.bits.value = 8
    crusher.wet.value = 0.0
    const wah = new Tone.AutoWah()
    wah.wet.attack = 1.0
    wah.wet.q = 6
    wah.wet.value = 0.0

    const sampler = new Tone.Sampler({
      urls: { [note]: file },
      baseUrl: "samples/",
      onload: () => resolve({ sampler, wah, distortion, crusher, delay, panner }),
      onerror: reject,
    }).chain(wah, distortion, crusher, delay, panner, this.masterReverb);
  });
},  

_beginPlayback() {
  if (!this.isLoaded || this.isPlaying) return;
  const btn = document.getElementById('start');
  btn.style.display = 'none';

  // Mirrors Python: random.uniform(0.02, 1.5) ** 2
  // Range ~0.0004s–2.25s, skewed heavily toward short gaps
  const future = () => {
    const r = Math.random() * (2.5 - 0.01) + 0.01;
    return r * r;
  };

  const scheduleNext = (time) => {
    if (!this.isPlaying || !this.samplers ) return;

    const note = Math.floor(Math.random() * 120) + 5;
    const vel  = Math.random() * 0.8 + 0.2;
    const duration = (Math.random() * 10.0 + 2.0); // 0.05s – 1.0s

    // Pick a random sampler + its effects
    const entry = this.samplers[Math.floor(Math.random() * this.samplers.length)];

    entry.sampler.triggerAttackRelease(
      Tone.Frequency(note, "midi").toNote(),
      duration,
      time,
      vel
    );

    // Mutate that sampler's own effects independently
    //entry.delay.delayTime.value = Math.random();
    
    Tone.Draw.schedule(() => {
      if (typeof window.onMidiEvent === 'function') {
        window.onMidiEvent({
          note:     note,
          velocity: Math.round(vel * 127),
          x: map(note, 20, 100, 0, window.innerWidth),
          y: Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.25
        });
      }
    }, time);

    // Each note schedules the next — mirrors the Python `target_time = future()` line
    Tone.Transport.scheduleOnce(scheduleNext, "+" + future());
  };

  // Kick off the chain immediately
  Tone.Transport.scheduleOnce(scheduleNext, "+0");

  //Tone.Transport.bpm.value = 50;
  Tone.Transport.start();
  this.isPlaying = true;
  console.log('Playback started. BPM:', Tone.Transport.bpm.value);
},

  // Call this from sketch.js if you want spectral data
  getFFT() {
    if (!this.analyser) return null;
    return this.analyser.getValue();
  }
};

// Click handler
document.getElementById('start').addEventListener('click', () => {
  AudioEngine.start();
});

// Also handle touch for mobile
document.getElementById('start').addEventListener('touchstart', (e) => {
  e.preventDefault();
  AudioEngine.start();
});
