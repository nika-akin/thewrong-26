let particles = [];

// This function is called by audio.js whenever a note plays
window.onMidiEvent = function(event) {
  particles.push({
    x: map(event.note, 20, 100, 0, width),
    y: height / 2,
    size: map(event.velocity, 0, 127, 5, 80),
    hue: map(event.note, 20, 100, 0, 360),
    birth: millis(),
    life: 2000
  });
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB);
}

function draw() {
  background(0, 0, 0, 0.15); // trail effect
  
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    let age = millis() - p.birth;
    if (age > p.life) { particles.splice(i, 1); continue; }
    
    let progress = age / p.life;
    fill(p.hue, 90, 100, 1 - progress);
    noStroke();
    ellipse(p.x, p.y + sin(age * 0.01) * 50, p.size * (1 - progress));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}