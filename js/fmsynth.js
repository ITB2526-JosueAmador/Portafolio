// Inicializar el sintetizador FM
const synth = new Tone.FMSynth({
  harmonicity: 3,
  modulationIndex: 10,
  envelope: {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.5,
    release: 1
  },
  modulation: {
    type: "sine"
  },
  modulationEnvelope: {
    attack: 0.5,
    decay: 0,
    sustain: 1,
    release: 0.5
  }
}).toDestination();

// Variables para el reproductor MIDI
let midiData = null;
let midiPart = null;
let currentNotes = [];
let startTime = 0;
let duration = 0;
let progressInterval = null;

// Configurar el teclado
const keys = document.querySelectorAll('.key');
keys.forEach(key => {
  key.addEventListener('mousedown', () => {
    const note = key.getAttribute('data-note');
    synth.triggerAttackRelease(note, '8n');
    key.classList.add('active');
  });

  key.addEventListener('mouseup', () => {
    key.classList.remove('active');
  });

  key.addEventListener('mouseleave', () => {
    key.classList.remove('active');
  });
});

// Controles del sintetizador
const harmonicitySlider = document.getElementById('harmonicity');
const harmonicityValue = document.getElementById('harmonicity-value');
harmonicitySlider.addEventListener('input', (e) => {
  synth.harmonicity.value = parseFloat(e.target.value);
  harmonicityValue.textContent = parseFloat(e.target.value).toFixed(1);
});

const modulationIndexSlider = document.getElementById('modulationIndex');
const modulationIndexValue = document.getElementById('modulationIndex-value');
modulationIndexSlider.addEventListener('input', (e) => {
  synth.modulationIndex.value = parseFloat(e.target.value);
  modulationIndexValue.textContent = e.target.value;
});

const attackSlider = document.getElementById('attack');
const attackValue = document.getElementById('attack-value');
attackSlider.addEventListener('input', (e) => {
  synth.envelope.attack = parseFloat(e.target.value);
  attackValue.textContent = parseFloat(e.target.value).toFixed(2) + 's';
});

const decaySlider = document.getElementById('decay');
const decayValue = document.getElementById('decay-value');
decaySlider.addEventListener('input', (e) => {
  synth.envelope.decay = parseFloat(e.target.value);
  decayValue.textContent = parseFloat(e.target.value).toFixed(2) + 's';
});

const sustainSlider = document.getElementById('sustain');
const sustainValue = document.getElementById('sustain-value');
sustainSlider.addEventListener('input', (e) => {
  synth.envelope.sustain = parseFloat(e.target.value);
  sustainValue.textContent = parseFloat(e.target.value).toFixed(2);
});

const releaseSlider = document.getElementById('release');
const releaseValue = document.getElementById('release-value');
releaseSlider.addEventListener('input', (e) => {
  synth.envelope.release = parseFloat(e.target.value);
  releaseValue.textContent = parseFloat(e.target.value).toFixed(2) + 's';
});

// Soporte para teclado físico
const keyMap = {
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4',
  'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5'
};

document.addEventListener('keydown', (e) => {
  const note = keyMap[e.key.toLowerCase()];
  if (note && !e.repeat) {
    synth.triggerAttackRelease(note, '8n');
    const keyElement = document.querySelector(`[data-note="${note}"]`);
    if (keyElement) keyElement.classList.add('active');
  }
});

document.addEventListener('keyup', (e) => {
  const note = keyMap[e.key.toLowerCase()];
  if (note) {
    const keyElement = document.querySelector(`[data-note="${note}"]`);
    if (keyElement) keyElement.classList.remove('active');
  }
});

// ===== REPRODUCTOR MIDI =====
const midiFileInput = document.getElementById('midi-file');
const midiInfo = document.getElementById('midi-info');
const midiControls = document.getElementById('midi-controls');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const progressFill = document.getElementById('progress-fill');

// Cargar archivo MIDI
midiFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const arrayBuffer = await file.arrayBuffer();
    midiData = new Midi(arrayBuffer);

    // Mostrar información del archivo
    const trackCount = midiData.tracks.length;
    const noteCount = midiData.tracks.reduce((sum, track) => sum + track.notes.length, 0);
    duration = midiData.duration;

    midiInfo.innerHTML = `
      <strong style="color: #60a5fa;">${file.name}</strong><br>
      ${trackCount} pistas • ${noteCount} notas • ${duration.toFixed(1)}s
    `;

    // Mostrar y habilitar controles
    midiControls.style.display = 'flex';
    playBtn.disabled = false;
    stopBtn.disabled = false;
    setupMidiPlayback();
  } catch (error) {
    console.error('Error cargando MIDI:', error);
    midiInfo.innerHTML = '<span style="color: #ef4444;">Error al cargar el archivo</span>';
  }
});

function setupMidiPlayback() {
  // Limpiar reproducción anterior
  if (midiPart) {
    midiPart.dispose();
    Tone.Transport.cancel();
  }

  // Crear un PolySynth para manejar múltiples notas
  const polySynth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: synth.harmonicity.value,
    modulationIndex: synth.modulationIndex.value,
    envelope: {
      attack: synth.envelope.attack,
      decay: synth.envelope.decay,
      sustain: synth.envelope.sustain,
      release: synth.envelope.release
    }
  }).toDestination();

  // Sincronizar con los controles del sintetizador
  [harmonicitySlider, modulationIndexSlider, attackSlider, decaySlider, sustainSlider, releaseSlider].forEach(slider => {
    slider.addEventListener('input', () => {
      polySynth.set({
        harmonicity: parseFloat(harmonicitySlider.value),
        modulationIndex: parseFloat(modulationIndexSlider.value),
        envelope: {
          attack: parseFloat(attackSlider.value),
          decay: parseFloat(decaySlider.value),
          sustain: parseFloat(sustainSlider.value),
          release: parseFloat(releaseSlider.value)
        }
      });
    });
  });

  // Convertir notas MIDI a eventos de Tone.js
  const notes = [];
  midiData.tracks.forEach(track => {
    track.notes.forEach(note => {
      notes.push({
        time: note.time,
        note: note.name,
        duration: note.duration,
        velocity: note.velocity
      });
    });
  });

  // Crear Part para reproducir las notas
  midiPart = new Tone.Part((time, note) => {
    polySynth.triggerAttackRelease(note.note, note.duration, time, note.velocity);

    // Animar las teclas visuales si coinciden
    const keyElement = document.querySelector(`[data-note="${note.note}"]`);
    if (keyElement) {
      Tone.Draw.schedule(() => {
        keyElement.classList.add('active');
        setTimeout(() => keyElement.classList.remove('active'), note.duration * 1000);
      }, time);
    }
  }, notes);

  midiPart.loop = false;
}

// Controles de reproducción
playBtn.addEventListener('click', async () => {
  await Tone.start();
  if (Tone.Transport.state === 'paused') {
    Tone.Transport.start();
  } else {
    Tone.Transport.start();
    midiPart.start(0);
    startTime = Tone.now();
    startProgressTracking();
  }
  playBtn.disabled = true;
  pauseBtn.disabled = false;
});

pauseBtn.addEventListener('click', () => {
  Tone.Transport.pause();
  stopProgressTracking();
  playBtn.disabled = false;
  pauseBtn.disabled = true;
});

stopBtn.addEventListener('click', () => {
  Tone.Transport.stop();
  Tone.Transport.position = 0;
  midiPart.stop();
  stopProgressTracking();
  progressFill.style.width = '0%';
  playBtn.disabled = false;
  pauseBtn.disabled = true;
});

// Tracking de progreso
function startProgressTracking() {
  progressInterval = setInterval(() => {
    const elapsed = Tone.Transport.seconds;
    const progress = (elapsed / duration) * 100;
    progressFill.style.width = Math.min(progress, 100) + '%';

    if (progress >= 100) {
      stopProgressTracking();
      playBtn.disabled = false;
      pauseBtn.disabled = true;
    }
  }, 100);
}

function stopProgressTracking() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}