const AudioEngine = {
  sampler: null,
  isPlaying: false,

  init() {
    this.sampler = new Tone.Sampler({
      urls: {
        C2: "samples/contrabass-C2.wav",
        C4: "samples/piccolo-C4.wav"
      },
      baseUrl: "samples/",
      onload: () => console.log("Samples loaded")
    }).toDestination();

    // === REPLACE THIS LOOP WITH  ALGORITHM ===
    Tone.Transport.scheduleRepeat((time) => {
      const note = Math.floor(random(30, 90));
      const vel = random(0.3, 1.0);
      const duration = random(["8n", "4n", "2n"]);
      
      this.sampler.triggerAttackRelease(
        Tone.Frequency(note, "midi").toNote(),
        duration,
        time,
        vel
      );
      
      // Dispatch to visuals — this line must stay
      if (window.onMidiEvent) {
        Tone.Draw.schedule(() => {
          window.onMidiEvent({ 
            note, 
            velocity: Math.round(vel * 127),
            x: map(note, 20, 100, 0, window.innerWidth),
            y: random(window.innerHeight * 0.3, window.innerHeight * 0.8)
          });
        }, time);
      }
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

document.getElementById('start').addEventListener('click', () => AudioEngine.start());