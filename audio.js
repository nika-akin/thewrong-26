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

    // 2. Create the sampler
    this.sampler = new Tone.Sampler({
      urls: {
        C2: "contrabass-C2.wav",
        C4: "piccolo-C4.wav"
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
    }).toDestination();

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

    // === YOUR FRIEND'S GENERATIVE ALGORITHM GOES HERE ===
    // Replace this placeholder loop with his actual MIDI generation logic.
    // The key rule: every note must call window.onMidiEvent({note, velocity, x, y})

    Tone.Transport.scheduleRepeat((time) => {
      // Only generate if sampler is ready
      if (!this.sampler || !this.sampler.loaded) return;

      const note = Math.floor(Math.random() * 60) + 30;  // MIDI 30-90
      const vel = Math.random() * 0.7 + 0.3;             // 0.3 - 1.0
      const duration = Math.random() > 0.5 ? "8n" : "4n";

      // Trigger the sound
      this.sampler.triggerAttackRelease(
        Tone.Frequency(note, "midi").toNote(),
        duration,
        time,
        vel
      );

      // Send to visuals — synchronized via Tone.Draw
      Tone.Draw.schedule(() => {
        if (typeof window.onMidiEvent === 'function') {
          window.onMidiEvent({
            note: note,
            velocity: Math.round(vel * 127),
            x: map(note, 20, 100, 0, window.innerWidth),
            y: Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.25
          });
        }
      }, time);

    }, "4n");  // Every quarter note — adjust to your friend's tempo

    // Start transport
    Tone.Transport.bpm.value = 90;  // Adjust tempo here
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
