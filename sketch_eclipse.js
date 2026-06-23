// ============================================================
// ECLIPSE AS PHASE TRANSITION — Ars Electronica Entry
// "Glitches reveal hidden systems"
// The corona is always here — the eclipse reveals it through sonic refraction
// ============================================================

let terrain = [];
let coronalField = [];
let bailyBeads = [];
let alfvénWaves = [];
let shadowBands = [];
let eclipseState = 'PHOTOSPHERIC';
let stateTimer = 0;
let hysteresisThreshold = 0.5;
let accumulatedEnergy = 0;
let diamondRing = { active: false, x: 0, y: 0, intensity: 0, phase: 0 };
const LAYERS = 12;
const FIELD_LINES = 24;
const BEAD_SPAWN_RATE = 0.02;

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block');
  colorMode(HSB, 360, 100, 100, 1);
  noSmooth();
  
  initCoronalField();
  initTerrain();
  initShadowBands();
  console.log('p5 canvas created:', width, 'x', height);
}



function initCoronalField() {
  coronalField = [];
  for (let i = 0; i < FIELD_LINES; i++) {
    let angle = map(i, 0, FIELD_LINES, 0, TWO_PI);
    coronalField.push({
      angle: angle,
      baseLength: random(150, 400),
      flowOffset: random(TWO_PI),
      velocity: random(0.002, 0.008),
      temperature: random(1, 3), // Million Kelvin
      alfvenPhase: 0
    });
  }
}

function initTerrain() {
  terrain = [];
  for (let layer = 0; layer < LAYERS; layer++) {
    let points = [];
    let yBase = map(layer, 0, LAYERS - 1, height * 0.4, height * 0.95);
    let segments = 180;
    
    for (let i = 0; i <= segments; i++) {
      let x = map(i, 0, segments, 0, width);
      // Multi-octave lunar limb profile
      let n = lunarNoise(x, layer, frameCount);
      let y = yBase + n * map(layer, 0, LAYERS - 1, 80, 15);
      
      points.push({
        x: x,
        y: y,
        originalY: y,
        concavity: 0,
        beadActive: false
      });
    }
    
    // Calculate concavity for Baily's bead spawning
    for (let i = 2; i < points.length - 2; i++) {
      let secondDeriv = points[i-2].y - 2*points[i].y + points[i+2].y;
      points[i].concavity = secondDeriv;
    }
    
    terrain.push({
      points: points,
      hue: 45, // Photospheric gold
      sat: 90,
      bri: map(layer, 0, LAYERS - 1, 95, 60),
      alpha: map(layer, 0, LAYERS - 1, 0.9, 0.4),
      layer: layer
    });
  }
}

function lunarNoise(x, layer, time) {
  // Combine multiple noise octaves for rugged lunar topography
  let n = 0;
  n += noise(x * 0.003, layer * 50) * 1.0;
  n += noise(x * 0.008, layer * 50 + 100) * 0.5;
  n += noise(x * 0.02, layer * 50 + 200) * 0.25;
  // Sharp valleys for bead formation
  n -= pow(noise(x * 0.015, time * 0.001), 3) * 0.3;
  return (n - 0.5) * 2;
}

function initShadowBands() {
  shadowBands = [];
  for (let i = 0; i < 8; i++) {
    shadowBands.push({
      x: random(-width, width),
      width: random(30, 80),
      speed: random(2, 6),
      amplitude: random(5, 20),
      frequency: random(0.02, 0.08),
      phase: random(TWO_PI)
    });
  }
}

// Called by audio.js when a MIDI note plays
window.onMidiEvent = function(event) {
  // Accumulate energy — makes totality harder to reach
  accumulatedEnergy += event.velocity / 127.0 * 0.03;
  
  // Spawn Baily's bead at note position
  if (eclipseState === 'TRANSITION' || eclipseState === 'RECOVERY') {
    spawnBailyBead(event.x, event.y, event.velocity);
  }
  
  // Alfvén wave emission during totality
  if (eclipseState === 'TOTALITY') {
    emitAlfvénWave(event.x, event.y);
  }
};

function spawnBailyBead(x, y, velocity) {
  // Find nearest terrain concavity point
  for (let layer of terrain) {
    for (let p of layer.points) {
      if (abs(p.x - x) < 50 && abs(p.y - y) < 50) {
        if (p.concavity > 0.3 && !p.beadActive) {
          bailyBeads.push({
            x: p.x,
            y: p.y,
            layer: layer.layer,
            birth: millis(),
            life: random(500, 2000),
            intensity: map(velocity, 0, 127, 0.5, 1.0),
            chromaSep: random(-15, 15)
          });
          p.beadActive = true;
          setTimeout(() => { p.beadActive = false; }, 2000);
        }
      }
    }
  }
}

function emitAlfvénWave(x, y) {
  alfvénWaves.push({
    x: x,
    y: y,
    radius: 10,
    maxRadius: random(width, width * 1.5),
    speed: random(3, 8),
    amplitude: random(20, 60),
    frequency: random(8, 15),
    hue: random(200, 340)
  });
}

function draw() {
  // State machine logic
  updateEclipseState();
  
  // Background: dynamic range compression reveals corona
  drawBackground();
  
  // Coronal magnetic field (visible during totality/transition)
  drawCoronalField();
  
  // Shadow bands sweep across terrain
  drawShadowBands();
  
  // Terrain layers with inverse temperature mapping
  drawTerrain();
  
  // Baily's beads as phoneme triggers
  drawBailyBeads();
  
  // Diamond ring singularity
  if (diamondRing.active) {
    drawDiamondRing();
  }
  
  // Alfvén wave propagation
  drawAlfvénWaves();
  
  // State indicator
  drawStateHUD();
}

function updateEclipseState() {
  stateTimer++;
  
  switch (eclipseState) {
    case 'PHOTOSPHERIC':
      // Energy accumulation makes transition harder
      hysteresisThreshold = constrain(0.3 + accumulatedEnergy * 0.1, 0.3, 0.9);
      if (stateTimer > random(300, 600)) {
        eclipseState = 'TRANSITION';
        stateTimer = 0;
        initiateTransition();
      }
      break;
      
    case 'TRANSITION':
      // Gradual dimming, beads emerge
      if (stateTimer > random(400, 800)) {
        eclipseState = 'TOTALITY';
        stateTimer = 0;
        triggerDiamondRing();
      }
      break;
      
    case 'TOTALITY':
      // Silence period — corona visible
      // Audience must be "quiet" (low energy accumulation) to exit
      if (accumulatedEnergy < hysteresisThreshold && stateTimer > 500) {
        eclipseState = 'RECOVERY';
        stateTimer = 0;
        accumulatedEnergy *= 0.5; // Partial reset
      } else if (stateTimer > 1800) {
        // Forced recovery after maximum duration
        eclipseState = 'RECOVERY';
        stateTimer = 0;
      }
      break;
      
    case 'RECOVERY':
      // Slow return with memory
      if (stateTimer > random(600, 1000)) {
        eclipseState = 'PHOTOSPHERIC';
        stateTimer = 0;
        accumulatedEnergy *= 0.7; // Hysteresis — never fully resets
      }
      break;
  }
  
  // Decay accumulated energy slowly
  accumulatedEnergy *= 0.995;
}

function initiateTransition() {
  // Prepare diamond ring position
  diamondRing.x = width * 0.5 + random(-200, 200);
  diamondRing.y = height * 0.35 + random(-50, 50);
}

function triggerDiamondRing() {
  diamondRing.active = true;
  diamondRing.phase = 0;
  diamondRing.intensity = 1.0;
  
  // Trigger glitch burst in audio engine
  if (typeof AudioEngine !== 'undefined' && AudioEngine.triggerDiamondRing) {
    AudioEngine.triggerDiamondRing();
  }
  
  // Spawn intense bead cluster
  for (let i = 0; i < 12; i++) {
    bailyBeads.push({
      x: diamondRing.x + random(-80, 80),
      y: diamondRing.y + random(-30, 30),
      layer: random(0, 3),
      birth: millis(),
      life: random(2000, 5000),
      intensity: random(0.8, 1.0),
      chromaSep: random(-25, 25),
      isDiamond: i === 0
    });
  }
}

function drawBackground() {
  let bgBrightness, bgNoise;
  
  switch (eclipseState) {
    case 'PHOTOSPHERIC':
      bgBrightness = map(accumulatedEnergy, 0, 1, 8, 15);
      bgNoise = 0.02;
      break;
    case 'TRANSITION':
      bgBrightness = map(stateTimer, 0, 800, 8, 4);
      bgNoise = map(stateTimer, 0, 800, 0.02, 0.1);
      break;
    case 'TOTALITY':
      bgBrightness = map(stateTimer, 0, 500, 4, 6);
      bgNoise = 0.15;
      break;
    case 'RECOVERY':
      bgBrightness = map(stateTimer, 0, 1000, 4, 8);
      bgNoise = map(stateTimer, 0, 1000, 0.15, 0.02);
      break;
  }
  
  background(240, 20, bgBrightness);
  
  // Coronal glow during totality
  if (eclipseState === 'TOTALITY' || eclipseState === 'RECOVERY') {
    noStroke();
    for (let i = 0; i < 3; i++) {
      let gradientAlpha = map(i, 0, 3, 0.08, 0.02);
      fill(200 + i * 40, 60, 30, gradientAlpha);
      ellipse(width * 0.5, height * 0.35, width * (0.8 + i * 0.4));
    }
  }
  
  // Dynamic range noise (cosmic rays, detector noise)
  noStroke();
  let noiseCount = floor(bgNoise * 500);
  for (let i = 0; i < noiseCount; i++) {
    let x = random(width);
    let y = random(height);
    let s = random(1, 4);
    fill(random(360), 30, random(60, 100), random(0.1, 0.4));
    rect(x, y, s, s);
  }
}

function drawCoronalField() {
  let visibility;
  switch (eclipseState) {
    case 'PHOTOSPHERIC': visibility = 0; break;
    case 'TRANSITION': visibility = map(stateTimer, 0, 800, 0, 0.6); break;
    case 'TOTALITY': visibility = 0.7; break;
    case 'RECOVERY': visibility = map(stateTimer, 0, 1000, 0.7, 0); break;
  }
  
  if (visibility < 0.01) return;
  
  push();
  translate(width * 0.5, height * 0.35); // Solar center
  
  for (let field of coronalField) {
    field.flowOffset += field.velocity;
    
    noFill();
    strokeWeight(2);
    
    // Temperature-inverse coloring (hotter = lower hue in our paradox)
    let tempHue = map(field.temperature, 1, 3, 340, 200);
    let saturation = map(visibility, 0, 0.7, 0, 80);
    
    beginShape();
    for (let r = 0; r < field.baseLength; r += 8) {
      let spiralAngle = field.angle + r * 0.01 + sin(field.flowOffset + r * 0.05) * 0.3;
      let x = cos(spiralAngle) * r;
      let y = sin(spiralAngle) * r;
      
      // Alfvén wave perturbation
      if (eclipseState === 'TOTALITY') {
        x += sin(r * 0.1 + frameCount * 0.1) * field.temperature * 10;
        y += cos(r * 0.1 + frameCount * 0.1) * field.temperature * 10;
      }
      
      stroke(tempHue, saturation, map(r, 0, field.baseLength, 100, 40), visibility);
      vertex(x, y);
    }
    endShape();
  }
  
  pop();
}

function drawShadowBands() {
  let visibility;
  switch (eclipseState) {
    case 'PHOTOSPHERIC': visibility = 0; break;
    case 'TRANSITION': visibility = map(stateTimer, 0, 800, 0.3, 0.8); break;
    case 'TOTALITY': visibility = 0; break;
    case 'RECOVERY': visibility = map(stateTimer, 0, 1000, 0.8, 0.2); break;
  }
  
  if (visibility < 0.01) return;
  
  push();
  blendMode(ADD);
  noStroke();
  
  for (let band of shadowBands) {
    band.x += band.speed;
    if (band.x > width + band.width) band.x = -band.width * 2;
    
    band.phase += 0.05;
    
    for (let x = band.x; x < band.x + band.width; x += 4) {
      if (x < 0 || x > width) continue;
      
      let waveOffset = sin(x * band.frequency + band.phase) * band.amplitude;
      let alpha = map(abs(x - band.x - band.width/2), 0, band.width/2, visibility * 0.4, 0);
      
      fill(0, 0, 100, alpha);
      rect(x, 0, 5, height);
    }
  }
  
  pop();
}

function drawTerrain() {
  // Inverse temperature mapping: hotter visuals = lower audio potential
  let photosphereBrightness = 1.0;
  let coronalInfluence = 0;
  
  switch (eclipseState) {
    case 'PHOTOSPHERIC':
      photosphereBrightness = 1.0;
      coronalInfluence = 0;
      break;
    case 'TRANSITION':
      photosphereBrightness = map(stateTimer, 0, 800, 1.0, 0.2);
      coronalInfluence = map(stateTimer, 0, 800, 0, 0.8);
      break;
    case 'TOTALITY':
      photosphereBrightness = 0.1;
      coronalInfluence = 1.0;
      break;
    case 'RECOVERY':
      photosphereBrightness = map(stateTimer, 0, 1000, 0.2, 0.9);
      coronalInfluence = map(stateTimer, 0, 1000, 0.9, 0.1);
      break;
  }
  
  for (let i = terrain.length - 1; i >= 0; i--) {
    let layer = terrain[i];
    let points = layer.points;
    
    // INVERSE PARADOX: visual brightness vs audio frequency
    let visualHue = lerp(45, 280, coronalInfluence); // Gold → Blue-violet
    let visualSat = lerp(90, 60, coronalInfluence);
    let visualBri = layer.bri * photosphereBrightness * (1 - coronalInfluence * 0.5);
    let visualAlpha = layer.alpha * lerp(1, 0.3, coronalInfluence);
    
    noStroke();
    fill(visualHue, visualSat, visualBri, visualAlpha);
    
    beginShape();
    vertex(0, height);
    
    for (let j = 0; j < points.length; j++) {
      let p = points[j];
      let y = p.originalY;
      
      // Atmospheric refraction wobble during transition
      if (eclipseState === 'TRANSITION' || eclipseState === 'RECOVERY') {
        y += sin(frameCount * 0.05 + j * 0.1) * (1 - photosphereBrightness) * 8;
      }
      
      // Permanent scarring from beads
      if (p.beadActive) {
        y -= 5;
      }
      
      vertex(p.x, y);
    }
    
    vertex(width, height);
    endShape(CLOSE);
    
    // Wireframe emerges during totality (topographic data becoming signal)
    if (coronalInfluence > 0.3) {
      stroke(visualHue, visualSat * 0.5, 100, visualAlpha * 0.5);
      strokeWeight(0.5);
      noFill();
      
      beginShape();
      for (let p of points) {
        vertex(p.x, p.originalY);
      }
      endShape();
    }
  }
}

function drawBailyBeads() {
  for (let i = bailyBeads.length - 1; i >= 0; i--) {
    let bead = bailyBeads[i];
    let age = millis() - bead.birth;
    let progress = age / bead.life;
    
    if (progress > 1) {
      bailyBeads.splice(i, 1);
      continue;
    }
    
    let alpha = (1 - progress) * bead.intensity;
    let size = map(progress, 0, 1, 12, 2);
    
    // Chromatic aberration (prismatic dispersion through lunar valley)
    push();
    translate(bead.x, bead.y);
    
    // Red channel
    noStroke();
    fill(0, 80, 100, alpha * 0.7);
    ellipse(bead.chromaSep, 0, size * 0.8);
    
    // Green channel
    fill(120, 80, 100, alpha * 0.7);
    ellipse(0, 0, size * 0.8);
    
    // Blue channel
    fill(240, 80, 100, alpha * 0.7);
    ellipse(-bead.chromaSep, 0, size * 0.8);
    
    // Core brilliance
    fill(60, 20, 100, alpha);
    ellipse(0, 0, size * 0.4);
    
    // Radial spikes for diamond
    if (bead.isDiamond) {
      stroke(60, 50, 100, alpha * 0.5);
      strokeWeight(2);
      for (let a = 0; a < 360; a += 30) {
        let len = size * random(2, 4);
        line(0, 0, cos(radians(a)) * len, sin(radians(a)) * len);
      }
    }
    
    pop();
  }
}

function drawDiamondRing() {
  if (!diamondRing.active) return;
  
  diamondRing.phase += 0.08;
  diamondRing.intensity *= 0.98;
  
  if (diamondRing.intensity < 0.01) {
    diamondRing.active = false;
    return;
  }
  
  push();
  translate(diamondRing.x, diamondRing.y);
  
  // Blinding central bead
  noStroke();
  for (let i = 5; i > 0; i--) {
    let alpha = map(i, 0, 5, diamondRing.intensity, diamondRing.intensity * 0.3);
    let size = map(i, 0, 5, 80, 20);
    fill(60, 50, 100, alpha);
    ellipse(0, 0, size);
  }
  
  // Radial distortion waves breaking coordinate system
  stroke(60, 80, 100, diamondRing.intensity * 0.4);
  strokeWeight(3);
  noFill();
  for (let r = 20; r < 300; r += 15) {
    let distortedR = r + sin(diamondRing.phase * 3 + r * 0.05) * 20;
    ellipse(0, 0, distortedR * 2);
  }
  
  // Chromatic fracture lines
  for (let a = 0; a < 360; a += 15) {
    let rad = radians(a);
    let len = random(50, 200) * diamondRing.intensity;
    
    stroke(0, 100, 100, diamondRing.intensity * 0.6);
    line(0, 0, cos(rad) * len, sin(rad) * len);
    
    stroke(180, 100, 100, diamondRing.intensity * 0.6);
    line(0, 0, cos(rad + 0.1) * len, sin(rad + 0.1) * len);
  }
  
  pop();
}

function drawAlfvénWaves() {
  for (let i = alfvénWaves.length - 1; i >= 0; i--) {
    let wave = alfvénWaves[i];
    wave.radius += wave.speed;
    wave.alfvenPhase += 0.15;
    
    if (wave.radius > wave.maxRadius) {
      alfvénWaves.splice(i, 1);
      continue;
    }
    
    let alpha = map(wave.radius, 0, wave.maxRadius, 0.8, 0);
    let circumference = TWO_PI * wave.radius;
    let segments = floor(circumference / 10);
    
    noFill();
    strokeWeight(2);
    
    beginShape();
    for (let j = 0; j <= segments; j++) {
      let angle = map(j, 0, segments, 0, TWO_PI);
      let r = wave.radius + sin(angle * wave.frequency + wave.alfvenPhase) * wave.amplitude;
      let x = cos(angle) * r;
      let y = sin(angle) * r;
      
      stroke(wave.hue, 70, 100, alpha);
      vertex(wave.x + x, wave.y + y);
    }
    endShape(CLOSE);
  }
}

function drawStateHUD() {
  push();
  textFont('Courier New');
  textSize(11);
  textAlign(LEFT, TOP);
  noStroke();
  
  // Sync audio engine with visual state
  if (typeof AudioEngine !== 'undefined' && AudioEngine.setEclipseState) {
    AudioEngine.setEclipseState(eclipseState);
  }
  
  // State display
  let stateColors = {
    'PHOTOSPHERIC': [45, 90, 100],
    'TRANSITION': [30, 80, 80],
    'TOTALITY': [280, 60, 40],
    'RECOVERY': [200, 50, 60]
  };
  
  let col = stateColors[eclipseState];
  fill(col[0], col[1], col[2], 0.8);
  text(`STATE: ${eclipseState}`, 20, 20);
  
  // Hysteresis threshold indicator
  fill(0, 0, 100, 0.6);
  text(`THRESHOLD: ${(hysteresisThreshold * 100).toFixed(0)}%`, 20, 35);
  
  // Energy accumulation (audience participation meter)
  let energyBarWidth = 200;
  let energyHeight = 8;
  fill(0, 0, 30, 0.5);
  rect(20, 55, energyBarWidth, energyHeight);
  
  let energyColor = accumulatedEnergy > hysteresisThreshold ? [0, 100, 100] : [120, 80, 100];
  fill(energyColor[0], energyColor[1], energyColor[2], 0.9);
  rect(20, 55, energyBarWidth * accumulatedEnergy, energyHeight);
  
  fill(0, 0, 100, 0.7);
  text(`ENERGY (QUIET TO PROCEED): ${(accumulatedEnergy * 100).toFixed(1)}%`, 20, 70);
  
  // Scientific annotation
  if (eclipseState === 'TOTALITY') {
    textAlign(RIGHT, BOTTOM);
    fill(280, 60, 80, 0.7);
    textSize(10);
    text('CORONAL TEMPERATURE: 2×10⁶ K\nPHOTOSPHERIC TEMPERATURE: 5778 K\nTHE HEATING PROBLEM REMAINS UNSOLVED', width - 20, height - 20);
  }
  
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initTerrain();
  initCoronalField();
}

// Add instructions style dynamically
function setupInstructions() {
  const existing = document.getElementById('experience-instructions-style');
  if (existing) existing.remove();
  
  const style = document.createElement('style');
  style.id = 'experience-instructions-style';
  style.textContent = `
    .instructions {
      position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
      color: #ffaa00; font-family: 'Courier New', monospace; font-size: 11px;
      text-align: center; opacity: 0.6; pointer-events: none; z-index: 100;
    }
  `;
  document.head.appendChild(style);
}

// Manual override + interactivity (p5 global handlers)
function keyPressed() {
  if (keyCode === 32) { // SPACE
    if (typeof AudioEngine !== 'undefined' && AudioEngine.advancePhase) {
      AudioEngine.advancePhase();
    }
    return false; // Prevent page scroll
  }
  if (key === 'd' || key === 'D') {
    triggerDiamondRing();
  }
}

// Mouse interaction: reveal hidden coronal layers
function mouseMoved() {
  if (eclipseState === 'TOTALITY' && typeof AudioEngine !== 'undefined' && AudioEngine.revealCorona) {
    AudioEngine.revealCorona(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (eclipseState === 'TOTALITY' && typeof AudioEngine !== 'undefined' && AudioEngine.revealCorona) {
    AudioEngine.revealCorona(mouseX, mouseY);
  }
}
