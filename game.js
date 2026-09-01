// ============================================
// 1945 Flying Tigers - Retro Shooting Game
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============================================
// AUDIO SYSTEM - Web Audio API Sounds
// ============================================

let audioContext = null;
let bgmGain = null;
let sfxGain = null;
let bgmOscillators = [];
let bgmPlaying = false;

function initAudio() {
    if (audioContext) return;
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    bgmGain = audioContext.createGain();
    bgmGain.gain.value = 0.15;
    bgmGain.connect(audioContext.destination);
    
    sfxGain = audioContext.createGain();
    sfxGain.gain.value = 0.3;
    sfxGain.connect(audioContext.destination);
}

// Space-themed BGM - intense battle music with bass and arpeggios
function startBGM() {
    if (bgmPlaying || !audioContext) return;
    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }
    bgmPlaying = true;
    
    const now = audioContext.currentTime;
    
    // === BASS LINE - driving rhythm ===
    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49]; // A1 pattern
    const bassDuration = 0.5; // 120 BPM
    
    // Converted from forEach to for (reverse for safe splice)
    for (let i = bassNotes.length - 1; i >= 0; i--) {
        const freq = bassNotes[i];
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 3;
        
        const startTime = now + i * bassDuration;
        oscGain.gain.setValueAtTime(0, startTime);
        oscGain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.01, startTime + bassDuration * 0.9);
        
        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(bgmGain);
        osc.start(startTime);
        osc.stop(startTime + bassDuration);
        bgmOscillators.push(osc);
    }
    
    // === PAD LAYER - tension chords ===
    const padFreqs = [110, 138.59, 164.81]; // A2, C#3, E3 - A major
    // Converted from forEach to for (reverse for safe splice)
    for (let i = padFreqs.length - 1; i >= 0; i--) {
        const freq = padFreqs[i];
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 8;
        
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        filter.Q.value = 1;
        
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.04, now + 2);
        
        // LFO for tension
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.value = 0.15 + i * 0.05;
        lfo.type = 'sine';
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.detune);
        lfo.start(now);
        bgmOscillators.push(lfo);
        
        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(bgmGain);
        osc.start(now + i * 0.5);
        bgmOscillators.push(osc);
    }
    
    // === ARPEGGIO - fast high notes for urgency ===
    const arpNotes = [440, 554.37, 659.25, 880, 659.25, 554.37]; // A4, C#5, E5, A5
    const arpSpeed = 0.15;
    
    function playArpeggioLoop(startOffset) {
        // Converted from forEach to for (reverse for safe splice)
        for (let i = arpNotes.length - 1; i >= 0; i--) {
            const freq = arpNotes[i];
            const osc = audioContext.createOscillator();
            const oscGain = audioContext.createGain();
            
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const startTime = now + startOffset + i * arpSpeed;
            oscGain.gain.setValueAtTime(0, startTime);
            oscGain.gain.linearRampToValueAtTime(0.03, startTime + 0.01);
            oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + arpSpeed * 0.8);
            
            osc.connect(oscGain);
            oscGain.connect(bgmGain);
            osc.start(startTime);
            osc.stop(startTime + arpSpeed);
            bgmOscillators.push(osc);
        }
    }
    
    // Play arpeggio loop every 4 seconds
    for (let loop = 0; loop < 50; loop++) {
        playArpeggioLoop(loop * 4);
    }
    
    // === PERCUSSION - subtle rhythmic pulse ===
    for (let beat = 0; beat < 200; beat++) {
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 80;
        
        const startTime = now + beat * bassDuration;
        oscGain.gain.setValueAtTime(0, startTime);
        oscGain.gain.linearRampToValueAtTime(0.06, startTime + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
        
        osc.connect(oscGain);
        oscGain.connect(bgmGain);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
        bgmOscillators.push(osc);
    }
}

function stopBGM() {
    if (!bgmPlaying) return;
    bgmPlaying = false;
    
    const now = audioContext.currentTime;
    for (let oi = bgmOscillators.length - 1; oi >= 0; oi--) {
        try {
            bgmOscillators[oi].stop(now + 0.5);
        } catch (e) {}
    }
    bgmOscillators = [];
}

// Shoot sound - laser pew
function playShootSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Main laser tone
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
    
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
    
    // Add a second harmonic
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1320, now);
    osc2.frequency.exponentialRampToValueAtTime(330, now + 0.08);
    
    gain2.gain.setValueAtTime(0.1, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc2.connect(gain2);
    gain2.connect(sfxGain);
    
    osc2.start(now);
    osc2.stop(now + 0.08);
}

// Explosion sound - impactful boom
function playExplosionSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Noise burst for impact
    const bufferSize = audioContext.sampleRate * 0.3;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    const noiseFilter = audioContext.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(sfxGain);
    
    noise.start(now);
    
    // Low boom oscillator
    const boom = audioContext.createOscillator();
    const boomGain = audioContext.createGain();
    
    boom.type = 'sine';
    boom.frequency.setValueAtTime(80, now);
    boom.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    
    boomGain.gain.setValueAtTime(0.5, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    boom.connect(boomGain);
    boomGain.connect(sfxGain);
    
    boom.start(now);
    boom.stop(now + 0.25);
    
    // Mid punch
    const punch = audioContext.createOscillator();
    const punchGain = audioContext.createGain();
    
    punch.type = 'triangle';
    punch.frequency.setValueAtTime(200, now);
    punch.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    
    punchGain.gain.setValueAtTime(0.3, now);
    punchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    punch.connect(punchGain);
    punchGain.connect(sfxGain);
    
    punch.start(now);
    punch.stop(now + 0.15);
}

// Powerup collect sound
function playPowerupSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    // Converted from forEach to for (reverse for safe splice)
    for (let i = notes.length - 1; i >= 0; i--) {
        const freq = notes[i];
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
    }
}

// Player hit sound
function playHitSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    
    // Harsh noise burst
    const bufferSize = audioContext.sampleRate * 0.2;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
    }
    
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const noiseGain = audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noise.connect(noiseGain);
    noiseGain.connect(sfxGain);
    
    noise.start(now);
    
    // Dissonant tone
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
}

// Game Over sound
function playGameOverSound() {
    if (!audioContext) return;
    
    const now = audioContext.currentTime;
    const notes = [392, 349.23, 329.63, 293.66]; // G4, F4, E4, D4 - descending
    
    // Converted from forEach to for (reverse for safe splice)
    for (let i = notes.length - 1; i >= 0; i--) {
        const freq = notes[i];
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, now + i * 0.3);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.3 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.3);
        
        osc.connect(gain);
        gain.connect(sfxGain);
        
        osc.start(now + i * 0.3);
        osc.stop(now + i * 0.3 + 0.35);
    }
}

// Laser hum sound - continuous buzzing while laser fires
let laserSoundActive = false;
let laserOscillators = [];

function playLaserSound() {
    if (!audioContext || laserSoundActive) return;
    laserSoundActive = true;
    
    const now = audioContext.currentTime;
    
    // Create a buzzing hum with multiple harmonics
    for (let h = 0; h < 3; h++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        
        // Base frequencies for harmonics
        const baseFreqs = [120, 180, 240];
        
        osc.type = 'sawtooth';
        osc.frequency.value = baseFreqs[h];
        
        // LFO for warbling effect
        lfo.frequency.value = 8 + h * 3;
        lfo.type = 'sine';
        lfoGain.gain.value = 30 + h * 10;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        laserOscillators.push(lfo);
        
        // Filter for buzz
        filter.type = 'bandpass';
        filter.frequency.value = 600 + h * 200;
        filter.Q.value = 2;
        
        // Low volume - subtle hum
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04 - h * 0.01, now + 0.05);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(sfxGain);
        
        osc.start(now);
        laserOscillators.push(osc);
    }
}

function stopLaserSound() {
    if (!laserSoundActive) return;
    laserSoundActive = false;
    
    const now = audioContext.currentTime;
    for (let oi = laserOscillators.length - 1; oi >= 0; oi--) {
        try {
            laserOscillators[oi].stop(now + 0.05);
        } catch (e) {}
    }
    laserOscillators = [];
}

// Game Constants
const GAME_WIDTH = 480;
const GAME_HEIGHT = 720;
const PLAYER_SPEED = 6;
const BULLET_SPEED = 8;
const ENEMY_BASE_SPEED = 2;
const MAX_PARTICLES = 150;  // Perf: global explosion particle cap

// Game State
const GameState = {
    TITLE: 'title',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover'
};

let gameState = GameState.TITLE;
let score = 0;
let highScore = parseInt(localStorage.getItem('1945_highscore')) || 0;
let wave = 1;
let waveTimer = 0;
let waveFlash = null;
let bossActive = false;
let bossDefeated = false;
let bossWaveNumber = 0;
let bossSpawned = false;  // Guard: boss actually spawned this stage
let bossIsFinalBoss = false;  // true = stage-end boss, false = mid-boss
let bossDeathX = 0, bossDeathY = 0;  // Boss death position for explosion effect
let midBossStreak = 0;

// === FINAL BOSS INTRO SEQUENCE (2026-09) ===
// bossIntroPhase: 'siren' → 'escort' → 'spawn'
// 'siren'   — red siren overlay flashes for ~60 frames (~1s)
// 'escort'  — dense swarm of escort enemies drifts down from top of screen
//             for ~4s (or until cleared). Escorts fire NO bullets — pure visual escort.
// 'spawn'   — normal boss-fight state; the actual final boss entity is now present.
let bossIntroPhase = null;
let bossIntroTimer = 0;
let bossSirenTimer = 0;          // drives the red flash overlay
let bossSirenDuration = 30;      // 0.5s @ 60fps — brief warning flash, then escorts immediately
let bossEscortSpawnTimer = 0;
let bossEscortSpawnedCount = 0;
let bossEscortMax = 28;          // very dense screen-filling swarm
let bossEscortActiveCount = 0;
let bossEscortStartTimer = 0;    // 4s countdown while escort window is open
let bossEscortWindowFrames = 240; // 4s @ 60fps
let bossPendingPayload = null;   // deferred final-boss entity (spawned after escort clears)

// === HYPERSPACE / STAGE SYSTEM ===
let currentStage = 1;              // Current macro-stage (was "wave" conceptually)
let stageWave = 1;                 // Sub-wave within current stage (1-12)
let stageTimer = 0;                // Timer for sub-wave progression
const STAGE_WAVES = 15;            // 15 sub-waves per stage (then stage boss appears)
const STAGE_WAVE_DURATION = 1500;  // 25 seconds per sub-wave @ 60fps
const HYPERSPACE_TOTAL = 240;      // 4 seconds at 60fps
const WAVE_FLASH_DURATION = 90;    // Wave announce text fade duration (frames)
let waveAnnounceTimer = 0;         // Wave announce text countdown
let waveAnnounceText = '';         // Wave announce text content
let hyperspaceActive = false;      // Hyperspace jump in progress
let hyperspaceTimer = 0;           // Hyperspace duration counter
let hyperspacePhase = 0;           // 0=rise, 1=streak, 2=arrive
let currentPlanetIndex = 0;        // Which planet theme is displayed
let hyperspaceStars = [];          // Star streak data for hyperspace effect
let bossBaseHP = 0;
let frameCount = 0;
let bossClawCount = 1; // Number of claws (increases per boss)
let bossClaws = []; // Array of claw objects: { timer, active, x, length, maxLength, retracting, offsetX }
let octopusTentacles = []; // Array of tentacle objects: { x, y, length, maxLength, active, extending, retracting, targetX, targetY, ownerId }
let deathActive = false;
let deathTimer = 0;
let deathFlashAlpha = 0;
let spawnBoost = 0;
let noSpawnCounter = 0;
let lastSpawnFrame = 0;

// === SLOW-MOTION SYSTEM (used by final boss death + player death) ===
let slowMoTimer = 0;            // frames remaining at slowed time scale
let slowMoMaxScale = 1.0;       // target time scale (0.3 = 30% speed)
let slowMoFade = 8;             // frames to lerp from 1.0 → maxScale at start
let slowMoFadeOut = 60;         // frames to lerp from maxScale → 1.0 at end
function startSlowMo(duration, maxScale) {
    // Start slow-motion for `duration` frames at `maxScale` (e.g. 0.3 = 30% speed).
    // First `slowMoFade` frames lerp 1.0 → maxScale, then last `slowMoFadeOut` frames
    // lerp back to 1.0, middle stays at maxScale.
    if (typeof duration !== 'number') duration = 90;
    if (typeof maxScale !== 'number') maxScale = 0.3;
    slowMoTimer = duration;
    slowMoMaxScale = maxScale;
    slowMoFade = 8;
    slowMoFadeOut = Math.min(60, Math.floor(duration * 0.7));
}
function getTimeScale() {
    // Returns the current global time multiplier in [slowMoMaxScale, 1.0].
    if (slowMoTimer <= 0) return 1.0;
    const elapsed = slowMoTimer;
    const total = slowMoMaxScale > 0 ? 90 : 90; // unused, kept for readability
    return 1.0; // unused — real computation happens in update
}
let timeScale = 1.0;            // global time multiplier (updated each frame)

// === FINAL BOSS DEATH CASCADE (multi-step explosion) ===
let bossCascadeActive = false;
let bossCascadeStep = 0;        // 0=idle, 1=chain small pops, 2=big final + slow-mo
let bossCascadeTimer = 0;
let bossCascadeX = 0;
let bossCascadeY = 0;
let bossCascadeSubTimer = 0;    // frames between chain pops

// === HEAVYBOMBER DEATH FALL (mid-boss falling sequence) ===
const HEAVY_FALL_DURATION = 80; // frames falling + smoke before big explosion

// === DESIGN OVERHAUL: New visual state variables ===
let screenShake = 0;              // Frames of screen shake remaining
let screenShakeIntensity = 5;     // Max pixel offset
let hitMarkers = [];              // [{x, y, timer}]
let comboCount = 0;               // Consecutive enemy kills
let comboTimer = 0;               // Frames until combo expires
let comboText = '';               // Text to show (e.g. "3x COMBO!")
let maxCombo = 0;                // Highest combo achieved this game
let planets = [];                 // Background planets array
let bossHPBarAlpha = 0;           // Boss HP bar fade-in alpha
let bgStars = [];               // Tiny distant background stars
let cloudLayer = [];            // Background cloud wisps

// === Laser (W) weapon balance tuning — easily adjustable knobs ===
const LASER_MAX_LEVEL = 6;           // max laserLevel (0..LASER_MAX_LEVEL → up to 7 ticks but capped to ACTIVE_BEAM_CAP)
const LASER_ACTIVE_BEAM_CAP = 3;     // max simultaneously-active beams regardless of level (1..LASER_MAX_LEVEL+1)
const LASER_MAX_TARGETS = 3;         // max distinct enemies one wave can target
const LASER_RANGE_Y = 220;           // enemies must have y >= player.y - LASER_RANGE_Y to be targetable
const LASER_RANGE_X = 360;           // enemies must be within this horizontal distance of player
const LASER_TICK_INTERVAL = 22;      // frames between damage ticks (was 16)
const LASER_DAMAGE_BASE = 0.22;      // base per-tick damage (was 0.76 → 0.55 → 0.22, -60% from 0.55)
const LASER_DAMAGE_PER_LEVEL = 0.032; // damage grows per laserLevel (-60% from 0.08)

// === PERFORMANCE MODE (auto-engaged when many entities are on screen) ===
// When the total visible enemies + bullets + effects exceed PERF_MODE_THRESHOLD,
// heavy graphics features (shadowBlur, expensive gradients on glow) are skipped
// to keep the frame rate playable on low-end Android devices.
const PERF_MODE_THRESHOLD = 80;      // total entities before perfMode engages
const PERF_MODE_HYSTERESIS = 12;     // wait this many fewer entities to disengage
let perfMode = false;                // toggled each frame based on entity count

// === CACHED GRADIENTS (built once, reused across all frames) ===
// Pre-built gradients for entities whose visual style doesn't change per-frame.
// ctx.createLinearGradient/createRadialGradient is expensive on canvas2d and the
// objects can be shared safely — the gradient's color stops are absolute.
const GRAD_CACHE = {
    bgSky: null,           // drawBackground: top→bottom sky gradient
    bgOcean: null,         // drawBackground: ocean bottom gradient
    sunGlow: null,         // drawBackground: sun radial
    cloudBody: null,       // cloud body horizontal
    cloudHighlight: null,  // cloud top highlight
    playerWing: null,      // P-40 wing horizontal
    playerBody: null,      // P-40 body vertical
    playerCanopy: null,    // P-40 canopy vertical
    scoutWing: null,       // scout enemy wing
    scoutBody: null,       // scout enemy body
    scoutCanopy: null,     // scout canopy
    heavyWing: null,       // heavyBomber wing
    heavyBody: null,       // heavyBomber body
    heavyCanopy: null,     // heavyBomber canopy
    finalFuselage: null,   // final boss fuselage
    finalCanopy: null,     // final boss canopy
    finalTail: null,       // final boss tail
    finalWing: null,       // final boss wing
    finalBody: null,       // drawWaveBoss body gradient
    droneBody: null,       // drone body
    droneWing: null,       // drone wing
    droneCanopy: null,     // drone canopy
    bulletCore: null,      // standard player bullet
    bombFuse: null,        // bomb/falling bullet fuse
    bombBody: null,        // bomb body vertical
    bulletEnemyCore: null, // enemy bullet radial
    hpBarFill: null,       // boss HP bar fill horizontal (cached w/ full width, scaled via ctx)
    wUltText: null,        // W ultimate text vertical
};
// helper: returns true when perf-mode is active (so callers can branch on it)
function isPerfMode() { return perfMode; }

// Call once after ctx exists (deferred until first draw — see end of file body).

// 7-level weapon system state
let laserLevel = 0;          // W laser level (0-7, beams = level)
let pUltimateTimer = 0;      // P level 7 shield cooldown (180 frames = 3s)
let pUltimateActive = false; // P level 7 shield is active
let pUltimateAlpha = 0;      // Visual flash alpha
let wUltimateTimer = 0;      // W level 7 piercing laser cooldown (180 frames = 3s)
let wUltimateActive = false; // W level 7 laser beam active
let wUltimateY = 0;          // W ultimate laser Y position
let wUltimateX = 0;          // W ultimate laser X position (fixed on fire)
let mUltimateTimer = 0;      // M level 7 special missile cooldown (300 frames = 5s)
let mUltimateActive = false; // M level 7 special missile active
let mUltimateMissile = null; // M level 7 special missile object
let gameLoopErrorCount = 0;
let sparkleFlashActive = false; // Sparkle effect on weapon upgrade
let sparkleFlashTimer = 0;     // Sparkle flash duration counter

// Player
const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 80,
    width: 62,   // +30% from 48 (user-requested: enlarge player ship)
    height: 62,  // +30% from 48
    speed: PLAYER_SPEED,
    powerLevel: 0,
    bombs: 3,
    lives: 3,
    invincible: false,
    invincibleTimer: 0,
    shieldActive: false,
    shieldTimer: 0,
    shootCooldown: 0,
    visible: true,
    vPowerActive: false,
    vPowerTimer: 0,
    hadShield: false,  // remember shield state before V-power
    activeWeapon: 'P'  // 'P', 'W', or 'M' - tracks which weapon type is active
};

// Input
const keys = {};

// Arrays
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let powerups = [];
let drones = [];
let droneBullets = [];
let laserBeams = [];
let missiles = [];
let missileCooldown = 0;
let missileDefenseCooldown = 0;
let playerMissileLevel = 0;
let explosions = [];
let stars = [];

// === BOSS DESTRUCTION: detached wing debris (separate physics objects) ===
let bossWingDebris = [];

// Background stars
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 1
    });
}

// Colors
const COLORS = {
    player: '#FFD700',
    playerBody: '#1E90FF',
    enemy: '#FF4444',
    enemy2: '#FF6B35',
    bullet: '#FFD700',
    enemyBullet: '#FF3300',
    powerup: '#00FF00',
    powerupP: '#00FF00',
    powerupB: '#FF8C00',
    powerupS: '#00BFFF',
    powerupD: '#FF69B4',
    drone: '#FF69B4',
    droneR: '#FF0000',
    droneBullet: '#4488FF',
    droneBulletR: '#FF1493',
    powerupDR: '#FF0000',
    powerupW: '#FFFFFF',
    powerupV: '#888888',
    powerupM: '#FF6600',
    laser: '#FFFFFF',
    explosion: ['#FF6B35', '#F7931E', '#FFD700', '#FFFFFF']
};

// ============================================
// PLANET THEMES - One planet per stage
// ============================================
const PLANET_THEMES = [
    { name: 'KEPLER-7',  body: '#4A90D9', accent: '#2266CC', glow: '100,150,255', ring: 'rgba(180,210,255,0.55)', hasRing: true, hasMoon: false, moonColor: null, nebula: 'rgba(60,80,140,0.08)' },
    { name: 'VULCAN-4',  body: '#CC4433', accent: '#882211', glow: '220,80,50',   ring: 'rgba(255,130,100,0.45)',  hasRing: false, hasMoon: true, moonColor: '#C0C0C0', nebula: 'rgba(140,40,20,0.07)' },
    { name: 'NEXUS-9',   body: '#6B4A9E', accent: '#362280', glow: '140,100,200', ring: 'rgba(170,140,220,0.55)', hasRing: true, hasMoon: true, moonColor: '#DDA0DD', nebula: 'rgba(80,40,120,0.08)' },
    { name: 'ZENITH-2',  body: '#3C8B5E', accent: '#1A5C30', glow: '80,180,120',  ring: 'rgba(120,200,160,0.5)',   hasRing: false, hasMoon: false, moonColor: null, nebula: 'rgba(30,80,50,0.07)' },
    { name: 'ORION-5',   body: '#D9A04A', accent: '#B07020', glow: '255,180,80',  ring: 'rgba(255,200,120,0.55)',  hasRing: true, hasMoon: false, moonColor: null, nebula: 'rgba(120,80,20,0.07)' },
    { name: 'CRYON-8',   body: '#55AACC', accent: '#337788', glow: '80,190,220',  ring: 'rgba(150,220,240,0.5)',   hasRing: true, hasMoon: true, moonColor: '#E8E8FF', nebula: 'rgba(40,100,140,0.08)' },
    { name: 'EMBER-3',   body: '#EE6622', accent: '#BB4400', glow: '250,120,50',  ring: 'rgba(255,160,80,0.45)',   hasRing: false, hasMoon: false, moonColor: null, nebula: 'rgba(140,60,10,0.07)' },
    { name: 'VOID-6',    body: '#334466', accent: '#1A2A40', glow: '60,80,140',   ring: 'rgba(80,100,180,0.4)',    hasRing: true, hasMoon: true, moonColor: '#999999', nebula: 'rgba(20,30,60,0.09)' },
];

// ============================================
// INPUT HANDLING
// ============================================

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (gameState === GameState.TITLE && e.code === 'Space') {
        initAudio();
        startGame();
    } else if (gameState === GameState.PLAYING && e.code === 'KeyP') {
        gameState = GameState.PAUSED;
    } else if (gameState === GameState.PAUSED && (e.code === 'KeyP' || e.code === 'Escape')) {
        gameState = GameState.PLAYING;
    } else if (gameState === GameState.GAMEOVER && e.code === 'Space') {
        initAudio();
        startGame();
    } else if (gameState === GameState.PLAYING && e.code === 'KeyB') {
        useBomb();
    }
    
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// ============================================
// MOBILE TOUCH CONTROLS
// ============================================

let touchTarget = { x: null, y: null };
let isTouching = false;
// touchFirePressed removed - using auto-fire
let bombBtn = null;
let bombIndicator = null;
let controlsVisible = false;

// Joystick state
let joystickActive = false;
let joystickId = null;
let joystickBaseX = 0;
let joystickBaseY = 0;
let joystickStickX = 0;
let joystickStickY = 0;
let joystickDX = 0;
let joystickDY = 0;
const JOYSTICK_MAX_RADIUS = 40;
const JOYSTICK_BASE_RADIUS = 50;

// Touch device detection
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Initialize mobile controls after DOM is ready
function setupMobileControls() {
    bombBtn = document.getElementById('bombBtn');
    createMobileButtons();
    
    // Canvas touch for Wing Fighter style movement
    canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleCanvasTouchEnd, { passive: false });
    canvas.addEventListener('click', handleCanvasClick);
    
    // Bomb button only (fire button removed - auto-fire on touch devices)
    if (bombBtn) {
        bombBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (gameState === GameState.PLAYING) {
                useBomb();
                bombBtn.classList.add('pressed');
            }
        }, { passive: false });
        
        bombBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            bombBtn.classList.remove('pressed');
        }, { passive: false });
        
        bombBtn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            bombBtn.classList.remove('pressed');
        }, { passive: false });
        
        // Mouse support
        bombBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (gameState === GameState.PLAYING) {
                useBomb();
                bombBtn.classList.add('pressed');
            }
        });
        
        bombBtn.addEventListener('mouseup', () => {
            bombBtn.classList.remove('pressed');
        });
        
        bombBtn.addEventListener('mouseleave', () => {
            bombBtn.classList.remove('pressed');
        });
    }
}

function createMobileButtons() {
    if (bombBtn) {
        controlsVisible = true;
    }
}

function handleCanvasTouch(e) {
    e.preventDefault();
    
    if (gameState === GameState.TITLE) {
        initAudio();
        startGame();
        return;
    }
    
    if (gameState === GameState.GAMEOVER) {
        initAudio();
        startGame();
        return;
    }
    
    if (gameState !== GameState.PLAYING) return;
    
    // Process all touches
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const rect = canvas.getBoundingClientRect();
        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;
        const tx = (touch.clientX - rect.left) * scaleX;
        const ty = (touch.clientY - rect.top) * scaleY;
        
        // Left side (30% of screen) = joystick zone
        if (tx < GAME_WIDTH * 0.3 && !joystickActive) {
            joystickActive = true;
            joystickId = touch.identifier;
            joystickBaseX = tx;
            joystickBaseY = ty;
            joystickStickX = tx;
            joystickStickY = ty;
            joystickDX = 0;
            joystickDY = 0;
        } else if (tx >= GAME_WIDTH * 0.3 && !isTouching) {
            // Right side = direct plane control
            isTouching = true;
            touchTarget.x = tx;
            touchTarget.y = ty;
        }
    }
}

function handleCanvasTouchMove(e) {
    e.preventDefault();
    if (gameState !== GameState.PLAYING) return;
    
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const rect = canvas.getBoundingClientRect();
        const scaleX = GAME_WIDTH / rect.width;
        const scaleY = GAME_HEIGHT / rect.height;
        const tx = (touch.clientX - rect.left) * scaleX;
        const ty = (touch.clientY - rect.top) * scaleY;
        
        // Update joystick
        if (joystickActive && touch.identifier === joystickId) {
            const dx = tx - joystickBaseX;
            const dy = ty - joystickBaseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > JOYSTICK_MAX_RADIUS) {
                joystickStickX = joystickBaseX + (dx / dist) * JOYSTICK_MAX_RADIUS;
                joystickStickY = joystickBaseY + (dy / dist) * JOYSTICK_MAX_RADIUS;
            } else {
                joystickStickX = tx;
                joystickStickY = ty;
            }
            
            joystickDX = (joystickStickX - joystickBaseX) / JOYSTICK_MAX_RADIUS;
            joystickDY = (joystickStickY - joystickBaseY) / JOYSTICK_MAX_RADIUS;
        }
        
        // Update direct touch
        if (isTouching && tx >= GAME_WIDTH * 0.3) {
            touchTarget.x = tx;
            touchTarget.y = ty;
        }
    }
}

function handleCanvasTouchEnd(e) {
    e.preventDefault();
    
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        
        if (joystickActive && touch.identifier === joystickId) {
            joystickActive = false;
            joystickId = null;
            joystickDX = 0;
            joystickDY = 0;
        }
    }
    
    // Check if any remaining touches are on the right side
    if (e.touches.length === 0) {
        isTouching = false;
        touchTarget.x = null;
        touchTarget.y = null;
    } else {
        // Check remaining touches
        let hasRightTouch = false;
        for (let i = 0; i < e.touches.length; i++) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = GAME_WIDTH / rect.width;
            const tx = (e.touches[i].clientX - rect.left) * scaleX;
            if (tx >= GAME_WIDTH * 0.3) {
                hasRightTouch = true;
                touchTarget.x = tx;
                touchTarget.y = (e.touches[i].clientY - rect.top) * (GAME_HEIGHT / rect.height);
            }
        }
        if (!hasRightTouch) {
            isTouching = false;
            touchTarget.x = null;
            touchTarget.y = null;
        }
    }
}

// Click handler for title/gameover screen (touch + mouse fallback)
function handleCanvasClick(e) {
    if (gameState === GameState.TITLE) {
        initAudio();
        startGame();
        return;
    }
    if (gameState === GameState.GAMEOVER) {
        initAudio();
        startGame();
        return;
    }
}

function updateTouchTarget(touch) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    
    touchTarget.x = (touch.clientX - rect.left) * scaleX;
    touchTarget.y = (touch.clientY - rect.top) * scaleY;
}

// Initialize mobile controls after DOM is ready
// Initialize mobile controls - handle both async and sync loading
if (isTouchDevice()) { setupMobileControls(); }

// ============================================
// GAME FUNCTIONS
// ============================================

function startGame() {
    gameState = GameState.PLAYING;
    score = 0;
    currentStage = 1;
    stageWave = 1;
    stageTimer = 0;
    bossDefeated = false;
    bossActive = false;
    bossSpawned = false;
    bossWaveNumber = 0;
    bossClaws = [];
    bossClawCount = 1;
    wave = 1;  // keep wave for compatibility with existing code that reads it
    currentPlanetIndex = 0;
    generatePlanetSet(currentPlanetIndex);
    waveTimer = 0;
    frameCount = 0;
    hyperspaceActive = false;
    hyperspaceTimer = 0;
    hyperspacePhase = 0;
    hyperspaceStars = [];
    
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT - 80;
    // New game: reset all weapon levels
    player.bombs = 3;
    player.lives = 3;
    player.invincible = false;
    player.visible = true;
    player.shieldActive = false;
    player.shieldTimer = 0;
    player.vPowerActive = false;
    player.vPowerTimer = 0;
    player.hadShield = false;
    
    playerBullets = [];
    enemyBullets = [];
    enemies = [];
    powerups = [];
    drones = [];
    droneBullets = [];
    explosions = [];
    laserBeams = [];
    missiles = [];
    missileCooldown = 0;
    missileDefenseCooldown = 0;
    playerMissileLevel = 0;
    bossActive = false;
    bossDefeated = false;
    bossWaveNumber = 0;
    midBossStreak = 0;
    bossClawCount = 1;
    bossClaws = [];
    octopusTentacles = [];
    deathActive = false;
    deathTimer = 0;
    deathFlashAlpha = 0;
    spawnBoost = 0;
    noSpawnCounter = 0;
    screenShake = 0;
    bgStars = [];
    cloudLayer = [];
    // Initialize background stars
    for (let si = 0; si < 120; si++) {
        bgStars.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, sz: Math.random() * 1.5 + 0.5, sp: Math.random() * 0.3 + 0.1, tw: Math.random() * Math.PI * 2 });
    }
    for (let si = 0; si < 40; si++) {
        stars.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, size: Math.random() * 2 + 1, sp: Math.random() * 0.5 + 0.2, tw: Math.random() * Math.PI * 2 });
    }
    for (let si = 0; si < 5; si++) {
        cloudLayer.push({ x: Math.random() * GAME_WIDTH, y: Math.random() * GAME_HEIGHT, w: Math.random() * 120 + 80, sp: Math.random() * 0.3 + 0.15, al: Math.random() * 0.06 + 0.03 });
    }
    hitMarkers = [];
    comboCount = 0;
    comboTimer = 0;
    comboText = '';
    bossHPBarAlpha = 0;
    lastSpawnFrame = 0;
    player.activeWeapon = 'P';
    laserLevel = 0;
    pUltimateTimer = 0;
    pUltimateActive = false;
    pUltimateAlpha = 0;
    wUltimateTimer = 180;
    wUltimateActive = false;
    wUltimateY = player.y;
    wUltimateX = 0;
    mUltimateTimer = 0;
    mUltimateActive = false;
    mUltimateMissile = null;
    
    startBGM();
    buildGradCache(); // PERF: build cached gradients once at game start
}

// === Cached gradient builder ===
// Builds reusable CanvasGradient objects for entities whose color stops are
// constant across frames. Saves ~30 createLinearGradient/createRadialGradient
// allocations per frame when many entities are visible.
function buildGradCache() {
    if (GRAD_CACHE.bgSky) return; // already built

    // Background sky (drawn at full canvas height)
    const sky = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    sky.addColorStop(0, '#0a1a3a');
    sky.addColorStop(0.5, '#2a4870');
    sky.addColorStop(1, '#5a7aa0');
    GRAD_CACHE.bgSky = sky;

    // Background ocean (bottom)
    const ocean = ctx.createLinearGradient(0, GAME_HEIGHT * 0.6, 0, GAME_HEIGHT);
    ocean.addColorStop(0, '#1a3858');
    ocean.addColorStop(1, '#0a1830');
    GRAD_CACHE.bgOcean = ocean;

    // Sun radial
    const sun = ctx.createRadialGradient(
        GAME_WIDTH * 0.78, GAME_HEIGHT * 0.74, 0,
        GAME_WIDTH * 0.78, GAME_HEIGHT * 0.74, 220
    );
    sun.addColorStop(0, 'rgba(255,220,160,0.55)');
    sun.addColorStop(0.4, 'rgba(255,180,120,0.25)');
    sun.addColorStop(1, 'rgba(255,160,100,0)');
    GRAD_CACHE.sunGlow = sun;

    // === Background-specific gradients (drawBackground uses these) ===
    // Dusk sky gradient for 1945 themed background
    const skyDusk = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    skyDusk.addColorStop(0, '#1a3a6b');
    skyDusk.addColorStop(0.55, '#5b8bbf');
    skyDusk.addColorStop(0.78, '#a9c4dc');
    skyDusk.addColorStop(0.82, '#0c2a4a');
    skyDusk.addColorStop(1, '#081f3a');
    GRAD_CACHE.bgSkyDusk = skyDusk;

    // Dusk sun glow radial (matches drawBackground literals exactly)
    const sunDusk = ctx.createRadialGradient(
        GAME_WIDTH * 0.78, GAME_HEIGHT * 0.74, 0,
        GAME_WIDTH * 0.78, GAME_HEIGHT * 0.74, 220
    );
    sunDusk.addColorStop(0, 'rgba(255, 220, 160, 0.55)');
    sunDusk.addColorStop(0.4, 'rgba(255, 180, 120, 0.18)');
    sunDusk.addColorStop(1, 'rgba(255, 180, 120, 0)');
    GRAD_CACHE.sunGlowDusk = sunDusk;

    // Cloud body horizontal (generic)
    const cBody = ctx.createLinearGradient(0, 0, 120, 0);
    cBody.addColorStop(0, 'rgba(255,255,255,0.10)');
    cBody.addColorStop(0.5, 'rgba(255,255,255,0.20)');
    cBody.addColorStop(1, 'rgba(255,255,255,0.10)');
    GRAD_CACHE.cloudBody = cBody;

    const cHi = ctx.createLinearGradient(0, 0, 0, 30);
    cHi.addColorStop(0, 'rgba(255,255,255,0.30)');
    cHi.addColorStop(1, 'rgba(255,255,255,0)');
    GRAD_CACHE.cloudHighlight = cHi;

    // Player P-40 — colors must match drawPlayer literals exactly.
    const pWing = ctx.createLinearGradient(-24, 0, 24, 0);
    pWing.addColorStop(0, '#1F4F8A');
    pWing.addColorStop(0.5, '#3D7AB8');
    pWing.addColorStop(1, '#1F4F8A');
    GRAD_CACHE.playerWing = pWing;

    const pBody = ctx.createLinearGradient(0, -16, 0, 16);
    pBody.addColorStop(0, '#1F4F8A');
    pBody.addColorStop(0.5, '#3D7AB8');
    pBody.addColorStop(1, '#1A3A6A');
    GRAD_CACHE.playerBody = pBody;

    const pCanopy = ctx.createLinearGradient(0, -8, 0, -2);
    pCanopy.addColorStop(0, '#5ce0ff');
    pCanopy.addColorStop(0.5, '#a0f0ff');
    pCanopy.addColorStop(1, '#3aa0d0');
    GRAD_CACHE.playerCanopy = pCanopy;

    // Scout enemy (small fighter)
    const sWing = ctx.createLinearGradient(-20, 0, 20, 0);
    sWing.addColorStop(0, '#661111');
    sWing.addColorStop(0.5, '#AA2222');
    sWing.addColorStop(1, '#661111');
    GRAD_CACHE.scoutWing = sWing;

    const sBody = ctx.createLinearGradient(-5, -16, 5, 12);
    sBody.addColorStop(0, '#FF6644');
    sBody.addColorStop(0.5, '#CC2222');
    sBody.addColorStop(1, '#661111');
    GRAD_CACHE.scoutBody = sBody;

    const sCanopy = ctx.createLinearGradient(0, -10, 0, -2);
    sCanopy.addColorStop(0, '#5ce0ff');
    sCanopy.addColorStop(0.5, '#a0f0ff');
    sCanopy.addColorStop(1, '#3aa0d0');
    GRAD_CACHE.scoutCanopy = sCanopy;

    // Heavy bomber mid-boss
    const hWing = ctx.createLinearGradient(-28, 0, 28, 0);
    hWing.addColorStop(0, '#444444');
    hWing.addColorStop(0.5, '#777777');
    hWing.addColorStop(1, '#444444');
    GRAD_CACHE.heavyWing = hWing;

    const hBody = ctx.createLinearGradient(-7, -20, 7, 14);
    hBody.addColorStop(0, '#AAAAAA');
    hBody.addColorStop(0.5, '#666666');
    hBody.addColorStop(1, '#333333');
    GRAD_CACHE.heavyBody = hBody;

    // Final boss (slender interceptor — body, canopy, tail, wing)
    // drawFinalBoss (slender interceptor) — colors must match drawFinalBoss literals.
    const fFuse = ctx.createLinearGradient(0, -15, 0, 22);
    fFuse.addColorStop(0, '#4A5260');
    fFuse.addColorStop(0.5, '#2A323E');
    fFuse.addColorStop(1, '#181C24');
    GRAD_CACHE.finalFuselage = fFuse;

    const fCanopy = ctx.createLinearGradient(0, -14, 0, 2);
    fCanopy.addColorStop(0, '#5AFFB0');
    fCanopy.addColorStop(0.5, '#1AA060');
    fCanopy.addColorStop(1, '#0A4030');
    GRAD_CACHE.finalCanopy = fCanopy;

    const fTail = ctx.createLinearGradient(0, 20, 0, 50);
    fTail.addColorStop(0, '#3A4250');
    fTail.addColorStop(1, '#1A2028');
    GRAD_CACHE.finalTail = fTail;

    const fWing = ctx.createLinearGradient(-100, 0, 100, 0);
    fWing.addColorStop(0, '#3a2818');
    fWing.addColorStop(0.5, '#5a4030');
    fWing.addColorStop(1, '#3a2818');
    GRAD_CACHE.finalWing = fWing;

    // drawWaveBoss (red heavy) — body
    const fBody = ctx.createLinearGradient(-20, -30, 20, 30);
    fBody.addColorStop(0, '#CC4444');
    fBody.addColorStop(0.5, '#882222');
    fBody.addColorStop(1, '#440000');
    GRAD_CACHE.finalBody = fBody;

    // Drone (pink/magenta — small prop fighter) — colors must match drawDrone literals.
    const dBody = ctx.createLinearGradient(-3, -10, 3, 10);
    dBody.addColorStop(0, '#FFCCDD');
    dBody.addColorStop(0.5, '#FF66AA');
    dBody.addColorStop(1, '#993366');
    GRAD_CACHE.droneBody = dBody;

    const dWing = ctx.createLinearGradient(-12, 0, 12, 0);
    dWing.addColorStop(0, '#CC3366');
    dWing.addColorStop(0.5, '#FF4488');
    dWing.addColorStop(1, '#CC3366');
    GRAD_CACHE.droneWing = dWing;

    const dCanopy = ctx.createLinearGradient(0, -7, 0, 0);
    dCanopy.addColorStop(0, '#88DDFF');
    dCanopy.addColorStop(1, '#224466');
    GRAD_CACHE.droneCanopy = dCanopy;

    // Standard player bullet (cached w/ relative coords, ctx transforms to bullet pos)
    const bCore = ctx.createLinearGradient(-3, -8, 3, 8);
    bCore.addColorStop(0, '#fff8a0');
    bCore.addColorStop(0.5, '#ffd040');
    bCore.addColorStop(1, '#ff9020');
    GRAD_CACHE.bulletCore = bCore;

    // Bomb body vertical — colors must match drawBullet literals.
    const bombBody = ctx.createLinearGradient(-7, -8, 7, 9);
    bombBody.addColorStop(0, '#666');
    bombBody.addColorStop(0.5, '#3A3A3A');
    bombBody.addColorStop(1, '#1A1A1A');
    GRAD_CACHE.bombBody = bombBody;

    // Bomb fuse (radial)
    const fuse = ctx.createRadialGradient(0, -10, 0, 0, -10, 4);
    fuse.addColorStop(0, 'rgba(255,255,180,1)');
    fuse.addColorStop(0.5, 'rgba(255,180,80,0.7)');
    fuse.addColorStop(1, 'rgba(255,80,0,0)');
    GRAD_CACHE.bombFuse = fuse;

    // Enemy bullet core (radial — vivid red tone for high contrast on any background)
    const eBullet = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    eBullet.addColorStop(0, 'rgba(255,120,80,1)');
    eBullet.addColorStop(0.35, 'rgba(255,30,20,1)');
    eBullet.addColorStop(0.75, 'rgba(200,20,20,0.9)');
    eBullet.addColorStop(1, 'rgba(140,0,0,0)');
    GRAD_CACHE.bulletEnemyCore = eBullet;

    // Boss HP bar (full-width 300px, scaled via ctx when drawn)
    const hp = ctx.createLinearGradient(0, 0, 300, 0);
    hp.addColorStop(0, '#ff4040');
    hp.addColorStop(0.5, '#ff8040');
    hp.addColorStop(1, '#ffcc40');
    GRAD_CACHE.hpBarFill = hp;

    // W ultimate text vertical
    const wUlt = ctx.createLinearGradient(0, 0, 0, 80);
    wUlt.addColorStop(0, '#a0ffff');
    wUlt.addColorStop(1, '#2080ff');
    GRAD_CACHE.wUltText = wUlt;
}

function useBomb() {
    if (typeof deathActive !== 'undefined' && deathActive) return;
    if (player.bombs <= 0) return;

    player.bombs--;

    // Destroy ALL non-boss enemies — stage final boss is immune to bomb (only loses 8% HP)
    const bombDamagePct = 0.08;
    let finalBossHit = false;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const en = enemies[i];
        // === DYING GUARD: skip enemies already in dying-fall / death-cascade (avoid double rewards) ===
        if (en.dying) continue;
        if (en.isWaveBoss) {
            // Final boss is bomb-immune: only deal small damage, never destroy
            const dmg = Math.max(1, Math.floor(en.hp * bombDamagePct));
            en.hp -= dmg;
            createExplosion(en.x, en.y, 4);
            finalBossHit = true;
            if (en.hp < 0) en.hp = 1; // safety floor so it can't be destroyed by bomb alone
            continue;
        }
        createExplosion(en.x, en.y, 10);
        score += en.score || 10;
        enemies.splice(i, 1);
    }

    // Clear ALL enemy bullets
    enemyBullets = [];

    // Big screen flash at center
    createExplosion(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50);
}

function playerShoot() {
    if (player.shootCooldown > 0) return;
    // Block P bullets when lasers or missiles active
    if (laserBeams.length > 0 || playerMissileLevel > 0) return;
    
    player.shootCooldown = 8;
    playShootSound();
    
    // playerMissileLevel already checked above
    
    // P weapon: 7 levels (0-6), each level adds more bullets with increasing power
    const pw = player.powerLevel;
    const bulletPower = player.vPowerActive ? 2.0 : (1 + pw * 0.15); // scaling damage
    const bulletW = 4 + pw * 1;  // thicker bullets at higher levels
    const bulletH = 14 + pw * 2; // longer bullets
    
    if (pw === 0) {
        // Level 1: Single bullet
        playerBullets.push({
            x: player.x, y: player.y - 20,
            width: 4, height: 16, speed: BULLET_SPEED,
            power: bulletPower
        });
    } else if (pw === 1) {
        // Level 2: 2 bullets
        for (let i = 0; i < 2; i++) {
            playerBullets.push({
                x: player.x + (i - 0.5) * 16, y: player.y - 18,
                width: bulletW, height: bulletH, speed: BULLET_SPEED + 1,
                power: bulletPower
            });
        }
    } else if (pw === 2) {
        // Level 3: 3 bullets (center + angled sides)
        playerBullets.push({x: player.x, y: player.y - 22, width: bulletW + 2, height: bulletH + 2, speed: BULLET_SPEED + 2, power: bulletPower});
        playerBullets.push({x: player.x - 16, y: player.y - 12, width: bulletW, height: bulletH, speed: BULLET_SPEED + 1, angle: -0.12, power: bulletPower});
        playerBullets.push({x: player.x + 16, y: player.y - 12, width: bulletW, height: bulletH, speed: BULLET_SPEED + 1, angle: 0.12, power: bulletPower});
    } else if (pw === 3) {
        // Level 4: 4 bullets (2×2 spread)
        for (let i = 0; i < 4; i++) {
            playerBullets.push({
                x: player.x + (i - 1.5) * 14, y: player.y - 20,
                width: bulletW, height: bulletH, speed: BULLET_SPEED + 2,
                power: bulletPower
            });
        }
    } else if (pw === 4) {
        // Level 5: 5 bullets (wide spread with angles)
        for (let i = -2; i <= 2; i++) {
            playerBullets.push({
                x: player.x + i * 12, y: player.y - 20,
                width: bulletW, height: bulletH, speed: BULLET_SPEED + 3,
                angle: i * 0.08, power: bulletPower
            });
        }
    } else if (pw === 5) {
        // Level 6: 6 bullets (dense spread)
        for (let i = -2; i <= 3; i++) {
            playerBullets.push({
                x: player.x + (i - 0.5) * 11, y: player.y - 20,
                width: bulletW + 1, height: bulletH + 2, speed: BULLET_SPEED + 3,
                angle: (i - 0.5) * 0.07, power: bulletPower
            });
        }
    } else {
        // Level 7 (pw >= 6): 7-bullet fan spread
        for (let i = -3; i <= 3; i++) {
            playerBullets.push({
                x: player.x + i * 11, y: player.y - 20,
                width: bulletW + 2, height: bulletH + 4, speed: BULLET_SPEED + 4,
                angle: i * 0.08, power: bulletPower
            });
        }
    }
}

function spawnEnemy() {
    // === FINAL BOSS INTRO (2026-09): drive the siren/escort phase machine. ===
    // This call is a no-op once the boss is fully spawned (phase === 'spawn'),
    // so it is safe to invoke from every spawnEnemy caller without guard.
    updateBossIntro();

    // Boss wave check: boss appears at sub-wave 10 of each stage
    // Also handle case where stageWave overshot due to timer
    // Force new boss spawn - remove any old boss that's still alive
    if ((stageWave === STAGE_WAVES || stageWave > STAGE_WAVES) && bossWaveNumber < currentStage && !bossActive) {
        // Remove any previous wave boss that's still alive (prevents spawn blocking)
        if (bossActive) {
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
                if (enemies[ei].isWaveBoss) {
                    enemies.splice(ei, 1);
                }
            }
            bossClaws = [];
        }
        // === 2026-09 FINAL BOSS INTRO SEQUENCE ===
        // Phase A: red siren flash (~60 frames)
        // Phase B: swarm of escort enemies fills screen and drifts down (~240 frames)
        //          - Escorts fire NO bullets — pure visual escort only
        // Phase C: when escorts cleared (or 240f elapsed) → spawn the actual final boss
        bossActive = true;
        bossDefeated = false;
        bossSpawned = false;  // Guard: boss not yet spawned — escorts must clear first
        bossIsFinalBoss = true;
        bossWaveNumber = currentStage;
        bossIntroPhase = 'siren';          // 'siren' | 'escort' | 'spawn'
        bossIntroTimer = 0;
        bossSirenTimer = 0;                // drives the red flash overlay
        bossEscortSpawnTimer = 0;
        bossEscortSpawnedCount = 0;
        bossEscortMax = 28;                // very dense screen-filling swarm
        bossEscortActiveCount = 0;
        bossEscortStartTimer = 0;          // 4-second timer for escort descent window
        bossEscortWindowFrames = 240;      // 4s @ 60fps
        
        // Boss HP: first boss = mid-boss * 3 (20+10*5=70, so 210)
        // Each subsequent boss +30% from previous boss
        // (2026-09 update) Final boss HP doubled (x2) for the escort-stage finale.
        const bossNumber = currentStage; // Boss number = current stage
        const baseMidBossHP = 20 + 10 * 5; // mid-boss HP at wave 10 = 70
        let bossHP = Math.round(baseMidBossHP * 3); // 210 for first boss (integer)
        for (let b = 1; b < bossNumber; b++) {
            bossHP = Math.round(bossHP * 1.3);
        }
        bossHP = bossHP * 2; // Final boss: +100% HP (escort stage finale)
        bossBaseHP = bossHP;
        
        // Each boss appearance adds one more claw (first boss = 1 claw)
        bossClawCount = currentStage + 1;
        bossClaws = [];
        
        // Boss payload is staged — it is created only when the escort clears.
        // We hold the stats here so spawnFinalBoss() can build the entity later.
        bossPendingPayload = {
            x: GAME_WIDTH / 2,
            y: -120,
            // Visual size — B-52 spans ~340 wide × 96 tall (long bomber silhouette).
            width: 340,
            height: 96,
            type: 'final',
            hp: bossHP,
            maxHp: bossHP,
            speed: ENEMY_BASE_SPEED * 0.25,
            score: 5000 + currentStage * 5000,
            shootCooldown: 60,
            angle: 0,
            phase: Math.random() * Math.PI * 2,
            isWaveBoss: true,
            // === B-52 hitbox segmentation ===
            // Wings are huge but invulnerable. Only fuselage (center) and tail take damage.
            // Coordinates are relative to enemy center (e.x, e.y). Visual layout:
            //   wings:  x in [-170, -55] and [55, 170]   y in [-30, 30]   → invulnerable
            //   body:   x in [-55, 55]                   y in [-25, 30]   → damageable (fuselage)
            //   tail:   x in [-25, 25]                   y in [30, 60]    → damageable (tail)
            hitboxWings: { xOff: 0, yOff: 0, halfW: 170, halfH: 30 },   // wings (for reference)
            hitboxBody:  { xOff: 0, yOff: 2, halfW: 55, halfH: 28 },    // fuselage (center)
            hitboxTail:  { xOff: 0, yOff: 45, halfW: 25, halfH: 15 },   // tail section
            // Bomb-trail attack — drops a row of bombs slowly every cycle
            bombTrailCooldown: 90,
            bombTrailPhase: 0,
            bombTrailBullets: 6    // bombs per trail
        };
        // (Boss entity push is deferred to spawnFinalBoss() after escort clears.)

        // Show boss warning flash
        waveFlash = { active: true, timer: 120, text: 'WARNING: INCOMING BOSS' };
        // Cap stageWave at STAGE_WAVES while boss is alive
        if (stageWave > STAGE_WAVES) stageWave = STAGE_WAVES;
        // Reset stageTimer to give boss fight full duration
        stageTimer = 0;
        // Block normal spawns during the entire boss intro (siren + escort)
        return;
    }

    // Block normal spawns during the boss intro (siren + escort phases)
    if (bossActive && bossIntroPhase && bossIntroPhase !== 'spawn') {
        return;
    }

    // Spawn enemies slightly slower during boss fight (7/8 pass rate)
    if (bossActive && frameCount % 8 === 0) return;
    
    let types = ['scout', 'scout', 'scout', 'scout', 'scout', 'fighter', 'fighter', 'fighter', 'bomber', 'rammer'];
    if (wave >= 3) { types.push('fighter', 'bomber', 'rammer'); }
    // Mid-boss spawn: all mid-bosses unified to heavyBomber design (long bomber silhouette)
    if (wave >= 17 && wave % 10 !== 0) types.push('heavyBomber');
    // At wave 15+, reduce small enemy types by 50% (prevent overwhelming spawns)
    if (currentStage >= 2 && stageWave !== STAGE_WAVES) {
        // More small enemies for stage 2+
        types = ['scout', 'scout', 'scout', 'scout', 'scout', 'fighter', 'fighter', 'fighter', 'bomber', 'rammer'];
        // Mid-bosses only after wave >= 17 (same condition as stage 1) - unified heavyBomber
        if (wave >= 17 && wave % 10 !== 0) {
            types.push('heavyBomber');
        }
    }
    
    let type = types[Math.floor(Math.random() * types.length)];
    
    // Limit consecutive mid-boss spawns to 5 before forcing a break
    if (type === 'heavyBomber') {
        midBossStreak++;
        if (midBossStreak > 3) {
            // Force a non-boss enemy after 5 consecutive mid-bosses
            const fallbackTypes = ['scout', 'fighter', 'bomber', 'rammer'];
            type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
            midBossStreak = 0;
        }
    } else {
        midBossStreak = 0;
    }
    
    // CAP: Max 2 heavy bombers on screen at once (prevent mass accumulation)
    if (type === 'heavyBomber') {
        let bomberCount = 0;
        for (let ec = 0; ec < enemies.length; ec++) {
            if (enemies[ec].type === 'heavyBomber') bomberCount++;
        }
        if (bomberCount >= 2) {
            const fallbackTypes = ['scout', 'fighter', 'bomber', 'rammer'];
            type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
        }
    }
    
    // CAP: Max 3 total mid-bosses on screen (all heavyBomber)
    if (type === 'heavyBomber') {
        let bossCount = 0;
        for (let bc = 0; bc < enemies.length; bc++) {
            if (enemies[bc].type === 'heavyBomber') bossCount++;
        }
        if (bossCount >= 3) {
            const fallbackTypes = ['scout', 'fighter', 'bomber', 'rammer'];
            type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
        }
    }

    // During spawnBoost (rapid spawn after stage start), skip mid-bosses entirely
    if (spawnBoost > 0 && type === 'heavyBomber') {
        const fallbackTypes = ['scout', 'fighter', 'bomber', 'rammer'];
        type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
    }
    
    let enemy = {
        x: Math.random() * (GAME_WIDTH - 60) + 30,
        y: -50,
        width: 40,
        height: 40,
        type: type,
        hp: 1,
        maxHp: 1,
        speed: ENEMY_BASE_SPEED,
        score: 100,
        shootCooldown: Math.random() * 60 + 30,
        angle: 0,
        phase: Math.random() * Math.PI * 2
    };
    
    switch (type) {
        case 'scout':
            enemy.hp = 1;
            enemy.maxHp = 1;
            enemy.speed = ENEMY_BASE_SPEED + Math.random();
            enemy.score = 100;
            enemy.width = 36;
            enemy.height = 36;
            break;
        case 'heavyBomber':
            // Heavy bomber mid-boss (replaces octopus) - aerial, slow, fires homing missiles from both wings
            enemy.isMidBoss = true; // CRITICAL: required for dying-fall to trigger on kill
            enemy.isHeavyBomber = true;
            enemy.hp = Math.round((((3 + currentStage * 3) * 0.7) + 2) * 3.2); // +220% tankier than baseline (1.6× + additional 100%)
            enemy.maxHp = enemy.hp;
            enemy.speed = 0.4 + currentStage * 0.05;
            enemy.score = 750;
            enemy.width = 70;
            enemy.height = 50;
            enemy.y = 80;
            enemy.isStationary = false;
            enemy.shootCooldown = 150; // Initial cooldown
            enemy.wingSide = 0; // 0 = left wing next, 1 = right wing next
            enemy.phase = Math.random() * Math.PI * 2;
            enemy._movePhase = Math.random() * Math.PI * 2;
            break;
        case 'fighter':
            enemy.hp = 2;
            enemy.maxHp = 2;
            enemy.speed = ENEMY_BASE_SPEED * 0.8;
            enemy.score = 200;
            enemy.width = 44;
            enemy.height = 44;
            break;
        case 'bomber':
            enemy.hp = 3;
            enemy.maxHp = 3;
            enemy.speed = ENEMY_BASE_SPEED * 0.5;
            enemy.score = 300;
            enemy.width = 52;
            enemy.height = 52;
            enemy.shootCooldown = 120;
            break;
        case 'boss':
            // Legacy alias → unified to heavyBomber design (long bomber silhouette)
            // Spawn logic no longer emits 'boss' but kept for back-compat / future use
            enemy.isMidBoss = true;
            enemy.isHeavyBomber = true;
            enemy.hp = Math.round((((3 + currentStage * 3) * 0.7) + 2) * 3.2);
            enemy.maxHp = enemy.hp;
            enemy.speed = 0.4 + currentStage * 0.05;
            enemy.score = 750;
            enemy.width = 70;
            enemy.height = 50;
            enemy.y = 80;
            enemy.isStationary = false;
            enemy.shootCooldown = 150;
            enemy.wingSide = 0;
            enemy.phase = Math.random() * Math.PI * 2;
            enemy._movePhase = Math.random() * Math.PI * 2;
            break;
        case 'rammer':
            enemy.hp = 1 + Math.floor(currentStage * 0.7);
            // HP scales: Stage1=1, Stage2=2, Stage3=3, Stage5=4, Stage10=8
            enemy.maxHp = enemy.hp;
            enemy.speed = ENEMY_BASE_SPEED * 0.864;
            enemy.score = 400;
            enemy.width = 48;
            enemy.height = 48;
            enemy.shootCooldown = 9999;
            break;
    }
    
    enemy._id = 'enemy_' + frameCount + '_' + Math.random();
    enemies.push(enemy);
}

function spawnPowerup(x, y, isBossKill) {
    // No powerups drop during V-Power mode
    if (player.vPowerActive) return;
    // First 9 waves (before boss): 50% higher item drop rate for better survivability
    // From wave 10 (boss appears): original rate
    const dropRate = wave < 10 ? 0.0804375 : 0.053625;
    if (Math.random() > dropRate && !isBossKill) return;
    
    let types;
    if (isBossKill) {
        // Boss kill: guaranteed V powerup + chance for others
        types = ['powerV', 'power', 'powerW', 'powerM', 'bomb', 'shield'];
    } else if (bossActive) {
        // During boss fight: V powerup can appear but rarely
        types = ['powerV', 'power', 'powerW', 'powerM', 'powerW', 'powerW', 'bomb', 'bomb', 'shield', 'drone', 'droneR'];
    } else {
        types = ['powerV', 'power', 'powerW', 'powerM', 'powerW', 'powerW', 'bomb', 'bomb', 'shield', 'drone', 'droneR'];
    }
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerups.push({
        x: x,
        y: y,
        width: 24,
        height: 24,
        type: type,
        speed: 1.5
    });
}

// ====================================================================
// === FINAL BOSS INTRO (2026-09) =======================================
// ====================================================================
// Three-phase cinematic entrance for the stage final boss:
//   'siren'  — red emergency siren flashes for ~1.5s
//   'escort' — dense swarm of escort aircraft fills the screen and drifts
//              downward (left/right or in tight columns). Escorts NEVER fire —
//              they are pure visual escort for the incoming boss.
//   'spawn'  — escort window ends (escorts cleared or 4s elapsed) → the
//              actual final boss entity is spawned from bossPendingPayload.
//
// Escort enemies are flagged with `isBossEscort = true`. They use normal
// collision HP and give normal score, but their bullet cooldown is disabled.
// ====================================================================

function spawnBossEscort() {
    // Pick spawn pattern: column (tight vertical line) or side entry (L/R)
    const pattern = Math.floor(Math.random() * 3); // 0 = left, 1 = right, 2 = column
    const xBase = pattern === 0 ? -20 : (pattern === 1 ? GAME_WIDTH + 20 : GAME_WIDTH / 2);
    const xJitter = (Math.random() - 0.5) * 30;
    const x = xBase + xJitter;
    const y = -30 - Math.random() * 60;

    // For columns: create a small flock at once instead of single
    if (pattern === 2) {
        const colWidth = 50;
        const count = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count && bossEscortSpawnedCount < bossEscortMax; i++) {
            const ex = GAME_WIDTH / 2 + (i - (count - 1) / 2) * colWidth;
            const ey = y - i * 28;
            pushBossEscortEnemy(ex + (Math.random() - 0.5) * 14, ey, i % 2 === 0 ? 'scout' : 'fighter');
        }
        return;
    }

    // Side entry: single escort
    const t = (pattern === 0) ? 'fighter' : (Math.random() < 0.5 ? 'scout' : 'fighter');
    pushBossEscortEnemy(x, y, t);
}

function pushBossEscortEnemy(x, y, kind) {
    // Small visual size, no bullets, slightly faster than normal scout to fill screen.
    const enemy = {
        x: x,
        y: y,
        width: kind === 'fighter' ? 30 : 26,
        height: kind === 'fighter' ? 30 : 26,
        type: kind,           // 'scout' or 'fighter' — drawn with existing drawEnemyAircraft branches
        hp: 1,
        maxHp: 1,
        speed: ENEMY_BASE_SPEED * 0.85,
        score: 50,
        shootCooldown: 99999, // effectively disabled — no bullets
        shootCooldownMax: 99999,
        angle: 0,
        phase: Math.random() * Math.PI * 2,
        isBossEscort: true,   // mark as escort (for update logic + filtering)
        // Smooth lateral sway: gentle sinusoidal L/R drift while descending.
        escortSwayAmp: 20 + Math.random() * 18,
        escortSwayFreq: 0.025 + Math.random() * 0.02,
        escortSwayPhase: Math.random() * Math.PI * 2,
        escortSwayCenter: x
    };
    enemies.push(enemy);
    bossEscortSpawnedCount++;
}

function updateBossIntro() {
    if (!bossActive || !bossIntroPhase || bossIntroPhase === 'spawn') return;

    // === SIREN PHASE — red overlay flash for ~1.5s ===
    if (bossIntroPhase === 'siren') {
        bossSirenTimer++;
        if (bossSirenTimer >= bossSirenDuration) {
            bossIntroPhase = 'escort';
            bossEscortStartTimer = 0;
            bossEscortSpawnTimer = 0;
            bossEscortSpawnedCount = 0;
            bossEscortActiveCount = 0;
        }
        return;
    }

    // === ESCORT PHASE — spawn escorts continuously and let them drift ===
    if (bossIntroPhase === 'escort') {
        bossEscortStartTimer++;
        bossEscortSpawnTimer++;

        // Spawn cadence: about every 6 frames so screen fills quickly
        if (bossEscortSpawnTimer >= 6 && bossEscortSpawnedCount < bossEscortMax) {
            bossEscortSpawnTimer = 0;
            spawnBossEscort();
        }

        // Update escort-specific behavior each frame (sway + descent)
        for (let i = 0; i < enemies.length; i++) {
            const en = enemies[i];
            if (!en || !en.isBossEscort) continue;
            // Lateral sinusoidal sway around escortSwayCenter
            en.x = en.escortSwayCenter + Math.sin(frameCount * en.escortSwayFreq + en.escortSwayPhase) * en.escortSwayAmp;
            en.y += en.speed;
            // Remove if drifted past bottom — counts as "cleared"
            if (en.y > GAME_HEIGHT + 40) {
                en.markRemove = true;
            }
        }
        // Reap off-screen escorts
        if (enemies.some(e => e && e.markRemove)) {
            enemies = enemies.filter(e => !e.markRemove);
        }

        // Count remaining escorts
        let remain = 0;
        for (let j = 0; j < enemies.length; j++) {
            if (enemies[j] && enemies[j].isBossEscort) remain++;
        }
        bossEscortActiveCount = remain;

        // Escort window closes when: (a) all spawned escorts cleared, OR
        //                              (b) 4 seconds elapsed from escort start
        const elapsedEnough = bossEscortStartTimer >= bossEscortWindowFrames;
        const allCleared = (bossEscortSpawnedCount >= bossEscortMax && remain === 0);
        if (elapsedEnough || allCleared) {
            spawnFinalBoss();
        }
        return;
    }
}

function spawnFinalBoss() {
    // Promote the deferred payload to an actual enemy entity.
    if (!bossPendingPayload) {
        // Defensive fallback — should never happen, but keep boss fight alive.
        bossIntroPhase = 'spawn';
        bossSpawned = true;
        return;
    }
    enemies.push(Object.assign({}, bossPendingPayload));
    bossPendingPayload = null;
    bossIntroPhase = 'spawn';
    bossSpawned = true;
    // Big boss entry flash
    waveFlash = { active: true, timer: 120, text: 'BOSS' };
    // Reset stageTimer to give boss fight full duration
    stageTimer = 0;
}

function drawBossSirenOverlay() {
    if (!bossActive || bossIntroPhase !== 'siren') return;
    // Strobe between dark red and bright red. Frame count % 6 alternates.
    const t = bossSirenTimer;
    // Build a 3-pulse envelope: 0..30 bright, 30..45 dark, 45..90 bright pulse,
    // to look like an emergency siren.
    let alpha = 0;
    if (t < 30) {
        alpha = 0.35 * (t / 30);
    } else if (t < 45) {
        alpha = 0.35 * (1 - (t - 30) / 15);
    } else if (t < 60) {
        alpha = 0.30 * ((t - 45) / 15);
    } else if (t < 75) {
        alpha = 0.30 * (1 - (t - 60) / 15);
    } else {
        alpha = 0.45 * Math.min(1, (t - 75) / 15);
    }
    if (alpha <= 0) return;
    // Full-screen red flash
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FF1818';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Siren border vignette
    ctx.globalAlpha = alpha * 0.9;
    const vig = ctx.createRadialGradient(
        GAME_WIDTH / 2, GAME_HEIGHT / 2, Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.3,
        GAME_WIDTH / 2, GAME_HEIGHT / 2, Math.max(GAME_WIDTH, GAME_HEIGHT) * 0.7
    );
    vig.addColorStop(0, 'rgba(255, 30, 30, 0)');
    vig.addColorStop(1, 'rgba(180, 0, 0, 0.85)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // WARNING text
    ctx.globalAlpha = Math.min(1, alpha * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!! WARNING !!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#FFE0E0';
    ctx.fillText('INCOMING HOSTILES', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16);
    ctx.restore();
}

function drawBossEscortLabel() {
    if (!bossActive || bossIntroPhase !== 'escort') return;
    // Small caption at top so the player understands the escort role.
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#FFD060';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const remain = bossEscortMax - bossEscortSpawnedCount + bossEscortActiveCount;
    ctx.fillText('BOSS ESCORT — CLEAR THEM (' + remain + ')', GAME_WIDTH / 2, 8);
    ctx.restore();
}

function createExplosion(x, y, scale) {
    scale = scale || 1.0;
    // === PERF: Adaptive particle budget for screen density ===
    var overloaded = explosions.length > 120;
    var mult = overloaded ? 0.35 : 0.5;
    var sc = scale * mult;
    // === IMPACT: Core flash — always reserved (squeeze room by retiring oldest non-core particle) ===
    if (explosions.length >= MAX_PARTICLES) {
        var roomMade = false;
        for (var ri = 0; ri < explosions.length; ri++) {
            if (!explosions[ri].isCore) { explosions.splice(ri, 1); roomMade = true; break; }
        }
        if (!roomMade) return;
    }
    {
        var coreSize = scale >= 1.5 ? 4 * sc : (1.5 + scale * 1.2);
        explosions.push({x:x,y:y,vx:0,vy:0,size:coreSize,life:1.0,decay: scale >= 1.5 ? 0.18 : 0.22,color: scale >= 2 ? '#FFFFDD' : '#FFEEC8',isCore:true,gravity:0});
    }
    // === IMPACT: Debris — minimum 2 fragments even under overload (was 1, felt muted) ===
    if (explosions.length < MAX_PARTICLES - 6) {
        var debrisCount = scale >= 1.5 ? Math.floor(2 + sc * 2) : (overloaded ? 2 : 3);
        debrisCount = Math.min(debrisCount, scale >= 3 ? 6 : 4);
        for (var di = 0; di < debrisCount; di++) {
            var dAng = Math.random() * Math.PI * 2;
            var dSpd = (0.6 + Math.random() * 1.4) * sc * (scale >= 2 ? 1.2 : 0.7);
            explosions.push({x:x,y:y,vx:Math.cos(dAng)*dSpd,vy:Math.sin(dAng)*dSpd,size: (1 + Math.random()) * Math.max(0.6, sc * 0.9),life:1.0,decay:0.04,color: Math.random() < 0.5 ? '#888' : '#666',isDebris:true,rotSpeed:0.1,angle:Math.random()*Math.PI*2,gravity:0.1});
        }
    }
    // === IMPACT: Smoke puff — at least 1 wisp always shown (was blocked on overload → muted feel) ===
    if (explosions.length < MAX_PARTICLES - 4) {
        var smokeCount = overloaded ? 1 : (scale >= 1.5 ? Math.floor(4 * sc) : (scale >= 0.5 ? 2 : 1));
        for (var si = 0; si < smokeCount; si++) {
            var sAng = Math.random() * Math.PI * 2;
            var sSpd = 0.2 + Math.random() * 0.5 * sc;
            explosions.push({x:x,y:y,vx:Math.cos(sAng)*sSpd,vy:Math.sin(sAng)*sSpd,life:1.0,decay:0.02,size:2+Math.random()*2*sc,color: scale >= 1.5 ? '#555' : '#666',isSmoke:true,type:'smoke',gravity:0.02});
        }
    }
    // === Fireball (2-4 particles at small scale, scaled up at large) ===
    var fireCount = overloaded ? 2 : Math.floor(3 + scale * 2.5);
    fireCount = Math.min(fireCount, 8);
    for (var fi = 0; fi < fireCount; fi++) {
        var fAng = Math.random() * Math.PI * 2;
        var fSpd = 0.8 + Math.random() * 1.2 * sc;
        explosions.push({x:x,y:y,vx:Math.cos(fAng)*fSpd,vy:Math.sin(fAng)*fSpd,life:1.0,decay:0.04,size:1.5+Math.random()*2.5*sc,color:COLORS.explosion[Math.floor(Math.random()*3)],type:'fire',gravity:0});
    }
    // === Sparks — for scale >= 1.5 (sparks visible from mid-scale up) ===
    if (scale >= 1.5 && explosions.length < MAX_PARTICLES - 5) {
        for (var ki = 0; ki < (scale >= 2 ? 3 : 2); ki++) {
            var kAng = Math.random() * Math.PI * 2;
            var kSpd = 0.5 + Math.random() * 0.5 * sc;
            explosions.push({x:x,y:y,vx:Math.cos(kAng)*kSpd,vy:Math.sin(kAng)*kSpd,life:1.0,decay:0.05,size:1+Math.random()*2*sc,color:'#FFFFFF',type:'spark',gravity:0});
        }
    }
    // === Shockwave — at scale >= 2 ===
    if (scale >= 2 && explosions.length < MAX_PARTICLES - 2) {
        explosions.push({x:x,y:y,vx:0,vy:0,life:1.0,decay:0.07,size:0,maxSize:20*sc,color:'rgba(255,200,80,0.6)',type:'shockwave',gravity:0});
    }
    // === Screen shake feedback ===
    if (scale >= 2) {
        screenShake = Math.max(screenShake, 4);
        screenShakeIntensity = Math.max(screenShakeIntensity, 2);
    } else if (scale >= 0.7) {
        // Light feedback for small-scale (mook kills, laser kills)
        screenShake = Math.max(screenShake, 2);
    }
}
function checkCollision(a, b) {
    const shrink = 0.6;
    const aW = a.width * shrink;
    const aH = a.height * shrink;
    const aX = a.x - aW / 2;
    const aY = a.y - aH / 2;
    
    const bW = b.width * shrink;
    const bH = b.height * shrink;
    const bX = b.x - bW / 2;
    const bY = b.y - bH / 2;
    
    return aX < bX + bW &&
           aX + aW > bX &&
           aY < bY + bH &&
           aY + aH > bY;
}

function playerHit() {
    if (player.invincible) return;
    if (player.shieldActive) {
        player.shieldActive = false;
        player.shieldTimer = 0;
        player.invincible = true;
        player.invincibleTimer = 90;
        return;
    }
    if (player.vPowerActive) {
        player.vPowerActive = false;
        player.vPowerTimer = 0;
        player.invincible = true;
        player.invincibleTimer = 90;
        return;
    }
    // === DRONE SHIELD: drones absorb hits in place of the player ===
    if (drones.length > 0) {
        // Consume the closest drone to the impact point (or last drone)
        const consumedIdx = drones.length - 1;
        const d = drones[consumedIdx];
        if (d) {
            // Small explosion where the drone was
            createExplosion(d.x, d.y, 0.8);
            createHitSpark(d.x, d.y, 0.6);
            // Small screen shake for feedback
            screenShake = Math.max(screenShake, 4);
            screenShakeIntensity = Math.max(screenShakeIntensity, 2);
        }
        drones.splice(consumedIdx, 1);
        // Brief invincibility frames so the player isn't chain-hit
        player.invincible = true;
        player.invincibleTimer = 60;
        return;
    }
    // === PERF: Ultra-minimal explosion for playable framerate ===
    var px = player.x, py = player.y;
    createExplosion(px, py, 1.2);
    // Ultra-minimal extra particles: 2 smoke, 2 fire, 1 spark, 1 shockwave
    for (var i = 0; i < 2; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1 + Math.random() * 2;
        explosions.push({x:px,y:py,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.015,size:4+Math.random()*3,color:'#666',isSmoke:true,type:'smoke',gravity:0.02});
    }
    for (var i = 0; i < 2; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1 + Math.random() * 2;
        explosions.push({x:px,y:py,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.03,size:3+Math.random()*3,color:COLORS.explosion[Math.floor(Math.random()*3)],type:'fire',gravity:0});
    }
    for (var i = 0; i < 1; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1 + Math.random() * 1.5;
        explosions.push({x:px,y:py,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.05,size:1.5+Math.random()*2,color:'#FFFFFF',type:'spark',gravity:0});
    }
    explosions.push({x:px,y:py,vx:0,vy:0,life:1.0,decay:0.04,size:0,maxSize:50,color:'rgba(255,150,50,0.5)',type:'shockwave',gravity:0});
    screenShake = Math.max(screenShake, 10);
    screenShakeIntensity = Math.max(screenShakeIntensity, 4);
    deathFlashAlpha = 0.4;
    if (typeof playHitSound === 'function') playHitSound();
    if (typeof playExplosionSound === 'function') playExplosionSound();
    player.lives--;
    if (player.lives <= 0) {
        // === FINAL DEATH: huge multi-layer explosion + screen flash + slow-mo ===
        var dpx = player.x, dpy = player.y;
        createMassiveExplosion(dpx, dpy, 1.5);
        createExplosion(dpx, dpy, 3.0);
        // Large fireball burst
        for (var fi = 0; fi < 30; fi++) {
            var fAng = Math.random() * Math.PI * 2;
            var fSpd = 2 + Math.random() * 4;
            explosions.push({x:dpx, y:dpy, vx:Math.cos(fAng)*fSpd, vy:Math.sin(fAng)*fSpd, life:1.0, decay:0.025, size:3+Math.random()*5, color:COLORS.explosion[Math.floor(Math.random()*3)], type:'fire', gravity:0});
        }
        // Large debris burst
        for (var di = 0; di < 14; di++) {
            var dAng = Math.random() * Math.PI * 2;
            var dSpd = 1.5 + Math.random() * 3;
            explosions.push({x:dpx, y:dpy, vx:Math.cos(dAng)*dSpd, vy:Math.sin(dAng)*dSpd, size:(2+Math.random()*2), life:1.0, decay:0.03, color:'#888', isDebris:true, rotSpeed:0.1, angle:Math.random()*Math.PI*2, gravity:0.15});
        }
        // Multi-shockwave
        for (var sw = 0; sw < 2; sw++) {
            explosions.push({x:dpx, y:dpy, vx:0, vy:0, life:1.0, decay:0.04, size:0, maxSize:100 + sw*30, color:'rgba(255,180,80,0.6)', type:'shockwave', gravity:0});
        }
        // White flash
        deathFlashAlpha = 0.85;
        screenShake = Math.max(screenShake, 22);
        screenShakeIntensity = Math.max(screenShakeIntensity, 7);
        if (typeof playExplosionSound === 'function') playExplosionSound();
        // Start slow-mo, then game-over after it ends
        startSlowMo(110, 0.3);
        deathActive = true;
        deathTimer = 110; // longer than slow-mo so game-over triggers when slow-mo ends
        player.visible = false;
    } else {
        deathActive = true;
        deathTimer = 120;
        player.visible = false;
    }
}

function gameOver() {
    gameState = GameState.GAMEOVER;
    stopBGM();
    playGameOverSound();
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('1945_highscore', highScore);
    }
}

function respawnPlayer() {
    if (player.lives <= 0) {
        deathActive = false;
        deathFlashAlpha = 0;
        gameOver();
        return;
    }
    
    // DESTROY ALL ENEMIES EXCEPT BOSSES
    enemies = enemies.filter(e => e.isWaveBoss);
    // CLEAR ALL BULLETS
    enemyBullets = [];
    playerBullets = [];
    droneBullets = [];
    powerups = [];
    missiles = [];
    laserBeams = [];
    octopusTentacles = [];
    stopLaserSound();
    
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT - 80;
    // Weapon downgrade on death: lose 1 level for active weapon
    if (player.activeWeapon === 'P') {
        player.powerLevel = Math.max(0, player.powerLevel - 1);
    } else if (player.activeWeapon === 'W') {
        laserLevel = Math.max(0, laserLevel - 1);
    } else if (player.activeWeapon === 'M') {
        playerMissileLevel = Math.max(0, playerMissileLevel - 1);
    }
    player.bombs = 3;
    player.visible = true;
    player.invincible = true;
    player.invincibleTimer = 180;
    player.shieldActive = false;
    deathActive = false;
    deathFlashAlpha = 0;
    explosions = [];
    
    // Re-attach drones to new player position
    const sideOffsets = [-30, 30, -45, 45];
    // Converted from forEach to for (reverse for safe splice)
    for (let idx = drones.length - 1; idx >= 0; idx--) {
        const drone = drones[idx];
        if (idx < sideOffsets.length) {
            drone.x = player.x + sideOffsets[idx];
            drone.y = player.y;
        }
    }
}

// ============================================
// UPDATE FUNCTIONS
// ============================================

function update() {
    if (gameState !== GameState.PLAYING) return;

    // PERF: toggle performance mode based on total visible entities.
    // Hysteresis prevents rapid on/off flicker when count hovers near threshold.
    {
        // (droneMissiles may not exist in all builds — guard to be safe)
const _droneMissiles = (typeof droneMissiles !== 'undefined' && droneMissiles) ? droneMissiles : [];
const _effects = (typeof effects !== 'undefined' && effects) ? effects : [];
const entityCount = enemies.length + enemyBullets.length + playerBullets.length +
                            droneBullets.length + _droneMissiles.length +
                            explosions.length + _effects.length + powerups.length;
        if (!perfMode && entityCount > PERF_MODE_THRESHOLD) {
            perfMode = true;
        } else if (perfMode && entityCount < PERF_MODE_THRESHOLD - PERF_MODE_HYSTERESIS) {
            perfMode = false;
        }
    }

    // frameCount already incremented in gameLoop
    // stageTimer is incremented above

    // === FINAL BOSS INTRO (2026-09): tick every frame so the siren→escort→spawn
    //     state machine advances even when spawnEnemy() is throttled by spawnRate.
    //     (Previously updateBossIntro() only ran inside spawnEnemy(), which was
    //      called every 12-75 frames — the siren could take 2 minutes to end.)
    if (bossActive && bossIntroPhase && bossIntroPhase !== 'spawn') {
        updateBossIntro();
    }

    // === SLOW-MOTION UPDATE: lerp time scale 1.0 → maxScale → 1.0 ===
    if (slowMoTimer > 0) {
        // Determine phase by remaining time. Total = slowMoTimer + (elapsed in this call).
        // We approximate: elapsed frames = slowMoFade + slowMoFadeOut + middle.
        // Use simple curve: first 8 frames fade in, last 60 frames fade out, middle stays at max.
        const elapsedFromEnd = 0; // tracks time since startSlowMo
        const totalDuration = 120;
        const elapsed = totalDuration - slowMoTimer;
        if (elapsed < slowMoFade) {
            // Fade-in
            timeScale = 1.0 - (1.0 - slowMoMaxScale) * (elapsed / slowMoFade);
        } else if (elapsed > totalDuration - slowMoFadeOut) {
            // Fade-out
            const fadeProgress = (elapsed - (totalDuration - slowMoFadeOut)) / slowMoFadeOut;
            timeScale = slowMoMaxScale + (1.0 - slowMoMaxScale) * fadeProgress;
        } else {
            timeScale = slowMoMaxScale;
        }
        slowMoTimer--;
        if (slowMoTimer <= 0) {
            slowMoTimer = 0;
            timeScale = 1.0;
        }
    } else {
        timeScale = 1.0;
    }

    // === SLOW-MO GAMEPLAY EFFECT: skip in-game entity updates when slowed ===
    // Visual effects (cascade, shake, flash, particles) keep rendering at full framerate,
    // but enemy/bullet positions are frozen so the dying moment feels frozen in time.
    const slowMoActive = timeScale < 0.95;
    if (slowMoActive) {
        // Determine which frames to actually tick entity movement. With slowMoFactor ~0.35,
        // we skip ~65% of frames to keep motion at slowed pace while staying smooth.
        if (Math.random() > timeScale) {
            // Skip enemy movement + AI + shooting this frame
            // but keep player input, dying timers, and visual effects ticking
        }
    }

    // Stage/Sub-wave progression - hyperspace check FIRST
    if (hyperspaceActive) {
        updateHyperspace();
        return; // Skip all gameplay updates during hyperspace
    }

    stageTimer++;

    // Wave announce text countdown (visual only, no gameplay effect)
    if (waveAnnounceTimer > 0) {
        waveAnnounceTimer--;
    }

    // HYPERSPACE TRIGGER: Check BEFORE stageWave overflow resets bossDefeated
    if (bossDefeated && !hyperspaceActive && !deathActive) {
        onBossDefeated();
        return; // Skip rest of frame - hyperspace jump started
    }
    
    // Stage wave progression — each sub-wave lasts exactly 25s (1500 frames)
    if (stageTimer > STAGE_WAVE_DURATION) {
        stageWave++;
        // Hard cap: never let stageWave exceed STAGE_WAVES (fixes 16-wave overshoot bug)
        if (stageWave > STAGE_WAVES) stageWave = STAGE_WAVES;
        stageTimer = 0;
        bossDefeated = false;
        bossSpawned = false;
        wave = currentStage * STAGE_WAVES + stageWave; // keep legacy wave roughly in sync (STAGE_WAVES sub-waves per stage)
        generatePlanetSet(currentPlanetIndex);
        // Rapid enemy respawn after wave increase — keeps spawns continuous, no gap
        spawnBoost = 90;
        // Show wave announce text for ~1.5s
        waveAnnounceText = 'WAVE ' + stageWave + ' / ' + STAGE_WAVES;
        waveAnnounceTimer = WAVE_FLASH_DURATION;
        // Force-spawn one enemy immediately so the screen is never empty between waves
        if (gameState === GameState.PLAYING && !hyperspaceActive && !deathActive) {
            spawnEnemy();
            lastSpawnFrame = frameCount;
            noSpawnCounter = 0;
        }
    }
    
    // === FORCE BOSS SPAWN if stageWave has passed the boss wave ===
    // This handles cases where stageWave increments past 10 without a boss appearing
    if (stageWave >= STAGE_WAVES && bossWaveNumber < currentStage && !bossActive) {
        // Boss was never spawned for this stage — force it now
        stageWave = STAGE_WAVES; // Reset to boss wave
        // The next spawnEnemy call will handle boss spawning
    }
    
    // Spawn enemies (always runs - enemies never stop!)
    if (spawnBoost > 0) {
        // Rapid enemy respawn after bomb/wave (slower rate to avoid boss flood)
        if (frameCount % 25 === 0) {
            spawnEnemy();
            lastSpawnFrame = frameCount;
            noSpawnCounter = 0;
        }
        spawnBoost--;
    } else {
        const spawnRate = Math.max(12, 75 - currentStage * 6 - stageWave);
        if (frameCount % spawnRate === 0) {
            spawnEnemy();
            lastSpawnFrame = frameCount;
            noSpawnCounter = 0;
        }
    }
    
    
    // SAFETY NET: If no enemies for too long, force spawn
    noSpawnCounter++;
    const maxGap = Math.max(45, 120 - wave * 2); // shorter gap at higher waves
    if (noSpawnCounter > maxGap && enemies.length < 30 && !deathActive && gameState === GameState.PLAYING) {
        spawnEnemy();
        lastSpawnFrame = frameCount;
        noSpawnCounter = 0;
    }
    
    // === DEATH SEQUENCE ===
    if (deathActive) {
        deathTimer--;
        deathFlashAlpha = Math.max(0, deathTimer / 120);
        
        // Update explosion particles (slow motion)
        if (frameCount % 2 === 0) {
            for (let i = explosions.length - 1; i >= 0; i--) {
                const p = explosions[i];
                p.x += p.vx * 0.5;
                p.y += p.vy * 0.5;
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.life -= p.decay;
                // Wing Fighter: rotate debris particles
                if (p.isDebris && p.rotSpeed) {
                    p.rotation = (p.rotation || 0) + p.rotSpeed * 0.5;
                }
                // Wing Fighter: smoke expands and rises (slower in death cam)
                if (p.isSmoke) {
                    p.vy -= 0.03;
                    p.size += 0.04;
                }
                // Wing Fighter: ring particles expand
                if (p.isRing && p.ringRadius) {
                    p.ringRadius += p.size * 0.15;
                }
                if (p.life <= 0) explosions.splice(i, 1);
            }
        }
        
        if (deathTimer <= 0) {
            respawnPlayer();
        }
        return;
    }
    
    // Player movement (keyboard) — slowed during cinematic slow-mo
    const playerSpeedScale = slowMoActive ? timeScale : 1.0;
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= player.speed * playerSpeedScale;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += player.speed * playerSpeedScale;
    }
    if (keys['ArrowUp'] || keys['KeyW']) {
        player.y -= player.speed * playerSpeedScale;
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
        player.y += player.speed * playerSpeedScale;
    }

    // Player movement (joystick) — also slowed during slow-mo
    if (joystickActive) {
        player.x += joystickDX * player.speed * playerSpeedScale;
        player.y += joystickDY * player.speed * playerSpeedScale;
    }
    
    // Old touch target movement removed - using Wing Fighter style
    
    // Clamp player position
    player.x = Math.max(player.width / 2, Math.min(GAME_WIDTH - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(GAME_HEIGHT - player.height / 2, player.y));
    
    // Shooting (keyboard - Space)
    if (keys['Space'] && player.shootCooldown <= 0) {
        playerShoot();
        player.shootCooldown = 10;
    }
    
    // Auto-fire on touch devices (no fire button needed)
    if (isTouchDevice() && gameState === GameState.PLAYING && player.shootCooldown <= 0) {
        playerShoot();
        player.shootCooldown = 10;
    }
    
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (sparkleFlashTimer > 0) { sparkleFlashTimer--; if (sparkleFlashTimer <= 0) sparkleFlashActive = false; }
    
    // Invincibility (after hit)
    if (player.invincible) {
        player.invincibleTimer--;
        player.visible = Math.floor(player.invincibleTimer / 5) % 2 === 0;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
            player.visible = true;
        }
    }
    
    // Shield persists until hit - no timer countdown
    
    // V power timer
    if (player.vPowerActive) {
        player.vPowerTimer--;
        if (player.vPowerTimer <= 0) {
            player.vPowerActive = false;
            player.invincible = false;
            player.invincibleTimer = 0;
            // Restore shield if player had one before V-power
            if (player.hadShield) {
                player.shieldActive = true;
                player.shieldTimer = 999999;
                player.hadShield = false;
            }
        }
    }
    
    // === P ULTIMATE: Level 7 shield pulse (3s cooldown) ===
    if (player.activeWeapon === 'P' && player.powerLevel >= 6) {
        if (!pUltimateActive) {
            pUltimateTimer++;
            if (pUltimateTimer >= 180) {
                // Activate shield pulse
                pUltimateActive = true;
                pUltimateAlpha = 1.0;
                // Shield activation flash
                sparkleFlashActive = true;
                sparkleFlashTimer = 30;
                pUltimateTimer = 0;
                // Destroy all enemy bullets within radius
                for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
                    const b = enemyBullets[bi];
                    const dx = player.x - b.x;
                    const dy = player.y - b.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 150) {
                        enemyBullets.splice(bi, 1);
                    }
                }
                // Damage all enemies within radius
                for (let ei = enemies.length - 1; ei >= 0; ei--) {
                    const e = enemies[ei];
                    const dx = player.x - e.x;
                    const dy = player.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 75) {
                        e.hp -= 3;
                        if (e.hp <= 0) {
                            score += e.score;
                            createHitSpark(e.x, e.y, 0.3);
                            if (e.isWaveBoss) {
                                spawnPowerup(e.x, e.y, true);
                                bossActive = false;
                                if (bossIsFinalBoss) {
                                    // Final boss destruction: massive explosion effect
                                    bossDeathX = e.x;
                                    bossDeathY = e.y;
                                    createExplosion(e.x, e.y, 1.5);
                                    deathFlashAlpha = Math.max(deathFlashAlpha, 0.3);
                                    screenShake = 10; screenShakeIntensity = 3;
                                } else {
                                    screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                                }
                                bossDefeated = true;
                                bossClaws = [];
                                player.lives = Math.min(5, player.lives + 1);
                            } else {
                                spawnPowerup(e.x, e.y);
                            }
                            enemies.splice(ei, 1);
                        }
                    }
                }
            }
        } else {
            // Fade out shield visual
            pUltimateAlpha -= 0.011; // 1.5sec duration (90 frames)
            if (pUltimateAlpha <= 0) {
                pUltimateAlpha = 0;
                pUltimateActive = false;
            }
        }
    }
    

    // Octopus tentacle attacks (from wave 15 mid-boss)
    if (octopusTentacles.length > 0) {
        for (let ti = octopusTentacles.length - 1; ti >= 0; ti--) {
            const tentacle = octopusTentacles[ti];
            if (!tentacle.active) { octopusTentacles.splice(ti, 1); continue; }
            
            if (tentacle.extending) {
                tentacle.length += 0.25;
                if (tentacle.length >= tentacle.maxLength) {
                    tentacle.extending = false;
                    tentacle.retracting = true;
                }
            } else if (tentacle.retracting) {
                tentacle.length -= 0.8;
                if (tentacle.length <= 0) {
                    tentacle.active = false;
                    octopusTentacles.splice(ti, 1);
                    continue;
                }
            }
            
            // Check collision with player
            if (!player.invincible && !player.vPowerActive && !player.shieldActive) {
                const dx = player.x - tentacle.x;
                const dy = player.y - (tentacle.y + tentacle.length);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 25) {
                    playerHit();
                }
            }
        }
    }
    
    // Boss claw attacks - multiple claws for higher boss levels
    if (bossActive) {
        const bossEnemy = enemies.find(e => e.isWaveBoss);
        if (!bossEnemy) { bossClaws = []; }
        
        // Ensure we have the right number of claws
        while (bossClaws.length < bossClawCount) {
            bossClaws.push({
                timer: bossClaws.length * 120, // Staggered start: 0, 120, 240...
                active: false,
                x: bossEnemy ? bossEnemy.x : GAME_WIDTH / 2,
                length: 0,
                maxLength: GAME_HEIGHT * 0.66,
                retracting: false,
                offsetX: (bossClaws.length - (bossClawCount - 1) / 2) * 40 // Spread claws
            });
        }
        
        for (let ci = bossClaws.length - 1; ci >= 0; ci--) {
            const claw = bossClaws[ci];
            
            if (!claw.active) {
                claw.timer++;
                const clawInterval = Math.max(120, 420 - (bossClawCount - 1) * 30); // Faster with more claws
                if (claw.timer >= clawInterval) {
                    claw.active = true;
                    claw.timer = 0;
                    if (bossEnemy) {
                        claw.x = bossEnemy.x + claw.offsetX;
                    }
                    claw.length = 0;
                    claw.maxLength = GAME_HEIGHT * 0.66;
                    claw.retracting = false;
                }
            }
            
            if (claw.active) {
                const clawSpeed = 12;
                if (!claw.retracting) {
                    claw.length += clawSpeed;
                    if (claw.length >= claw.maxLength) {
                        claw.retracting = true;
                    }
                } else {
                    claw.length -= clawSpeed * 1.5;
                    if (claw.length <= 0) {
                        claw.length = 0;
                        claw.active = false;
                        claw.timer = 0;
                    }
                }
                // Claw follows boss x position loosely
                if (bossEnemy) {
                    claw.x += (bossEnemy.x + claw.offsetX - claw.x) * 0.1;
                }
                // Check collision with player
                const clawTipY = claw.length;
                if (!player.invincible && !player.vPowerActive && !player.shieldActive) {
                    const dx = player.x - claw.x;
                    const dy = player.y - clawTipY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 30) {
                        playerHit();
                    }
                }
            }
        }
    }

    
    // Update hit markers
    for (let i = hitMarkers.length - 1; i >= 0; i--) {
        hitMarkers[i].timer--;
        if (hitMarkers[i].timer <= 0) hitMarkers.splice(i, 1);
    }
    
    // Update combo timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) {
            comboCount = 0;
            comboText = '';
        }
    }
    
    // Update screen shake
    if (screenShake > 0) screenShake--;
    
    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
        const star = stars[i];
        star.y += star.speed;
        if (star.y > GAME_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * GAME_WIDTH;
        }
    }
    
    // Update laser beams — balanced: range-limited, low active-beam cap, slower ticks
    if (laserBeams.length > 0) {
        // 1) Range-limited target list — enemies must be on-screen and not too far above the player.
        //    Enemies spawned at the top (not yet entering the engagement zone) are excluded.
        const eligibleEnemies = [];
        for (let ei = 0; ei < enemies.length; ei++) {
            const e = enemies[ei];
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            // Must be: at or below the engagement line (not above), within horizontal range
            if (dy <= LASER_RANGE_Y && Math.abs(dx) <= LASER_RANGE_X) {
                eligibleEnemies.push(e);
            }
        }
        // Sort closest-first
        eligibleEnemies.sort((a, b) => {
            const da = Math.hypot(a.x - player.x, a.y - player.y);
            const db = Math.hypot(b.x - player.x, b.y - player.y);
            return da - db;
        });
        // Cap distinct targets so high levels don't lock the entire screen
        const targetPool = eligibleEnemies.slice(0, LASER_MAX_TARGETS);

        // Damage grows modestly per level (single-target focus), not per beam
        const damagePerTick = (LASER_DAMAGE_BASE + laserLevel * LASER_DAMAGE_PER_LEVEL) * (player.vPowerActive ? 1.5 : 1.0);
        const tickInterval = LASER_TICK_INTERVAL;

        // Cap active beams — extra slots just sit idle this frame.
        const activeBeamCount = Math.min(laserBeams.length, LASER_ACTIVE_BEAM_CAP);

        // Converted from forEach to for (reverse for safe splice)
        for (let beamIdx = laserBeams.length - 1; beamIdx >= 0; beamIdx--) {
            const beam = laserBeams[beamIdx];
            // Idle slots: clear target and skip damage
            if (beamIdx >= activeBeamCount) {
                beam.targetEnemy = null;
                continue;
            }
            // Assign target: round-robin through the capped target pool
            if (targetPool.length > 0) {
                const enemyIdx = beamIdx % targetPool.length;
                let target = targetPool[enemyIdx];
                // === DYING GUARD: skip dying enemies; pick next live target if available ===
                if (target && target.dying) {
                    let swapTarget = null;
                    for (let ti = 0; ti < targetPool.length; ti++) {
                        if (ti === enemyIdx) continue;
                        const cand = targetPool[ti];
                        if (cand && !cand.dying) { swapTarget = cand; break; }
                    }
                    if (!swapTarget) target = null;
                    else target = swapTarget;
                }
                if (target) {
                    beam.targetX = target.x;
                    beam.targetY = target.y;
                    beam.targetEnemy = target;
                } else {
                    beam.targetEnemy = null;
                }
            } else {
                beam.targetEnemy = null;
            }

            // Damage tick
            beam.tickTimer = (beam.tickTimer || 0) + 1;
            if (beam.tickTimer >= tickInterval) {
                beam.tickTimer = 0;
                
                if (beam.targetEnemy && enemies.includes(beam.targetEnemy) && !beam.targetEnemy.dying) {
                    const enemy = beam.targetEnemy;
                    // === B-52 STAGE BOSS: wings invulnerable. Skip damage if beam strikes only wings. ===
                    if (enemy.isWaveBoss && enemy.type === 'final' && enemy.hitboxBody) {
                        const hb = enemy.hitboxBody;
                        const ht = enemy.hitboxTail;
                        const eRelX = beam.targetX - enemy.x;
                        const eRelY = beam.targetY - enemy.y;
                        const inBody = Math.abs(eRelX - hb.xOff) < hb.halfW && Math.abs(eRelY - hb.yOff) < hb.halfH;
                        const inTail = Math.abs(eRelX - ht.xOff) < ht.halfW && Math.abs(eRelY - ht.yOff) < ht.halfH;
                        if (!inBody && !inTail) {
                            // Laser hits wing only — no damage, faint wing-edge spark
                            createHitSpark(beam.targetX, beam.targetY, 0.15);
                            continue;
                        }
                    }
                    enemy.hp -= damagePerTick;
                    hitMarkers.push({ x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y, timer: 12 });
                    
                    if (enemy.hp <= 0 && !enemy.dying) {
                        score += enemy.score;
                        comboCount++;
                        if (comboCount > maxCombo) maxCombo = comboCount;
                        comboTimer = 90;
                        if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                        createExplosion(enemy.x, enemy.y, 0.7);
                        if (enemy.isWaveBoss) {
                            // Boss defeated - spawn V powerup (one-shot reward)
                            spawnPowerup(enemy.x, enemy.y, true);
                            bossActive = false;
                            if (bossIsFinalBoss) {
                                // Final boss destruction: massive explosion effect
                                bossDeathX = enemy.x;
                                bossDeathY = enemy.y;
                                createMassiveExplosion(enemy.x, enemy.y, 1.5);
                                deathFlashAlpha = Math.max(deathFlashAlpha, 0.3);
                                screenShake = 10; screenShakeIntensity = 3;
                                // === Multi-step cascade: queue final boss dying (handled by its own dying block) ===
                                enemy.dying = true;
                                enemy.dyingTimer = 0;
                                enemy.dyingCascade = 0;
                                enemy.cascadeBaseX = enemy.x;
                                enemy.cascadeBaseY = enemy.y;
                                beam.targetEnemy = null;
                                continue; // skip splice — boss handled by dying block
                            } else {
                                screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                            }
                            bossDefeated = true;
                            player.lives = Math.min(5, player.lives + 1);
                            bossClaws = [];
                        } else if (enemy.isMidBoss && enemy.type === 'heavyBomber') {
                            // Mid-boss falling sequence (one-shot)
                            enemy.dying = true;
                            enemy.dyingTimer = 0;
                            enemy.shootCooldown = 9999;
                            enemy.fallRot = 0;
                            enemy.fallVy = 1.5;
                            enemy.fallVx = (Math.random() - 0.5) * 0.4;
                            createExplosion(enemy.x, enemy.y, 1.5);
                            beam.targetEnemy = null;
                            continue;
                        } else {
                            spawnPowerup(enemy.x, enemy.y);
                        }
                        if (!enemy.dying) {
                            const idx = enemies.indexOf(enemy);
                            if (idx >= 0) enemies.splice(idx, 1);
                        }
                        beam.targetEnemy = null;
                    }
                }
            }
        }
        
        // Play laser hum sound while active
        playLaserSound();
    } else {
        stopLaserSound();
    }

    // === ENEMY DEATH HANDLER (centralized impact destruction / dying-fall) ===
    // Called by all collision paths. Handles score, combo, heavyBomber dying-fall,
    // and final-boss death cascade. Returns true if the enemy was destroyed/queued.
    function killOrFallEnemy(enemy, ei) {
        if (!enemy) return false;
        // Final boss — multi-step cascade (no immediate splice)
        if (enemy.isWaveBoss && enemy.type === 'final') {
            if (enemy.dying) return true; // already dying
            enemy.dying = true;
            enemy.dyingTimer = 0;
            enemy.dyingCascade = 0; // chain step counter
            // Save center for cascade explosion positions
            enemy.cascadeBaseX = enemy.x;
            enemy.cascadeBaseY = enemy.y;
            return true;
        }
        // Mid-boss heavyBomber — dying-fall for ~1.5s before big explosion
        if (enemy.type === 'heavyBomber' && enemy.isMidBoss) {
            if (enemy.dying) return true;
            enemy.dying = true;
            enemy.dyingTimer = 0;
            enemy.shootCooldown = 9999;
            enemy.fallRot = enemy._fallRot || 0;
            enemy.fallVy = 1.5;
            enemy.fallVx = (Math.random() - 0.5) * 0.4;
            // Disable collision by flagging no AI fire / no hit processing
            return true;
        }
        // Mook — immediate destruction (small particles still spawn)
        return false; // not dying — caller does normal splice
    }

    // Update player bullets
    // Converted from forEach to for (reverse for safe splice)
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
        // === SLOW-MO: skip bullet motion for slowed frames ===
        if (slowMoActive && Math.random() > timeScale) {
            continue;
        }
        bullet.y -= bullet.speed;
        if (bullet.angle) {
            bullet.x += Math.sin(bullet.angle) * bullet.speed;
        }
        if (bullet.y < -20) {
            playerBullets.splice(i, 1);
        }
    }
    
    // Update enemy bullets
    // Converted from forEach to for (reverse for safe splice)
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        // === SLOW-MO: skip bullet motion for slowed frames ===
        if (slowMoActive && Math.random() > timeScale) {
            continue;
        }
        if (bullet.isHoming) {
            // Homing missile: turn toward player and self-destruct after homingLife
            bullet.homingLife--;
            if (bullet.homingLife <= 0 || !player || player.lives <= 0) {
                createHitSpark(bullet.x, bullet.y, 0.4);
                enemyBullets.splice(i, 1);
                continue;
            }
            const dx = player.x - bullet.x;
            const dy = player.y - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
            // Desired direction
            const desVx = (dx / dist) * bullet.speed;
            const desVy = (dy / dist) * bullet.speed;
            // Turn rate limited (smooth homing)
            const turnRate = bullet.homingTurnRate || 0.06;
            bullet.vx += (desVx - bullet.vx) * turnRate;
            bullet.vy += (desVy - bullet.vy) * turnRate;
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.angle = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2;
        } else {
            bullet.y += bullet.speed;
        }
        if (bullet.y > GAME_HEIGHT + 20 || bullet.y < -50) {
            enemyBullets.splice(i, 1);
        } else if (bullet.x < -50 || bullet.x > GAME_WIDTH + 50) {
            enemyBullets.splice(i, 1);
        }
    }
    
    // Update enemies
    // Converted from forEach to for (reverse for safe splice)
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const enemy = enemies[ei];
        // === DYING-ONLY: dying mid-bosses (heavyBomber) and final boss cascade
        // are handled entirely by their own dying blocks inside the case branches.
        // We MUST still fall into the switch (do NOT continue) so case 'heavyBomber'
        // and case 'final' dying blocks actually run each frame. The case blocks
        // themselves `break` out when done, so a single pass handles the dying tick.
        if (enemy.dying) {
            // slow-mo skip still applies — only the cinematic dying animations
            // (case 'heavyBomber' / case 'final') should keep running during slow-mo
            // and they ignore timeScale internally by design.
        }
        // === SLOW-MO: skip normal AI/movement updates for slowed frames ===
        // Dying animations and final boss cascade continue regardless (cinematic freeze).
        // Dying enemies must NOT be skipped — they need their per-frame fall/cascade ticks.
        if (!enemy.dying && slowMoActive && Math.random() > timeScale) {
            continue;
        }
        enemy.phase += 0.05;

        // === Boss escort enemies are updated by updateBossIntro (sway + descent).
        // Skip the regular enemy update block so their motion stays smooth and
        // their `shootCooldown = 99999` guarantee is never overridden.
        if (enemy.isBossEscort) {
            continue;
        }

        switch (enemy.type) {
            case 'scout':
                enemy.y += enemy.speed;
                break;
            case 'fighter':
                enemy.y += enemy.speed;
                enemy.x += Math.sin(enemy.phase) * 2;
                break;
            case 'bomber':
                enemy.y += enemy.speed;
                if (enemy.y > 100 && enemy.y < GAME_HEIGHT - 100) {
                    enemy.shootCooldown--;
                    if (enemy.shootCooldown <= 0) {
                        enemyBullets.push({
                            x: enemy.x,
                            y: enemy.y + enemy.height / 2,
                            width: 28,
                            height: 28,
                            speed: 1.28 // +60% from 0.8 (was 0.5)
                        });
                        enemy.shootCooldown = 160;
                    }
                }
                break;
            case 'rammer':
                // Chase the player - slow but persistent (speed +20%)
                enemy.y += enemy.speed * 1.0;
                const rdx = player.x - enemy.x;
                const rdy = player.y - enemy.y;
                const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
                if (rdist > 5) {
                    enemy.x += (rdx / rdist) * enemy.speed * 0.72;
                }
                break;
            case 'final':
                // === FINAL BOSS DESTRUCTION ===
                // Phase A (frame 0): initial smoke burst from fuselage + BOTH WINGS BREAK OFF
                //   - Left/right wings detach, become independent rotating debris with gravity
                //   - Pick drift direction toward the screen edge nearest the boss's death spot
                // Phase B (frames 1..~300): fuselage drifts toward that edge, trailing thick black smoke
                //   - Random small pops along the body
                //   - Body tilts more steeply as it falls
                // Phase C (frame ~300 OR body off-screen): final massive explosion + hyperspace
                if (enemy.dying) {
                    enemy.dyingTimer++;
                    const baseX = enemy.cascadeBaseX || enemy.x;
                    const baseY = enemy.cascadeBaseY || enemy.y;

                    // === Phase A (frame 0): initial burst + detach wings ===
                    if (enemy.dyingTimer === 1) {
                        // Big initial smoke + spark burst from fuselage (MUCH bigger than before)
                        createMassiveExplosion(baseX, baseY, 2.6);
                        createExplosion(baseX, baseY, 3.6);
                        // Thick black smoke — initial plume (doubled count, larger)
                        for (let si = 0; si < 18; si++) {
                            explosions.push({
                                x: baseX + (Math.random() - 0.5) * 50,
                                y: baseY + (Math.random() - 0.5) * 20,
                                vx: (Math.random() - 0.5) * 1.4,
                                vy: -0.6 + Math.random() * 0.8,
                                life: 1.0, decay: 0.012,
                                size: 12 + Math.random() * 10,
                                color: '#1A1A1A', isSmoke: true, type: 'smoke', gravity: 0.03
                            });
                        }
                        // Fire sparks (more, brighter)
                        for (let fi = 0; fi < 26; fi++) {
                            const a = Math.random() * Math.PI * 2;
                            const sp = 2.0 + Math.random() * 3.5;
                            explosions.push({
                                x: baseX, y: baseY,
                                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                                life: 1.0, decay: 0.025,
                                size: 3 + Math.random() * 4,
                                color: COLORS.explosion[Math.floor(Math.random() * 3)],
                                type: 'fire', gravity: 0
                            });
                        }
                        // Strong central shockwave at fuselage
                        explosions.push({
                            x: baseX, y: baseY, vx: 0, vy: 0,
                            life: 1.0, decay: 0.035, size: 0, maxSize: 180,
                            color: 'rgba(255,200,90,0.85)', type: 'shockwave', gravity: 0
                        });
                        explosions.push({
                            x: baseX, y: baseY, vx: 0, vy: 0,
                            life: 1.0, decay: 0.025, size: 0, maxSize: 260,
                            color: 'rgba(255,160,80,0.6)', type: 'shockwave', gravity: 0
                        });

                        // Decide drift direction toward nearest screen edge (left or right corner)
                        // Use boss X position: if x < mid → drift to LEFT corner, else RIGHT corner
                        const driftLeft = baseX < GAME_WIDTH / 2;
                        enemy._dyingDriftLeft = driftLeft;
                        enemy._dyingInitX = baseX;
                        enemy._dyingInitY = baseY;
                        // Give an immediate impulse so motion is visible from frame 1
                        enemy._dyingVx = driftLeft ? -2.6 : 2.6;
                        enemy._dyingVy = 0.4;

                        // === Detach LEFT WING (bigger throw, faster rotation) ===
                        bossWingDebris.push({
                            x: baseX - 60,
                            y: baseY + 5,
                            vx: (driftLeft ? -2.6 : -1.0) + (Math.random() - 0.5) * 0.8,
                            vy: 1.0 + Math.random() * 0.6,
                            rotSpeed: (driftLeft ? -0.14 : -0.18) + (Math.random() - 0.5) * 0.04,
                            angle: 0,
                            side: 'left',
                            life: 360,
                            size: 56  // half-width of detached wing
                        });
                        // === Detach RIGHT WING ===
                        bossWingDebris.push({
                            x: baseX + 60,
                            y: baseY + 5,
                            vx: (driftLeft ? 1.0 : 2.6) + (Math.random() - 0.5) * 0.8,
                            vy: 1.0 + Math.random() * 0.6,
                            rotSpeed: (driftLeft ? 0.18 : 0.14) + (Math.random() - 0.5) * 0.04,
                            angle: 0,
                            side: 'right',
                            life: 360,
                            size: 56
                        });

                        // Bigger shockwave ring at each wing-break point
                        explosions.push({
                            x: baseX - 60, y: baseY + 5, vx: 0, vy: 0,
                            life: 1.0, decay: 0.04, size: 0, maxSize: 120,
                            color: 'rgba(255,180,80,0.8)', type: 'shockwave', gravity: 0
                        });
                        explosions.push({
                            x: baseX + 60, y: baseY + 5, vx: 0, vy: 0,
                            life: 1.0, decay: 0.04, size: 0, maxSize: 120,
                            color: 'rgba(255,180,80,0.8)', type: 'shockwave', gravity: 0
                        });
                        // Extra wing-break sparks
                        for (let wi = 0; wi < 10; wi++) {
                            const a = Math.random() * Math.PI * 2;
                            const sp = 1.5 + Math.random() * 2.5;
                            explosions.push({
                                x: baseX + (Math.random() < 0.5 ? -60 : 60),
                                y: baseY + 5,
                                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                                life: 1.0, decay: 0.03,
                                size: 2 + Math.random() * 2,
                                color: COLORS.explosion[Math.floor(Math.random() * 3)],
                                type: 'fire', gravity: 0
                            });
                        }

                        // Screen shake + sound + slow-mo for cinematic impact (stronger)
                        deathFlashAlpha = Math.max(deathFlashAlpha, 0.85);
                        screenShake = Math.max(screenShake, 22);
                        screenShakeIntensity = Math.max(screenShakeIntensity, 7);
                        if (typeof playExplosionSound === 'function') playExplosionSound();
                        startSlowMo(120, 0.35);
                        break;
                    }

                    // === Phase B (frames 2..until off-screen): fuselage drifts toward corner ===
                    // Drive with explicit velocity so motion is dramatic & predictable
                    {
                        const driftLeft = enemy._dyingDriftLeft;
                        // Horizontal: gentle continuous accel so the body really travels
                        // to the edge of the screen (not just slides a few pixels)
                        enemy._dyingVx += driftLeft ? -0.055 : 0.055;
                        if (enemy._dyingVx > 5.0) enemy._dyingVx = 5.0;
                        if (enemy._dyingVx < -5.0) enemy._dyingVx = -5.0;
                        // Vertical: light gravity so it "slowly" falls, not freefall
                        enemy._dyingVy += 0.022;
                        if (enemy._dyingVy > 3.2) enemy._dyingVy = 3.2;
                        enemy.x += enemy._dyingVx;
                        enemy.y += enemy._dyingVy;

                        // Tilt body steeply toward the drift direction (faster so visible early)
                        const targetTilt = driftLeft ? -1.3 : 1.3;  // ~75° toward corner
                        enemy.angle += (targetTilt - enemy.angle) * 0.08;

                        // End condition: off-screen either side OR y past bottom
                        const offLeft = enemy.x < -120;
                        const offRight = enemy.x > GAME_WIDTH + 120;
                        const offBottom = enemy.y > GAME_HEIGHT + 80;
                        enemy._dyingOffScreen = offLeft || offRight || offBottom;
                        // Hard cap so it doesn't loop forever
                        if (enemy.dyingTimer > 360) enemy._dyingOffScreen = true;

                        // Sparse small pop every 18 frames (was every 10 — too dense, caused lag).
                        // As the body fades out (last 30% of drift), skip pops entirely.
                        if (enemy.dyingTimer % 18 === 0 && explosions.length < MAX_PARTICLES - 4) {
                            const px = enemy.x + (Math.random() - 0.5) * 36;
                            const py = enemy.y + (Math.random() - 0.5) * 14;
                            createExplosion(px, py, 0.6);
                        }
                        // Subtle black smoke — every 4 frames (was 3 — slightly sparser for smoothness)
                        if (enemy.dyingTimer % 4 === 0 && explosions.length < MAX_PARTICLES - 2) {
                            explosions.push({
                                x: enemy.x + (Math.random() - 0.5) * 28,
                                y: enemy.y + (Math.random() - 0.5) * 14,
                                vx: (Math.random() - 0.5) * 0.4 - (driftLeft ? 0.4 : -0.4),
                                vy: -0.4 + Math.random() * 0.5,
                                life: 1.0, decay: 0.016,
                                size: 10 + Math.random() * 6,
                                color: '#1A1A1A', isSmoke: true, type: 'smoke', gravity: 0.022
                            });
                            // Faint ember — only every 6 frames
                            if (enemy.dyingTimer % 6 === 0 && explosions.length < MAX_PARTICLES - 3 && Math.random() < 0.6) {
                                explosions.push({
                                    x: enemy.x + (Math.random() - 0.5) * 16,
                                    y: enemy.y,
                                    vx: (Math.random() - 0.5) * 1.4,
                                    vy: (Math.random() - 0.2) * 0.9,
                                    life: 1.0, decay: 0.045,
                                    size: 1.3 + Math.random() * 1.6,
                                    color: '#FF6622', type: 'spark', gravity: 0.04
                                });
                            }
                        }
                        // Wait — fall through to final explosion when off-screen
                    }
                    // (no break — final-explosion block below handles cleanup)

                    // === Phase C (body off-screen or 360+ frames): final explosion + hyperspace ===
                    // Wait until Phase B reports the body has actually drifted off-screen
                    // (or the hard 360-frame cap is reached). DO NOT trigger on the first
                    // dying frame — that was prematurely ending the drift animation.
                    if (!enemy._dyingOffScreen) {
                        // Still drifting toward the corner — just keep animating
                        break;
                    }
                    if (enemy._dyingFinalDone) {
                        // Already triggered — keep entity around but inert until removed
                        break;
                    }
                    enemy._dyingFinalDone = true;
                    // === Phase C: NO final explosion, NO shockwaves, NO debris, NO flash, ===
                    // === NO screen-shake, NO slow-mo. The fuselage and wings have already  ===
                    // === faded out and drifted off-screen via the natural fade animation.   ===
                    // === Just trigger the stage transition cleanly.                        ===
                    // (Keeping playExplosionSound for audio feedback — does not cause lag)
                    if (typeof playExplosionSound === 'function') playExplosionSound();

                    // === Trigger hyperspace stage transition ===
                    bossDefeated = true;
                    player.lives = Math.min(5, player.lives + 1);
                    bossClaws = [];
                    // Clear remaining non-boss enemies for clean transition
                    const remainingEnemies = enemies.filter(e => !e.isWaveBoss);
                    for (let rc = 0; rc < remainingEnemies.length; rc++) {
                        createHitSpark(remainingEnemies[rc].x, remainingEnemies[rc].y, 0.4);
                    }
                    enemies = enemies.filter(e => e.isWaveBoss);
                    enemyBullets = [];
                    playerBullets = [];
                    droneBullets = [];
                    missiles = [];
                    octopusTentacles = [];
                    hyperspaceActive = true;
                    hyperspaceTimer = HYPERSPACE_TOTAL;
                    hyperspacePhase = 0;

                    // Remove this boss entity
                    const idx = enemies.indexOf(enemy);
                    if (idx >= 0) enemies.splice(idx, 1);
                    // Let detached wings keep falling on their own (each has life=360)
                    // They'll splice out via the wing-debris update loop.
                    break;
                }
                // === B-52 STAGE BOSS ===
                // Slow entry: glide in from top until y reaches 100
                if (enemy.y < 100) {
                    enemy.y += enemy.speed;
                } else {
                    // Lateral sweep across full screen width (slow, bomber-like)
                    enemy._movePhase = (enemy._movePhase || 0) + 0.018;
                    enemy.x += Math.sin(enemy._movePhase) * 1.3;

                    // --- Pattern A: standard bullets from wing roots ---
                    enemy.shootCooldown--;
                    if (enemy.shootCooldown <= 0) {
                        // 2 bullets from left & right wing roots (just inside damageable body)
                        const leftX = enemy.x - 50;
                        const rightX = enemy.x + 50;
                        const bY = enemy.y + enemy.height / 2 - 30;
                        for (const bx of [leftX, rightX]) {
                            enemyBullets.push({
                                x: bx,
                                y: bY,
                                width: 32,
                                height: 32,
                                speed: 2.0 + currentStage * 0.18,
                                color: '#FF4422'
                            });
                        }
                        enemy.shootCooldown = Math.max(70, 130 - currentStage * 5);
                    }

                    // --- Pattern B: bomb-trail — drops a row of slow bombs ---
                    // When bombTrailPhase == 0 (idle), count down bombTrailCooldown
                    if (enemy.bombTrailPhase === 0) {
                        enemy.bombTrailCooldown--;
                        if (enemy.bombTrailCooldown <= 0) {
                            enemy.bombTrailPhase = 1;            // start dropping
                            enemy.bombTrailBulletsLeft = enemy.bombTrailBullets || 6;
                            enemy.bombTrailTimer = 0;             // delay until first bomb
                        }
                    } else if (enemy.bombTrailPhase === 1) {
                        // Drop one bomb every ~14 frames (~0.23s)
                        enemy.bombTrailTimer++;
                        if (enemy.bombTrailTimer >= 14) {
                            enemy.bombTrailTimer = 0;
                            // Drop bomb from slightly random X under the bomb bay
                            const bombBayX = enemy.x + (Math.random() - 0.5) * 50;
                            const bombBayY = enemy.y + enemy.height / 2 - 12;
                            enemyBullets.push({
                                x: bombBayX,
                                y: bombBayY,
                                width: 36,
                                height: 44,
                                speed: 1.2 + currentStage * 0.08, // slower than normal bullets (was 2.0+)
                                color: '#FFAA22',
                                isBomb: true,
                                ownerType: 'finalBoss'
                            });
                            enemy.bombTrailBulletsLeft--;
                            if (enemy.bombTrailBulletsLeft <= 0) {
                                enemy.bombTrailPhase = 0;
                                enemy.bombTrailCooldown = 240 + Math.floor(Math.random() * 60); // 4-5s gap before next trail
                            }
                        }
                    }
                }
                break;
            case 'boss':
                // legacy alias kept for safety (no longer spawned) — same as final
                if (enemy.y < 100) {
                    enemy.y += enemy.speed;
                } else {
                    enemy._movePhase = (enemy._movePhase || 0) + 0.018;
                    enemy.x += Math.sin(enemy._movePhase) * 1.3;
                    enemy.shootCooldown--;
                    if (enemy.shootCooldown <= 0) {
                        const leftX = enemy.x - 50;
                        const rightX = enemy.x + 50;
                        const bY = enemy.y + enemy.height / 2 - 30;
                        for (const bx of [leftX, rightX]) {
                            enemyBullets.push({
                                x: bx, y: bY,
                                width: 32, height: 32,
                                speed: 2.0 + currentStage * 0.18,
                                color: '#FF4422'
                            });
                        }
                        enemy.shootCooldown = Math.max(70, 130 - currentStage * 5);
                    }
                }
                break;
        case 'heavyBomber':
            // === HEAVY BOMBER DESTRUCTION (matches final-boss Phase A/B/C pattern) ===
            // Phase A (frame 0): initial burst from fuselage + both wings break off
            //   - Wings detach into bossWingDebris (same array as final-boss)
            //   - Drift direction chosen from death-spot X (left vs right corner)
            // Phase B (frames 1..until off-screen): fuselage slowly drifts toward corner
            //   - Thick black smoke trail + frequent pops + steep tilt
            // Phase C (off-screen OR 360-frame cap): final explosion + splice
            if (enemy.dying) {
                enemy.dyingTimer++;
                const baseX = enemy.cascadeBaseX || enemy.x;
                const baseY = enemy.cascadeBaseY || enemy.y;

                // === Phase A (frames 1..3): initial burst + detach wings ===
                // Spread across 3 frames so the impact is visually sustained (not a single-frame pop)
                if (enemy.dyingTimer >= 1 && enemy.dyingTimer <= 3) {
                    const phaseScale = enemy.dyingTimer === 1 ? 1.0 : (enemy.dyingTimer === 2 ? 0.6 : 0.35);
                    // Big initial smoke + spark burst from fuselage
                    if (enemy.dyingTimer === 1) {
                        createMassiveExplosion(baseX, baseY, 2.5);
                        createExplosion(baseX, baseY, 3.6);
                    } else {
                        createExplosion(baseX, baseY, 1.4 * phaseScale);
                        createHitSpark(baseX, baseY, 0.8 * phaseScale);
                    }
                    // Thick black smoke — initial plume (denser on frame 1, then sustained)
                    const smokeCount = enemy.dyingTimer === 1 ? 22 : 10;
                    for (let si = 0; si < smokeCount; si++) {
                        explosions.push({
                            x: baseX + (Math.random() - 0.5) * 50,
                            y: baseY + (Math.random() - 0.5) * 18,
                            vx: (Math.random() - 0.5) * 1.6,
                            vy: -0.7 + Math.random() * 0.8,
                            life: 1.0, decay: 0.014,
                            size: 11 + Math.random() * 9,
                            color: '#1A1A1A', isSmoke: true, type: 'smoke', gravity: 0.025
                        });
                    }
                    // Fire sparks — sustained across all 3 frames
                    const sparkCount = enemy.dyingTimer === 1 ? 26 : 12;
                    for (let fi = 0; fi < sparkCount; fi++) {
                        const a = Math.random() * Math.PI * 2;
                        const sp = 1.8 + Math.random() * 3.2;
                        explosions.push({
                            x: baseX, y: baseY,
                            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                            life: 1.0, decay: 0.028,
                            size: 2 + Math.random() * 3,
                            color: COLORS.explosion[Math.floor(Math.random() * 3)],
                            type: 'fire', gravity: 0
                        });
                    }
                    // Central shockwave (only frame 1 — large)
                    if (enemy.dyingTimer === 1) {
                        explosions.push({
                            x: baseX, y: baseY, vx: 0, vy: 0,
                            life: 1.0, decay: 0.04, size: 0, maxSize: 150,
                            color: 'rgba(255,200,90,0.8)', type: 'shockwave', gravity: 0
                        });
                        explosions.push({
                            x: baseX, y: baseY, vx: 0, vy: 0,
                            life: 1.0, decay: 0.03, size: 0, maxSize: 200,
                            color: 'rgba(255,160,80,0.55)', type: 'shockwave', gravity: 0
                        });
                    }

                    // Decide drift direction toward nearest screen edge (only frame 1)
                    if (enemy.dyingTimer === 1) {
                        const driftLeft = baseX < GAME_WIDTH / 2;
                        enemy._dyingDriftLeft = driftLeft;
                        enemy._dyingInitX = baseX;
                        enemy._dyingInitY = baseY;
                        // Strong immediate impulse so motion is visibly large from frame 1
                        enemy._dyingVx = driftLeft ? -3.0 : 3.0;
                        enemy._dyingVy = 0.6;

                        // === Detach LEFT WING (heavyBomber scale ≈ width 70 → wing half-width ~28) ===
                        bossWingDebris.push({
                            x: baseX - 30,
                            y: baseY + 4,
                            vx: (driftLeft ? -3.0 : -1.4) + (Math.random() - 0.5) * 0.8,
                            vy: 1.2 + Math.random() * 0.7,
                            rotSpeed: (driftLeft ? -0.20 : -0.24) + (Math.random() - 0.5) * 0.04,
                            angle: 0,
                            side: 'left',
                            life: 360,
                            size: 30  // half-width of detached wing
                        });
                        // === Detach RIGHT WING ===
                        bossWingDebris.push({
                            x: baseX + 30,
                            y: baseY + 4,
                            vx: (driftLeft ? 1.4 : 3.0) + (Math.random() - 0.5) * 0.8,
                            vy: 1.2 + Math.random() * 0.7,
                            rotSpeed: (driftLeft ? 0.24 : 0.20) + (Math.random() - 0.5) * 0.04,
                            angle: 0,
                            side: 'right',
                            life: 360,
                            size: 30
                        });
                        // Shockwave rings at each wing-break point
                        explosions.push({
                            x: baseX - 30, y: baseY + 4, vx: 0, vy: 0,
                            life: 1.0, decay: 0.05, size: 0, maxSize: 90,
                            color: 'rgba(255,180,80,0.85)', type: 'shockwave', gravity: 0
                        });
                        explosions.push({
                            x: baseX + 30, y: baseY + 4, vx: 0, vy: 0,
                            life: 1.0, decay: 0.05, size: 0, maxSize: 90,
                            color: 'rgba(255,180,80,0.85)', type: 'shockwave', gravity: 0
                        });
                        // Wing-break sparks
                        for (let wi = 0; wi < 12; wi++) {
                            const a = Math.random() * Math.PI * 2;
                            const sp = 1.4 + Math.random() * 2.6;
                            explosions.push({
                                x: baseX + (Math.random() < 0.5 ? -30 : 30),
                                y: baseY + 4,
                                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                                life: 1.0, decay: 0.035,
                                size: 1.5 + Math.random() * 2,
                                color: COLORS.explosion[Math.floor(Math.random() * 3)],
                                type: 'fire', gravity: 0
                            });
                        }
                        // Screen shake + sound + slow-mo (frame 1 only)
                        deathFlashAlpha = Math.max(deathFlashAlpha, 0.85);
                        screenShake = Math.max(screenShake, 22);
                        screenShakeIntensity = Math.max(screenShakeIntensity, 8);
                        if (typeof playExplosionSound === 'function') playExplosionSound();
                        if (typeof startSlowMo === 'function') startSlowMo(140, 0.35);
                    }
                }

                // === Phase B (frames 4..until off-screen): fuselage drifts toward corner ===
                if (enemy.dyingTimer >= 4 && !enemy._dyingFinalDone) {
                    const driftLeft = enemy._dyingDriftLeft;
                    // Horizontal: continuous accel so it really travels to the edge
                    enemy._dyingVx += driftLeft ? -0.060 : 0.060;
                    if (enemy._dyingVx > 4.6) enemy._dyingVx = 4.6;
                    if (enemy._dyingVx < -4.6) enemy._dyingVx = -4.6;
                    // Vertical: light gravity — "slowly" falls
                    enemy._dyingVy += 0.022;
                    if (enemy._dyingVy > 3.0) enemy._dyingVy = 3.0;
                    enemy.x += enemy._dyingVx;
                    enemy.y += enemy._dyingVy;

                    // Tilt body steeply toward drift direction (~75°)
                    const targetTilt = driftLeft ? -1.3 : 1.3;
                    enemy.angle += (targetTilt - enemy.angle) * 0.08;

                    // End condition: off-screen, on-screen time cap, or hard cap
                    const offLeft = enemy.x < -100;
                    const offRight = enemy.x > GAME_WIDTH + 100;
                    const offBottom = enemy.y > GAME_HEIGHT + 80;
                    const _offScreen = offLeft || offRight || offBottom;
                    // Trigger final explosion while still on-screen if it's drifted far
                    // enough or after a shorter time cap (so user sees the boom!)
                    const _onScreenCap = enemy.dyingTimer > 180 && (enemy.x < 80 || enemy.x > GAME_WIDTH - 80);
                    const _timeCap = enemy.dyingTimer > 240;

                    // Subtle drifting smoke — sparse, every 3 frames (NOT every frame) so screen doesn't lag
                    if (enemy.dyingTimer % 3 === 0 && explosions.length < MAX_PARTICLES - 2) {
                        explosions.push({
                            x: enemy.x + (Math.random() - 0.5) * 24,
                            y: enemy.y + (Math.random() - 0.5) * 12,
                            vx: (Math.random() - 0.5) * 0.4 - (driftLeft ? 0.4 : -0.4),
                            vy: -0.3 + Math.random() * 0.4,
                            life: 1.0, decay: 0.018,
                            size: 9 + Math.random() * 5,
                            color: '#1A1A1A', isSmoke: true, type: 'smoke', gravity: 0.02
                        });
                    }
                    // Faint ember — every 4 frames, single spark
                    if (enemy.dyingTimer % 4 === 0 && explosions.length < MAX_PARTICLES - 2 && Math.random() < 0.5) {
                        explosions.push({
                            x: enemy.x + (Math.random() - 0.5) * 14,
                            y: enemy.y,
                            vx: (Math.random() - 0.5) * 1.2,
                            vy: (Math.random() - 0.2) * 0.8,
                            life: 1.0, decay: 0.05,
                            size: 1.2 + Math.random() * 1.4,
                            color: '#FF6622', type: 'spark', gravity: 0.04
                        });
                    }
                    // No more frequent pops — just a subtle small flicker every 12 frames
                    if (enemy.dyingTimer % 12 === 0 && explosions.length < MAX_PARTICLES - 4) {
                        const px = enemy.x + (Math.random() - 0.5) * 20;
                        const py = enemy.y + (Math.random() - 0.5) * 10;
                        createExplosion(px, py, 0.6);
                    }

                    // === Phase C: NO 2nd explosion, NO shockwave, NO fire burst, NO debris. ===
                    // === The fuselage has already faded out and drifted off-screen via   ===
                    // === the natural fade-out animation. Just clean up silently.        ===
                    // (Audio cue kept for game feel — does not cause render lag)
                    if (_offScreen || _onScreenCap || _timeCap) {
                        enemy._dyingFinalDone = true;
                        if (typeof playExplosionSound === 'function') playExplosionSound();
                        const idx = enemies.indexOf(enemy);
                        if (idx >= 0) enemies.splice(idx, 1);
                    }
                }
                break;
            }
            // Heavy bomber - slow drift, alternates firing homing missiles from left/right wings
            enemy._movePhase = (enemy._movePhase || 0) + 0.012;
            enemy._lifetime = (enemy._lifetime || 0) + 1;
            // Auto-remove after lifetime to prevent accumulation (40 sec = 2400 frames)
            if (enemy._lifetime > 2400) {
                createHitSpark(enemy.x, enemy.y, 0.8);
                enemies.splice(ei, 1);
                break;
            }
            // Smooth slow horizontal oscillation
            enemy.x += Math.sin(enemy._movePhase) * enemy.speed * 1.5;
            // Keep roughly in upper area (allow gentle bobbing)
            enemy.y = 80 + Math.sin(enemy._movePhase * 0.7) * 15;
            
            // Homing missile fire (alternates left/right wing)
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0) {
                // Calculate missile spawn position (wing tip)
                const wingOffsetX = (enemy.wingSide === 0 ? -1 : 1) * (enemy.width / 2 - 8);
                const missileX = enemy.x + wingOffsetX;
                const missileY = enemy.y + enemy.height / 2 - 4;
                // Initial velocity toward player
                const dx = player.x - missileX;
                const dy = player.y - missileY;
                const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
                const mSpeed = 2.4 + currentStage * 0.15;
                enemyBullets.push({
                    x: missileX,
                    y: missileY,
                    width: 36,
                    height: 36,
                    speed: mSpeed,
                    vx: (dx / dist) * mSpeed,
                    vy: (dy / dist) * mSpeed,
                    isHoming: true,
                    homingTurnRate: 0.10 + currentStage * 0.008, // faster turn — reaches player before self-destruct
                    homingLife: 180, // ~3s @60fps (reduced from 7s per user request -4s)
                    color: '#FFAA00',
                    ownerType: 'heavyBomber',
                    targetX: player.x,
                    targetY: player.y
                });
                // Toggle wing
                enemy.wingSide = 1 - enemy.wingSide;
                // 2-3 second interval (120-180 frames at 60fps)
                enemy.shootCooldown = 120 + Math.floor(Math.random() * 60);
            }
            break;
        }
        
        // Keep enemy in bounds
        enemy.x = Math.max(enemy.width / 2, Math.min(GAME_WIDTH - enemy.width / 2, enemy.x));
        
        // Enemy shooting (basic)
        if (enemy.type !== 'bomber' && enemy.type !== 'heavyBomber' && enemy.y > 50) {
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0 && Math.random() < 0.02 * wave) {
                enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    width: 24,
                    height: 24,
                    speed: 2.30 + currentStage * 0.30 // +60% from 1.44+stage*0.19 (was 0.9+stage*0.12)
                });
                enemy.shootCooldown = (wave >= 20) ? 130 : 90;
            }
        }
        
        // Remove off-screen enemies
        if (enemy.y > GAME_HEIGHT + 50) {
            if (enemy.isWaveBoss) {
                bossActive = false;
                if (bossIsFinalBoss) {
                    bossDeathX = enemy.x;
                    bossDeathY = enemy.y;
                    createHitSpark(enemy.x, enemy.y, 0.6);
                                    deathFlashAlpha = Math.max(deathFlashAlpha, 0.3);
                                    screenShake = 10; screenShakeIntensity = 3;
                } else {
                    screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                }
                bossDefeated = true;
                bossClaws = [];
            }
            enemies.splice(ei, 1);
        }
    }

    // === Update detached boss wing debris (independent physics) ===
    for (let wi = bossWingDebris.length - 1; wi >= 0; wi--) {
        const w = bossWingDebris[wi];
        // Gravity + horizontal drift + rotation
        w.vy += 0.12;             // gravity
        w.vx *= 0.995;            // mild air drag
        w.x += w.vx;
        w.y += w.vy;
        w.angle += w.rotSpeed;
        w.life--;
        // Trail of small smoke from falling wing
        if (w.life % 3 === 0 && explosions.length < MAX_PARTICLES - 2) {
            explosions.push({
                x: w.x + (Math.random() - 0.5) * 8,
                y: w.y + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -0.2 + Math.random() * 0.2,
                life: 1.0, decay: 0.025,
                size: 3 + Math.random() * 3,
                color: '#333', isSmoke: true, type: 'smoke', gravity: 0.02
            });
            if (Math.random() < 0.3) {
                explosions.push({
                    x: w.x, y: w.y,
                    vx: (Math.random() - 0.5) * 1.5,
                    vy: (Math.random() - 0.5) * 1.0,
                    life: 1.0, decay: 0.05,
                    size: 1 + Math.random() * 1.5,
                    color: '#FF6622', type: 'spark', gravity: 0.05
                });
            }
        }
        // Splice out when expired or far off-screen
        if (w.life <= 0 || w.y > GAME_HEIGHT + 80 || w.x < -120 || w.x > GAME_WIDTH + 120) {
            bossWingDebris.splice(wi, 1);
        }
    }

    // Update powerups
    // Converted from forEach to for (reverse for safe splice)
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        pu.y += pu.speed;
        if (pu.y > GAME_HEIGHT + 20) {
            powerups.splice(i, 1);
        }
    }
    
    // Update drones
    // Converted from forEach to for (reverse for safe splice)
    for (let di = drones.length - 1; di >= 0; di--) {
        const drone = drones[di];
        // Follow player with offset
        const targetX = player.x + drone.offsetX;
        const targetY = player.y + drone.offsetY;
        drone.x += (targetX - drone.x) * 0.15;
        drone.y += (targetY - drone.y) * 0.15;
        
        // Drone shooting
        drone.shootCooldown--;
        if (drone.shootCooldown <= 0) {
            if (drone.droneType === 'homing') {
                // Red homing drone - slower fire rate, homing missiles
                // Find nearest enemy to target
                if (enemies.length > 0) {
                    let nearestEnemy = null;
                    let nearestDist = Infinity;
                    for (let ei = 0; ei < enemies.length; ei++) {
                        const enemy = enemies[ei];
                        // === DYING GUARD: drone should not lock onto dying-fall enemies ===
                        if (enemy.dying) continue;
                        const dx = enemy.x - drone.x;
                        const dy = enemy.y - drone.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestEnemy = enemy;
                        }
                    }
                    
                    if (nearestEnemy) {
                        const dx = nearestEnemy.x - drone.x;
                        const dy = nearestEnemy.y - drone.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const speed = 7.68; // +60% from 4.8 (was 3)
                        droneBullets.push({
                            x: drone.x,
                            y: drone.y - 10,
                            width: 5,
                            height: 12,
                            speed: speed,
                            vx: (dx / dist) * speed,
                            vy: (dy / dist) * speed,
                            isHoming: true,
                            targetEnemy: nearestEnemy,
                            damage: 2,
                            life: 180
                        });
                    }
                }
                drone.shootCooldown = 50 + Math.random() * 30;
            } else {
                // Normal pink drone - straight shot
                droneBullets.push({
                    x: drone.x,
                    y: drone.y - 10,
                    width: 3,
                    height: 10,
                    speed: 3.84 + wave * 0.26, // +60% from 2.4+wave*0.16 (was 1.5+wave*0.1)
                    isHoming: false,
                    damage: 1
                });
                drone.shootCooldown = 20 + Math.random() * 20;
            }
        }
    }
    
    // Update drone bullets
    // Converted from forEach to for (reverse for safe splice)
    for (let i = droneBullets.length - 1; i >= 0; i--) {
        const bullet = droneBullets[i];
        // === SLOW-MO: skip drone bullet motion for slowed frames ===
        if (slowMoActive && Math.random() > timeScale) {
            continue;
        }
        if (bullet.isHoming) {
            // Homing missile - track target enemy
            bullet.life--;
            if (bullet.life <= 0) {
                droneBullets.splice(i, 1);
                return;
            }
            
            // Re-acquire target if lost
            if (bullet.targetEnemy && !enemies.includes(bullet.targetEnemy)) {
                // Find new nearest enemy
                let nearestEnemy = null;
                let nearestDist = Infinity;
                for (let ei = 0; ei < enemies.length; ei++) {
                    const enemy = enemies[ei];
                    const dx = enemy.x - bullet.x;
                    const dy = enemy.y - bullet.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                }
                bullet.targetEnemy = nearestEnemy;
            }
            
            // Steer toward target
            if (bullet.targetEnemy) {
                const dx = bullet.targetEnemy.x - bullet.x;
                const dy = bullet.targetEnemy.y - bullet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const steerStrength = 0.08;
                    bullet.vx += (dx / dist) * steerStrength * bullet.speed;
                    bullet.vy += (dy / dist) * steerStrength * bullet.speed;
                    
                    // Normalize speed
                    const currentSpeed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                    if (currentSpeed > 0) {
                        bullet.vx = (bullet.vx / currentSpeed) * bullet.speed;
                        bullet.vy = (bullet.vy / currentSpeed) * bullet.speed;
                    }
                }
            }
            
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // Remove if off screen
            if (bullet.y < -50 || bullet.y > GAME_HEIGHT + 50 || bullet.x < -50 || bullet.x > GAME_WIDTH + 50) {
                droneBullets.splice(i, 1);
            }
        } else {
            bullet.y -= bullet.speed;
            if (bullet.y < -20) {
                droneBullets.splice(i, 1);
            }
        }
    }
    
    // Collision: Drone bullets vs Enemies
    // Converted from forEach to for (reverse for safe splice)
    for (let bi = droneBullets.length - 1; bi >= 0; bi--) {
        const bullet = droneBullets[bi];
        if (bullet._hit) continue;
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const enemy = enemies[ei];
            if (bullet._hit) break;
            // === DYING GUARD: skip enemies already in dying-fall / death-cascade ===
            if (enemy.dying) continue;
            if (checkCollision(bullet, enemy)) {
                // === B-52 STAGE BOSS: wings invulnerable. ===
                if (enemy.isWaveBoss && enemy.type === 'final' && enemy.hitboxBody) {
                    const hb = enemy.hitboxBody;
                    const ht = enemy.hitboxTail;
                    const dRelX = bullet.x - enemy.x;
                    const dRelY = bullet.y - enemy.y;
                    const inBody = Math.abs(dRelX - hb.xOff) < hb.halfW && Math.abs(dRelY - hb.yOff) < hb.halfH;
                    const inTail = Math.abs(dRelX - ht.xOff) < ht.halfW && Math.abs(dRelY - ht.yOff) < ht.halfH;
                    if (!inBody && !inTail) {
                        createHitSpark(bullet.x, bullet.y, 0.15);
                        bullet._hit = true;
                        droneBullets.splice(bi, 1);
                        break;
                    }
                }
                const dmg = (bullet.damage || 1) * (player.vPowerActive ? 1.5 : 1);
                enemy.hp -= dmg;
                bullet._hit = true;
                droneBullets.splice(bi, 1);
                
                if (enemy.hp <= 0 && !enemy.dying) {
                    score += enemy.score;
                    comboCount++;
                    comboTimer = 90; // 1.5 seconds to chain kills
                    if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                    // Mid-boss: trigger falling sequence instead of immediate splice (one-shot)
                    if (enemy.isMidBoss && enemy.type === 'heavyBomber' && !enemy.dying) {
                        enemy.dying = true;
                        enemy.dyingTimer = 0;
                        enemy.shootCooldown = 9999;
                        enemy.fallRot = 0;
                        enemy.fallVy = 1.5;
                        enemy.fallVx = (Math.random() - 0.5) * 0.4;
                        createExplosion(enemy.x, enemy.y, 1.5);
                        continue;
                    }
                    if (enemy.isWaveBoss && !enemy.dying) {
                        // One-shot reward: only runs the FIRST time this boss is killed
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                        if (bossIsFinalBoss) {
                            // === MULTI-STEP CASCADE: small chained pops before big final + slow-mo ===
                            enemy.dying = true;
                            enemy.dyingTimer = 0;
                            enemy.dyingCascade = 0;
                            enemy.cascadeBaseX = enemy.x;
                            enemy.cascadeBaseY = enemy.y;
                            bossDeathX = enemy.x;
                            bossDeathY = enemy.y;
                            continue; // skip splice — boss handled by its dying block
                        } else {
                            screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                        }
                        bossDefeated = true;
                        player.lives = Math.min(5, player.lives + 1);
                        bossClaws = [];
                    } else if (!enemy.isWaveBoss && !enemy.isMidBoss) {
                        // Mook (regular enemy) drops powerup immediately
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    // Dying enemies stay in the array — their dying block removes them later
                    if (!enemy.dying) {
                        enemies.splice(ei, 1);
                    }
                } else {
                    hitMarkers.push({ x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y, timer: 12 });
                    createHitSpark(enemy.x, enemy.y, 0.5);
                }
            }
        }
    }
    
    // Update explosions
    // Converted from forEach to for (reverse for safe splice)
    // === PERF: Aggressive culling when overloaded ===
    var overloaded = explosions.length > 80;
    // === SLOW-MO: Particle motion slowed when timeScale < 1 ===
    const particleScale = timeScale < 0.95 ? timeScale : 1.0;
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.x += exp.vx * particleScale;
        exp.y += exp.vy * particleScale;
        exp.vx *= 0.95;
        exp.vy *= 0.95;
        exp.life -= exp.decay * particleScale;
        // Wing Fighter: rotate debris particles
        if (exp.isDebris && exp.rotSpeed) {
            exp.rotation = (exp.rotation || 0) + exp.rotSpeed;
        }
        // Wing Fighter: smoke expands and rises
        if (exp.isSmoke) {
            exp.vy -= 0.05;
            exp.size += 0.08;
        }
        // Wing Fighter: ring particles expand
        if (exp.isRing && exp.ringRadius) {
            exp.ringRadius += exp.size * 0.3;
        }
        // Wing Fighter: core flash pulses brighter at start
        if (exp.isCore) {
            exp.size += 0.3;
        }
        // === PERF: Aggressive culling — speed up decay when overloaded ===
        if (overloaded) {
            exp.decay *= 1.04; // Gradually decay faster
            // Immediately kill tiny/smoke particles that are almost dead
            if ((exp.isSmoke && exp.life < 0.5) || (exp.life < 0.15 && !exp.isCore)) {
                exp.life = -1;
            }
        }
        if (exp.life <= 0) {
            explosions.splice(i, 1);
        }
    }
    // === PERF: Hard trim if still over cap (shouldn't happen but safety net) ===
    if (explosions.length > MAX_PARTICLES) {
        explosions.splice(0, explosions.length - MAX_PARTICLES);
    }
    
    
    // === W ULTIMATE (Level 7): 3-second piercing laser straight up ===
    if (laserLevel >= 6 && player.activeWeapon === 'W') {
        wUltimateTimer--;
        if (wUltimateTimer <= 0) {
            wUltimateTimer = 180; // 3 seconds
            wUltimateActive = true;
            wUltimateX = player.x;
            wUltimateY = player.y;
        }
        if (wUltimateActive) {
            // The piercing laser beam - damages all enemies it passes through
            const beamX = wUltimateX;
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
                const enemy = enemies[ei];
                // === DYING GUARD: skip enemies already dying/cascading ===
                if (enemy.dying) continue;
                // Check if enemy is in the vertical beam path
                if (Math.abs(enemy.x - beamX) < enemy.width / 2 + 12 && enemy.y < player.y) {
                    enemy.hp -= 46.08; // 3x missile damage
                    if (enemy.hp <= 0 && !enemy.dying) {
                        score += enemy.score;
                        comboCount++;
                        comboTimer = 90;
                        if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                        createExplosion(enemy.x, enemy.y, 0.7);
                        if (enemy.isWaveBoss) {
                            // One-shot reward
                            spawnPowerup(enemy.x, enemy.y, true);
                            bossActive = false;
                            if (bossIsFinalBoss) {
                                // Final boss destruction: massive explosion effect
                                bossDeathX = enemy.x;
                                bossDeathY = enemy.y;
                                createHitSpark(enemy.x, enemy.y, 0.6);
                                deathFlashAlpha = Math.max(deathFlashAlpha, 0.3);
                                screenShake = 10; screenShakeIntensity = 3;
                                enemy.dying = true;
                                enemy.dyingTimer = 0;
                                enemy.dyingCascade = 0;
                                enemy.cascadeBaseX = enemy.x;
                                enemy.cascadeBaseY = enemy.y;
                                continue; // skip splice
                            } else {
                                screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                            }
                            bossDefeated = true;
                            bossClaws = [];
                            player.lives = Math.min(5, player.lives + 1);
                        } else if (enemy.isMidBoss && enemy.type === 'heavyBomber') {
                            enemy.dying = true;
                            enemy.dyingTimer = 0;
                            enemy.shootCooldown = 9999;
                            enemy.fallRot = 0;
                            enemy.fallVy = 1.5;
                            enemy.fallVx = (Math.random() - 0.5) * 0.4;
                            createExplosion(enemy.x, enemy.y, 1.5);
                            continue;
                        } else {
                            spawnPowerup(enemy.x, enemy.y);
                        }
                        if (!enemy.dying) {
                            enemies.splice(ei, 1);
                        }
                    } else if (enemy.hp > 0) {
                        hitMarkers.push({ x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y, timer: 12 });
                    }
                }
            }
            // Destroy enemy bullets in beam path
            for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
                const b = enemyBullets[bi];
                if (Math.abs(b.x - beamX) < 16 && b.y < player.y) {
                    enemyBullets.splice(bi, 1);
                }
            }
            // Beam lasts 15 frames then fades
            wUltimateY -= 30;
            if (wUltimateY < -50) {
                wUltimateActive = false;
                wUltimateY = player.y;
            }
        }
    }
    
    

    // Missile cooldowns
    if (playerMissileLevel > 0) {
        missileCooldown--;
        if (playerMissileLevel >= 5) missileDefenseCooldown--;
    }
    // M ultimate timer (runs regardless of missile level once set)
    if (mUltimateTimer > 0) mUltimateTimer--;
    
    // === M MISSILE SHOOTING (7 levels, 0-6) ===
    if (playerMissileLevel >= 1 && missileCooldown <= 0) {
        // Level 6 (ultimate): faster fire rate, smaller missiles
        missileCooldown = (playerMissileLevel >= 6) ? 55 : 90;
        const mSize = (playerMissileLevel >= 6) ? 1.0 : 0.5; // Bigger at level 7, small at 1-6
        const mW = Math.floor(12 * mSize);
        const mH = Math.floor(27 * mSize);
        const mSpd = (playerMissileLevel >= 6) ? -5.5 : -4.5;
        
        // Level 1: 1 forward missile
        missiles.push({ x: player.x, y: player.y - 10, vy: mSpd, vx: 0, homing: false, defensive: false, w: mW, h: mH, isUltimate: false });
        
        if (playerMissileLevel >= 2) {
            // Level 2: +2 side missiles
            missiles.push({ x: player.x - 15, y: player.y - 5, vy: mSpd, vx: -0.3, homing: false, defensive: false, w: mW, h: mH, isUltimate: false });
            missiles.push({ x: player.x + 15, y: player.y - 5, vy: mSpd, vx: 0.3, homing: false, defensive: false, w: mW, h: mH, isUltimate: false });
        }
        
        if (playerMissileLevel >= 3) {
            // Level 3: +1 left homing missile
            missiles.push({ x: player.x - 22, y: player.y, vy: -3, vx: -1, homing: true, defensive: false, w: mW, h: mH, isUltimate: false });
        }
        
        if (playerMissileLevel >= 4) {
            // Level 4: +1 right homing missile
            missiles.push({ x: player.x + 22, y: player.y, vy: -3, vx: 1, homing: true, defensive: false, w: mW, h: mH, isUltimate: false });
        }
        
        if (playerMissileLevel >= 5) {
            // Level 5-6: +2 more homing missiles from wider positions
            missiles.push({ x: player.x - 30, y: player.y + 5, vy: -3.5, vx: -1.5, homing: true, defensive: false, w: mW, h: mH, isUltimate: false });
            missiles.push({ x: player.x + 30, y: player.y + 5, vy: -3.5, vx: 1.5, homing: true, defensive: false, w: mW, h: mH, isUltimate: false });
        }
    }
    
    // Defensive rear missile (level 5+)
    if (playerMissileLevel >= 5 && missileDefenseCooldown <= 0) {
        missileDefenseCooldown = 120;
        const mSize = (playerMissileLevel >= 6) ? 1.0 : 0.5;
        const mW = Math.floor(12 * mSize);
        const mH = Math.floor(27 * mSize);
        missiles.push({ x: player.x, y: player.y + 15, vy: 3, vx: 0, homing: false, defensive: true, w: mW, h: mH, isUltimate: false });
    }
    
    // === M ULTIMATE (Level 7): Special slow missile that explodes near mid-boss area ===
    if (playerMissileLevel >= 5 && mUltimateTimer <= 0) {
        mUltimateTimer = 300; // 5 seconds
        mUltimateActive = true;
        mUltimateMissile = {
            x: player.x,
            y: player.y - 30,
            vy: -1.8, // slow ascent
            vx: 0,
            w: (playerMissileLevel >= 6) ? 16 : 8, h: (playerMissileLevel >= 6) ? 36 : 18, // big at level 6, small at level 5
            life: 300,
            exploded: false
        };
    }
    
    // Update M ultimate missile
    if (mUltimateActive && mUltimateMissile && !mUltimateMissile.exploded) {
        mUltimateMissile.y += mUltimateMissile.vy;
        // Explode when reaching mid-boss area (y ~ 100-200)
        if (mUltimateMissile.y < 160) {
            mUltimateMissile.exploded = true;
            // Create explosion fragments
            for (let fi = 0; fi < 20; fi++) {
                const fAngle = (Math.PI * 2 / 20) * fi;
                const fSpeed = Math.random() * 5 + 3;
                explosions.push({
                    x: mUltimateMissile.x, y: mUltimateMissile.y,
                    vx: Math.cos(fAngle) * fSpeed, vy: Math.sin(fAngle) * fSpeed,
                    size: Math.random() * 10 + 6, life: 1,
                    decay: Math.random() * 0.02 + 0.01,
                    color: '#FF6600'
                });
            }
            // Damage all enemies in radius (3x normal missile damage)
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
                const enemy = enemies[ei];
                // === DYING GUARD: never re-damage / re-reward an enemy already in its death sequence ===
                if (enemy.dying) continue;
                const d = Math.hypot(mUltimateMissile.x - enemy.x, mUltimateMissile.y - enemy.y);
                if (d < 200) {
                    enemy.hp -= 46.08; // 3x normal missile damage (15.36 * 3)
                    if (enemy.hp <= 0) {
                        score += enemy.score;
                        createExplosion(enemy.x, enemy.y, 0.7);
                        if (enemy.isWaveBoss) {
                            spawnPowerup(enemy.x, enemy.y, true);
                            bossActive = false;
                            if (bossIsFinalBoss) {
                                // Final boss destruction: massive explosion effect
                                bossDeathX = enemy.x;
                                bossDeathY = enemy.y;
                                createHitSpark(enemy.x, enemy.y, 0.6);
                                    deathFlashAlpha = Math.max(deathFlashAlpha, 0.3);
                                    screenShake = 10; screenShakeIntensity = 3;
                            } else {
                                screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                            }
                            bossDefeated = true;
                            bossClaws = [];
                            player.lives = Math.min(5, player.lives + 1);
                        } else {
                            spawnPowerup(enemy.x, enemy.y);
                        }
                        enemies.splice(ei, 1);
                    }
                }
            }
            // Destroy enemy bullets in radius
            for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
                const b = enemyBullets[bi];
                if (Math.hypot(mUltimateMissile.x - b.x, mUltimateMissile.y - b.y) < 200) {
                    enemyBullets.splice(bi, 1);
                }
            }
            mUltimateActive = false;
            mUltimateMissile = null;
        }
    }
    
    // Missile update
    for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        
        if (m.homing && !m.defensive) {
            // Homing: track nearest enemy
            let closest = null, closestDist = Infinity;
            for (let ei = 0; ei < enemies.length; ei++) {
                const e = enemies[ei];
                const dx = e.x - m.x, dy = e.y - m.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < closestDist) { closestDist = d; closest = e; }
            }
            if (closest) {
                const tdx = closest.x - m.x, tdy = closest.y - m.y;
                const td = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
                m.vx += (tdx / td) * 0.18;
                m.vy += (tdy / td) * 0.18;
                const sp = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
                if (sp > 5.25) { m.vx = m.vx / sp * 5.25; m.vy = m.vy / sp * 5.25; }
            }
        }
        
        if (m.defensive) {
            // Defensive: track nearest enemy bullet
            if (enemyBullets.length > 0) {
                let closestBullet = enemyBullets[0];
                let cbDist = Infinity;
                for (let bi = 0; bi < enemyBullets.length; bi++) {
                    const b = enemyBullets[bi];
                    const d = Math.hypot(b.x - m.x, b.y - m.y);
                    if (d < cbDist) { cbDist = d; closestBullet = b; }
                }
                const tdx = closestBullet.x - m.x, tdy = closestBullet.y - m.y;
                const td = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
                m.vx = tdx / td * 2.5;
                m.vy = tdy / td * 2.5;
            }
        }
        
        m.x += m.vx;
        m.y += m.vy;
        
        // M Level 5+: Missiles can destroy enemy bullets (bullet defense)
        if (!m.defensive && playerMissileLevel >= 4) {
            let hitBullet = false;
            for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
                const b = enemyBullets[bi];
                const dx = m.x - b.x, dy = m.y - b.y;
                if (Math.sqrt(dx * dx + dy * dy) < 22) {
                    enemyBullets.splice(bi, 1);
                    hitBullet = true;
                }
            }
            if (hitBullet) {
                // Missile survives bullet destruction (strong defense)
            }
        }
        
        // Remove if off screen
        if (m.y < -30 || m.y > GAME_HEIGHT + 30 || m.x < -30 || m.x > GAME_WIDTH + 30) {
            missiles.splice(i, 1);
            continue;
        }
        
        // Defensive missile: destroy enemy bullets on contact + splash
        if (m.defensive) {
            let hitBullet = false;
            for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
                const b = enemyBullets[bi];
                const dx = m.x - b.x, dy = m.y - b.y;
                if (Math.sqrt(dx * dx + dy * dy) < 25) {
                    // Splash: destroy nearby bullets too
                    for (let bj = enemyBullets.length - 1; bj >= 0; bj--) {
                        const b2 = enemyBullets[bj];
                        const d2 = Math.hypot(m.x - b2.x, m.y - b2.y);
                        if (d2 < 110) { // wider defensive splash
                            enemyBullets.splice(bj, 1);
                        }
                    }
                    hitBullet = true;
                    break;
                }
            }
            if (hitBullet) {
                createExplosion(m.x, m.y, 0.8);
                missiles.splice(i, 1);
                continue;
            }
        }
        
        // Missile vs Enemy collision - AABB checkCollision for reliable hits on all enemy types
        let hitEnemy = false;
        // Larger hitbox (44x44) ensures ALL enemy types are reliably hit every time
        const missileHitbox = { x: m.x, y: m.y, width: 24, height: 24 };
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const enemy = enemies[ei];
            // === DYING GUARD: skip enemies in dying-fall / death-cascade ===
            if (enemy.dying) continue;
            if (checkCollision(missileHitbox, enemy)) {
                // === B-52 STAGE BOSS: wings are invulnerable. Only body/tail take damage. ===
                if (enemy.isWaveBoss && enemy.type === 'final' && enemy.hitboxBody) {
                    const hb = enemy.hitboxBody;
                    const ht = enemy.hitboxTail;
                    const mRelX = m.x - enemy.x;
                    const mRelY = m.y - enemy.y;
                    const inBody = Math.abs(mRelX - hb.xOff) < hb.halfW && Math.abs(mRelY - hb.yOff) < hb.halfH;
                    const inTail = Math.abs(mRelX - ht.xOff) < ht.halfW && Math.abs(mRelY - ht.yOff) < ht.halfH;
                    if (!inBody && !inTail) {
                        // Wing hit: missile fizzles without damage (still consumes missile)
                        createHitSpark(m.x, m.y, 0.2);
                        hitEnemy = true;
                        break;
                    }
                }
                // Direct hit: 12.8 damage (same power applied to ALL enemy types)
                const missileDamage = 15.36; // 40% power reduction from 25.6
                enemy.hp -= missileDamage;
                createExplosion(m.x, m.y, 1.0);
                createHitSpark(enemy.x, enemy.y);
                
                // Splash damage to ALL nearby enemies (reverse iteration for safety)
                // Skip dying enemies — their kill reward already triggered
                for (let ej = enemies.length - 1; ej >= 0; ej--) {
                    if (ej === ei) continue;
                    const e2 = enemies[ej];
                    if (e2.dying) continue;
                    const d2 = Math.hypot(m.x - e2.x, m.y - e2.y);
                    if (d2 < 140) { // wider splash radius
                        e2.hp -= missileDamage * 0.5;
                    }
                }
                
                // Proper enemy cleanup when killed by missile (score + powerup + removal)
                if (enemy.hp <= 0 && !enemy.dying) {
                    score += enemy.score;
                    comboCount++;
                    comboTimer = 90;
                    if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                    createExplosion(enemy.x, enemy.y, 0.7);
                    if (enemy.isWaveBoss) {
                        // One-shot reward for boss kill
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                        if (bossIsFinalBoss) {
                            bossDeathX = enemy.x;
                            bossDeathY = enemy.y;
                            createHitSpark(enemy.x, enemy.y, 0.6);
                            deathFlashAlpha = Math.max(deathFlashAlpha, 0.3);
                            screenShake = 10; screenShakeIntensity = 3;
                            enemy.dying = true;
                            enemy.dyingTimer = 0;
                            enemy.dyingCascade = 0;
                            enemy.cascadeBaseX = enemy.x;
                            enemy.cascadeBaseY = enemy.y;
                            hitEnemy = true;
                            break;
                        } else {
                            screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                        }
                        bossDefeated = true;
                        bossClaws = [];
                        player.lives = Math.min(5, player.lives + 1);
                    } else if (enemy.isMidBoss && enemy.type === 'heavyBomber') {
                        // heavyBomber dying-fall (one-shot)
                        enemy.dying = true;
                        enemy.dyingTimer = 0;
                        enemy.shootCooldown = 9999;
                        enemy.fallRot = 0;
                        enemy.fallVy = 1.5;
                        enemy.fallVx = (Math.random() - 0.5) * 0.4;
                        createExplosion(enemy.x, enemy.y, 1.5);
                        hitEnemy = true;
                        break;
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    if (!enemy.dying) {
                        enemies.splice(ei, 1);
                    }
                } else if (enemy.hp > 0) {
                    hitMarkers.push({ x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y, timer: 12 });
                }
                hitEnemy = true;
                break;
            }
        }
        if (hitEnemy) {
            missiles.splice(i, 1);
        }
    }
    
    // Collision: Player bullets vs Enemies
    // Converted from forEach to for (reverse for safe splice)
    for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
        const bullet = playerBullets[bi];
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const enemy = enemies[ei];
            // === DYING GUARD: enemies already in dying-fall / death-cascade are ignored entirely ===
            if (enemy.dying) continue;
            if (checkCollision(bullet, enemy)) {
                // === B-52 STAGE BOSS: wings are invulnerable. Only body/tail take damage. ===
                if (enemy.isWaveBoss && enemy.type === 'final' && enemy.hitboxBody) {
                    const hb = bullet.hitboxBody || { xOff: 0, yOff: 2, halfW: 55, halfH: 28 };
                    const ht = bullet.hitboxTail || { xOff: 0, yOff: 45, halfW: 25, halfH: 15 };
                    // Bullet position relative to boss center
                    const bRelX = bullet.x - enemy.x;
                    const bRelY = bullet.y - enemy.y;
                    const inBody = Math.abs(bRelX - hb.xOff) < hb.halfW && Math.abs(bRelY - hb.yOff) < hb.halfH;
                    const inTail = Math.abs(bRelX - ht.xOff) < ht.halfW && Math.abs(bRelY - ht.yOff) < ht.halfH;
                    if (!inBody && !inTail) {
                        // Wing hit: bullet passes through, tiny spark on wing edge, NO damage
                        createHitSpark(bullet.x, bullet.y, 0.15);
                        continue; // skip damage, bullet keeps flying
                    }
                }
                const bulletDmg = bullet.power || (player.vPowerActive ? 1.5 : 1);
                enemy.hp -= bulletDmg;
                createHitSpark(enemy.x + (Math.random() - 0.5) * enemy.width * 0.5, enemy.y + (Math.random() - 0.5) * enemy.height * 0.5);
                playerBullets.splice(bi, 1);

                if (enemy.hp <= 0 && !enemy.dying) {
                    score += enemy.score;
                    comboCount++;
                    comboTimer = 90;
                    if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                    createExplosion(enemy.x, enemy.y, 0.7);
                    // Mid-boss falling sequence (heavyBomber) — guard prevents second kill from short-circuiting
                    if (enemy.isMidBoss && enemy.type === 'heavyBomber' && !enemy.dying) {
                        enemy.dying = true;
                        enemy.dyingTimer = 0;
                        enemy.shootCooldown = 9999;
                        enemy.fallRot = 0;
                        enemy.fallVy = 1.5;
                        enemy.fallVx = (Math.random() - 0.5) * 0.4;
                        createExplosion(enemy.x, enemy.y, 1.5);
                        continue;
                    }
                    if (enemy.isWaveBoss && !enemy.dying) {
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                        if (bossIsFinalBoss) {
                            enemy.dying = true;
                            enemy.dyingTimer = 0;
                            enemy.dyingCascade = 0;
                            enemy.cascadeBaseX = enemy.x;
                            enemy.cascadeBaseY = enemy.y;
                            bossDeathX = enemy.x;
                            bossDeathY = enemy.y;
                            continue;
                        } else {
                            screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                        }
                        bossDefeated = true;
                        bossClaws = [];
                        player.lives = Math.min(5, player.lives + 1);
                    } else if (!enemy.isWaveBoss && !enemy.isMidBoss) {
                        // Mid-boss already handled above; mook still gets powerup
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    // dying boss / heavyBomber must stay in enemies[] until their dying block removes them
                    if (!enemy.dying) {
                        enemies.splice(ei, 1);
                    }
                } else {
                    hitMarkers.push({ x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y, timer: 12 });
                    createHitSpark(enemy.x, enemy.y, 0.5);
                }
            }
        }
    }
    
    // Collision: Enemy bullets vs Player
    if (!player.invincible) {
        // Converted from forEach to for (reverse for safe splice)
        for (let bi = enemyBullets.length - 1; bi >= 0; bi--) {
            const bullet = enemyBullets[bi];
            if (checkCollision(bullet, player)) {
                enemyBullets.splice(bi, 1);
            if (player.shieldActive && !player.vPowerActive) {
                    // Shield absorbs the hit
                    player.shieldActive = false;
                    player.shieldTimer = 0;
                    createExplosion(player.x, player.y, 1.0);
                    screenShake = Math.max(screenShake, 8);
                } else {
                    playerHit();
                }
            }
        }
    }
    
    // Collision: Enemies vs Player
    if (!player.invincible) {
        // Converted from forEach to for (reverse for safe splice)
        for (let ei = enemies.length - 1; ei >= 0; ei--) {
            const enemy = enemies[ei];
            // === DYING GUARD: dying enemies (mid-boss fall / final-boss cascade) cannot damage player ===
            if (enemy.dying) continue;
            if (checkCollision(enemy, player)) {
                // Ram collision: deals 1 damage (same as a single player bullet).
                // - Mook (hp=1) → dies, normal splice, drop powerup, etc.
                // - heavyBomber / final-boss (high hp) → takes 1 chip damage, stays alive,
                //   so the player can no longer "win by grazing". Boss dying/cascade still
                //   fires iff ram happened to bring hp to 0 (treated identically to a
                //   weapon-collision kill — same dying flag, same bossDefeated timing).
                enemy.hp -= 1;
                createExplosion(enemy.x, enemy.y, 0.3);
                let ramKilled = false;
                if (enemy.hp <= 0 && !enemy.dying) {
                    score += enemy.score;
                    comboCount++;
                    comboTimer = 90; // 1.5 seconds to chain kills
                    if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                    if (enemy.isMidBoss && enemy.type === 'heavyBomber') {
                        enemy.dying = true;
                        enemy.dyingTimer = 0;
                        enemy.shootCooldown = 9999;
                        enemy.fallRot = 0;
                        enemy.fallVy = 1.5;
                        enemy.fallVx = (Math.random() - 0.5) * 0.4;
                        createExplosion(enemy.x, enemy.y, 1.5);
                        ramKilled = true;
                    } else if (enemy.isWaveBoss) {
                        bossActive = false;
                        if (bossIsFinalBoss) {
                            createExplosion(enemy.x, enemy.y, 0.6);
                            deathFlashAlpha = Math.max(deathFlashAlpha, 0.3);
                            screenShake = 10; screenShakeIntensity = 3;
                            enemy.dying = true;
                            enemy.dyingTimer = 0;
                            enemy.dyingCascade = 0;
                            enemy.cascadeBaseX = enemy.x;
                            enemy.cascadeBaseY = enemy.y;
                            bossDeathX = enemy.x;
                            bossDeathY = enemy.y;
                        } else {
                            screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                            bossDefeated = true;
                            bossClaws = [];
                        }
                        spawnPowerup(enemy.x, enemy.y, true);
                        player.lives = Math.min(5, player.lives + 1);
                        ramKilled = true;
                    } else {
                        createExplosion(enemy.x, enemy.y, 0.7);
                        spawnPowerup(enemy.x, enemy.y);
                        ramKilled = true;
                    }
                }
                // Player always takes the ram hit. dying boss/heavyBomber stays in enemies[]
                // (their dying block removes them when the cascade completes).
                if (player.shieldActive && !player.vPowerActive) {
                    // Shield absorbs the hit
                    player.shieldActive = false;
                    player.shieldTimer = 0;
                    createExplosion(player.x, player.y, 1.0);
                    screenShake = Math.max(screenShake, 8);
                } else {
                    playerHit();
                }
                // Mook cleanup only — dying boss/heavyBomber manage themselves.
                if (ramKilled && !enemy.dying) {
                    enemies.splice(ei, 1);
                }
            }
        }
    }
    
    // Collision: Powerups vs Player
    // Converted from forEach to for (reverse for safe splice)
    for (let i = powerups.length - 1; i >= 0; i--) {
        const pu = powerups[i];
        if (checkCollision(pu, player)) {
            playPowerupSound();
            switch (pu.type) {
                case 'power':
                    player.powerLevel = Math.min(6, player.powerLevel + 1);
                    sparkleFlashActive = true; sparkleFlashTimer = 30;
                    player.activeWeapon = 'P';
                    laserBeams = [];
                    stopLaserSound();
                    laserLevel = 0;
                    // Clear missiles when switching to P bullets
                    missiles = [];
                    playerMissileLevel = 0;
                    break;
                case 'powerW':
                    // White W - Laser weapon (up to 7 beams, level 0-6)
                    // Degrade current weapon by 1 level on death
                    if (player.activeWeapon === 'P') {
                        player.powerLevel = Math.max(0, player.powerLevel - 1);
                    } else if (player.activeWeapon === 'W') {
                        if (laserBeams.length > 0) laserBeams.pop();
                    } else if (player.activeWeapon === 'M') {
                        playerMissileLevel = Math.max(0, playerMissileLevel - 1);
                    }
                    player.activeWeapon = 'W';
                    // Clear missiles when switching to W laser
                    missiles = [];
                    playerMissileLevel = 0;
                    laserLevel = Math.min(LASER_MAX_LEVEL, laserLevel + 1);
                    sparkleFlashActive = true; sparkleFlashTimer = 30;
                    // Rebuild laser beams array to match level
                    laserBeams = [];
                    for (let lb = 0; lb < laserLevel + 1; lb++) {
                        laserBeams.push({ tickTimer: 0 });
                        sparkleFlashActive = true; sparkleFlashTimer = 30;
                    }
                    playPowerupSound();
                    break;
                case 'bomb':
                    player.bombs = Math.min(5, player.bombs + 1);
                    break;
                case 'shield':
                    player.shieldActive = true;
                    player.shieldTimer = 999999; // never expires until hit
                    break;
                case 'drone':
                    // Add a normal drone (pink) up to max 4 total
                    if (drones.length < 4) {
                        const sideOffsets = [-30, 30, -45, 45];
                        const offsetIdx = drones.length;
                        drones.push({
                            x: player.x + sideOffsets[offsetIdx],
                            y: player.y,
                            side: offsetIdx % 2 === 0 ? 'left' : 'right',
                            offsetX: sideOffsets[offsetIdx],
                            offsetY: -10 - (Math.floor(offsetIdx / 2) * 15),
                            width: 16,
                            height: 16,
                            shootCooldown: 0,
                            droneType: 'normal'
                        });
                    } else {
                        // At max drones, replace a homing drone with normal (prefer homing to replace)
                        let replaced = false;
                        for (let di = 0; di < drones.length; di++) {
                            if (drones[di].droneType === 'homing') {
                                drones[di].droneType = 'normal';
                                drones[di].shootCooldown = 0;
                                replaced = true;
                                break;
                            }
                        }
                        // If all are normal, replace the oldest
                        if (!replaced && drones.length > 0) {
                            drones[0].droneType = 'normal';
                            drones[0].shootCooldown = 0;
                        }
                    }
                    break;
                case 'droneR':
                    // Add a homing drone (red) up to max 4 total
                    if (drones.length < 4) {
                        const sideOffsets = [-30, 30, -45, 45];
                        const offsetIdx = drones.length;
                        drones.push({
                            x: player.x + sideOffsets[offsetIdx],
                            y: player.y,
                            side: offsetIdx % 2 === 0 ? 'left' : 'right',
                            offsetX: sideOffsets[offsetIdx],
                            offsetY: -10 - (Math.floor(offsetIdx / 2) * 15),
                            width: 16,
                            height: 16,
                            shootCooldown: 0,
                            droneType: 'homing'
                        });
                    } else {
                        // At max drones, replace oldest normal drone with homing drone
                        // Prefer replacing normal drones over homing ones
                        let replaced = false;
                        for (let di = 0; di < drones.length; di++) {
                            if (drones[di].droneType === 'normal') {
                                drones[di].droneType = 'homing';
                                drones[di].shootCooldown = 0;
                                replaced = true;
                                break;
                            }
                        }
                        // If all are homing, replace the oldest homing
                        if (!replaced && drones.length > 0) {
                            drones[0].droneType = 'homing';
                            drones[0].shootCooldown = 0;
                        }
                    }
                    break;
                case 'powerM':
                    // Orange M - Missile weapon (up to 7 levels, 0-6)
                    playerMissileLevel = Math.min(6, playerMissileLevel + 1);
                    sparkleFlashActive = true; sparkleFlashTimer = 30;
                    player.activeWeapon = 'M';
                    // Clear other weapons - M replaces P bullets and W lasers
                    laserBeams = [];
                    stopLaserSound();
                    laserLevel = 0;
                    player.powerLevel = 0;
                    missiles = missiles; // keep missiles
                    playPowerupSound();
                    break;
                case 'powerV':
                    // Gray V - 5 seconds of +50% weapon power
                    player.hadShield = player.shieldActive;
                    player.vPowerActive = true;
                    player.vPowerTimer = 420; // 7 seconds at 60fps
                    player.invincible = true;
                    player.invincibleTimer = 420; // 7s invincibility
                    // Shield preserved (invincibility protects it)
                    playPowerupSound();
                    break;
            }
            powerups.splice(i, 1);
        }
    }
    
    // === FINAL BOSS DEATH CHECK: Run at end of update to catch same-frame boss kills ===
    if (bossDefeated && !hyperspaceActive && !deathActive) {
        onBossDefeated();
    }
}

// ============================================
// DRAWING FUNCTIONS
// ============================================

function drawLaserBeam() {
    for (let i = 0; i < laserBeams.length; i++) {
        const lb = laserBeams[i];
        if (!lb) continue;
        // Use player position as beam origin, target enemy as destination
        const sx = player.x;
        const sy = player.y - 20;
        const tx = lb.targetX || player.x;
        const ty = lb.targetY || 0;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;
        ctx.save();
        // Outer wide glow — disabled under perfMode to keep framerate stable
        if (!perfMode) {
            ctx.shadowColor = "#00FFFF";
            ctx.shadowBlur = 25;
        }
        ctx.strokeStyle = "rgba(0, 255, 255, 0.7)";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        // Mid beam
        if (!perfMode) {
            ctx.shadowColor = "#FFFFFF";
            ctx.shadowBlur = 18;
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        // Inner bright core
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        // Edge sparks along beam
        ctx.fillStyle = "#FFFF00";
        const sparkCount = perfMode ? 2 : 4;
        for (let j = 0; j < sparkCount; j++) {
            const t = (j + 1) / (sparkCount + 1);
            const sparkX = sx + dx * t + (Math.sin(frameCount * 0.5 + j) * 6) * ny;
            const sparkY = sy + dy * t + (Math.sin(frameCount * 0.5 + j) * 6) * (-nx);
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    // W-ultimate full screen laser
    if (wUltimateActive) {
        ctx.save();
        if (!perfMode) {
            ctx.shadowColor = "#00FFFF";
            ctx.shadowBlur = 30;
        }
        ctx.fillStyle = "rgba(0, 255, 255, 0.5)";
        ctx.fillRect(wUltimateX - 30, 0, 60, GAME_HEIGHT);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(wUltimateX - 8, 0, 16, GAME_HEIGHT);
        ctx.restore();
    }
}
// Generate planet set based on current wave
// ============================================
// HYPERSPACE SYSTEM
// ============================================


// Growing massive explosion - scale 0.15..1.0 (small->huge), used during boss death countdown
function createGrowingMassiveExplosion(x, y, scale) {
    scale = Math.max(0.15, scale || 1.0);
    const fireCount = Math.floor(8 * scale);
    const smokeCount = Math.floor(5 * scale);
    const sparkCount = Math.floor(3 * scale);
    for (let i = 0; i < fireCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (1 + Math.random() * 3) * scale;
        const cIdx = Math.floor(Math.random() * 3);
        explosions.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0, decay: 0.02 + Math.random() * 0.015,
            size: (2 + Math.random() * 5) * scale,
            color: COLORS.explosion[cIdx],
            type: 'fire', gravity: 0
        });
    }
    for (let i = 0; i < smokeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.4 + Math.random() * 1.4) * scale;
        explosions.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0, decay: 0.008 + Math.random() * 0.006,
            size: (4 + Math.random() * 5) * scale,
            color: '#666666', isSmoke: true, type: 'smoke', gravity: -0.01
        });
    }
    for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (1.5 + Math.random() * 3) * scale;
        explosions.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0, decay: 0.04 + Math.random() * 0.02,
            size: (1.5 + Math.random() * 2.5) * scale,
            color: '#FFFFFF', type: 'spark', gravity: 0
        });
    }
    explosions.push({
        x: x, y: y, vx: 0, vy: 0,
        life: 1.0, decay: 0.05, size: 0,
        maxSize: 40 * scale,
        color: 'rgba(255, 200, 100, 0.8)',
        type: 'shockwave', gravity: 0
    });
    if (scale >= 1.0) {
        screenShake = Math.max(screenShake, Math.floor(8 * scale));
        screenShakeIntensity = Math.max(screenShakeIntensity, 4);
    }
}

// Hit spark effect - small bright burst at impact point
// Muzzle flash effect - brief bright burst at weapon origin
function createMuzzleFlash(x, y) {
    // === PERF: Minimal muzzle flash
    if (explosions.length >= MAX_PARTICLES) return;
    explosions.push({x:x,y:y,vx:0,vy:-1,size:5,life:0.8,decay:0.12,color:'#FFFFFF',isCore:true});
    for (var i = 0; i < 2; i++) {
        var angle = Math.random() * Math.PI * 2;
        explosions.push({x:x,y:y,vx:Math.cos(angle)*2,vy:Math.sin(angle)*2-1,size:1.5,life:0.6,decay:0.1,color:'#FFEE88',isSpark:true});
    }
}
function createHitSpark(x, y, scale) {
    // === PERF: Minimal hit spark — just a small flash
    if (explosions.length >= MAX_PARTICLES) return;
    scale = scale || 1.0;
    // Single tiny core flash
    if (explosions.length < 100) {
        explosions.push({x:x,y:y,vx:0,vy:0,size:3*scale,life:1.0,decay:0.15,color:'#FFFFCC',isCore:true,gravity:0});
    }
    // 2-3 tiny sparks
    for (var i = 0; i < 3; i++) {
        if (explosions.length >= MAX_PARTICLES) break;
        var angle = Math.random() * Math.PI * 2;
        var speed = (1 + Math.random() * 1.5) * scale;
        explosions.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:(0.8+Math.random())*scale,life:1.0,decay:0.08,color:'#FFEE66',isSpark:true,gravity:0});
    }
    // Hit marker
    if (typeof hitMarkers !== 'undefined') {
        hitMarkers.push({x:x,y:y,timer:8});
    }
}

// // Massive explosion for final boss destruction (like player death but bigger)
function createMassiveExplosion(x, y, scale) {
    // === PERF: DRASTIC 90% reduction from original 193 particles
    if (explosions.length >= MAX_PARTICLES) return;
    scale = scale || 1.0;
    // 2 smoke
    for (var i = 0; i < 2; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.5 + Math.random() * 1.5 * scale;
        explosions.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.012,size:4+Math.random()*4,color:'#666',isSmoke:true,type:'smoke',gravity:-0.01});
    }
    // 4 fire
    for (var i = 0; i < 4; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1 + Math.random() * 2 * scale;
        explosions.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.03,size:3+Math.random()*4,color:COLORS.explosion[Math.floor(Math.random()*3)],type:'fire',gravity:0});
    }
    // 1 spark
    for (var i = 0; i < 1; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1 + Math.random() * 3;
        explosions.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.05,size:1.5+Math.random()*2,color:'#FFFFFF',type:'spark',gravity:0});
    }
    // 1 shockwave
    explosions.push({x:x,y:y,vx:0,vy:0,life:1.0,decay:0.05,size:0,maxSize:40*scale,color:'rgba(255,180,80,0.6)',type:'shockwave',gravity:0});
    screenShake = Math.max(screenShake, 6);
    screenShakeIntensity = Math.max(screenShakeIntensity, 3);
}

function onBossDefeated() {
    if (bossDefeated) {
        // Final boss death effect: same as player death (3-layer explosion, no slow timer)
        // (Player death = 50+40+15=105 particles; do 60+40+15=115 for slightly bigger boss death)
        const dx = bossDeathX;
        const dy = bossDeathY;
        // Ultra-minimal smoke
        for (var i = 0; i < 3; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1 + Math.random() * 2;
            explosions.push({x:dx,y:dy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.015,size:4+Math.random()*4,color:'#666',isSmoke:true,type:'smoke',gravity:0.02});
        }
        // Fireball (reduced)
        for (var i = 0; i < 4; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1.5 + Math.random() * 2.5;
            explosions.push({
                x: dx, y: dy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0, decay: 0.03 + Math.random() * 0.02,
                size: 5 + Math.random() * 8,
                color: COLORS.explosion[Math.floor(Math.random()*3)], type: 'fire', gravity: 0
            });
        }
        // Sparks (ultra-minimal)
        for (var i = 0; i < 2; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1 + Math.random() * 2;
            explosions.push({x:dx,y:dy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.05,size:1+Math.random()*2,color:'#FFFFFF',type:'spark',gravity:0});
        }
        // Single shockwave
        explosions.push({x:dx,y:dy,vx:0,vy:0,life:1.0,decay:0.04,size:0,maxSize:70,color:'rgba(255,150,50,0.5)',type:'shockwave',gravity:0});
        // Debris (ultra-minimal)
        for (var i = 0; i < 1; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1 + Math.random() * 2;
            explosions.push({x:dx,y:dy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.03,size:2+Math.random()*2,color:'#888',type:'debris',gravity:0.15});
        }
        // Light screen shake
        screenShake = Math.max(screenShake, 12);
        screenShakeIntensity = Math.max(screenShakeIntensity, 4);
        // White flash
        deathFlashAlpha = Math.max(deathFlashAlpha, 0.4);
        // Score and effects
        score += bossIsFinalBoss ? 10000 : 5000;
        comboCount += 5;
        comboTimer = 180;
        // IMMEDIATELY start hyperspace (no 5-minute freeze)
        if (bossIsFinalBoss) {
            // Clear all remaining enemies and bullets for clean stage transition
            const remainingEnemies = enemies.filter(e => !e.isWaveBoss);
            for (let rc = 0; rc < remainingEnemies.length; rc++) {
                createHitSpark(remainingEnemies[rc].x, remainingEnemies[rc].y, 0.4);
            }
            enemies = enemies.filter(e => e.isWaveBoss);
            enemyBullets = [];
            playerBullets = [];
            droneBullets = [];
            missiles = [];
            octopusTentacles = [];
            hyperspaceActive = true;
            hyperspaceTimer = HYPERSPACE_TOTAL; // FIX: start at full duration, not 0
            hyperspacePhase = 0;
        }
        // Reset state
        bossDefeated = false;
        bossActive = false;
        bossSpawned = false;
    }
}

function updateHyperspace() {
    hyperspaceTimer--;
    const progress = hyperspaceTimer / HYPERSPACE_TOTAL; // 1→0
    
    // === 3-PHASE ACCELERATION / DECELERATION ===
    // Phase 0 (progress 1.0→0.75): Player rises, stars slowly accelerate downward
    // Phase 1 (progress 0.75→0.25): Full hyperspace - max speed star rain
    // Phase 2 (progress 0.25→0.0): Deceleration - stars slow, trails shrink to dots
    
    if (progress > 0.75) {
        // Phase 0: ACCELERATION - player rises, stars begin falling
        hyperspacePhase = 0;
        const p = (progress - 0.75) / 0.25; // 1→0 during this phase
        player.y = GAME_HEIGHT - 80 - (1 - p) * (GAME_HEIGHT * 0.45);
        if (player.y < GAME_HEIGHT * 0.25) player.y = GAME_HEIGHT * 0.25;
    } else if (progress > 0.25) {
        // Phase 1: FULL HYPERSPACE RAIN - stars at max speed
        hyperspacePhase = 1;
        player.y = GAME_HEIGHT * 0.25;
    } else {
        // Phase 2: DECELERATION - player descends to landing position
        hyperspacePhase = 2;
        const p = progress / 0.25; // 0→1 during this phase
        player.y = GAME_HEIGHT * 0.25 + p * (GAME_HEIGHT - 80 - GAME_HEIGHT * 0.25);
    }
    
    // Update hyperspace stars (top→bottom rain)
    for (let i = hyperspaceStars.length - 1; i >= 0; i--) {
        const s = hyperspaceStars[i];
        
        // Speed depends on phase
        if (hyperspacePhase === 0) {
            s.vy = s.vy + (s.maxVy - s.vy) * 0.05; // lerp toward max
        } else if (hyperspacePhase === 1) {
            s.vy = s.maxVy; // full speed
        } else {
            s.vy = s.maxVy + (1.5 - s.maxVy) * (1 - (progress / 0.25)); // lerp back to slow
            s.vy = Math.max(0.5, s.vy);
        }
        
        s.y += s.vy;
        // Slight horizontal wobble for depth
        s.x += Math.sin(s.y * 0.02 + s.baseX * 0.1) * 0.5;
        
        // Trail length proportional to speed
        s.trailLength = s.vy * 25;
        
        // Reset star when it goes below screen
        if (s.y > GAME_HEIGHT + 50) {
            s.y = -30 - Math.random() * 40;
            s.x = Math.random() * GAME_WIDTH;
            s.baseX = s.x;
            s.vy = 1.5 + Math.random() * 3;
            s.trailLength = 0;
        }
    }
    
    // Transition back to gameplay when timer expires
    if (hyperspaceTimer <= 0) {
        hyperspaceActive = false;
        hyperspacePhase = 0;
        hyperspaceStars = [];
        
        // Advance to next stage
        currentStage++;
        stageWave = 1;
        stageTimer = 0;
        wave = currentStage * 10 + 1;
        bossDefeated = false;
        bossSpawned = false;  // Reset for next stage
        bossActive = false;
        bossClawCount = currentStage + 1;
        
        // Next planet theme
        currentPlanetIndex = (currentPlanetIndex + 1) % PLANET_THEMES.length;
        generatePlanetSet(currentPlanetIndex);
        
        // Reset player position and state
        player.y = GAME_HEIGHT - 80;
        player.invincible = true;
        player.visible = true;
        player.invincibleTimer = 60; // brief invincibility after jump
        
        // Show new stage flash
        waveFlash = { active: true, timer: 120, text: 'STAGE ' + currentStage };
        
        // Replenish 1 bomb per stage clear (up to max 5)
        player.bombs = Math.min(5, player.bombs + 1);
        
        // Heal 1 HP on stage clear (up to max 5)
        player.lives = Math.min(5, player.lives + 1);
        
        // Rapid spawn after hyperspace
        spawnBoost = 90;
    }
}

function drawHyperspace() {
    // Deep space background with subtle nebula
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#000510');
    gradient.addColorStop(0.5, '#001030');
    gradient.addColorStop(1, '#000818');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Distant stars (fixed)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 80; i++) {
        const sx = (i * 73.3 + frameCount * 0.1) % GAME_WIDTH;
        const sy = (i * 41.7) % GAME_HEIGHT;
        ctx.fillRect(sx, sy, 1, 1);
    }

    // Calculate warp intensity based on phase
    let intensity = 0;
    if (hyperspacePhase === 0) intensity = hyperspaceTimer / 60; // rise
    else if (hyperspacePhase === 1) intensity = 1.0 + hyperspaceTimer / 30; // peak
    else intensity = 1.0 - hyperspaceTimer / 60; // fall
    intensity = Math.max(0.2, Math.min(2.5, intensity));

    // Star streaks
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;
    for (let i = 0; i < hyperspaceStars.length; i++) {
        const star = hyperspaceStars[i];
        if (!star.active) continue;
        const dx = star.x - centerX;
        const dy = star.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const speed = star.speed * intensity;
        star.x += (dx / dist) * speed;
        star.y += (dy / dist) * speed;
        // Recycle if off screen
        if (star.x < 0 || star.x > GAME_WIDTH || star.y < 0 || star.y > GAME_HEIGHT) {
            const angle = Math.random() * Math.PI * 2;
            star.x = centerX + Math.cos(angle) * 10;
            star.y = centerY + Math.sin(angle) * 10;
            star.speed = 3 + Math.random() * 5 * intensity;
            star.length = 8 + Math.random() * 12 * intensity;
        }
        // Draw streak line
        const len = Math.min(star.length, dist * 0.5);
        const tailX = star.x - (dx / dist) * len;
        const tailY = star.y - (dy / dist) * len;
        const alpha = Math.min(1, intensity * 0.8);
        const hue = star.colorHue;
        ctx.strokeStyle = 'hsla(' + hue + ', 80%, 80%, ' + alpha + ')';
        ctx.lineWidth = 1 + intensity * 1.5;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        // Bright head
        ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
        ctx.beginPath();
        ctx.arc(star.x, star.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Player ship in center - keep normal ship appearance
    ctx.save();
    ctx.translate(centerX, centerY);
    // Slight rotation based on phase
    if (hyperspacePhase === 1) {
        ctx.rotate(Math.sin(frameCount * 0.1) * 0.05);
    }
    try {
        drawPlayer();
    } catch (e) {
        // fallback if drawPlayer not ready
    }
    ctx.restore();

    // Subtle warp flash overlay
    if (hyperspacePhase === 1 && hyperspaceTimer % 4 < 2) {
        ctx.fillStyle = 'rgba(200, 220, 255, 0.08)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Phase label at top
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#4488FF';
    ctx.shadowBlur = 8;
    let label = '';
    if (hyperspacePhase === 0) label = 'HYPERSPACE JUMP';
    else if (hyperspacePhase === 1) label = 'WARP DRIVE';
    else label = 'ARRIVING';
    ctx.fillText(label, centerX, 50);
    ctx.shadowBlur = 0;

    // Destination planet name
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
    if (currentPlanetIndex < PLANET_THEMES.length) {
        ctx.fillText('-> ' + PLANET_THEMES[currentPlanetIndex].name, centerX, 70);
    }

    // === Stage transition message: "Moving to next area" ===
    const phaseProgress = (HYPERSPACE_TOTAL - hyperspaceTimer) / HYPERSPACE_TOTAL;
    // Show centered message during phase 1 (peak warp)
    if (hyperspacePhase === 1) {
        const msgAlpha = Math.min(1, phaseProgress * 2); // fade in
        ctx.save();
        ctx.globalAlpha = msgAlpha;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 10;
        // Pulsing y offset
        const msgY = GAME_HEIGHT * 0.78 + Math.sin(frameCount * 0.08) * 3;
        ctx.fillText('NEXT AREA...', centerX, msgY);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // === Background fade overlay (subtle vignette brightening during warp peak) ===
    if (hyperspacePhase === 1) {
        const fadeAlpha = 0.15 + Math.sin(frameCount * 0.05) * 0.05;
        ctx.fillStyle = 'rgba(180, 220, 255, ' + fadeAlpha + ')';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else if (hyperspacePhase === 2 && phaseProgress > 0.9) {
        // End-of-jump fade to white before new stage starts
        const endFade = (phaseProgress - 0.9) / 0.1;
        ctx.fillStyle = 'rgba(255, 255, 255, ' + endFade * 0.6 + ')';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
}

function generatePlanetSet(planetIndex) {
    planets = [];
    const theme = PLANET_THEMES[planetIndex % PLANET_THEMES.length];
    // Main planet - large, prominent
    planets.push({
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT * 0.72,
        radius: 180 + Math.random() * 40,
        speed: 0,
        distance: 0.1,
        isMainPlanet: true,
        themeIndex: planetIndex % PLANET_THEMES.length,
        craters: 5 + Math.floor(Math.random() * 5),
        phase: Math.random() * Math.PI * 2,
        waveType: 0
    });
    // Small background moons/planets
    for (let p = 0; p < 4; p++) {
        planets.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT * 0.55,
            radius: 10 + Math.random() * 25,
            speed: 0.15 + Math.random() * 0.3,
            distance: 0.3 + Math.random() * 0.4,
            isMainPlanet: false,
            themeIndex: Math.floor(Math.random() * PLANET_THEMES.length),
            craters: 1 + Math.floor(Math.random() * 3),
            phase: Math.random() * Math.PI * 2,
            waveType: Math.floor(Math.random() * 3)
        });
    }
}
function drawMainPlanet() {
    const theme = PLANET_THEMES[currentPlanetIndex % PLANET_THEMES.length];
    // Use first planet as the "main" background planet
    const px = 80;
    const py = 140;
    const pr = 60;

    // Outer atmospheric glow
    const atmoGrad = ctx.createRadialGradient(px, py, pr * 0.9, px, py, pr * 1.8);
    atmoGrad.addColorStop(0, 'rgba(' + theme.glow + ', 0.5)');
    atmoGrad.addColorStop(0.5, 'rgba(' + theme.glow + ', 0.15)');
    atmoGrad.addColorStop(1, 'rgba(' + theme.glow + ', 0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Ring (behind planet) if applicable
    if (theme.hasRing) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-0.3);
        ctx.scale(1, 0.25);
        // Outer ring
        ctx.strokeStyle = theme.ring;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(0, 0, pr * 1.5, 0, Math.PI * 2);
        ctx.stroke();
        // Inner ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, pr * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    // Planet body
    const bodyGrad = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, 0, px, py, pr);
    bodyGrad.addColorStop(0, lightenHex(theme.body, 30));
    bodyGrad.addColorStop(0.7, theme.body);
    bodyGrad.addColorStop(1, darkenHex(theme.body, 40));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();

    // Surface craters/details
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.arc(px + 15, py - 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px - 20, py + 25, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 30, py + 15, 5, 0, Math.PI * 2);
    ctx.fill();
    // Highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(px - 10, py - 20, 12, 0, Math.PI * 2);
    ctx.fill();

    // Ring (in front of planet) if applicable
    if (theme.hasRing) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-0.3);
        // Only draw front half of ring
        ctx.scale(1, 0.25);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, pr * 1.5, Math.PI * 0.05, Math.PI * 0.45);
        ctx.stroke();
        ctx.restore();
    }

    // Moon if applicable
    if (theme.hasMoon) {
        const moonOrbit = 110;
        const moonAngle = frameCount * 0.005;
        const moonX = px + Math.cos(moonAngle) * moonOrbit;
        const moonY = py + Math.sin(moonAngle) * (moonOrbit * 0.5);
        // Moon shadow/glow
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 18);
        moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        moonGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
        ctx.fill();
        // Moon body
        ctx.fillStyle = theme.moonColor;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 8, 0, Math.PI * 2);
        ctx.fill();
        // Moon craters
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(moonX - 2, moonY - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonX + 3, moonY + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBackground() {
    // === 1945 themed sky + clouds + ocean horizon (replaces deep-space backdrop) ===
    // Sky gradient — uses cached gradient when available to avoid per-frame alloc
    if (GRAD_CACHE.bgSkyDusk) {
        ctx.fillStyle = GRAD_CACHE.bgSkyDusk;
    } else {
        const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        grad.addColorStop(0, '#1a3a6b');
        grad.addColorStop(0.55, '#5b8bbf');
        grad.addColorStop(0.78, '#a9c4dc');
        grad.addColorStop(0.82, '#0c2a4a');  // ocean band
        grad.addColorStop(1, '#081f3a');     // deeper ocean
        ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Distant sun glow on the horizon (right side) — cached when available
    if (GRAD_CACHE.sunGlowDusk) {
        ctx.fillStyle = GRAD_CACHE.sunGlowDusk;
    } else {
        const sunGrad = ctx.createRadialGradient(GAME_WIDTH * 0.78, GAME_HEIGHT * 0.74, 0, GAME_WIDTH * 0.78, GAME_HEIGHT * 0.74, 220);
        sunGrad.addColorStop(0, 'rgba(255, 220, 160, 0.55)');
        sunGrad.addColorStop(0.4, 'rgba(255, 180, 120, 0.18)');
        sunGrad.addColorStop(1, 'rgba(255, 180, 120, 0)');
        ctx.fillStyle = sunGrad;
    }
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Drifting cumulus clouds (parallax 0.3) — soft white puffs in the sky
    // PERF: build radial once per cloud (positioned), but cache gradient via offscreen
    for (let i = 0; i < 6; i++) {
        const cx = (i * 180 + frameCount * 0.3 + 60) % (GAME_WIDTH + 240) - 120;
        const cy = 50 + i * 55;
        const cw = 90 + (i % 3) * 20;
        const ch = 22 + (i % 2) * 6;
        // Cache key per (size, type). Reuse if same-size slot exists.
        const ck = 'cum_' + cw;
        let cgrad = GRAD_CACHE[ck];
        if (!cgrad) {
            // Build relative to (0,0), used as a stamp at each cloud position
            cgrad = ctx.createRadialGradient(0, 0, 0, 0, 0, cw);
            cgrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
            cgrad.addColorStop(0.6, 'rgba(230, 235, 245, 0.25)');
            cgrad.addColorStop(1, 'rgba(230, 235, 245, 0)');
            GRAD_CACHE[ck] = cgrad;
        }
        ctx.fillStyle = cgrad;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.ellipse(0, 0, cw, ch, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Mid-distance clouds (parallax 0.6) — cached radial
    if (!GRAD_CACHE.midCloud) {
        const mg = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
        mg.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        mg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        GRAD_CACHE.midCloud = mg;
    }
    for (let i = 0; i < 4; i++) {
        const cx = (i * 260 + frameCount * 0.6 + 100) % (GAME_WIDTH + 200) - 100;
        const cy = 200 + i * 40;
        const cw = 60;
        const ch = 14;
        ctx.fillStyle = GRAD_CACHE.midCloud;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        ctx.ellipse(0, 0, cw, ch, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Ocean horizon line — soft white surf line at the seam
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(0, GAME_HEIGHT * 0.795, GAME_WIDTH, 1);

    // Ocean wave shimmer (slow horizontal scrolling)
    for (let i = 0; i < 5; i++) {
        const wy = GAME_HEIGHT * 0.81 + i * 24;
        const shift = (frameCount * (0.4 + i * 0.15)) % GAME_WIDTH;
        ctx.fillStyle = 'rgba(220, 235, 250, ' + (0.18 - i * 0.025) + ')';
        ctx.beginPath();
        for (let x = -20; x <= GAME_WIDTH + 20; x += 32) {
            const yo = Math.sin((x + shift) * 0.05 + i) * 1.5;
            ctx.rect(x, wy + yo, 16, 1);
        }
        ctx.fill();
    }

    // Small distant contrails — drifting smoke trails from off-screen planes (periodically)
    if (frameCount % 220 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(0, 60 + (frameCount % 3) * 30, GAME_WIDTH, 1);
    }
}

// Helper: hex to rgb string
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return r + ', ' + g + ', ' + b;
}
function lightenHex(hex, amount) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return '#' + [r, g, b].map(v => Math.floor(v).toString(16).padStart(2, '0')).join('');
}
function darkenHex(hex, amount) {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return '#' + [r, g, b].map(v => Math.floor(v).toString(16).padStart(2, '0')).join('');
}
function drawPlayer() {
    const px = player.x;
    const py = player.y;

    // Engine flame (animated, behind ship) — propeller-style dual exhaust
    if (player.visible) {
        const flameLen = 12 + Math.sin(frameCount * 0.6) * 3;
        const flameWobble = Math.sin(frameCount * 0.8) * 1.5;
        // Outer flame
        ctx.fillStyle = '#FF3300';
        ctx.beginPath();
        ctx.moveTo(px - 4, py + 16);
        ctx.lineTo(px - 2 + flameWobble, py + 16 + flameLen * 0.6);
        ctx.lineTo(px + 2 + flameWobble, py + 16 + flameLen * 0.6);
        ctx.lineTo(px + 4, py + 16);
        ctx.closePath();
        ctx.fill();
        // Middle flame
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath();
        ctx.moveTo(px - 2.5, py + 16);
        ctx.lineTo(px - 0.5 + flameWobble * 0.6, py + 16 + flameLen * 0.45);
        ctx.lineTo(px + 0.5 + flameWobble * 0.6, py + 16 + flameLen * 0.45);
        ctx.lineTo(px + 2.5, py + 16);
        ctx.closePath();
        ctx.fill();
        // Inner white-hot
        ctx.fillStyle = '#FFFFCC';
        ctx.beginPath();
        ctx.moveTo(px - 1.2, py + 16);
        ctx.lineTo(px + flameWobble * 0.4, py + 16 + flameLen * 0.3);
        ctx.lineTo(px + flameWobble * 0.4, py + 16 + flameLen * 0.3);
        ctx.lineTo(px + 1.2, py + 16);
        ctx.closePath();
        ctx.fill();
    }

    ctx.save();
    // Soft shadow under the plane
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(px + 1, py + 2, 10, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // === Wide low main wings (P-40 trapezoidal silhouette) ===
    // PERF: cached gradient (color stops only — orientation is vertical, so the
    // gradient is identical regardless of px/py).
    ctx.fillStyle = GRAD_CACHE.playerWing;
    // Left wing
    ctx.beginPath();
    ctx.moveTo(px - 6, py - 1);
    ctx.lineTo(px - 24, py - 2);
    ctx.lineTo(px - 26, py + 2);
    ctx.lineTo(px - 24, py + 8);
    ctx.lineTo(px - 6, py + 4);
    ctx.closePath();
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.moveTo(px + 6, py - 1);
    ctx.lineTo(px + 24, py - 2);
    ctx.lineTo(px + 26, py + 2);
    ctx.lineTo(px + 24, py + 8);
    ctx.lineTo(px + 6, py + 4);
    ctx.closePath();
    ctx.fill();

    // Wing leading-edge highlight (lighter strip near fuselage)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(px - 24, py, 18, 1);
    ctx.fillRect(px + 6, py, 18, 1);

    // === Fuselage (long oval, blue-grey P-40 camo top, olive underside) ===
    const bodyGrad = ctx.createLinearGradient(px, py - 24, px, py + 18);
    bodyGrad.addColorStop(0, '#3D6F9E');
    bodyGrad.addColorStop(0.5, '#1E4A7A');
    bodyGrad.addColorStop(0.85, '#3A4D2A');  // olive underside
    bodyGrad.addColorStop(1, '#2A3A20');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(px, py - 24);          // nose tip
    ctx.lineTo(px + 4, py - 14);      // right cowling
    ctx.lineTo(px + 5, py - 2);       // right shoulder
    ctx.lineTo(px + 4, py + 12);      // right rear fuselage
    ctx.lineTo(px + 3, py + 18);      // tail right
    ctx.lineTo(px - 3, py + 18);      // tail left
    ctx.lineTo(px - 4, py + 12);      // left rear fuselage
    ctx.lineTo(px - 5, py - 2);       // left shoulder
    ctx.lineTo(px - 4, py - 14);      // left cowling
    ctx.closePath();
    ctx.fill();

    // Olive panel break line (camo division)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(px - 4, py + 6, 8, 1);

    // === Cowling (P-40 distinctive nose with chin radiator scoop) ===
    ctx.fillStyle = '#0E2A48';
    ctx.beginPath();
    ctx.moveTo(px, py - 24);
    ctx.lineTo(px + 4, py - 14);
    ctx.lineTo(px + 3, py - 8);
    ctx.lineTo(px - 3, py - 8);
    ctx.lineTo(px - 4, py - 14);
    ctx.closePath();
    ctx.fill();
    // Radiator intake (chin scoop)
    ctx.fillStyle = '#0A1A2E';
    ctx.fillRect(px - 1.5, py - 4, 3, 4);

    // === Spinning propeller (animated) ===
    const propAngle = frameCount * 0.8;
    ctx.save();
    ctx.translate(px, py - 20);
    ctx.rotate(propAngle);
    ctx.strokeStyle = 'rgba(255, 240, 220, 0.7)';
    ctx.lineWidth = 1.2;
    // 2 blades
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.stroke();
    // Propeller hub
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // === Horizontal stabilizer (rear wings) ===
    ctx.fillStyle = '#1E4A7A';
    ctx.beginPath();
    ctx.moveTo(px - 10, py + 12);
    ctx.lineTo(px - 4, py + 10);
    ctx.lineTo(px - 3, py + 18);
    ctx.lineTo(px - 12, py + 16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + 10, py + 12);
    ctx.lineTo(px + 4, py + 10);
    ctx.lineTo(px + 3, py + 18);
    ctx.lineTo(px + 12, py + 16);
    ctx.closePath();
    ctx.fill();

    // === Vertical stabilizer / rudder ===
    ctx.fillStyle = '#1E4A7A';
    ctx.beginPath();
    ctx.moveTo(px - 2, py + 12);
    ctx.lineTo(px + 2, py + 12);
    ctx.lineTo(px + 1.5, py + 18);
    ctx.lineTo(px - 1.5, py + 18);
    ctx.closePath();
    ctx.fill();
    // Red rudder stripe (Flying Tigers tail marking)
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(px - 1, py + 13, 2, 4);

    // === Red roundel on wing tops (Flying Tigers insignia) ===
    // Outer white ring + red center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(px - 18, py + 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 18, py + 3, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#CC0000';
    ctx.beginPath();
    ctx.arc(px - 18, py + 3, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 18, py + 3, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // === Bubble canopy (P-40 framed greenhouse style) ===
    const canopyGrad = ctx.createLinearGradient(px, py - 14, px, py - 2);
    canopyGrad.addColorStop(0, '#9FD8E8');
    canopyGrad.addColorStop(0.5, '#3D7AAB');
    canopyGrad.addColorStop(1, '#1A3550');
    ctx.fillStyle = canopyGrad;
    ctx.beginPath();
    ctx.moveTo(px, py - 14);
    ctx.lineTo(px + 5, py - 8);
    ctx.lineTo(px + 4, py - 2);
    ctx.lineTo(px - 4, py - 2);
    ctx.lineTo(px - 5, py - 8);
    ctx.closePath();
    ctx.fill();
    // Canopy frame
    ctx.strokeStyle = '#0A1A2E';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(px, py - 14);
    ctx.lineTo(px + 5, py - 8);
    ctx.lineTo(px + 4, py - 2);
    ctx.lineTo(px - 4, py - 2);
    ctx.lineTo(px - 5, py - 8);
    ctx.closePath();
    ctx.stroke();
    // Canopy highlight (glass reflection)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(px - 2, py - 12);
    ctx.lineTo(px - 3, py - 6);
    ctx.lineTo(px - 1, py - 6);
    ctx.lineTo(px - 1, py - 12);
    ctx.closePath();
    ctx.fill();
    // Pilot head silhouette in canopy
    ctx.fillStyle = 'rgba(20, 20, 30, 0.6)';
    ctx.beginPath();
    ctx.arc(px - 0.5, py - 6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Fuselage outline (subtle dark stroke)
    ctx.strokeStyle = '#0A1A2E';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(px, py - 24);
    ctx.lineTo(px + 4, py - 14);
    ctx.lineTo(px + 5, py - 2);
    ctx.lineTo(px + 4, py + 12);
    ctx.lineTo(px + 3, py + 18);
    ctx.lineTo(px - 3, py + 18);
    ctx.lineTo(px - 4, py + 12);
    ctx.lineTo(px - 5, py - 2);
    ctx.lineTo(px - 4, py - 14);
    ctx.closePath();
    ctx.stroke();

    // Wing outlines
    ctx.beginPath();
    ctx.moveTo(px - 6, py - 1);
    ctx.lineTo(px - 24, py - 2);
    ctx.lineTo(px - 26, py + 2);
    ctx.lineTo(px - 24, py + 8);
    ctx.lineTo(px - 6, py + 4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px + 6, py - 1);
    ctx.lineTo(px + 24, py - 2);
    ctx.lineTo(px + 26, py + 2);
    ctx.lineTo(px + 24, py + 8);
    ctx.lineTo(px + 6, py + 4);
    ctx.closePath();
    ctx.stroke();

    // === Wing-mounted machine guns (under each wing) ===
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(px - 22, py + 5, 5, 1.5);
    ctx.fillRect(px + 17, py + 5, 5, 1.5);
    // Muzzle tip highlight
    ctx.fillStyle = '#666666';
    ctx.fillRect(px - 22, py + 5, 1, 1.5);
    ctx.fillRect(px + 21, py + 5, 1, 1.5);

    // === Landing gear stub (retracted) ===
    ctx.fillStyle = '#0A1A2E';
    ctx.fillRect(px - 3, py + 10, 1.5, 2);
    ctx.fillRect(px + 1.5, py + 10, 1.5, 2);

    // Shield effect
    if (player.shieldActive) {
        ctx.strokeStyle = 'rgba(0, 220, 255, ' + (0.5 + 0.3 * Math.sin(frameCount * 0.2)) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(120, 240, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 30, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();

    // V-power shield (silver)
    if (player.vPowerActive) {
        ctx.save();
        ctx.strokeStyle = 'rgba(220, 220, 240, ' + (0.4 + 0.4 * Math.sin(frameCount * 0.3)) + ')';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, 32, 0, Math.PI * 2);
        ctx.stroke();
        // Hexagon overlay
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        for (let a = 0; a < 6; a++) {
            const ang = a * Math.PI / 3;
            const hx = px + Math.cos(ang) * 32;
            const hy = py + Math.sin(ang) * 32;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(hx, hy);
            ctx.stroke();
        }
        ctx.restore();
    }

    // P-ultimate shield flash
    if (pUltimateActive && pUltimateAlpha > 0) {
        ctx.fillStyle = 'rgba(0, 200, 255, ' + (pUltimateAlpha * 0.3) + ')';
        ctx.beginPath();
        ctx.arc(px, py, 50, 0, Math.PI * 2);
        ctx.fill();
    }

    // Invincibility blink
    if (player.invincible && Math.floor(frameCount / 4) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(px, py, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    // Sparkle flash on weapon upgrade
    if (sparkleFlashActive && sparkleFlashTimer > 0) {
        for (let s = 0; s < 8; s++) {
            const sa = s * Math.PI / 4 + frameCount * 0.1;
            const sr = 25 + Math.sin(frameCount * 0.2 + s) * 5;
            const sx2 = px + Math.cos(sa) * sr;
            const sy2 = py + Math.sin(sa) * sr;
            ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
            ctx.beginPath();
            ctx.arc(sx2, sy2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
    
    function drawOctopusTentacles() {
        for (let ti = 0; ti < octopusTentacles.length; ti++) {
            const tentacle = octopusTentacles[ti];
            if (!tentacle.active || tentacle.length <= 0) continue;
            const startX = tentacle.x;
            const startY = tentacle.y;
            const endY = startY + tentacle.length;
            ctx.save();
            // Sucker bumps along tentacle
            const segs = 8;
            const waveAmp = 12 * (tentacle.length / tentacle.maxLength);
            // Outer glow
            ctx.strokeStyle = 'rgba(180, 100, 220, 0.3)';
            ctx.lineWidth = 10;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            for (let seg = 0; seg <= segs; seg++) {
                const t = seg / segs;
                const segY = startY + t * tentacle.length;
                const segX = startX + Math.sin(t * Math.PI * 3 + frameCount * 0.1) * waveAmp;
                ctx.lineTo(segX, segY);
            }
            ctx.stroke();
            // Main tentacle body
            ctx.strokeStyle = '#AA44DD';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            for (let seg = 0; seg <= segs; seg++) {
                const t = seg / segs;
                const segY = startY + t * tentacle.length;
                const segX = startX + Math.sin(t * Math.PI * 3 + frameCount * 0.1) * waveAmp;
                ctx.lineTo(segX, segY);
            }
            ctx.stroke();
            // Suckers
            for (let seg = 1; seg < segs; seg++) {
                const t = seg / segs;
                const segY = startY + t * tentacle.length;
                const segX = startX + Math.sin(t * Math.PI * 3 + frameCount * 0.1) * waveAmp;
                ctx.fillStyle = '#FFCCFF';
                ctx.beginPath();
                ctx.arc(segX, segY, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
            // Tip with spike
            const tipX = startX + Math.sin(Math.PI * 3 + frameCount * 0.1) * waveAmp;
            const tipY = endY;
            ctx.fillStyle = '#FF00FF';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFAAFF';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    function drawBossClaw() {
        for (let ci = 0; ci < bossClaws.length; ci++) {
            const claw = bossClaws[ci];
            if (!claw) continue;
            ctx.save();
            // Chain segments
            const segs = 5;
            for (let s = 0; s < segs; s++) {
                const t1 = s / segs;
                const t2 = (s + 1) / segs;
                const x1 = claw.x - 20 + Math.sin(t1 * Math.PI) * 10;
                const y1 = claw.y - claw.length * t1;
                const x2 = claw.x - 20 + Math.sin(t2 * Math.PI) * 10;
                const y2 = claw.y - claw.length * t2;
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
            // Claw body
            const clawGrad = ctx.createLinearGradient(claw.x - 8, claw.y - 8, claw.x + 8, claw.y + 8);
            clawGrad.addColorStop(0, '#888888');
            clawGrad.addColorStop(0.5, '#555555');
            clawGrad.addColorStop(1, '#222222');
            ctx.fillStyle = clawGrad;
            ctx.beginPath();
            ctx.arc(claw.x, claw.y, 8, 0, Math.PI * 2);
            ctx.fill();
            // Claw blades
            ctx.strokeStyle = '#FF2200';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(claw.x, claw.y - 5);
            ctx.lineTo(claw.x - 6, claw.y - 14);
            ctx.moveTo(claw.x, claw.y - 5);
            ctx.lineTo(claw.x + 6, claw.y - 14);
            ctx.stroke();
            // Outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(claw.x, claw.y, 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
    
    function drawEnemy() {
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e) continue;

            ctx.save();

            // === Dying enemies fade out + shrink as they drift toward screen edge ===
            // (bosses/mid-bosses only — no random fades on live enemies)
            // Effect: silhouette blurs (alpha drops) AND shrinks (scale decreases)
            // from the moment dying begins, so the body visibly "fades into the
            // distance" before it reaches the floor — eliminates the lingering
            // crisp silhouette during the falling phase.
            if (e.dying && (e.isMidBoss || e.isWaveBoss)) {
                // --- Time-based fade (works for any dying boss) ---
                // 0..~240 frames. Start fading very early (around 10% in) so the
                // fuselage loses crispness quickly, fully gone by ~95%.
                let alpha = 1;
                let scale = 1;
                if (typeof e.dyingTimer === 'number' && e.dyingTimer > 0) {
                    // Total dying window: 240 frames (matches Phase B _timeCap)
                    const totalFrames = 240;
                    const tFade = Math.max(0, Math.min(1, (e.dyingTimer - 25) / (totalFrames - 25)));
                    // Ease-in fade so the first frames still feel solid, then it
                    // softens and dissolves.
                    const tEase = tFade * tFade;
                    alpha = Math.min(alpha, 1 - tEase);
                    // Also shrink: scale goes 1.0 → 0.55 over the same window
                    scale = Math.max(0.55, 1 - tFade * 0.45);
                }

                // --- Edge-based fade (faster near the corner) ---
                if (e._dyingDriftLeft !== undefined) {
                    const edgeX = e._dyingDriftLeft ? 0 : GAME_WIDTH;
                    const distX = Math.abs(e.x - edgeX) / (GAME_WIDTH / 2);
                    const distY = (GAME_HEIGHT - e.y) / GAME_HEIGHT;
                    const progress = 1 - Math.min(1, Math.max(distX, 1 - distY));
                    // Start fading earlier than before (5% in) so the silhouette
                    // softens well before it reaches the floor.
                    let fadeT = Math.max(0, Math.min(1, (progress - 0.05) / 0.95));
                    const edgeAlpha = 1 - fadeT * fadeT;
                    alpha = Math.min(alpha, edgeAlpha);
                }

                if (alpha < 1) ctx.globalAlpha = Math.max(0, alpha);

                // Apply scale around the body center so it visibly recedes.
                if (scale < 1) {
                    ctx.translate(e.x, e.y);
                    ctx.scale(scale, scale);
                    ctx.translate(-e.x, -e.y);
                }
            }

            if (e.type === 'scout') {
                // Small agile scout (red/green)
                drawScoutEnemy(e);
            } else if (e.type === 'fighter') {
                // Heavier fighter (red body, dark wings)
                drawFighterEnemy(e);
            } else if (e.type === 'bomber') {
                // Large slow bomber (gray, wide wings)
                drawBomberEnemy(e);
            } else if (e.type === 'heavyBomber') {
                // Heavy bomber mid-boss (unified for all stages - long bomber silhouette)
                drawHeavyBomber(e);
            } else if (e.type === 'final' || e.type === 'boss') {
                // Stage final boss (B-52 inspired bomber, draw in drawFinalBoss)
                if (e.dying && e.angle) {
                    // Apply drift tilt so the broken fuselage visibly leans as it falls
                    ctx.translate(e.x, e.y);
                    ctx.rotate(e.angle);
                    ctx.translate(-e.x, -e.y);
                }
                drawFinalBoss(e);
            } else if (e.type === 'waveBoss' || e.type === 'wave_boss') {
                drawWaveBoss(e);
            } else {
                // Default fallback
                drawScoutEnemy(e);
            }

            ctx.restore();
        }
    }

    // === Detached boss wing debris — broken wings falling independently ===
    function drawBossWingDebris() {
        for (let wi = 0; wi < bossWingDebris.length; wi++) {
            const w = bossWingDebris[wi];
            if (!w) continue;
            ctx.save();
            ctx.translate(w.x, w.y);
            ctx.rotate(w.angle);
            const sw = w.size;     // half-width of wing
            const sh = 14;        // half-height of wing slab

            // Wing slab — dark metallic color, slightly brighter edge if burning
            ctx.fillStyle = '#3A3A3A';
            ctx.strokeStyle = '#0A0A0A';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            if (w.side === 'left') {
                // Wing tip extends to the LEFT
                ctx.moveTo(0, -sh * 0.6);          // root top
                ctx.lineTo(-sw, -sh);               // tip top
                ctx.lineTo(-sw * 0.95, sh * 0.7);   // tip bottom
                ctx.lineTo(0, sh * 0.6);            // root bottom
            } else {
                // Wing tip extends to the RIGHT
                ctx.moveTo(0, -sh * 0.6);
                ctx.lineTo(sw, -sh);
                ctx.lineTo(sw * 0.95, sh * 0.7);
                ctx.lineTo(0, sh * 0.6);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Engine pod near root
            ctx.fillStyle = '#1A1A1A';
            if (w.side === 'left') {
                ctx.beginPath();
                ctx.ellipse(-sw * 0.35, 0, 5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // Exhaust glow
                ctx.fillStyle = '#FF6600';
                ctx.beginPath();
                ctx.ellipse(-sw * 0.35, sh * 0.45, 3, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.ellipse(sw * 0.35, 0, 5, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#FF6600';
                ctx.beginPath();
                ctx.ellipse(sw * 0.35, sh * 0.45, 3, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Wing leading-edge highlight
            ctx.strokeStyle = '#A8B0B8';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            if (w.side === 'left') {
                ctx.moveTo(0, -sh * 0.6);
                ctx.lineTo(-sw, -sh);
            } else {
                ctx.moveTo(0, -sh * 0.6);
                ctx.lineTo(sw, -sh);
            }
            ctx.stroke();

            // Burning red flash as the wing dies (life fades)
            const lifeRatio = Math.max(0, w.life / 240);
            // === Wings fade out naturally as their life drains — no 2nd explosion needed ===
            // Start fading at 60% life, fully gone at 10% life
            let wingAlpha = 1;
            if (lifeRatio < 0.6) {
                wingAlpha = (lifeRatio - 0.1) / 0.5;
                if (wingAlpha < 0) wingAlpha = 0;
                if (wingAlpha > 1) wingAlpha = 1;
                ctx.globalAlpha = wingAlpha;
            }
            if (lifeRatio < 0.6) {
                ctx.fillStyle = 'rgba(255, 80, 20, ' + (1 - lifeRatio) * 0.4 + ')';
                ctx.beginPath();
                if (w.side === 'left') {
                    ctx.ellipse(-sw * 0.5, 0, sw * 0.7, sh * 1.2, 0, 0, Math.PI * 2);
                } else {
                    ctx.ellipse(sw * 0.5, 0, sw * 0.7, sh * 1.2, 0, 0, Math.PI * 2);
                }
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // ===== SCOUT: small red plane =====
    function drawScoutEnemy(e) {
        const ex = e.x, ey = e.y;
        // Wing wobble animation
        const wobble = Math.sin(frameCount * 0.15 + e.x) * 1.5;
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(ex + 1, ey + 2, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wings (dark red)
        ctx.fillStyle = '#882222';
        ctx.beginPath();
        ctx.moveTo(ex - 4, ey - 4 + wobble);
        ctx.lineTo(ex - 16, ey - 1);
        ctx.lineTo(ex - 18, ey + 2);
        ctx.lineTo(ex - 4, ey + 3);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex + 4, ey - 4 + wobble);
        ctx.lineTo(ex + 16, ey - 1);
        ctx.lineTo(ex + 18, ey + 2);
        ctx.lineTo(ex + 4, ey + 3);
        ctx.closePath();
        ctx.fill();
        // Body (red) — PERF: cached gradient (same color stops regardless of position)
        ctx.fillStyle = GRAD_CACHE.scoutBody;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 12);
        ctx.lineTo(ex + 4, ey - 4 + wobble);
        ctx.lineTo(ex + 4, ey + 6);
        ctx.lineTo(ex - 4, ey + 6);
        ctx.lineTo(ex - 4, ey - 4 + wobble);
        ctx.closePath();
        ctx.fill();
        // Cockpit
        ctx.fillStyle = '#FFCC44';
        ctx.beginPath();
        ctx.ellipse(ex, ey - 4 + wobble, 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Outline
        ctx.strokeStyle = '#330000';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Hit flash
        if (e.hitFlash && e.hitFlash > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (e.hitFlash * 0.5) + ')';
            ctx.beginPath();
            ctx.ellipse(ex, ey, 14, 10, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ===== FIGHTER: heavier combat plane =====
    function drawFighterEnemy(e) {
        const ex = e.x, ey = e.y;
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(ex + 1, ey + 2, 12, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Main wings — PERF: cached gradient
        ctx.fillStyle = GRAD_CACHE.scoutWing;
        ctx.beginPath();
        ctx.moveTo(ex - 6, ey - 2);
        ctx.lineTo(ex - 20, ey);
        ctx.lineTo(ex - 22, ey + 6);
        ctx.lineTo(ex - 6, ey + 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex + 6, ey - 2);
        ctx.lineTo(ex + 20, ey);
        ctx.lineTo(ex + 22, ey + 6);
        ctx.lineTo(ex + 6, ey + 8);
        ctx.closePath();
        ctx.fill();
        // Body (red) — PERF: cached gradient
        ctx.fillStyle = GRAD_CACHE.scoutBody;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 16);
        ctx.lineTo(ex + 5, ey - 6);
        ctx.lineTo(ex + 6, ey + 10);
        ctx.lineTo(ex - 6, ey + 10);
        ctx.lineTo(ex - 5, ey - 6);
        ctx.closePath();
        ctx.fill();
        // Tail
        ctx.fillStyle = '#882222';
        ctx.beginPath();
        ctx.moveTo(ex - 5, ey + 6);
        ctx.lineTo(ex - 8, ey + 14);
        ctx.lineTo(ex - 3, ey + 14);
        ctx.lineTo(ex, ey + 8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex + 5, ey + 6);
        ctx.lineTo(ex + 8, ey + 14);
        ctx.lineTo(ex + 3, ey + 14);
        ctx.lineTo(ex, ey + 8);
        ctx.closePath();
        ctx.fill();
        // Cockpit
        ctx.fillStyle = '#FFFF99';
        ctx.beginPath();
        ctx.ellipse(ex, ey - 4, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wing tip lights
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(ex - 18, ey + 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00FF00';
        ctx.beginPath();
        ctx.arc(ex + 18, ey + 3, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Outline
        ctx.strokeStyle = '#220000';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 16);
        ctx.lineTo(ex + 5, ey - 6);
        ctx.lineTo(ex + 6, ey + 10);
        ctx.lineTo(ex - 6, ey + 10);
        ctx.lineTo(ex - 5, ey - 6);
        ctx.closePath();
        ctx.stroke();
        // Hit flash
        if (e.hitFlash && e.hitFlash > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (e.hitFlash * 0.6) + ')';
            ctx.beginPath();
            ctx.ellipse(ex, ey, 18, 14, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ===== BOMBER: large slow plane =====
    function drawBomberEnemy(e) {
        const ex = e.x, ey = e.y;
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(ex + 2, ey + 3, 18, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        // Big wings — PERF: cached gradient
        ctx.fillStyle = GRAD_CACHE.heavyWing;
        ctx.beginPath();
        ctx.moveTo(ex - 8, ey - 4);
        ctx.lineTo(ex - 28, ey - 2);
        ctx.lineTo(ex - 30, ey + 8);
        ctx.lineTo(ex - 8, ey + 10);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex + 8, ey - 4);
        ctx.lineTo(ex + 28, ey - 2);
        ctx.lineTo(ex + 30, ey + 8);
        ctx.lineTo(ex + 8, ey + 10);
        ctx.closePath();
        ctx.fill();
        // Tail wings
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.moveTo(ex - 8, ey + 8);
        ctx.lineTo(ex - 18, ey + 16);
        ctx.lineTo(ex - 6, ey + 18);
        ctx.lineTo(ex, ey + 12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex + 8, ey + 8);
        ctx.lineTo(ex + 18, ey + 16);
        ctx.lineTo(ex + 6, ey + 18);
        ctx.lineTo(ex, ey + 12);
        ctx.closePath();
        ctx.fill();
        // Body (gray) — PERF: cached gradient
        ctx.fillStyle = GRAD_CACHE.heavyBody;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 20);
        ctx.lineTo(ex + 7, ey - 8);
        ctx.lineTo(ex + 8, ey + 12);
        ctx.lineTo(ex - 8, ey + 12);
        ctx.lineTo(ex - 7, ey - 8);
        ctx.closePath();
        ctx.fill();
        // Cockpit
        ctx.fillStyle = '#FFDD44';
        ctx.beginPath();
        ctx.ellipse(ex, ey - 6, 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Bomb symbols (yellow triangles under wings)
        ctx.fillStyle = '#FFCC00';
        for (let bx = -22; bx <= 22; bx += 22) {
            ctx.beginPath();
            ctx.moveTo(ex + bx - 2, ey + 10);
            ctx.lineTo(ex + bx + 2, ey + 10);
            ctx.lineTo(ex + bx, ey + 13);
            ctx.closePath();
            ctx.fill();
        }
        // Engine glow
        for (let eng = -1; eng <= 1; eng += 2) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(ex + eng * 5, ey + 14, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // Outline
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 20);
        ctx.lineTo(ex + 7, ey - 8);
        ctx.lineTo(ex + 8, ey + 12);
        ctx.lineTo(ex - 8, ey + 12);
        ctx.lineTo(ex - 7, ey - 8);
        ctx.closePath();
        ctx.stroke();
        // Hit flash
        if (e.hitFlash && e.hitFlash > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (e.hitFlash * 0.6) + ')';
            ctx.beginPath();
            ctx.ellipse(ex, ey, 26, 18, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ===== HEART BOSS: pink heart-shape with eyes =====
    // Stage 1 mid-boss: large, long 4-engine heavy bomber (Flying Tigers-era)
    function drawHeartBoss(e) {
        const ex = e.x, ey = e.y;
        const hit = e.hitFlash && e.hitFlash > 0;
        const pulse = 1 + Math.sin(frameCount * 0.08) * 0.03;

        // Outer shadow (under bomber body)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(ex + 6, ey + 18, 70 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glow halo
        const glowGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 90 * pulse);
        glowGrad.addColorStop(0, 'rgba(180, 200, 220, 0.18)');
        glowGrad.addColorStop(1, 'rgba(180, 200, 220, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(ex, ey, 90 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(ex, ey);
        // Banking on horizontal drift
        const bank = Math.sin((e._movePhase || 0) * 1.2) * 0.12;
        ctx.rotate(bank);

        // Dimensions: long horizontal bomber ~ 140 wide, 50 tall
        const W = 70;  // half-width
        const H = 22;  // half-height of fuselage
        const bodyColor = hit ? '#FF8866' : '#5A6470';
        const bellyColor = hit ? '#FFAA88' : '#7A8490';
        const wingEdge = hit ? '#FF6644' : '#3A4450';

        // ===== Wings (rear layer) =====
        ctx.fillStyle = wingEdge;
        ctx.beginPath();
        ctx.moveTo(-W, -2);
        ctx.lineTo(-W - 8, H + 4);
        ctx.lineTo(-18, H + 4);
        ctx.lineTo(-12, -2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(W, -2);
        ctx.lineTo(W + 8, H + 4);
        ctx.lineTo(18, H + 4);
        ctx.lineTo(12, -2);
        ctx.closePath();
        ctx.fill();

        // ===== Wing top surface =====
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-W + 4, -6);
        ctx.lineTo(-W - 4, H + 2);
        ctx.lineTo(-12, H + 2);
        ctx.lineTo(-8, -6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(W - 4, -6);
        ctx.lineTo(W + 4, H + 2);
        ctx.lineTo(12, H + 2);
        ctx.lineTo(8, -6);
        ctx.closePath();
        ctx.fill();

        // ===== Wing roundels (red dot, white outline) =====
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(-W * 0.62, -1, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc( W * 0.62, -1, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#CC2233';
        ctx.beginPath(); ctx.arc(-W * 0.62, -1, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc( W * 0.62, -1, 2.6, 0, Math.PI * 2); ctx.fill();

        // ===== Fuselage =====
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.moveTo(-W + 6, -H * 0.6);
        ctx.lineTo(-W + 14, -H);
        ctx.lineTo( W - 14, -H);
        ctx.lineTo( W - 6, -H * 0.6);
        ctx.lineTo( W - 6,  H * 0.6);
        ctx.lineTo( W - 14,  H);
        ctx.lineTo(-W + 14,  H);
        ctx.lineTo(-W + 6,  H * 0.6);
        ctx.closePath();
        ctx.fill();

        // Belly highlight
        ctx.fillStyle = bellyColor;
        ctx.beginPath();
        ctx.moveTo(-W + 12,  H * 0.2);
        ctx.lineTo(-W + 18,  H * 0.85);
        ctx.lineTo( W - 18,  H * 0.85);
        ctx.lineTo( W - 12,  H * 0.2);
        ctx.closePath();
        ctx.fill();

        // ===== Nose =====
        ctx.fillStyle = wingEdge;
        ctx.beginPath();
        ctx.moveTo(W - 14, -H * 0.55);
        ctx.lineTo(W + 6, 0);
        ctx.lineTo(W - 14,  H * 0.55);
        ctx.closePath();
        ctx.fill();

        // ===== Tail =====
        ctx.fillStyle = wingEdge;
        ctx.beginPath();
        ctx.moveTo(-W + 6, -H * 0.5);
        ctx.lineTo(-W - 4, -H * 1.4);
        ctx.lineTo(-W + 16, -H * 1.4);
        ctx.lineTo(-W + 10, -H * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-W + 6,  H * 0.5);
        ctx.lineTo(-W - 4,  H * 1.4);
        ctx.lineTo(-W + 16,  H * 1.4);
        ctx.lineTo(-W + 10,  H * 0.5);
        ctx.closePath();
        ctx.fill();

        // Tail rudder stripe (Flying Tigers accent)
        ctx.fillStyle = '#CC2233';
        ctx.fillRect(-W - 2, -H * 1.35, 3, H * 0.3);
        ctx.fillRect(-W - 2,  H * 1.05, 3, H * 0.3);

        // ===== Cockpit canopy (cyan glass) — PERF: cached gradient =====
        ctx.fillStyle = GRAD_CACHE.heavyCanopy;
        ctx.beginPath();
        ctx.moveTo(W * 0.18, -H * 0.55);
        ctx.lineTo(W * 0.55, -H * 0.85);
        ctx.lineTo(W * 0.78, -H * 0.55);
        ctx.lineTo(W * 0.55, -H * 0.30);
        ctx.closePath();
        ctx.fill();
        // Canopy frame
        ctx.strokeStyle = '#222831';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(W * 0.18, -H * 0.55);
        ctx.lineTo(W * 0.55, -H * 0.85);
        ctx.lineTo(W * 0.78, -H * 0.55);
        ctx.lineTo(W * 0.55, -H * 0.30);
        ctx.closePath();
        ctx.stroke();
        // Pilot silhouette
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath();
        ctx.ellipse(W * 0.55, -H * 0.55, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // ===== 4 engines under wings =====
        // Inner engines
        ctx.fillStyle = '#3A4450';
        ctx.fillRect(-W * 0.45 - 4, H + 4, 8, 6);
        ctx.fillRect( W * 0.45 - 4, H + 4, 8, 6);
        // Outer engines
        ctx.fillStyle = '#3A4450';
        ctx.fillRect(-W * 0.85 - 4, H + 4, 8, 6);
        ctx.fillRect( W * 0.85 - 4, H + 4, 8, 6);
        // Engine cowling rings
        ctx.fillStyle = '#1A1F26';
        [-0.85, -0.45, 0.45, 0.85].forEach(rx => {
            ctx.beginPath();
            ctx.arc(W * rx, H + 5, 2.2, 0, Math.PI * 2);
            ctx.fill();
        });

        // ===== Spinning propellers (4) =====
        const propAngle = frameCount * 0.6;
        [-0.85, -0.45, 0.45, 0.85].forEach(rx => {
            ctx.save();
            ctx.translate(W * rx, H + 4);
            ctx.rotate(propAngle + rx * 0.7);
            ctx.fillStyle = 'rgba(220, 230, 240, 0.55)';
            ctx.fillRect(-7, -0.8, 14, 1.6);
            ctx.fillStyle = '#FFD24A';
            ctx.beginPath();
            ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // ===== Bomb bay doors (under fuselage) =====
        ctx.fillStyle = '#1A1F26';
        ctx.fillRect(-12, H - 1, 24, 4);
        ctx.fillStyle = '#FFAA22';
        for (let i = -10; i <= 10; i += 5) {
            ctx.beginPath();
            ctx.arc(i, H + 1, 1.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // ===== Dorsal machine-gun turret =====
        ctx.fillStyle = '#3A4450';
        ctx.fillRect(-W * 0.30, -H - 4, 8, 4);
        ctx.fillRect(-W * 0.28, -H - 7, 4, 4);
        // Gun barrels
        ctx.strokeStyle = '#1A1F26';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-W * 0.28, -H - 7);
        ctx.lineTo(-W * 0.28, -H - 12);
        ctx.moveTo(-W * 0.24, -H - 7);
        ctx.lineTo(-W * 0.24, -H - 12);
        ctx.stroke();

        // ===== Wing-tip navigation lights =====
        ctx.fillStyle = '#FF3333';
        ctx.beginPath();
        ctx.arc(-W - 5, 0, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#33FF55';
        ctx.beginPath();
        ctx.arc(W + 5, 0, 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // ===== HP bar (large, above bomber) =====
        if (e.hp !== undefined && e.maxHp !== undefined) {
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            const bw = 90;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(ex - bw / 2 - 1, ey - 36, bw + 2, 7);
            ctx.fillStyle = hpRatio > 0.5 ? '#00FF44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
            ctx.fillRect(ex - bw / 2, ey - 35, bw * hpRatio, 5);
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(ex - bw / 2 - 1, ey - 36, bw + 2, 7);
        }
    }

    // ===== HEAVY BOMBER: large 2-engine bomber (replaces octopus) =====
    function drawHeavyBomber(e) {
        const ex = e.x, ey = e.y;
        const w = e.width || 70;
        const h = e.height || 50;
        const isDying = !!e.dying;
        const wingsBroken = isDying && (e.dyingTimer || 0) >= 1;
        ctx.save();
        ctx.translate(ex, ey);
        // Slight banking based on horizontal velocity (or use drift tilt when dying)
        const bankAngle = isDying
            ? (e.angle || 0)
            : Math.sin((e._movePhase || 0) * 1.2) * 0.15;
        ctx.rotate(bankAngle);

        // Outer shadow under body
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 4, w * 0.55, h * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // === Main fuselage (large, gray-olive bomber) ===
        const fuseGrad = ctx.createLinearGradient(-w * 0.4, -h * 0.5, w * 0.4, h * 0.5);
        fuseGrad.addColorStop(0, '#6B6B5A');
        fuseGrad.addColorStop(0.5, '#4A4A3A');
        fuseGrad.addColorStop(1, '#2A2A1A');
        ctx.fillStyle = fuseGrad;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.55); // nose
        ctx.lineTo(w * 0.18, -h * 0.2);
        ctx.lineTo(w * 0.22, h * 0.3);
        ctx.lineTo(w * 0.1, h * 0.5);
        ctx.lineTo(-w * 0.1, h * 0.5);
        ctx.lineTo(-w * 0.22, h * 0.3);
        ctx.lineTo(-w * 0.18, -h * 0.2);
        ctx.closePath();
        ctx.fill();
        // Fuselage outline
        ctx.strokeStyle = '#1A1A0A';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // === Cockpit canopy ===
        ctx.fillStyle = '#88CCFF';
        if (!perfMode) {
            ctx.shadowColor = '#88CCFF';
            ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.42);
        ctx.quadraticCurveTo(w * 0.08, -h * 0.32, w * 0.06, -h * 0.18);
        ctx.lineTo(-w * 0.06, -h * 0.18);
        ctx.quadraticCurveTo(-w * 0.08, -h * 0.32, 0, -h * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#224466';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // === Wings (wide trapezoid) — SKIP if wings already broke off ===
        if (!wingsBroken) {
            // Left wing
            ctx.fillStyle = '#5A5A4A';
            ctx.beginPath();
            ctx.moveTo(-w * 0.15, -h * 0.15);
            ctx.lineTo(-w * 0.95, -h * 0.05);
            ctx.lineTo(-w * 0.95, h * 0.05);
            ctx.lineTo(-w * 0.15, h * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Right wing
            ctx.beginPath();
            ctx.moveTo(w * 0.15, -h * 0.15);
            ctx.lineTo(w * 0.95, -h * 0.05);
            ctx.lineTo(w * 0.95, h * 0.05);
            ctx.lineTo(w * 0.15, h * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            // Wing detail panel lines
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 0.8;
            for (let li = 1; li <= 3; li++) {
                const xLeft = -w * 0.95 + (w * 0.8 * li / 4);
                ctx.beginPath();
                ctx.moveTo(xLeft, -h * 0.05 + (li * 0.01));
                ctx.lineTo(xLeft, h * 0.05 + (li * 0.01));
                ctx.stroke();
                const xRight = w * 0.95 - (w * 0.8 * li / 4);
                ctx.beginPath();
                ctx.moveTo(xRight, -h * 0.05 + (li * 0.01));
                ctx.lineTo(xRight, h * 0.05 + (li * 0.01));
                ctx.stroke();
            }

            // === Engines (2x nacelles) on wings ===
            const engineColor = '#1F1F1F';
            const engineGlow = '#FF6600';
            // Left engine
            ctx.fillStyle = engineColor;
            ctx.beginPath();
            ctx.ellipse(-w * 0.55, 0, w * 0.07, h * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0A0A0A';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Left engine exhaust glow (PERF: skip shadowBlur under perf mode)
            ctx.fillStyle = engineGlow;
            if (!perfMode) { ctx.shadowColor = engineGlow; ctx.shadowBlur = 10; }
            ctx.beginPath();
            ctx.ellipse(-w * 0.55, h * 0.15, w * 0.05, h * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
            // Right engine
            ctx.fillStyle = engineColor;
            ctx.beginPath();
            ctx.ellipse(w * 0.55, 0, w * 0.07, h * 0.18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Right engine exhaust glow
            ctx.fillStyle = engineGlow;
            ctx.beginPath();
            ctx.ellipse(w * 0.55, h * 0.15, w * 0.05, h * 0.08, 0, 0, Math.PI * 2);
            ctx.fill();
            if (!perfMode) ctx.shadowBlur = 0;

            // === Tail fin ===
            ctx.fillStyle = '#3A3A2A';
            ctx.beginPath();
            ctx.moveTo(0, h * 0.3);
            ctx.lineTo(-w * 0.06, h * 0.55);
            ctx.lineTo(w * 0.06, h * 0.55);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // === Iron cross markings (German bomber style) ===
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-w * 0.6, -h * 0.02, w * 0.08, h * 0.04);
            ctx.fillStyle = '#1A1A1A';
            ctx.fillRect(-w * 0.59, -h * 0.005, w * 0.06, h * 0.01);

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(w * 0.52, -h * 0.02, w * 0.08, h * 0.04);
            ctx.fillStyle = '#1A1A1A';
            ctx.fillRect(w * 0.53, -h * 0.005, w * 0.06, h * 0.01);

            // === Wing tip missile pods (visual cue) ===
            ctx.fillStyle = '#2A2A1A';
            // Left tip
            ctx.beginPath();
            ctx.ellipse(-w * 0.93, h * 0.1, w * 0.04, h * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0A0A0A';
            ctx.lineWidth = 0.8;
            ctx.stroke();
            // Right tip
            ctx.beginPath();
            ctx.ellipse(w * 0.93, h * 0.1, w * 0.04, h * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Dying: draw torn wing-stubs where the wing broke off (just the inner root)
            ctx.fillStyle = '#3A3A2A';
            ctx.beginPath();
            ctx.moveTo(-w * 0.15, -h * 0.15);
            ctx.lineTo(-w * 0.32, -h * 0.05);
            ctx.lineTo(-w * 0.32, h * 0.05);
            ctx.lineTo(-w * 0.15, h * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0A0A0A';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(w * 0.15, -h * 0.15);
            ctx.lineTo(w * 0.32, -h * 0.05);
            ctx.lineTo(w * 0.32, h * 0.05);
            ctx.lineTo(w * 0.15, h * 0.2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();

        // === HP bar (above the bomber) ===
        if (e.hp !== undefined && Math.round(e.maxHp) !== undefined) {
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            const barW = 60;
            const barX = ex - barW / 2;
            const barY = ey - h * 0.5 - 12;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(barX - 1, barY - 1, barW + 2, 5);
            ctx.fillStyle = hpRatio > 0.5 ? '#00FF44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
            ctx.fillRect(barX, barY, barW * hpRatio, 3);
            // PERF: HP text rendered with Math.round for clean integer display
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(e.hp) + ' / ' + Math.round(e.maxHp), ex, barY - 3);
            ctx.textAlign = 'left';
        }
    }

    // ===== WAVE BOSS: red heavy plane =====
    function drawWaveBoss(e) {
        const ex = e.x, ey = e.y;
        // Heavy bomber-like boss
        const bossGlow = Math.sin(frameCount * 0.1) * 0.3 + 0.7;
        // Outer ring (warning)
        ctx.strokeStyle = 'rgba(255, 100, 100, ' + (0.3 * bossGlow) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ex, ey, 50, 0, Math.PI * 2);
        ctx.stroke();
        // Body (dark red) — PERF: cached gradient
        ctx.fillStyle = GRAD_CACHE.finalBody;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 30);
        ctx.lineTo(ex + 18, ey - 10);
        ctx.lineTo(ex + 20, ey + 20);
        ctx.lineTo(ex - 20, ey + 20);
        ctx.lineTo(ex - 18, ey - 10);
        ctx.closePath();
        ctx.fill();
        // Wings (big)
        ctx.fillStyle = '#661111';
        ctx.beginPath();
        ctx.moveTo(ex - 14, ey - 5);
        ctx.lineTo(ex - 36, ey);
        ctx.lineTo(ex - 40, ey + 10);
        ctx.lineTo(ex - 14, ey + 12);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex + 14, ey - 5);
        ctx.lineTo(ex + 36, ey);
        ctx.lineTo(ex + 40, ey + 10);
        ctx.lineTo(ex + 14, ey + 12);
        ctx.closePath();
        ctx.fill();
        // Cockpit
        ctx.fillStyle = '#FFEE44';
        ctx.beginPath();
        ctx.ellipse(ex, ey - 8, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cannons
        ctx.fillStyle = '#222222';
        ctx.fillRect(ex - 30, ey + 2, 6, 2);
        ctx.fillRect(ex + 24, ey + 2, 6, 2);
        // Engine glow
        for (let eng = -1; eng <= 1; eng += 2) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(ex + eng * 8, ey + 22, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        // HP bar
        if (e.hp !== undefined && e.maxHp !== undefined) {
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(ex - 40, ey - 42, 80, 6);
            ctx.fillStyle = hpRatio > 0.5 ? '#00FF44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
            ctx.fillRect(ex - 40, ey - 42, 80 * hpRatio, 6);
        }
    }

    // ===== FINAL BOSS: B-52 inspired heavy bomber (huge wings, only body/tail take damage) =====
    function drawFinalBoss(e) {
        // ===== STAGE FINAL BOSS — sleek WWII heavy interceptor =====
        // Long elegant wings (invulnerable), slim tapered fuselage + tail (damageable)
        // Inspired by P-61 Black Widow / He 219 silhouette: swept wings, twin booms, central gondola
        const ex = e.x, ey = e.y;
        const t = frameCount;
        // When dying, the wings are already detached and falling as separate debris.
        // Skip drawing the wings on the fuselage so the body looks truly broken.
        const wingsBroken = !!e.dying;

        // === Threat aura (subtle red glow) ===
        const auraGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 180);
        auraGrad.addColorStop(0, 'rgba(255, 80, 60, 0.22)');
        auraGrad.addColorStop(0.6, 'rgba(255, 60, 30, 0.08)');
        auraGrad.addColorStop(1, 'rgba(255, 40, 20, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(ex, ey, 180, 0, Math.PI * 2);
        ctx.fill();

        // === Long, ROUNDED WINGS (invulnerable) — heavy-bomber silhouette ===
        // Wings stretch from x: -160 to +160 with a fully rounded tip
        // (long-bombing-aircraft style). The wing root meets the fuselage
        // between x = -30..+30. Tip is rounded with quadratic curves on
        // BOTH upper and lower edges so the silhouette is bulbous at the end
        // (not a sharp triangle). The wings are visually large but the
        // hitbox (hitboxBody / hitboxTail) only covers fuselage + tail, so
        // bullets striking the wing tips deal zero damage.
        if (!wingsBroken) {
        ctx.fillStyle = '#2A3038';
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 1;
        // ---- Left wing ----
        // Path: root-top → curve out to tip-top → round tip arc → tip-bottom → root-bottom
        ctx.beginPath();
        ctx.moveTo(ex - 30, ey - 6);   // root top
        ctx.quadraticCurveTo(ex - 120, ey - 28, ex - 160, ey - 18); // upper edge: sweep back & down to tip-top area
        ctx.quadraticCurveTo(ex - 175, ey - 8,  ex - 160, ey + 4);  // rounded tip arc (upper→lower)
        ctx.quadraticCurveTo(ex - 120, ey + 18, ex - 30, ey + 12);  // lower edge: curve back to root bottom
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // ---- Right wing ----
        ctx.beginPath();
        ctx.moveTo(ex + 30, ey - 6);
        ctx.quadraticCurveTo(ex + 120, ey - 28, ex + 160, ey - 18);
        ctx.quadraticCurveTo(ex + 175, ey - 8,  ex + 160, ey + 4);
        ctx.quadraticCurveTo(ex + 120, ey + 18, ex + 30, ey + 12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // === Wing leading edge highlight (silver) — curved to follow new silhouette ===
        ctx.strokeStyle = '#A8B0B8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(ex - 30, ey - 6);
        ctx.quadraticCurveTo(ex - 120, ey - 28, ex - 160, ey - 18);
        ctx.moveTo(ex + 30, ey - 6);
        ctx.quadraticCurveTo(ex + 120, ey - 28, ex + 160, ey - 18);
        ctx.stroke();

        // === Iron cross markings on wings (WWII aesthetic) ===
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(ex - 80, ey - 10, 4, 1.5);
        ctx.fillRect(ex - 78.5, ey - 11.5, 0.8, 4);
        ctx.fillRect(ex + 78, ey - 10, 4, 1.5);
        ctx.fillRect(ex + 79.5, ey - 11.5, 0.8, 4);

        // === Engine pods on wings (sleek cylinders) ===
        const engineGlow = (Math.sin(t * 0.25) > 0) ? '#FFD060' : '#FF8030';
        // Left engine pod
        ctx.fillStyle = '#1A1F25';
        ctx.beginPath();
        ctx.ellipse(ex - 110, ey - 6, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#3A4250';
        ctx.beginPath();
        ctx.ellipse(ex - 110, ey - 8, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // exhaust
        ctx.fillStyle = engineGlow;
        ctx.beginPath();
        ctx.ellipse(ex - 110, ey + 10, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // Right engine pod
        ctx.fillStyle = '#1A1F25';
        ctx.beginPath();
        ctx.ellipse(ex + 110, ey - 6, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#3A4250';
        ctx.beginPath();
        ctx.ellipse(ex + 110, ey - 8, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = engineGlow;
        ctx.beginPath();
        ctx.ellipse(ex + 110, ey + 10, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        } // end !wingsBroken

        // === Fuselage (damageable) — sleek tapered cigar shape ===
        // PERF: cached gradient
        ctx.fillStyle = GRAD_CACHE.finalFuselage;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 18);       // nose (sharp point)
        ctx.quadraticCurveTo(ex + 18, ey - 10, ex + 22, ey + 0);
        ctx.lineTo(ex + 20, ey + 20);  // tail end
        ctx.lineTo(ex - 20, ey + 20);
        ctx.lineTo(ex - 22, ey + 0);
        ctx.quadraticCurveTo(ex - 18, ey - 10, ex, ey - 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 1;
        ctx.stroke();

        // === Cockpit canopy (green-tinted glass) — PERF: cached gradient ===
        ctx.fillStyle = GRAD_CACHE.finalCanopy;
        ctx.beginPath();
        ctx.moveTo(ex - 8, ey - 8);
        ctx.quadraticCurveTo(ex, ey - 14, ex + 8, ey - 8);
        ctx.quadraticCurveTo(ex + 7, ey - 1, ex + 4, ey + 2);
        ctx.lineTo(ex - 4, ey + 2);
        ctx.quadraticCurveTo(ex - 7, ey - 1, ex - 8, ey - 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        // canopy highlight
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(ex - 4, ey - 10);
        ctx.quadraticCurveTo(ex - 2, ey - 12, ex + 1, ey - 10);
        ctx.lineTo(ex - 1, ey - 7);
        ctx.lineTo(ex - 4, ey - 7);
        ctx.closePath();
        ctx.fill();

        // === Tail section (damageable) — slim rear boom — PERF: cached gradient ===
        // x -10..+10, y +20..+50
        ctx.fillStyle = GRAD_CACHE.finalTail;
        ctx.fillStyle = tailGrad;
        ctx.beginPath();
        ctx.moveTo(ex - 12, ey + 18);
        ctx.lineTo(ex - 8, ey + 48);
        ctx.lineTo(ex + 8, ey + 48);
        ctx.lineTo(ex + 12, ey + 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0A0A0A';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // === Vertical stabilizer (slim fin) ===
        ctx.fillStyle = '#2A323E';
        ctx.beginPath();
        ctx.moveTo(ex - 2, ey + 18);
        ctx.lineTo(ex - 6, ey + 50);
        ctx.lineTo(ex + 6, ey + 50);
        ctx.lineTo(ex + 2, ey + 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#0A0A0A';
        ctx.stroke();

        // === Rear horizontal stabilizer (small wings on tail) ===
        ctx.fillStyle = '#252B35';
        ctx.beginPath();
        ctx.moveTo(ex - 22, ey + 30);
        ctx.lineTo(ex - 4, ey + 28);
        ctx.lineTo(ex - 4, ey + 36);
        ctx.lineTo(ex - 22, ey + 38);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex + 22, ey + 30);
        ctx.lineTo(ex + 4, ey + 28);
        ctx.lineTo(ex + 4, ey + 36);
        ctx.lineTo(ex + 22, ey + 38);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // === Nose propeller (rotating) ===
        const propAngle = t * 0.5;
        ctx.save();
        ctx.translate(ex, ey - 18);
        ctx.rotate(propAngle);
        ctx.fillStyle = 'rgba(180,180,180,0.4)';
        ctx.fillRect(-14, -1, 28, 2);
        ctx.fillRect(-1, -14, 2, 28);
        // propeller hub
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === Red nose spinner ===
        ctx.fillStyle = '#CC2020';
        ctx.beginPath();
        ctx.arc(ex, ey - 19, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#600';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // === Wing-mounted cannons (on damageable body) ===
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(ex - 30, ey + 2, 8, 1.5);
        ctx.fillRect(ex + 22, ey + 2, 8, 1.5);
        // muzzle tips
        ctx.fillStyle = '#888';
        ctx.fillRect(ex - 32, ey + 1, 2, 3);
        ctx.fillRect(ex + 30, ey + 1, 2, 3);

        // === Belly bomb bay markings (yellow stripes — invites targeting) ===
        ctx.fillStyle = 'rgba(255, 220, 80, 0.7)';
        ctx.fillRect(ex - 14, ey + 8, 28, 1);
        ctx.fillRect(ex - 14, ey + 12, 28, 1);

        // === Navigation lights (blinking) ===
        const navP = Math.sin(t * 0.3) > 0 ? 1 : 0.3;
        ctx.fillStyle = 'rgba(255, 30, 30, ' + navP + ')';
        ctx.beginPath();
        ctx.arc(ex - 160, ey - 20, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(30, 255, 60, ' + navP + ')';
        ctx.beginPath();
        ctx.arc(ex + 160, ey - 20, 2, 0, Math.PI * 2);
        ctx.fill();

        // === Tail rudder stripes (red accent) ===
        ctx.fillStyle = '#CC2020';
        ctx.fillRect(ex - 1, ey + 22, 2, 12);

        // === HP bar (wide bar above the wings) ===
        if (e.hp !== undefined && e.maxHp !== undefined) {
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            const barW = 220;
            const barX = ex - barW / 2;
            const barY = ey - 48;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(barX, barY, barW, 8);
            const hpColor = hpRatio > 0.5 ? '#00FF66' : hpRatio > 0.25 ? '#FFAA22' : '#FF3333';
            ctx.fillStyle = hpColor;
            ctx.fillRect(barX, barY, barW * hpRatio, 8);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, 8);
            // Label
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 9px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FINAL BOSS', ex, barY - 4);
        }
    }
        function drawBullet(bullet, isEnemy) {
        if (!bullet) return;
        if (isEnemy) {
            if (bullet.isBomb) {
                // ===== B-52 bomb-trail bullet — large aerial bomb silhouette (doubled) =====
                ctx.save();
                // Shadow under the bomb
                ctx.fillStyle = 'rgba(0,0,0,0.35)';
                ctx.beginPath();
                ctx.ellipse(bullet.x + 2, bullet.y + 18, 14, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                // Bomb casing (oval body) — PERF: cached gradient
                ctx.fillStyle = GRAD_CACHE.bombBody;
                ctx.beginPath();
                ctx.ellipse(bullet.x, bullet.y, 14, 18, 0, 0, Math.PI * 2);
                ctx.fill();
                // Bomb band
                ctx.fillStyle = '#222';
                ctx.fillRect(bullet.x - 14, bullet.y - 2, 28, 3);
                // Tail fins
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.moveTo(bullet.x - 14, bullet.y - 12);
                ctx.lineTo(bullet.x - 22, bullet.y - 16);
                ctx.lineTo(bullet.x - 18, bullet.y - 4);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(bullet.x + 14, bullet.y - 12);
                ctx.lineTo(bullet.x + 22, bullet.y - 16);
                ctx.lineTo(bullet.x + 18, bullet.y - 4);
                ctx.closePath();
                ctx.fill();
                // Nose fuse (lit)
                const lit = Math.sin(frameCount * 0.6 + bullet.x * 0.1) * 0.3 + 0.7;
                ctx.fillStyle = 'rgba(255, 80, 30, ' + lit + ')';
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y - 18, 3.6, 0, Math.PI * 2);
                ctx.fill();
                // Outline
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.ellipse(bullet.x, bullet.y, 14, 18, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                return;
            }
            // Enemy bullet - vivid red energy orb (PERF: skip shadowBlur in perf mode)
            // Visuals scaled to match doubled hit-box: outer 8→16, core 3→6, inner 1.5→3
            ctx.save();
            if (!perfMode) { ctx.shadowColor = "#FF0000"; ctx.shadowBlur = 14; }
            // Outer glow (PERF: cached)
            ctx.fillStyle = GRAD_CACHE.bulletEnemyCore;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 16, 0, Math.PI * 2);
            ctx.fill();
            // Bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#FF2200";
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#FFDD44";
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // Player bullet - yellow/white energy bolt (PERF: skip shadowBlur in perf mode)
            ctx.save();
            if (!perfMode) { ctx.shadowColor = "#FFEE00"; ctx.shadowBlur = 8; }
            // Main laser body (PERF: cached)
            ctx.fillStyle = GRAD_CACHE.bulletCore;
            ctx.beginPath();
            ctx.ellipse(bullet.x, bullet.y, 3, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            // Inner bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.ellipse(bullet.x, bullet.y, 1.2, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            // Trail effect
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "#FFCC00";
            ctx.beginPath();
            ctx.ellipse(bullet.x, bullet.y + 5, 1.5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    function drawPowerup() {
        for (let i = 0; i < powerups.length; i++) {
            const p = powerups[i];
            if (!p) continue;
            ctx.save();
            ctx.translate(p.x, p.y);
            // Outer rotating glow (PERF: skip shadowBlur in perf mode)
            const rotAngle = frameCount * 0.05;
            ctx.rotate(rotAngle);
            // Outer ring
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            if (!perfMode) { ctx.shadowColor = p.color; ctx.shadowBlur = 12; }
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.stroke();
            // Inner cross spokes
            for (let s = 0; s < 4; s++) {
                const ang = s * Math.PI / 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * 12, Math.sin(ang) * 12);
                ctx.lineTo(Math.cos(ang) * 18, Math.sin(ang) * 18);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            ctx.rotate(-rotAngle);
            // Background circle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            // Inner colored ring
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, 11, 0, Math.PI * 2);
            ctx.stroke();
            // Letter (PERF: skip shadowBlur in perf mode)
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (!perfMode) { ctx.shadowColor = p.color; ctx.shadowBlur = 6; }
            ctx.fillText(p.type || 'P', 0, 1);
            if (!perfMode) ctx.shadowBlur = 0;
            ctx.restore();
        }
    }
    
    function drawDrone() {
        for (let i = 0; i < drones.length; i++) {
            const d = drones[i];
            if (!d) continue;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.angle || 0);

            // Outer pink glow (PERF: skip shadowBlur under perf mode)
            if (!perfMode) { ctx.shadowColor = '#FF69B4'; ctx.shadowBlur = 6; }

            // === Fuselage (slim propeller fighter body) — PERF: cached gradient ===
            ctx.fillStyle = GRAD_CACHE.droneBody;
            ctx.beginPath();
            ctx.moveTo(0, -11);            // nose
            ctx.lineTo(3, -3);
            ctx.lineTo(2.5, 7);
            ctx.lineTo(-2.5, 7);
            ctx.lineTo(-3, -3);
            ctx.closePath();
            ctx.fill();

            // === Cockpit canopy === (PERF: skip shadowBlur under perf mode)
            ctx.fillStyle = '#88DDFF';
            if (!perfMode) { ctx.shadowColor = '#88DDFF'; ctx.shadowBlur = 5; }
            ctx.beginPath();
            ctx.ellipse(0, -3, 2.5, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#224466';
            ctx.lineWidth = 0.6;
            ctx.stroke();
            if (!perfMode) ctx.shadowBlur = 0;

            // === Wings (trapezoid, mid-wing) — PERF: cached gradient ===
            ctx.fillStyle = GRAD_CACHE.droneWing;
            // Left wing
            ctx.beginPath();
            ctx.moveTo(-2.5, -2);
            ctx.lineTo(-13, -2);
            ctx.lineTo(-15, 4);
            ctx.lineTo(-2.5, 5);
            ctx.closePath();
            ctx.fill();
            // Right wing
            ctx.beginPath();
            ctx.moveTo(2.5, -2);
            ctx.lineTo(13, -2);
            ctx.lineTo(15, 4);
            ctx.lineTo(2.5, 5);
            ctx.closePath();
            ctx.fill();
            // Wing outline
            ctx.strokeStyle = '#661133';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(-2.5, -2); ctx.lineTo(-13, -2); ctx.lineTo(-15, 4); ctx.lineTo(-2.5, 5); ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(2.5, -2); ctx.lineTo(13, -2); ctx.lineTo(15, 4); ctx.lineTo(2.5, 5); ctx.closePath();
            ctx.stroke();

            // === Pink roundel on wings (identification) ===
            ctx.fillStyle = '#FFEE00';
            ctx.beginPath(); ctx.arc(-9, 1, 1.6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(9, 1, 1.6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#FF1493';
            ctx.beginPath(); ctx.arc(-9, 1, 0.8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(9, 1, 0.8, 0, Math.PI * 2); ctx.fill();

            // === Tail (small vertical fin) ===
            ctx.fillStyle = '#CC3366';
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.lineTo(-2, 9);
            ctx.lineTo(2, 9);
            ctx.closePath();
            ctx.fill();

            // === Spinning propeller (animated) ===
            const propAngle = (frameCount * 0.5 + i * 1.7) % (Math.PI * 2);
            ctx.save();
            ctx.translate(0, -11);
            ctx.rotate(propAngle);
            // Propeller blades (drawn as elongated thin shapes)
            ctx.fillStyle = 'rgba(255, 200, 220, 0.85)';
            ctx.beginPath();
            ctx.ellipse(0, 0, 1.2, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(0, 0, 7, 1.2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Hub
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // === Fuselage outline ===
            ctx.strokeStyle = '#440022';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -11);
            ctx.lineTo(3, -3);
            ctx.lineTo(2.5, 7);
            ctx.lineTo(-2.5, 7);
            ctx.lineTo(-3, -3);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        }
    }
    
    function drawDroneBullet() {
        for (let i = 0; i < droneBullets.length; i++) {
            const b = droneBullets[i];
            if (!b) continue;
            ctx.save();
            ctx.translate(b.x, b.y);
            if (b.angle !== undefined) ctx.rotate(b.angle);
            // Outer glow
            ctx.shadowColor = '#FF1493';
            ctx.shadowBlur = 10;
            // Outer energy ring
            ctx.fillStyle = '#FF1493';
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            // Inner white core
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            // Homing trail
            if (b.trail) {
                ctx.globalAlpha = 0.4;
                ctx.fillStyle = '#FF69B4';
                for (let t = 0; t < b.trail.length; t++) {
                    const tp = b.trail[t];
                    ctx.beginPath();
                    ctx.arc(tp.x - b.x, tp.y - b.y, 3 - t * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            }
            ctx.restore();
        }
    }
    
    function drawExplosion() {
        // === PERF: Fast-path rendering when overloaded (>200 particles) ===
        var overloaded = explosions.length > 80;
        for (let i = 0; i < explosions.length; i++) {
            const e = explosions[i];
            if (!e) continue;
            var alpha = e.life;
            if (alpha <= 0.01) continue;
            ctx.globalAlpha = alpha;
            // === WING FIGHTER-STYLE PARTICLE RENDERING ===
            if (e.isCore) {
                var sz = e.size * (1.5 - e.life * 0.5);
                if (overloaded) {
                    ctx.fillStyle = e.color;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, sz * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    var grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, sz);
                    grad.addColorStop(0, '#FFFFFF');
                    grad.addColorStop(0.4, e.color);
                    grad.addColorStop(0.7, 'rgba(255, 200, 100, 0.5)');
                    grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
                    ctx.fillStyle = grad;
                    ctx.globalAlpha = e.life;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, sz, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + e.life + ')';
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, sz * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (e.isRing) {
                var baseR = e.ringRadius || 4;
                var sz = baseR + (1 - e.life) * baseR * 4;
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 1.5 * e.life + 0.5;
                ctx.globalAlpha = e.life * 0.8;
                ctx.beginPath();
                ctx.arc(e.x, e.y, sz, 0, Math.PI * 2);
                ctx.stroke();
                if (!overloaded) {
                    ctx.lineWidth = 0.8;
                    ctx.globalAlpha = e.life * 0.4;
                    ctx.beginPath();
                    ctx.moveTo(e.x - sz, e.y);
                    ctx.lineTo(e.x + sz, e.y);
                    ctx.moveTo(e.x, e.y - sz);
                    ctx.lineTo(e.x, e.y + sz);
                    ctx.stroke();
                }
            } else if (e.isSpark) {
                var sz = e.size * (0.5 + e.life * 0.5);
                if (overloaded) {
                    ctx.fillStyle = e.color;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, sz, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    var grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, sz * 2);
                    grad.addColorStop(0, e.color);
                    grad.addColorStop(0.5, e.color);
                    grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
                    ctx.fillStyle = grad;
                    ctx.globalAlpha = e.life * 0.7;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, sz * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#FFFFFF';
                ctx.globalAlpha = e.life;
                ctx.beginPath();
                ctx.arc(e.x, e.y, sz * 0.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (e.isDebris) {
                ctx.save();
                ctx.translate(e.x, e.y);
                ctx.rotate((e.angle || 0) + (1 - e.life) * 4);
                ctx.fillStyle = e.color;
                ctx.globalAlpha = e.life;
                ctx.fillRect(-e.size / 2, -e.size / 2, e.size, e.size);
                if (!overloaded) {
                    ctx.fillStyle = 'rgba(255, 255, 255, ' + (e.life * 0.5) + ')';
                    ctx.fillRect(-e.size / 2, -e.size / 2, e.size * 0.4, e.size * 0.3);
                }
                ctx.restore();
            } else if (e.type === 'shockwave') {
                var sz = (e.maxSize || 40) * (1 - e.life);
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 2 + (1 - e.life) * 2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, sz, 0, Math.PI * 2);
                ctx.stroke();
                if (!overloaded) {
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, sz * 0.7, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else if (e.type === 'fire') {
                if (overloaded) {
                    ctx.fillStyle = e.color;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, e.size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    var grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size);
                    grad.addColorStop(0, e.color);
                    grad.addColorStop(0.5, e.color);
                    grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                    ctx.fillStyle = grad;
                    ctx.globalAlpha = e.life;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (e.type === 'spark') {
                ctx.fillStyle = e.color;
                ctx.globalAlpha = e.life;
                if (!overloaded) {
                    ctx.shadowColor = e.color;
                    ctx.shadowBlur = 6;
                }
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                ctx.fill();
                if (!overloaded) ctx.shadowBlur = 0;
            } else if (e.type === 'smoke') {
                if (overloaded) {
                    ctx.fillStyle = e.color;
                    ctx.globalAlpha = e.life * 0.5;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    var smokeGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size);
                    smokeGrad.addColorStop(0, e.color);
                    smokeGrad.addColorStop(0.5, e.color);
                    smokeGrad.addColorStop(1, 'rgba(100, 100, 100, 0)');
                    ctx.fillStyle = smokeGrad;
                    ctx.globalAlpha = e.life * 0.7;
                    ctx.beginPath();
                    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (e.type === 'debris') {
                ctx.fillStyle = e.color;
                ctx.globalAlpha = e.life;
                ctx.fillRect(e.x - e.size / 2, e.y - e.size / 2, e.size, e.size);
            }
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }
    
    function drawJoystick() {
        // For touch devices, always show joystick zone
        if (!isTouchDevice()) return;
        
        const baseX = joystickActive ? joystickBaseX : 65;
        const baseY = joystickActive ? joystickBaseY : GAME_HEIGHT - 80;
        const stickX = joystickActive ? joystickStickX : baseX;
        const stickY = joystickActive ? joystickStickY : baseY;
        
        ctx.save();
        
        // Base circle
        ctx.globalAlpha = joystickActive ? 0.3 : 0.15;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(baseX, baseY, JOYSTICK_BASE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        
        // Stick
        ctx.globalAlpha = joystickActive ? 0.6 : 0.25;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(stickX, stickY, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner dot
        ctx.globalAlpha = joystickActive ? 0.9 : 0.4;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(stickX, stickY, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    
    function drawMissiles() {
        for (let i = 0; i < missiles.length; i++) {
            const m = missiles[i];
            if (!m) continue;
            ctx.save();
            ctx.translate(m.x, m.y);
            if (m.angle !== undefined) ctx.rotate(m.angle);
            // Outer glow
            ctx.shadowColor = '#FF6600';
            ctx.shadowBlur = 10;
            // Missile body
            const bodyGrad = ctx.createLinearGradient(-3, -8, 3, 8);
            bodyGrad.addColorStop(0, '#FFCC00');
            bodyGrad.addColorStop(0.5, '#FF6600');
            bodyGrad.addColorStop(1, '#AA2200');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(3, -2);
            ctx.lineTo(3, 4);
            ctx.lineTo(-3, 4);
            ctx.lineTo(-3, -2);
            ctx.closePath();
            ctx.fill();
            // Nose
            ctx.fillStyle = '#FF2200';
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(2, -2);
            ctx.lineTo(-2, -2);
            ctx.closePath();
            ctx.fill();
            // Fins
            ctx.fillStyle = '#888888';
            ctx.beginPath();
            ctx.moveTo(-3, 2);
            ctx.lineTo(-6, 5);
            ctx.lineTo(-3, 5);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(3, 2);
            ctx.lineTo(6, 5);
            ctx.lineTo(3, 5);
            ctx.closePath();
            ctx.fill();
            // Engine flame
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.moveTo(-2, 4);
            ctx.lineTo(0, 4 + 4 + Math.sin(frameCount * 0.5) * 2);
            ctx.lineTo(2, 4);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();
            // Trail
            if (m.trail && m.trail.length > 0) {
                for (let t = 0; t < m.trail.length; t++) {
                    const tp = m.trail[t];
                    ctx.fillStyle = 'rgba(255, 150, 0, ' + (1 - t / m.trail.length) * 0.5 + ')';
                    ctx.beginPath();
                    ctx.arc(tp.x, tp.y, 3 - t * 0.2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
    
    function drawHitMarkers() {
        for (let hi = hitMarkers.length - 1; hi >= 0; hi--) {
            const hm = hitMarkers[hi];
            hm.timer--;
            if (hm.timer <= 0) { hitMarkers.splice(hi, 1); continue; }
            const a = Math.min(1, hm.timer / 12);
            const r = 8 + (12 - hm.timer) * 0.5;
            ctx.strokeStyle = 'rgba(255, ' + (180 + hm.timer * 5) + ', 0, ' + a + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(hm.x, hm.y, r, 0, Math.PI * 2);
            ctx.stroke();
            // 4 rotating tick marks
            ctx.strokeStyle = 'rgba(255, 255, 100, ' + a + ')';
            ctx.lineWidth = 1.5;
            for (let t = 0; t < 4; t++) {
                const ang = (Math.PI * 2 / 4) * t + hm.timer * 0.15;
                const ix1 = hm.x + Math.cos(ang) * (r - 3);
                const iy1 = hm.y + Math.sin(ang) * (r - 3);
                const ix2 = hm.x + Math.cos(ang) * (r + 3);
                const iy2 = hm.y + Math.sin(ang) * (r + 3);
                ctx.beginPath();
                ctx.moveTo(ix1, iy1);
                ctx.lineTo(ix2, iy2);
                ctx.stroke();
            }
        }
    }
        function drawUI() {
        // Top bar — semi-transparent dark panel with subtle amber border
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, GAME_WIDTH, 34);
        ctx.fillStyle = 'rgba(255, 180, 60, 0.35)';
        ctx.fillRect(0, 33, GAME_WIDTH, 1);

        // Wave announce text — shown for ~1.5s after each sub-wave starts
        if (waveAnnounceTimer > 0 && waveAnnounceText) {
            const t = waveAnnounceTimer / WAVE_FLASH_DURATION;
            // Fade in 0..0.3, hold, fade out 0.7..1
            let alpha = 1;
            if (t > 0.7) alpha = (1 - t) / 0.3;
            else if (t < 0.3) alpha = t / 0.3;
            alpha = Math.max(0, Math.min(1, alpha));
            const pulse = 1 + (1 - t) * 0.08;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold ' + Math.floor(22 * pulse) + 'px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
            ctx.shadowBlur = 6;
            // shadow
            ctx.fillText(waveAnnounceText, GAME_WIDTH / 2 + 2, 70 + 2);
            ctx.fillStyle = '#FFD24A';
            ctx.fillText(waveAnnounceText, GAME_WIDTH / 2, 70);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFEEAA';
            ctx.font = 'bold 9px "Press Start 2P", monospace';
            ctx.fillText('NEXT AREA ' + currentStage + '-' + Math.min(stageWave + 1, STAGE_WAVES), GAME_WIDTH / 2, 92);
            ctx.restore();
        }

        // Score (gold)
        ctx.fillStyle = '#FFD24A';
        ctx.font = 'bold 16px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 4;
        ctx.fillText('1P ' + score.toString().padStart(8, '0'), 12, 22);
        // High score (orange-red)
        ctx.fillStyle = '#FF7043';
        ctx.fillText('HI ' + highScore.toString().padStart(8, '0'), 188, 22);
        // Stage (cyan-green)
        ctx.fillStyle = '#4DE0B6';
        ctx.textAlign = 'right';
        ctx.fillText('STAGE ' + currentStage, GAME_WIDTH - 12, 22);
        ctx.shadowBlur = 0;

        // Lives — mini P-40 silhouette icons
        ctx.textAlign = 'left';
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.fillStyle = '#A8C5E0';
        ctx.fillText('LIVES', 12, 48);
        for (let i = 0; i < Math.min(player.lives, 5); i++) {
            const lx = 60 + i * 16;
            const ly = 48;
            // Mini plane icon (dark silhouette)
            ctx.fillStyle = '#1A3550';
            // Body
            ctx.beginPath();
            ctx.moveTo(lx, ly - 5);
            ctx.lineTo(lx + 2, ly - 1);
            ctx.lineTo(lx + 2, ly + 4);
            ctx.lineTo(lx - 2, ly + 4);
            ctx.lineTo(lx - 2, ly - 1);
            ctx.closePath();
            ctx.fill();
            // Wings
            ctx.fillRect(lx - 7, ly, 14, 2);
            // Tail
            ctx.fillRect(lx - 2, ly + 4, 4, 2);
            // Red roundel
            ctx.fillStyle = '#CC0000';
            ctx.fillRect(lx - 5, ly + 0.5, 2, 1);
            ctx.fillRect(lx + 3, ly + 0.5, 2, 1);
        }

        // Bombs — orange bomb icon + count
        ctx.fillStyle = '#FFB347';
        ctx.font = 'bold 10px "Press Start 2P", monospace';
        ctx.fillText('BOMB', 160, 48);
        for (let i = 0; i < Math.min(player.bombs, 5); i++) {
            const bx = 200 + i * 12;
            // Mini bomb (round body + fuse)
            ctx.fillStyle = '#2A2A2A';
            ctx.beginPath();
            ctx.arc(bx, 50, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF7043';
            ctx.fillRect(bx - 0.5, 44, 1, 3);
            ctx.fillStyle = '#FFD24A';
            ctx.beginPath();
            ctx.arc(bx, 43, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Combo
        if (comboCount >= 2 && comboTimer > 0) {
            const comboScale = 1 + Math.sin(frameCount * 0.3) * 0.05;
            ctx.save();
            ctx.translate(GAME_WIDTH / 2, 100);
            ctx.scale(comboScale, comboScale);
            ctx.fillStyle = '#FFCC00';
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FF6600';
            ctx.shadowBlur = 8;
            ctx.fillText(comboCount + 'x COMBO!', 0, 0);
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('+' + (comboCount * 50), 0, 18);
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        // Max combo (bottom-right)
        if (maxCombo > 0) {
            ctx.fillStyle = '#888888';
            ctx.font = 'bold 9px "Press Start 2P", monospace';
            ctx.textAlign = 'right';
            ctx.fillText('MAX ' + maxCombo + 'x', GAME_WIDTH - 12, GAME_HEIGHT - 50);
        }

        // Wave indicator (centered banner)
        if (stageTimer < 120 && stageWave) {
            const alpha = Math.min(1, stageTimer < 60 ? (stageTimer / 60) : (1 - (stageTimer - 60) / 60));
            ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
            ctx.font = 'bold 22px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00D9FF';
            ctx.shadowBlur = 12;
            ctx.fillText('WAVE ' + stageWave, GAME_WIDTH / 2, 150);
            ctx.shadowBlur = 0;
        }

        // Boss HP bar
        const boss = enemies.find(e => e && (e.isFinalBoss || e.isMidBoss || e.isWaveBoss || e.type === 'final' || e.type === 'heavyBomber' || e.type === 'waveBoss' || e.type === 'wave_boss'));
        if (boss && boss.hp !== undefined && boss.maxHp !== undefined) {
            const hpRatio = Math.max(0, boss.hp / boss.maxHp);
            const barW = 300;
            const barX = (GAME_WIDTH - barW) / 2;
            const barY = 110;
            // Bar background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX - 2, barY - 2, barW + 4, 14);
            // HP fill (gradient from green to red)
            const hpColor = hpRatio > 0.5 ? '#00FF44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
            const hpGrad = ctx.createLinearGradient(barX, barY, barX + barW * hpRatio, barY);
            hpGrad.addColorStop(0, hpColor);
            hpGrad.addColorStop(1, hpRatio > 0.5 ? '#88FF88' : '#FFEE88');
            ctx.fillStyle = hpGrad;
            ctx.fillRect(barX, barY, barW * hpRatio, 10);
            // HP text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            ctx.fillText(Math.round(boss.hp) + ' / ' + Math.round(boss.maxHp), GAME_WIDTH / 2, barY + 8);
            ctx.shadowBlur = 0;
        }

        // Hit markers
        for (let i = 0; i < hitMarkers.length; i++) {
            const hm = hitMarkers[i];
            if (!hm) continue;
            ctx.save();
            ctx.translate(hm.x, hm.y);
            ctx.rotate(hm.angle || 0);
            ctx.strokeStyle = 'rgba(255, 255, 0, ' + (hm.timer / 30) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, 0);
            ctx.lineTo(6, 0);
            ctx.moveTo(0, -6);
            ctx.lineTo(0, 6);
            ctx.stroke();
            ctx.restore();
        }

        // Power level indicator
        if (player.powerLevel > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('PWR ' + player.powerLevel, 10, 70);
        }

        // (scorePopups dead code removed — was causing ReferenceError every frame)
    }
    
    function drawTitleScreen() {
        // Background (animated stars)
        drawBackground();
        // Title
        const titleY = 200 + Math.sin(frameCount * 0.05) * 5;
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 56px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('1945', GAME_WIDTH / 2, titleY);
        ctx.shadowBlur = 0;
        // Subtitle
        ctx.fillStyle = '#FF6600';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('FLYING TIGERS', GAME_WIDTH / 2, titleY + 36);
        // Pulse press start
        const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.1);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + pulse + ')';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('PRESS SPACE TO START', GAME_WIDTH / 2, 400);
        // Controls
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '12px monospace';
        ctx.fillText('ARROWS / WASD: MOVE', GAME_WIDTH / 2, 480);
        ctx.fillText('SPACE: AUTO-FIRE  |  B: BOMB  |  P: PAUSE', GAME_WIDTH / 2, 500);
        ctx.restore();

        // Show player ship in title
        ctx.save();
        ctx.translate(GAME_WIDTH / 2, 320);
        ctx.scale(1.5, 1.5);
        try { drawPlayer(); } catch(e) {}
        ctx.restore();
    }
    
    function drawPauseScreen() {
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // PAUSE text
        ctx.save();
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#FFFF00';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px monospace';
        ctx.fillText('PRESS P TO RESUME', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        ctx.restore();
    }
    
    function drawGameOverScreen() {
        // Dark red overlay
        ctx.fillStyle = 'rgba(80, 0, 0, 0.6)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // GAME OVER
        ctx.save();
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 52px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
        ctx.shadowBlur = 0;
        // Final score
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('SCORE: ' + score, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillStyle = '#FF8800';
        ctx.font = '16px monospace';
        ctx.fillText('HIGH SCORE: ' + highScore, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        // Pulse
        const pulse = 0.5 + 0.5 * Math.sin(frameCount * 0.08);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + pulse + ')';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('PRESS SPACE TO RESTART', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
        ctx.restore();
    }
    
    // ============================================
    // MAIN GAME LOOP
    // ============================================
    
    function gameLoop() {
    try {
        // === SAFETY: Reset canvas state EVERY frame (BEFORE try block) ===
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Clear the entire canvas first
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Error recovery throttle
        if (gameLoopErrorCount > 3) {
            gameLoopErrorCount = 0;
        }

        // Always increment frame counter
        frameCount++;

        // Update game logic
        if (gameState === GameState.PLAYING) {
            try { update(); } catch(e) { console.error('update:', e.message); }
        }

        // === RENDER SECTION ===
        if (gameState === GameState.TITLE) {
            try { drawTitleScreen(); } catch(e) { console.error('drawTitleScreen:', e.message); }
            if (isTouchDevice()) { try { drawJoystick(); } catch(e) {} }

        } else if (gameState === GameState.PLAYING) {
            // === HYPERSPACE CHECK: Special rendering during jump ===
            if (hyperspaceActive) {
                try { drawHyperspace(); } catch(e) { console.error('drawHyperspace:', e.message); }
                try { drawUI(); } catch(e) { console.error('drawUI:', e.message); }
                requestAnimationFrame(gameLoop);
                return;
            }
            
            // === PLAYING RENDER: Single save/restore around entire block ===
            ctx.save();

            // Screen shake transform
            if (screenShake > 0) {
                const shakeX = (Math.random() - 0.5) * screenShakeIntensity * (screenShake / 15);
                const shakeY = (Math.random() - 0.5) * screenShakeIntensity * (screenShake / 15);
                ctx.translate(shakeX, shakeY);
            }

            // Background
            try { drawBackground(); } catch(e) { console.error('drawBackground:', e.message); }

            // Powerups
            for (let i = powerups.length - 1; i >= 0; i--) {
                try { drawPowerup(powerups[i]); } catch(e) {}
            }

            // Player bullets
            for (let i = playerBullets.length - 1; i >= 0; i--) {
                try { drawBullet(playerBullets[i], false); } catch(e) {}
            }

            // Enemy bullets
            for (let i = enemyBullets.length - 1; i >= 0; i--) {
                try { drawBullet(enemyBullets[i], true); } catch(e) {}
            }

            // Boss claws & tentacles
            try { drawBossClaw(); } catch(e) {}
            try { drawOctopusTentacles(); } catch(e) {}

            // Enemies
            for (let i = enemies.length - 1; i >= 0; i--) {
                const _en = enemies[i];
                if (_en) { try { drawEnemy(_en); } catch(e) {} }
            }

            // Detached boss wing debris (drawn between enemies and explosions so smoke overlays it)
            try { drawBossWingDebris(); } catch(e) { console.error('drawBossWingDebris:', e.message); }

            // === FINAL BOSS INTRO (2026-09): escort caption (small, drawn under UI) ===
            try { drawBossEscortLabel(); } catch(e) { console.error('drawBossEscortLabel:', e.message); }

            // Explosions — drawExplosion iterates all particles internally
            try { drawExplosion(); } catch(e) {}

            // Player
            if (player.visible) {
                try { drawPlayer(); } catch(e) { console.error('drawPlayer:', e.message); }
            }

            // P Ultimate shield visual
            if (pUltimateActive && player.visible && player.activeWeapon === 'P') {
                try {
                    const sr = 150;
                    const a = pUltimateAlpha;
                    ctx.save();
                    ctx.globalAlpha = a * 0.2;
                    ctx.strokeStyle = '#FFFF00';
                    ctx.lineWidth = 8;
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 40;
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, sr + 10, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = a * 0.5;
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 5;
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 30;
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, sr, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = a * 0.7;
                    ctx.strokeStyle = '#FFFF44';
                    ctx.lineWidth = 2;
                    ctx.shadowColor = '#FFFF88';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, sr - 8, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = a * 0.08;
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(player.x, player.y, sr, 0, Math.PI * 2);
                    ctx.fill();
                    const dotCount = 12;
                    const rotAngle = frameCount * 0.05;
                    ctx.globalAlpha = a * 0.8;
                    ctx.fillStyle = '#FFFF44';
                    ctx.shadowColor = '#FFFF00';
                    ctx.shadowBlur = 8;
                    for (let d = 0; d < dotCount; d++) {
                        const angle = rotAngle + (Math.PI * 2 / dotCount) * d;
                        const dx = player.x + Math.cos(angle) * (sr - 2);
                        const dy = player.y + Math.sin(angle) * (sr - 2);
                        ctx.beginPath();
                        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.restore();
                } catch(e) {}
            }

            // W Ultimate laser projectile visual
            if (wUltimateActive && player.visible && player.activeWeapon === 'W') {
                try {
                    ctx.save();
                    const wUltW = 14;
                    const wUltH = 55;
                    const wUltX = player.x - wUltW / 2;
                    const wUltY = wUltimateY;

                    ctx.shadowColor = '#4488FF';
                    ctx.shadowBlur = 40;
                    ctx.fillStyle = 'rgba(68, 136, 255, 0.25)';
                    ctx.fillRect(wUltX - 5, wUltY - 2, wUltW + 10, wUltH + 4);

                    ctx.shadowColor = '#FFFFFF';
                    ctx.shadowBlur = 28;
                    var grad = ctx.createLinearGradient(0, wUltY, 0, wUltY + wUltH);
                    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
                    grad.addColorStop(0.3, 'rgba(200, 230, 255, 1)');
                    grad.addColorStop(0.7, 'rgba(120, 170, 255, 0.6)');
                    grad.addColorStop(1, 'rgba(60, 100, 255, 0.1)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(wUltX, wUltY, wUltW, wUltH);

                    ctx.shadowBlur = 35;
                    ctx.beginPath();
                    ctx.arc(player.x, wUltY + 3, 9, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fill();

                    ctx.shadowBlur = 10;
                    for (var t = 0; t < 4; t++) {
                        var alpha = 0.3 - t * 0.07;
                        var size = 6 - t * 1.2;
                        var yOff = wUltH + 6 + t * 10;
                        ctx.fillStyle = 'rgba(100, 180, 255, ' + alpha + ')';
                        ctx.beginPath();
                        ctx.arc(player.x, wUltY + yOff, Math.max(1, size), 0, Math.PI * 2);
                        ctx.fill();
                    }

                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';
                    ctx.restore();
                } catch(e) {}
            }

            // Lasers
            if (laserBeams.length > 0) {
                try { drawLaserBeam(); } catch(e) {}
            }

            // Missiles
            try { drawMissiles(); } catch(e) {}

            // Drones
            for (let i = drones.length - 1; i >= 0; i--) {
                try { drawDrone(drones[i]); } catch(e) {}
            }
            for (let i = droneBullets.length - 1; i >= 0; i--) {
                try { drawDroneBullet(droneBullets[i]); } catch(e) {}
            }

            // Joystick (touch devices)
            if (isTouchDevice()) {
                try { drawJoystick(); } catch(e) {}
            }

            // === RESTORE: Single restore for PLAYING block ===
            ctx.restore();

            // UI (drawn outside the save/restore so it's not affected by shake)
            try { drawUI(); } catch(e) { console.error('drawUI:', e.message); }

            // === FINAL BOSS INTRO (2026-09): red siren overlay (full screen) ===
            // Drawn after drawUI so the warning text reads clearly on top of HUD.
            try { drawBossSirenOverlay(); } catch(e) { console.error('drawBossSirenOverlay:', e.message); }

        } else if (gameState === GameState.PAUSED) {
            try { drawPauseScreen(); } catch(e) { console.error('drawPauseScreen:', e.message); }

        } else if (gameState === GameState.GAMEOVER) {
            try { drawBackground(); } catch(e) {}
            try { drawExplosion(); } catch(e) {}
            if (isTouchDevice()) {
                try { drawJoystick(); } catch(e) {}
            }
            try { drawGameOverScreen(); } catch(e) { console.error('drawGameOverScreen:', e.message); }
        }

        // === NEXT FRAME ===
        requestAnimationFrame(gameLoop);

    } catch (e) {
        // === FATAL ERROR RECOVERY ===
        gameLoopErrorCount++;
        console.error('[GameLoop Error #' + gameLoopErrorCount + ']:', e.message);

        // Safe canvas state reset (DON'T drain save stack - just reset what we can)
        try { ctx.setTransform(1, 0, 0, 1, 0, 0); } catch (_e) {}
        try { ctx.shadowBlur = 0; } catch (_e) {}
        try { ctx.shadowColor = 'transparent'; } catch (_e) {}
        try { ctx.globalAlpha = 1; } catch (_e) {}

        // If too many errors, emergency reset to title
        if (gameLoopErrorCount > 10) {
            gameLoopErrorCount = 0;
            gameState = GameState.TITLE;
            bossActive = false;
            enemies = [];
            enemyBullets = [];
            playerBullets = [];
            explosions = [];
        }

        // Always continue the game loop
        requestAnimationFrame(gameLoop);
    }
}

// Start the game loop
gameLoop();