// ============================================================
// AUDIO ENGINE — ECLIPSE AS PHASE TRANSITION
// "Glitches reveal hidden systems"
// ============================================================

const SAMPLE_DEFS = {
  "samples/mydesk/Perc/BD-Mic-hitty_16.wav": "C#2",
  "samples/mydesk/Perc/BD-Quittung_16.wav": "D2",
  "samples/mydesk/Guitar/git-f2-smooth_16.wav": "F2",
  "samples/mydesk/Guitar/Guitar-F2-5th-Hard_16.wav": "F2",
  "samples/mydesk/Voice/Voice7_16.wav": "A3",
  "samples/mydesk/Voice/Voice4_16.wav": "A3",
  "samples/mydesk/Rings/Ring3_16.wav": "C#5",
  "samples/mydesk/Voice/Voice1_16.wav": "A4",
  "samples/mydesk/Voice/Voice3_16.wav": "A4",
  "samples/mydesk/Rings/Ring1_16.wav": "C#6",
  "samples/mydesk/Rings/Ring2_16.wav": "C#6",
  "samples/mydesk/Perc/Click-Spoon1_16.wav": "C#7",
  "samples/mydesk/Perc/Click-Spoon2_16.wav": "C#7",
};

const AudioEngine = {
  sampler: null,
  isPlaying: false,
  isLoaded: false,
  analyser: null,
  eclipseState: 'PHOTOSPHERIC',
  totalActive: false,
  samplers: [],
  alfvenResonators: [],
  masterReverb: null,

  async start() {
    if (this.isPlaying) return;

    const btn = document.getElementById('start');
    btn.textContent = '[ LOADING SAMPLES... ]';

    await Tone.start();
    console.log('AudioContext started:', Tone.context.state);

    this.masterReverb = new Tone.Reverb({ decay: 6, wet: 0.5 });
    await this.masterReverb.ready;
    this.masterLimiter = new Tone.Limiter(-0.1);
    this.masterCompressor = new Tone.Compressor(-24, 3);

    this.masterReverb.chain(this.masterCompressor, this.masterLimiter, Tone.Destination);

    try {
      this.samplers = await Promise.all(
        Object.entries(SAMPLE_DEFS).map(async ([file, note]) => {
          const entry = await this._createSamplerEntry(note, file);
          return { ...entry, name: file };
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
      btn.textContent = '[ ERROR WHEN CREATING SAMPLERS ]';
    }

    this.analyser = new Tone.Analyser("fft", 1024);
    this.masterReverb.connect(this.analyser);
  },
  
  _createSamplerEntry(note, file) {
    return new Promise((resolve, reject) => {
      const delay = new Tone.FeedbackDelay(0.2, 0.0);
      const panner = new Tone.Panner();
      panner.pan.value = Math.random() * 2.0 - 1.0;
      const distortion = new Tone.Distortion(0.5);
      distortion.wet.value = 0.0;
      const crusher = new Tone.BitCrusher(8);
      crusher.wet.value = 0.0;
      const wah = new Tone.AutoWah();
      wah.baseFrequency.value = 100;
      wah.Q.value = 2;
      wah.follower.attack = 0.3;
      wah.wet.value = 0.0;
      const pitchShift = new Tone.PitchShift(0);
      pitchShift.wet.value = 0.0;
      const chorus = new Tone.Chorus(4, 2.5, 0.5).start();
      chorus.wet.value = 0.0;
      const reverbSend = new Tone.Gain(0.3);

      const sampler = new Tone.Sampler({
        urls: { [note]: file.replace("samples/", "") },
        baseUrl: "samples/",
        onload: () => resolve({ sampler, wah, distortion, crusher, delay, panner, pitchShift, chorus, reverbSend }),
        onerror: reject,
      }).chain(wah, distortion, crusher, delay, pitchShift, chorus, panner, reverbSend, this.masterReverb);
    });
  },  

  _beginPlayback() {
    if (!this.isLoaded || this.isPlaying) return;
    const btn = document.getElementById('start');
    btn.style.display = 'none';

    const scheduleNext = (time) => {
      if (!this.isPlaying || !this.samplers) return;

      const note = Math.floor(Math.random() * 36) + 48;
      const vel = Math.random() * 0.4 + 0.3;
      const duration = Math.random() * 3 + 1;
      const entry = this.samplers[Math.floor(Math.random() * this.samplers.length)];

      try {
        if (this.eclipseState === 'TOTALITY') {
          entry.pitchShift.pitch = 12;
          entry.pitchShift.wet.value = 0.7;
          entry.chorus.wet.value = 0.6;
          entry.reverbSend.gain.value = 0.8;
        } else if (this.eclipseState === 'TRANSITION') {
          entry.pitchShift.pitch = (Math.random() - 0.5) * 5;
          entry.pitchShift.wet.value = 0.4;
          entry.chorus.wet.value = 0.3;
          entry.reverbSend.gain.value = 0.5;
        } else {
          entry.pitchShift.pitch = 0;
          entry.pitchShift.wet.value = 0.0;
          entry.chorus.wet.value = 0.0;
          entry.reverbSend.gain.value = 0.3;
        }
        
        entry.sampler.triggerAttackRelease(
          Tone.Frequency(note, "midi").toNote(),
          duration,
          time,
          vel
        );
      } catch (err) {
        console.error('Problem with next note:', err);
      }

      Tone.Draw.schedule(() => {
        if (typeof window.onMidiEvent === 'function') {
          window.onMidiEvent({
            note: note,
            velocity: Math.round(vel * 127),
            duration: duration,
            x: map(note, 20, 100, 0, window.innerWidth),
            y: Math.random() * window.innerHeight * 0.5 + window.innerHeight * 0.25
          });
        }
      }, time);

      const nextInterval = Math.random() * 0.9 + 0.3;
      Tone.Transport.scheduleOnce(scheduleNext, "+" + nextInterval);
    };

    Tone.Transport.scheduleOnce(scheduleNext, "+0");
    Tone.Transport.start();
    this.isPlaying = true;
    console.log('Playback started');
  },

  setEclipseState(state) {
    this.eclipseState = state;
    this.totalActive = (state === 'TOTALITY');
    
    if (!this.samplers || !this.masterReverb) return;
    
    if (state === 'TOTALITY') {
      this.masterReverb.decay = 10;
    } else {
      this.masterReverb.decay = 6;
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
      
      entry.pitchShift.pitch = randomRange(-24, 24);
      entry.pitchShift.wet.value = 1.0;
      
      entry.sampler.triggerAttackRelease(
        Tone.Frequency(note, "midi").toNote(),
        duration,
        now + i * 0.05,
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
      entry.chorus.rate.value = 0.5 + intensity * 2;
      entry.chorus.wet.value = 0.6 + intensity * 0.3;
    });
  },

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

document.getElementById('start').addEventListener('click', () => {
  AudioEngine.start();
});

window.AudioEngine = AudioEngine;
