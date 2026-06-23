// ============================================================
// AUDIO ENGINE — Merged version with Nika's eclipse functions
// For The Wrong 2026 — Tone.js
// ============================================================

const SAMPLE_DEFS = {
  ///*
  "samples/mydesk/Guitar/git-f2-smooth_16.wav": "F2",
  "samples/mydesk/Guitar/Guitar-F2-5th-Hard_16.wav": "F2",
  "samples/mydesk/Guitar/Guitar-F3-OctaveBelow_16.wav": "F3",
  //"samples/mydesk/Guitar/Guitar-F3-OctaveBelow-NoAttack_16.wav": "F3",
  //*/
  
  ///*
  "samples/mydesk/Voice/Voice1_16.wav": "A4",
  "samples/mydesk/Voice/Voice3_16.wav": "A4",
  //"samples/mydesk/Voice/Voice4_16.wav": "A3",
  "samples/mydesk/Voice/Voice7_16.wav": "A3",
  //*/
  
  ///*
  "samples/mydesk/Rings/Ring1_16.wav": "C#6",
  "samples/mydesk/Rings/Ring2_16.wav": "C#6",
  "samples/mydesk/Rings/Ring3_16.wav": "C#5",
  //"samples/mydesk/Rings/Ring4_16.wav": "C#6",
  //"samples/mydesk/Rings/Ring5_16.wav": "C#6",
  //"samples/mydesk/Rings/Ring6_16.wav": "C#6",
  //*/
  
  ///*
  //"samples/mydesk/Perc/BD-Git-Fist_16.wav": "C#3",
  //"samples/mydesk/Perc/BD-Mic-dumb_16.wav": "C#3",
  "samples/mydesk/Perc/BD-Mic-hitty_16.wav": "C#3",
  "samples/mydesk/Perc/BD-Quittung_16.wav": "C#3",
  "samples/mydesk/Perc/Click-Spoon1_16.wav": "C#7",
  "samples/mydesk/Perc/Click-Spoon2_16.wav": "C#7",
  //"samples/mydesk/Perc/Click-Spoon3_16.wav": "C#7",
  //"samples/mydesk/Perc/SN-Guitar-Clap2_16.wav": "C#4",
  "samples/mydesk/Perc/SN-Guitar-Clap_16.wav": "C#4",
  "samples/mydesk/Perc/SN-Quittung-Hard_16.wav": "C#4",
  //"samples/mydesk/Perc/SN-Quittung-Soft_16.wav": "C#4",
  //*/
};

const TWEAKS = [
  { label: "delay time",         apply: e => e.delay.delayTime.value       = Math.random() * 0.8 },
  { label: "delay feedback",     apply: e => e.delay.feedback.value        = Math.random() * 0.5 },
  { label: "panner",             apply: e => e.panner.pan.value            = Math.random() * 2 - 1 },
  { label: "distortion amount",  apply: e => e.distortion.distortion.value = Math.random() },
  { label: "distortion wet",     apply: e => e.distortion.wet.value        = Math.random() },
  { label: "crusher bits",       apply: e => e.crusher.bits.value          = Math.floor(Math.random() * 7) + 1 },
  { label: "crusher wet",        apply: e => e.crusher.wet.value           = Math.random() },
  { label: "wah wet",            apply: e => e.wah.wet.value               = Math.random() },
  { label: "wah q",              apply: e => e.wah.Q.value                 = Math.random() * 7 + 1 },
  { label: "wah base frequency", apply: e => e.wah.baseFrequency.value     = Math.random() * 600 + 50 },
  { label: "wah attack",         apply: e => e.wah.follower.attack         = Math.random() },
];

const AudioEngine = {
  sampler: null,
  isPlaying: false,
  isLoaded: false,
  analyser: null,
  isStarting: false,
  eclipseState: 'PHOTOSPHERIC',
  totalActive: false,
  samplers: [],
  alfvenResonators: [],
  masterReverb: null,


  async start() {
    if (this.isPlaying || this.isStarting) return;
    this.isStarting = true;

    // Synchronously poke the AudioContext while still inside the gesture
    if (Tone.context.state !== 'running') {
      Tone.context.rawContext.resume(); // iOS unlock — don't await here
    }

    const btn = document.getElementById('start');
    btn.textContent = '[ LOADING SAMPLES... ]';

    // 1. Start the AudioContext (browser requires user gesture)
    await Tone.start();
    console.log('AudioContext started:', Tone.context.state);

    // 1. Global effects — created first so samplers can route into them
    this.masterReverb  = new Tone.Reverb({ decay: 6, wet: 0.5 });
    await this.masterReverb.ready;
    this.masterLimiter = new Tone.Limiter(-0.1);  // -2dB, just catches peaks

    // Chain global bus → destination
    this.masterReverb.chain(this.masterLimiter, Tone.Destination);

    try {
      // Promise.all waits for every sampler to finish loading
      this.samplers = await Promise.all(
        Object.entries(SAMPLE_DEFS).map(async ([file, note]) => {
          const entry = await this._createSamplerEntry(note, file);
          return { ...entry, name: file };  // name = "contrabass-C2_16.wav"
        })
      );
      
      this.isLoaded = true;
      console.log(`${this.samplers.length} samplers loaded`);
      
      for (let i = 0; i < 8; i++) {
        this.alfvenResonators.push(new Tone.LFO(randomRange(8, 15), 0, 1).start());
      }      
      
      this._beginPlayback();
    } catch (err) {
      console.error('Sample load error:', err);
      btn.textContent = '[ ERROR WITH AUDIO ]';
    }

    // 3. Optional: Add an analyser for spectral sync
    this.analyser = new Tone.Analyser("fft", 1024);
    this.masterReverb.connect(this.analyser);
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
    crusher.bits.value = 16
    crusher.wet.value = 0.0
    const wah = new Tone.AutoWah()
    wah.baseFrequency.value = 100
    wah.Q.value = 2
    wah.follower.attack = 0.3
    wah.wet.value = 0.0
    const chorus = new Tone.Chorus(4, 2.5, 0.5).start();
    chorus.wet.value = 0.0;
    
    const sampler = new Tone.Sampler({
      urls: { [note]: file },
      baseUrl: "",
      onload: () => resolve({ sampler, wah, distortion, crusher, delay, panner, chorus }),
      onerror: reject,
    }).chain(wah, distortion, crusher, delay, panner, chorus, this.masterReverb);
  });
},  

_beginPlayback() {
  if (!this.isLoaded || this.isPlaying) return;
  const btn = document.getElementById('start');
  btn.style.display = 'none';

  // Mirrors Python: random.uniform(0.02, 1.5) ** 2
  // Range ~0.0004s–2.25s, skewed heavily toward short gaps
  const future = () => {
    const r = Math.random() * 2.5 + 0.001;
    return r * r;
  };

  const scheduleNext = (time) => {
    if (!this.isPlaying || !this.samplers ) return;

    var note = Math.floor(Math.random() * 60) + 31;
    const vel  = Math.random() * 0.5 + 0.4;
    var duration = (Math.random() * 3 + 1);

    // Pick a random sampler + its effects
    const entry = this.samplers[Math.floor(Math.random() * this.samplers.length)];

    try {
      if (this.eclipseState === 'TOTALITY') {
        note = note + 30;
        entry.chorus.wet.value = 0.5;
        this.masterReverb.decay.value = 8;
        this.masterReverb.wet.value = 0.8;
      } else if (this.eclipseState === 'TRANSITION') {
        note = note - 30;
        entry.chorus.wet.value = 1.0;
        this.masterReverb.decay.value = 6;
        this.masterReverb.wet.value = 0.6;
        duration = (Math.random() * 5 + 7);
      } else {
        entry.chorus.wet.value = 0.0;
        this.masterReverb.decay.value = 4;
        this.masterReverb.wet.value = 0.3;
      }

      entry.sampler.triggerAttackRelease(
        Tone.Frequency(note, "midi").toNote(),
        duration,
        time,
        vel
      );
      console.log('Triggered note:', entry.name, note, duration, time, vel);
    } catch (err) {
      console.error('Problem with next note:', err);
    }

    try {
        // Mutate a random effects parameter
        const tweak = TWEAKS[Math.floor(Math.random() * TWEAKS.length)];
        tweak.apply(entry);
        console.log(`${entry.name} -> ${tweak.label}`);
    } catch (err) {
      console.error('Problem while tweaking:', err);
    }
    
    Tone.Draw.schedule(() => {
      if (typeof window.onMidiEvent === 'function') {
        window.onMidiEvent({
          note:     note,
          velocity: Math.round(vel * 127),
          duration: duration,
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
  console.log('Playback started.');
},

  setEclipseState(state) {
    this.eclipseState = state;
    this.totalActive = (state === 'TOTALITY');
    
    if (!this.samplers || !this.masterReverb) return;
    
    if (state === 'TOTALITY') {
      this.masterReverb.decay.value = 10;
    } else {
      this.masterReverb.decay.value = 6;
    }
  },

  triggerDiamondRing() {
    if (!this.samplers) return;
    
    const now = Tone.now();
    for (let i = 0; i < 8; i++) {
      const entry = this.samplers[Math.floor(Math.random() * this.samplers.length)];
      const note = Math.floor(randomRange(72, 96));
      const vel = randomRange(0.6, 1.0);
      const duration = randomRange(0.1, 0.4);
      
      entry.sampler.triggerAttackRelease(
        Tone.Frequency(note, "midi").toNote(),
        duration,
        Math.max(now, now + i * 0.05 + (Math.random()*0.1 -0.05)),
        vel
      );
    }
  },
  
  advancePhase() {
    const phases = ['PHOTOSPHERIC', 'TRANSITION', 'TOTALITY', 'RECOVERY'];
    const idx = phases.indexOf(this.eclipseState);
    this.setEclipseState(phases[(idx + 1) % phases.length]);
    console.log('Phase advanced to: ' + phases[(idx + 1) % phases.length]);
  },

  revealCorona(x, y) {
    if (!this.totalActive || !this.samplers) return;
    const intensity = map(y, 0, window.innerHeight, 1, 0);
    this.samplers.forEach(entry => {
      entry.chorus.frequency.value = 0.5 + intensity * 2;
      entry.chorus.wet.value = 0.6 + intensity * 0.3;
    });
  },

  // Call this from sketch.js if you want spectral data
  getFFT() {
    if (!this.analyser) return null;
    return this.analyser.getValue();
  }
};

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

const handleStart = (e) => {
  e.preventDefault();
  AudioEngine.start();
};

const btn = document.getElementById('start');
btn.addEventListener('click', handleStart);
btn.addEventListener('touchstart', handleStart, { passive: false });
