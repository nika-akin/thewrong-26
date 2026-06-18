// ============================================================
// DETERIORATING GLITCH LANDSCAPE
// For The Wrong 2026 — p5.js + Tone.js
// Theme: glitch, noise, errors, digital decay
// ============================================================

let terrain = [];
let glitchLayers = [];
let noiseOffset = 0;
let deterioration = 0;        // 0 = pristine, 1 = total decay
let midiEvents = [];
let scanlines = [];
let deadPixels = [];
let chromaShift = 0;
let errorTexts = [];

// Configuration
const TERRAIN_RES = 120;
const LAYERS = 8;
const MAX_DETERIORATION = 1.0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  noSmooth();

  initTerrain();
  initGlitchLayers();
  initScanlines();
}

function initTerrain() {
  terrain = [];
  for (let layer = 0; layer < LAYERS; layer++) {
    let layerPoints = [];
    let yBase = map(layer, 0, LAYERS - 1, height * 0.25, height * 0.95);
    let amplitude = map(layer, 0, LAYERS - 1, 120, 20);
    let noiseScale = map(layer, 0, LAYERS - 1, 0.003, 0.008);

    for (let x = 0; x <= width; x += width / TERRAIN_RES) {
      let n = noise(x * noiseScale, layer * 100);
      let y = yBase - n * amplitude;
      layerPoints.push({ x, y, originalY: y, noiseVal: n });
    }
    terrain.push({
      points: layerPoints,
      hue: map(layer, 0, LAYERS - 1, 200, 340),
      sat: map(layer, 0, LAYERS - 1, 30, 80),
      bri: map(layer, 0, LAYERS - 1, 90, 40),
      layer: layer
    });
  }
}

function initGlitchLayers() {
  glitchLayers = [];
  for (let i = 0; i < 5; i++) {
    glitchLayers.push({
      y: random(height),
      height: random(20, 100),
      offset: random(-50, 50),
      speed: random(0.5, 3),
      active: false,
      intensity: 0
    });
  }
}

function initScanlines() {
  scanlines = [];
  for (let y = 0; y < height; y += 3) {
    scanlines.push({
      y: y,
      alpha: random(0.02, 0.08),
      flicker: random(0.5, 2)
    });
  }
}

// Called by audio.js when a MIDI note plays
window.onMidiEvent = function(event) {
  midiEvents.push({
    note: event.note,
    velocity: event.velocity,
    time: millis(),
    x: map(event.note, 20, 100, 0, width),
    y: random(height * 0.3, height * 0.8)
  });

  // MIDI triggers glitch intensification
  let glitchBoost = map(event.velocity, 0, 127, 0, 0.15);
  deterioration = min(deterioration + glitchBoost, MAX_DETERIORATION);

  // Spawn a dead pixel cluster at note position
  for (let i = 0; i < 20; i++) {
    deadPixels.push({
      x: event.x + random(-100, 100),
      y: event.y + random(-50, 50),
      size: random(2, 8),
      birth: millis(),
      life: random(500, 3000),
      color: color(random(360), 80, 100)
    });
  }

  // Activate a random glitch layer
  let gl = random(glitchLayers);
  gl.active = true;
  gl.intensity = 1;
  gl.y = event.y;
};

function draw() {
  // Slow natural deterioration over time
  deterioration = min(deterioration + 0.0003, MAX_DETERIORATION);

  // Background: dark void that gets noisier
  background(0, 0, map(deterioration, 0, 1, 5, 25));

  // Draw static/noise background
  drawNoiseField();

  // Draw terrain layers (back to front)
  for (let i = terrain.length - 1; i >= 0; i--) {
    drawTerrainLayer(terrain[i]);
  }

  // Draw glitch artifacts
  drawGlitchLayers();
  drawDeadPixels();
  drawScanlines();
  drawChromaticAberration();
  drawDataMosh();

  // MIDI event visual echoes
  drawMidiEchoes();

  // HUD / error text when highly deteriorated
  if (deterioration > 0.6) {
    drawErrorText();
  }

  noiseOffset += 0.002;
}

function drawNoiseField() {
  // Subtle background noise that intensifies with deterioration
  let noiseAmount = map(deterioration, 0, 1, 0, 0.3);
  if (noiseAmount < 0.05) return;

  noStroke();
  for (let i = 0; i < 200 * noiseAmount; i++) {
    let x = random(width);
    let y = random(height);
    let s = random(1, 3);
    fill(random(360), 20, 100, random(0.1, 0.4));
    rect(x, y, s, s);
  }
}

function drawTerrainLayer(layer) {
  let points = layer.points;
  let hue = layer.hue;
  let sat = layer.sat;
  let bri = layer.bri;
  let layerIdx = layer.layer;

  // Apply deterioration to terrain geometry
  let geoDistort = map(deterioration, 0, 1, 0, 80);
  let colorShift = map(deterioration, 0, 1, 0, 60);

  // Layer fill
  noStroke();
  let fillHue = (hue + colorShift + noise(frameCount * 0.01, layerIdx) * 30) % 360;
  let fillSat = constrain(sat + deterioration * 40, 0, 100);
  let fillBri = bri * (1 - deterioration * 0.3);

  fill(fillHue, fillSat, fillBri, 0.7);

  beginShape();
  vertex(0, height);

  for (let p of points) {
    // Deterioration: points drift, duplicate, or disappear
    let y = p.originalY;

    if (deterioration > 0.2) {
      // Geometric drift
      let driftY = noise(p.x * 0.005, frameCount * 0.01, layerIdx) * geoDistort * 2;
      y += driftY;

      // Random point deletion (holes in terrain)
      if (random() < deterioration * 0.1) {
        y = height + 50;
      }
    }

    vertex(p.x, y);
  }

  vertex(width, height);
  endShape(CLOSE);

  // Wireframe overlay when deteriorated
  if (deterioration > 0.4) {
    stroke((fillHue + 180) % 360, 80, 100, map(deterioration, 0.4, 1, 0, 0.5));
    strokeWeight(0.5);
    noFill();

    beginShape();
    for (let p of points) {
      let y = p.originalY;
      if (deterioration > 0.2) {
        y += noise(p.x * 0.005, frameCount * 0.01, layerIdx) * geoDistort * 2;
      }
      vertex(p.x, y);
    }
    endShape();
  }

  // Horizontal slice displacement (classic glitch)
  if (deterioration > 0.3 && random() < deterioration * 0.3) {
    let sliceY = random(height * 0.2, height * 0.9);
    let sliceH = random(5, 30);
    let shiftX = random(-100, 100) * deterioration;

    push();
    translate(shiftX, 0);
    fill(fillHue, fillSat, fillBri, 0.5);
    noStroke();
    beginShape();
    vertex(0, sliceY + sliceH);
    for (let p of points) {
      if (p.y > sliceY && p.y < sliceY + sliceH) {
        vertex(p.x, p.y);
      }
    }
    vertex(width, sliceY + sliceH);
    endShape(CLOSE);
    pop();
  }
}

function drawGlitchLayers() {
  for (let gl of glitchLayers) {
    if (!gl.active) continue;

    gl.intensity *= 0.97;
    if (gl.intensity < 0.01) gl.active = false;

    let alpha = gl.intensity * map(deterioration, 0, 1, 0.3, 0.9);

    noStroke();

    // Red channel shifted left
    fill(0, 100, 100, alpha * 0.5);
    rect(0, gl.y, width, gl.height);

    // Cyan channel shifted right
    fill(180, 100, 100, alpha * 0.5);
    rect(gl.offset, gl.y, width, gl.height);

    // Scan lines within glitch band
    stroke(0, 0, 100, alpha);
    strokeWeight(1);
    for (let y = gl.y; y < gl.y + gl.height; y += 4) {
      line(0, y, width, y);
    }

    gl.y += gl.speed;
    if (gl.y > height) gl.y = 0;
  }
}

function drawDeadPixels() {
  noStroke();
  for (let i = deadPixels.length - 1; i >= 0; i--) {
    let dp = deadPixels[i];
    let age = millis() - dp.birth;

    if (age > dp.life) {
      deadPixels.splice(i, 1);
      continue;
    }

    let progress = age / dp.life;
    let alpha = 1 - progress;

    fill(hue(dp.color), saturation(dp.color), brightness(dp.color), alpha);

    let clusterSize = dp.size * (1 + progress * 3);
    for (let j = 0; j < 5; j++) {
      let cx = dp.x + random(-clusterSize, clusterSize);
      let cy = dp.y + random(-clusterSize, clusterSize);
      let cs = random(2, clusterSize);
      rect(cx, cy, cs, cs);
    }

    if (random() < 0.01 * deterioration) {
      fill(0, 0, 100, 0.8);
      rect(dp.x, dp.y, 2, 2);
    }
  }
}

function drawScanlines() {
  noStroke();
  for (let sl of scanlines) {
    let flicker = sin(frameCount * sl.flicker * 0.1) * 0.5 + 0.5;
    let alpha = sl.alpha * flicker * (1 + deterioration * 2);
    fill(0, 0, 0, alpha);
    rect(0, sl.y, width, 1);
  }

  if (deterioration > 0.5 && frameCount % 3 === 0) {
    let y = random(height);
    stroke(0, 0, 100, random(0.1, 0.4));
    strokeWeight(random(1, 4));
    line(0, y, width, y);
  }
}

function drawChromaticAberration() {
  if (deterioration < 0.2) return;

  chromaShift = lerp(chromaShift, deterioration * 20, 0.05);

  noStroke();
  for (let layer of terrain) {
    if (random() > deterioration * 0.5) continue;

    let p = random(layer.points);

    fill(0, 100, 100, 0.3);
    rect(p.x - chromaShift, p.y - 2, 4, 4);

    fill(180, 100, 100, 0.3);
    rect(p.x + chromaShift, p.y - 2, 4, 4);
  }
}

function drawDataMosh() {
  if (deterioration < 0.35) return;

  let blockCount = floor(map(deterioration, 0.35, 1, 0, 8));

  for (let i = 0; i < blockCount; i++) {
    let bx = random(width);
    let by = random(height);
    let bw = random(20, 200);
    let bh = random(5, 40);

    fill(random(360), random(30, 80), random(40, 100), 0.6);
    rect(bx, by, bw, bh);

    for (let px = bx; px < bx + bw; px += 8) {
      for (let py = by; py < by + bh; py += 8) {
        if (random() < 0.5) {
          fill(random(360), 60, 100, 0.8);
          rect(px, py, 8, 8);
        }
      }
    }
  }
}

function drawMidiEchoes() {
  for (let i = midiEvents.length - 1; i >= 0; i--) {
    let e = midiEvents[i];
    let age = millis() - e.time;

    if (age > 4000) {
      midiEvents.splice(i, 1);
      continue;
    }

    let progress = age / 4000;
    let alpha = (1 - progress) * map(e.velocity, 0, 127, 0.3, 1);
    let size = map(e.velocity, 0, 127, 10, 100) * (1 + progress * 2);

    noFill();
    stroke(map(e.note, 20, 100, 180, 340), 80, 100, alpha);
    strokeWeight(2);
    ellipse(e.x, e.y, size);

    if (progress < 0.3) {
      stroke(map(e.note, 20, 100, 180, 340), 60, 100, alpha * 2);
      strokeWeight(random(1, 4));
      line(e.x, 0, e.x, height);
    }
  }
}

function drawErrorText() {
  textFont('monospace');
  textSize(10 + random(-2, 2));

  let errorMessages = [
    'ERR: SECTOR_FAULT 0x' + hex(floor(random(65536)), 4),
    'CRC_MISMATCH: expected 0x' + hex(floor(random(65536)), 4),
    'BUFFER_OVERFLOW @ ' + floor(random(100000)),
    'DEGRADATION: ' + floor(deterioration * 100) + '%',
    'RECOVERING... FAILED',
    'SIGNAL_LOSS',
    'DATAMOSHING...',
    '0x' + hex(floor(random(4294967296)), 8)
  ];

  fill(0, 100, 100, random(0.3, 0.8));
  noStroke();

  for (let i = 0; i < 3; i++) {
    let msg = random(errorMessages);
    let x = random(width * 0.1, width * 0.9);
    let y = random(height);
    text(msg, x, y);
  }

  if (random() < 0.3) {
    fill(120, 80, 100, 0.2);
    textSize(8);
    for (let y = 0; y < height; y += 12) {
      let hexStr = '';
      for (let j = 0; j < 8; j++) {
        hexStr += hex(floor(random(256)), 2) + ' ';
      }
      text(hexStr, 10, y);
      text(hexStr, width - 120, y);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initTerrain();
  initScanlines();
}

// Click to manually trigger a deterioration spike (for testing)
function mousePressed() {
  deterioration = min(deterioration + 0.1, MAX_DETERIORATION);

  for (let gl of glitchLayers) {
    if (!gl.active) {
      gl.active = true;
      gl.intensity = 1;
      gl.y = mouseY;
      break;
    }
  }

  window.onMidiEvent({
    note: floor(map(mouseX, 0, width, 20, 100)),
    velocity: floor(random(60, 127)),
    x: mouseX,
    y: mouseY
  });
}
