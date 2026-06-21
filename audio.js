// ============================================================
// AUDIO ENGINE — Robust version with loading states & debug
// For The Wrong 2026 — Tone.js
// ============================================================

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

    // 1b. Create effects
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.4 });
    this.delay  = new Tone.FeedbackDelay("8n", 0.35);
    //this.filter = new Tone.Filter(2000, "lowpass");

    // 2. Create the sampler
    this.sampler = new Tone.Sampler({
      urls: {
        C2: "contrabass-C2.wav",
        //C4: "piccolo-C4.wav",
      },
      baseUrl: "samples/",
      onload: () => {
        this.isLoaded = true;
        console.log('All samples loaded');
        this._beginPlayback();
      },
      onerror: (err) => {
        console.error('Sample load error:', err);
        btn.textContent = '[ ERROR: SAMPLES NOT FOUND ]';
      }
    }).chain(this.delay, this.reverb, Tone.Destination); // signal flows left to right

    // 3. Optional: Add an analyser for spectral sync
    this.analyser = new Tone.Analyser("fft", 1024);
    this.sampler.connect(this.analyser);

    // 4. If samples are cached/fast, onload might fire before we reach here.
    // So also check after a tick:
    setTimeout(() => {
      if (this.sampler.loaded && !this.isLoaded) {
        this.isLoaded = true;
        console.log('Samples already loaded (cached)');
        this._beginPlayback();
      }
    }, 100);
  },

_beginPlayback() {
  if (!this.isLoaded || this.isPlaying) return;
  const btn = document.getElementById('start');
  btn.style.display = 'none';

  // Mirrors Python: random.uniform(0.02, 1.5) ** 2
  // Range ~0.0004s–2.25s, skewed heavily toward short gaps
  const future = () => {
    const r = Math.random() * (1.5 - 0.02) + 0.02;
    return r * r;
  };

  const scheduleNext = (time) => {
    if (!this.isPlaying || !this.sampler || !this.sampler.loaded) return;

    const note = Math.floor(Math.random() * 120) + 5;
    const vel  = Math.random() * 0.8 + 0.2;
    const duration = (Math.random() * 10.0 + 2.0); // 0.05s – 1.0s

    this.sampler.triggerAttackRelease(
      Tone.Frequency(note, "midi").toNote(),
      duration,
      time,
      vel
    );

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
