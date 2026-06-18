//  generative audio engine
const AudioEngine = {
  sampler: null,
  isPlaying: false,

  init() {
    this.sampler = new Tone.Sampler({
      urls: { C2: "samples/contrabass-C2.wav", C4: "samples/piccolo-C4.wav" },
      baseUrl: "./",
      onload: () => console.log("Samples loaded")
    }).toDestination();

    // Example: generative loop (replaces this with his algorithm)
    Tone.Transport.scheduleRepeat((time) => {
      const note = Math.floor(Math.random() * 50) + 30; // random MIDI note
      const vel = Math.random() * 0.5 + 0.5;
      this.sampler.triggerAttackRelease(Tone.Frequency(note, "midi"), "8n", time, vel);
      
      // Dispatch to visuals
      if (window.onMidiEvent) window.onMidiEvent({ note, velocity: vel * 127, time });
    }, "4n");
  },

  start() {
    if (this.isPlaying) return;
    Tone.start();
    this.init();
    Tone.Transport.start();
    this.isPlaying = true;
    document.getElementById('start').style.display = 'none';
  }
};

// Click to start (browsers require user gesture for audio)
document.getElementById('start').addEventListener('click', () => AudioEngine.start());