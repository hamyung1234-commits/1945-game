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
const BULLET_SPEED = 12;
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

// === HYPERSPACE / STAGE SYSTEM ===
let currentStage = 1;              // Current macro-stage (was "wave" conceptually)
let stageWave = 1;                 // Sub-wave within current stage (1-10)
let stageTimer = 0;                // Timer for sub-wave progression
const STAGE_WAVES = 10;            // 10 sub-waves per stage
const STAGE_WAVE_DURATION = 1260;  // 70% of original 1800 frames (21s)
const HYPERSPACE_TOTAL = 240;      // 4 seconds at 60fps
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
    width: 48,
    height: 48,
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
    enemyBullet: '#FF1493',
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
}

function useBomb() {
    if (player.bombs <= 0) return;
    player.bombs--;
    
    // === PERF: Count enemies first to budget explosions ===
    var enemyCount = enemies.length;
    var bossCount = 0;
    
    // Destroy all enemies and bullets (except boss which takes 15% max HP damage)
    // Reverse iteration for safe splice removal
    for (var ei = enemies.length - 1; ei >= 0; ei--) {
        var enemy = enemies[ei];
        if (enemy.isWaveBoss) {
            // ALL boss types take 15% of max HP damage from bomb - NEVER die from bomb
            var bombDamage = Math.floor(enemy.maxHp * 0.15);
            enemy.hp -= bombDamage;
            // Boss cannot die from bomb - ensure minimum HP based on boss type
            if (bossIsFinalBoss) { enemy.hp = Math.max(enemy.hp, 2); }
            if (enemy.hp < 1) enemy.hp = 1;
            bossCount++;
        } else {
            score += 10;
            enemies.splice(ei, 1);
        }
    }
    
    // Clear all enemy bullets
    enemyBullets = [];
    
    // === PERF: MINIMAL explosions — 3 total max
    for (var bi = 0; bi < 3; bi++) {
        var bx = 60 + Math.random() * (GAME_WIDTH - 120);
        var by = 80 + Math.random() * (GAME_HEIGHT - 200);
        createExplosion(bx, by, 0.5);
    }
    
    // Screen shake for impact
    screenShake = Math.max(screenShake, 8);
    screenShakeIntensity = Math.max(screenShakeIntensity, 4);
    
    // Rapid enemy respawn after bomb
    spawnBoost = 90;
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
        bossActive = true;
        bossDefeated = false;
        bossSpawned = true;  // Guard: boss actually spawned
        bossIsFinalBoss = true;
        bossWaveNumber = currentStage;
        
        // Boss HP: first boss = mid-boss * 3 (20+10*5=70, so 210)
        // Each subsequent boss +30% from previous boss
        const bossNumber = currentStage; // Boss number = current stage
        const baseMidBossHP = 20 + 10 * 5; // mid-boss HP at wave 10 = 70
        let bossHP = baseMidBossHP * 3; // 210 for first boss
        for (let b = 1; b < bossNumber; b++) {
            bossHP = Math.floor(bossHP * 1.3);
        }
        bossBaseHP = bossHP;
        
        // Each boss appearance adds one more claw (first boss = 1 claw)
        bossClawCount = currentStage + 1;
        bossClaws = [];
        
        const bossEnemy = {
            x: GAME_WIDTH / 2,
            y: -120,
            width: 100,
            height: 100,
            type: 'boss',
            hp: bossHP,
            maxHp: bossHP,
            speed: ENEMY_BASE_SPEED * 0.25,
            score: 5000 + currentStage * 5000,
            shootCooldown: 15,
            angle: 0,
            phase: Math.random() * Math.PI * 2,
            isWaveBoss: true
        };
        enemies.push(bossEnemy);
        
        // Show boss warning flash
        waveFlash = { active: true, timer: 120, text: 'BOSS' };
        // Cap stageWave at STAGE_WAVES while boss is alive
        if (stageWave > STAGE_WAVES) stageWave = STAGE_WAVES;
        // Reset stageTimer to give boss fight full duration
        stageTimer = 0;
        return;
    }
    
    // Spawn enemies slightly slower during boss fight (7/8 pass rate)
    if (bossActive && frameCount % 8 === 0) return;
    
    let types = ['scout', 'scout', 'scout', 'scout', 'scout', 'fighter', 'fighter', 'fighter', 'bomber', 'rammer'];
    if (wave >= 3) { types.push('fighter', 'bomber', 'rammer'); }
    if (wave >= 17 && wave % 10 !== 0) types.push('boss');
    // At wave 15+, reduce small enemy types by 50% (prevent overwhelming spawns)
    if (currentStage >= 2 && stageWave !== STAGE_WAVES) {
        // More small enemies for stage 2+ 
        types = ['scout', 'scout', 'scout', 'scout', 'scout', 'fighter', 'fighter', 'fighter', 'bomber', 'rammer'];
        // Mid-bosses only after wave >= 17 (same condition as stage 1)
        if (wave >= 17 && wave % 10 !== 0) {
            types.push('boss');
            types.push('octopus');
        }
    }
    
    let type = types[Math.floor(Math.random() * types.length)];
    
    // Limit consecutive mid-boss spawns to 5 before forcing a break
    if (type === 'boss' || type === 'octopus') {
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
    
    // CAP: Max 2 octopus on screen at once (prevent mass accumulation)
    if (type === 'octopus') {
        let octoCount = 0;
        for (let ec = 0; ec < enemies.length; ec++) {
            if (enemies[ec].type === 'octopus') octoCount++;
        }
        if (octoCount >= 2) {
            const fallbackTypes = ['scout', 'fighter', 'bomber', 'rammer'];
            type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
        }
    }
    
    // CAP: Max 3 total mid-bosses on screen
    if (type === 'boss' || type === 'octopus') {
        let bossCount = 0;
        for (let bc = 0; bc < enemies.length; bc++) {
            if (enemies[bc].type === 'boss' || enemies[bc].type === 'octopus') bossCount++;
        }
        if (bossCount >= 3) {
            const fallbackTypes = ['scout', 'fighter', 'bomber', 'rammer'];
            type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
        }
    }
    
    // During spawnBoost (rapid spawn after stage start), skip mid-bosses entirely
    if (spawnBoost > 0 && (type === 'boss' || type === 'octopus')) {
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
        case 'octopus':
            // Alien octopus mid-boss (from wave 15) - stays at top, attacks with tentacles
            enemy.hp = Math.floor((3 + currentStage * 3) * 0.7); // Scaled with new mid-boss HP
            enemy.maxHp = enemy.hp;
            enemy.speed = 0;
            enemy.score = 700;
            enemy.width = 56;
            enemy.height = 56;
            enemy.y = 70;
            enemy.isStationary = true;
            enemy.shootCooldown = 90;
            enemy.phase = Math.random() * Math.PI * 2;
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
            enemy.isMidBoss = true;
            enemy.hp = 3 + currentStage * 3; // Stage1=6, Stage2=9, Stage3=12 (balanced)
            enemy.maxHp = enemy.hp;
            enemy.speed = ENEMY_BASE_SPEED * 0.3;
            enemy.score = 2000;
            enemy.width = 80;
            enemy.height = 80;
            enemy.y = -100;
            enemy.shootCooldown = 20;
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

function createExplosion(x, y, scale) {
    // === PERF: Hard cap — skip entirely if particle budget exhausted ===
    if (explosions.length >= MAX_PARTICLES) return;
    scale = scale || 1.0;
    // === PERF: DRASTIC 80% reduction for playable framerate ===
    var overloaded = explosions.length > 120;
    var mult = overloaded ? 0.35 : 0.5;
    var sc = scale * mult;
    // Tiny core flash — only for scale >= 1.5
    if (scale >= 1.5 && explosions.length < 100) {
        explosions.push({x:x,y:y,vx:0,vy:0,size:3*sc,life:1.0,decay:0.18,color:'#FFFFDD',isCore:true,gravity:0});
    }
    // 0-1 debris
    if (scale >= 1.5 && explosions.length < 100) {
        explosions.push({x:x,y:y,vx:(Math.random()-0.5)*2*sc,vy:(Math.random()-0.5)*2*sc,size:(1+Math.random())*sc,life:1.0,decay:0.04,color:'#888',isDebris:true,rotSpeed:0.1,angle:Math.random()*Math.PI*2,gravity:0.1});
    }
    // Minimal smoke ring — ONLY if scale >= 2 and not overloaded
    if (!overloaded && scale >= 2) {
        var smokeCount = Math.floor(4 * sc);
        for (var i = 0; i < smokeCount; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 0.2 + Math.random() * 0.5 * sc;
            explosions.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.02,size:2+Math.random()*2*sc,color:'#555',isSmoke:true,type:'smoke',gravity:0.02});
        }
    }
    // Minimal fireball — 2-4 particles
    var fireCount = overloaded ? 2 : Math.floor(3 + scale * 2.5);
    for (var i = 0; i < fireCount; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.8 + Math.random() * 1.2 * sc;
        explosions.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.04,size:1.5+Math.random()*2.5*sc,color:COLORS.explosion[Math.floor(Math.random()*3)],type:'fire',gravity:0});
    }
    // Sparks — only for scale >= 2
    if (scale >= 2 && explosions.length < 80) {
        for (var i = 0; i < 3; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 0.5 + Math.random() * 0.5 * sc;
            explosions.push({x:x,y:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.0,decay:0.05,size:1+Math.random()*2*sc,color:'#FFFFFF',type:'spark',gravity:0});
        }
    }
    // Shockwave — only for scale >= 2.5
    if (scale >= 2.5 && explosions.length < 70) {
        explosions.push({x:x,y:y,vx:0,vy:0,life:1.0,decay:0.07,size:0,maxSize:20*sc,color:'rgba(255,200,80,0.6)',type:'shockwave',gravity:0});
    }
    // Minimal screen shake
    if (scale >= 2) {
        screenShake = Math.max(screenShake, 4);
        screenShakeIntensity = Math.max(screenShakeIntensity, 2);
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
        gameOver();
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

    
    // frameCount already incremented in gameLoop
    // stageTimer is incremented above
    
    // Stage/Sub-wave progression - hyperspace check FIRST
    if (hyperspaceActive) {
        updateHyperspace();
        return; // Skip all gameplay updates during hyperspace
    }
    
    stageTimer++;

    // HYPERSPACE TRIGGER: Check BEFORE stageWave overflow resets bossDefeated
    if (bossDefeated && !hyperspaceActive && !deathActive) {
        onBossDefeated();
        return; // Skip rest of frame - hyperspace jump started
    }
    
    // Stage wave progression (70% of original time)
    if (stageTimer > STAGE_WAVE_DURATION) {
        stageWave++;
        stageTimer = 0;
        bossDefeated = false;
        bossSpawned = false;
        wave = currentStage * 10 + stageWave; // keep legacy wave roughly in sync // keep legacy wave roughly in sync
        generatePlanetSet(currentPlanetIndex);
        // Rapid enemy respawn after wave increase
        spawnBoost = 60;
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
    
    // Player movement (keyboard)
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.x += player.speed;
    }
    if (keys['ArrowUp'] || keys['KeyW']) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
        player.y += player.speed;
    }
    
    // Player movement (joystick)
    if (joystickActive) {
        player.x += joystickDX * player.speed;
        player.y += joystickDY * player.speed;
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
    
    // Update laser beams - each beam targets different enemies
    if (laserBeams.length > 0) {
        // Sort enemies by distance from player (closest first)
        const sortedEnemies = [...enemies].sort((a, b) => {
            const da = Math.hypot(a.x - player.x, a.y - player.y);
            const db = Math.hypot(b.x - player.x, b.y - player.y);
            return da - db;
        });
        
        const damagePerTick = player.vPowerActive ? 1.14 : 0.76;  // per-beam damage (+30% boost, +50% with V power)
        const tickInterval = 16;     // frames between ticks
        
        // Converted from forEach to for (reverse for safe splice)
        for (let beamIdx = laserBeams.length - 1; beamIdx >= 0; beamIdx--) {
            const beam = laserBeams[beamIdx];
            // Assign target: round-robin through sorted enemies
            if (sortedEnemies.length > 0) {
                const enemyIdx = beamIdx % sortedEnemies.length;
                const target = sortedEnemies[enemyIdx];
                beam.targetX = target.x;
                beam.targetY = target.y;
                beam.targetEnemy = target;
            } else {
                beam.targetEnemy = null;
            }
            
            // Damage tick
            beam.tickTimer = (beam.tickTimer || 0) + 1;
            if (beam.tickTimer >= tickInterval) {
                beam.tickTimer = 0;
                
                if (beam.targetEnemy && enemies.includes(beam.targetEnemy)) {
                    const enemy = beam.targetEnemy;
                    enemy.hp -= damagePerTick;
                    hitMarkers.push({ x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y, timer: 12 });
                    
                    if (enemy.hp <= 0) {
                        score += enemy.score;
                        comboCount++;
                        if (comboCount > maxCombo) maxCombo = comboCount;
                        comboTimer = 90;
                        if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                        createHitSpark(enemy.x, enemy.y, 0.3);
                        if (enemy.isWaveBoss) {
                            // Boss defeated - spawn V powerup
                            spawnPowerup(enemy.x, enemy.y, true);
                            bossActive = false;
                            if (bossIsFinalBoss) {
                                // Final boss destruction: massive explosion effect
                                bossDeathX = enemy.x;
                                bossDeathY = enemy.y;
                                createMassiveExplosion(enemy.x, enemy.y, 1.5);
                                    deathFlashAlpha = Math.max(deathFlashAlpha, 0.3);
                                    screenShake = 10; screenShakeIntensity = 3;
                            } else {
                                screenShake = Math.max(screenShake, 7); screenShakeIntensity = 2;
                            }
                            bossDefeated = true;
                            player.lives = Math.min(5, player.lives + 1);
                            bossClaws = [];
                        } else {
                            spawnPowerup(enemy.x, enemy.y);
                        }
                        const idx = enemies.indexOf(enemy);
                        if (idx >= 0) enemies.splice(idx, 1);
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

    // Update player bullets
    // Converted from forEach to for (reverse for safe splice)
    for (let i = playerBullets.length - 1; i >= 0; i--) {
        const bullet = playerBullets[i];
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
        bullet.y += bullet.speed;
        if (bullet.y > GAME_HEIGHT + 20) {
            enemyBullets.splice(i, 1);
        }
    }
    
    // Update enemies
    // Converted from forEach to for (reverse for safe splice)
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const enemy = enemies[ei];
        enemy.phase += 0.05;
        
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
                            width: 10,
                            height: 10,
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
            case 'boss':
                if (enemy.y < 100) {
                    enemy.y += enemy.speed;
                } else {
                    // Sweep left-right across full screen width
                    // Use independent phase for slower movement (30% of original)
                    enemy._movePhase = (enemy._movePhase || 0) + 0.0225;
                    enemy.x += Math.sin(enemy._movePhase) * 1.5;
                    enemy.shootCooldown--;
                    if (enemy.shootCooldown <= 0) {
                        // 1-bullet shot (reduced from 2)
                        enemyBullets.push({
                            x: enemy.x,
                            y: enemy.y + enemy.height / 2,
                            width: 12,
                            height: 12,
                            speed: 1.6 // +60% from 1.0 (was 0.63)
                        });
                        enemy.shootCooldown = Math.max(90, 150 - currentStage * 5) + (bossIsFinalBoss ? 240 : 0); // final boss +2s interval
                    }
                }
                break;
        case 'octopus':
            // Alien octopus - stationary at top, attacks with tentacles only
            // Use independent phase for slower movement (30% of original)
            enemy._movePhase = (enemy._movePhase || 0) + 0.0159;
            // Auto-remove after lifetime (30 sec = ~1800 frames) to prevent accumulation
            enemy._lifetime = (enemy._lifetime || 0) + 1;
            if (enemy._lifetime > 300) {
                createHitSpark(enemy.x, enemy.y, 0.6);
                enemies.splice(ei, 1);
                break;
            }
            // Smooth left-right oscillation across screen
            enemy.x += Math.sin(enemy._movePhase) * 1.2;
            // Stay fixed at top
            enemy.y = 70;
            
            // Tentacle attack toward player
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0) {
                // Launch tentacle strike toward player
                const maxReach = Math.min(player.y - enemy.y - 20, GAME_HEIGHT * 0.35);
                octopusTentacles.push({
                    ownerId: enemy._id,
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    length: 0,
                    maxLength: Math.max(maxReach, 80),
                    active: true,
                    extending: true,
                    retracting: false,
                    targetX: player.x,
                    targetY: player.y - 30
                });
                enemy.shootCooldown = 600 + Math.random() * 200; // Much longer interval (50% slower attacks)
            }
            break;
        }
        
        // Keep enemy in bounds
        enemy.x = Math.max(enemy.width / 2, Math.min(GAME_WIDTH - enemy.width / 2, enemy.x));
        
        // Enemy shooting (basic)
        if (enemy.type !== 'bomber' && enemy.type !== 'boss' && enemy.type !== 'octopus' && enemy.y > 50) {
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0 && Math.random() < 0.02 * wave) {
                enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    width: 8,
                    height: 8,
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
            if (checkCollision(bullet, enemy)) {
                const dmg = (bullet.damage || 1) * (player.vPowerActive ? 1.5 : 1);
                enemy.hp -= dmg;
                bullet._hit = true;
                droneBullets.splice(bi, 1);
                
                if (enemy.hp <= 0) {
                    score += enemy.score;
                    comboCount++;
                    comboTimer = 90; // 1.5 seconds to chain kills
                    if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                    createHitSpark(enemy.x, enemy.y, 0.3);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
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
                        player.lives = Math.min(5, player.lives + 1);
                        bossClaws = [];
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    enemies.splice(ei, 1);
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
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.x += exp.vx;
        exp.y += exp.vy;
        exp.vx *= 0.95;
        exp.vy *= 0.95;
        exp.life -= exp.decay;
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
                // Check if enemy is in the vertical beam path
                if (Math.abs(enemy.x - beamX) < enemy.width / 2 + 12 && enemy.y < player.y) {
                    enemy.hp -= 46.08; // 3x missile damage
                    if (enemy.hp <= 0) {
                        score += enemy.score;
                        comboCount++;
                        comboTimer = 90;
                        if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                        createHitSpark(enemy.x, enemy.y, 0.3);
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
                    } else {
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
                const d = Math.hypot(mUltimateMissile.x - enemy.x, mUltimateMissile.y - enemy.y);
                if (d < 200) {
                    enemy.hp -= 46.08; // 3x normal missile damage (15.36 * 3)
                    if (enemy.hp <= 0) {
                        score += enemy.score;
                        createHitSpark(enemy.x, enemy.y, 0.3);
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
            if (checkCollision(missileHitbox, enemy)) {
                // Direct hit: 12.8 damage (same power applied to ALL enemy types)
                const missileDamage = 15.36; // 40% power reduction from 25.6
                enemy.hp -= missileDamage;
                createExplosion(m.x, m.y, 1.0);
                createHitSpark(enemy.x, enemy.y);
                
                // Splash damage to ALL nearby enemies (reverse iteration for safety)
                for (let ej = enemies.length - 1; ej >= 0; ej--) {
                    if (ej !== ei) {
                        const e2 = enemies[ej];
                        const d2 = Math.hypot(m.x - e2.x, m.y - e2.y);
                        if (d2 < 140) { // wider splash radius
                            e2.hp -= missileDamage * 0.5;
                        }
                    }
                }
                
                // Proper enemy cleanup when killed by missile (score + powerup + removal)
                if (enemy.hp <= 0) {
                    score += enemy.score;
                    comboCount++;
                    comboTimer = 90;
                    if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                    createHitSpark(enemy.x, enemy.y, 0.3);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
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
                        player.lives = Math.min(5, player.lives + 1);
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    enemies.splice(ei, 1);
                } else {
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
            if (checkCollision(bullet, enemy)) {
                const bulletDmg = bullet.power || (player.vPowerActive ? 1.5 : 1);
                enemy.hp -= bulletDmg;
                createHitSpark(enemy.x + (Math.random() - 0.5) * enemy.width * 0.5, enemy.y + (Math.random() - 0.5) * enemy.height * 0.5);
                playerBullets.splice(bi, 1);
                
                if (enemy.hp <= 0) {
                    score += enemy.score;
                    comboCount++;
                    comboTimer = 90;
                    if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                    createHitSpark(enemy.x, enemy.y, 0.3);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
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
                        player.lives = Math.min(5, player.lives + 1);
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    enemies.splice(ei, 1);
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
            if (checkCollision(enemy, player)) {
                createHitSpark(enemy.x, enemy.y, 0.3);
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
                    laserLevel = Math.min(6, laserLevel + 1);
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
        // Outer wide glow
        ctx.shadowColor = "#00FFFF";
        ctx.shadowBlur = 25;
        ctx.strokeStyle = "rgba(0, 255, 255, 0.7)";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        // Mid beam
        ctx.shadowColor = "#FFFFFF";
        ctx.shadowBlur = 18;
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
        for (let j = 0; j < 4; j++) {
            const t = (j + 1) / 5;
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
        ctx.shadowColor = "#00FFFF";
        ctx.shadowBlur = 30;
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
            hyperspaceActive = true;
            hyperspaceTimer = 0;
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
    // Deep space gradient
    const theme = PLANET_THEMES[currentPlanetIndex % PLANET_THEMES.length];
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#000005');
    grad.addColorStop(0.5, theme.nebula);
    grad.addColorStop(1, '#000008');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Nebula cloud
    ctx.fillStyle = theme.nebula;
    for (let i = 0; i < 3; i++) {
        const nx = (frameCount * 0.1 + i * 200) % (GAME_WIDTH + 200) - 100;
        const ny = 100 + i * 200;
        const nebGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 180);
        nebGrad.addColorStop(0, 'rgba(' + theme.glow + ', 0.08)');
        nebGrad.addColorStop(1, 'rgba(' + theme.glow + ', 0)');
        ctx.fillStyle = nebGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, 180, 0, Math.PI * 2);
        ctx.fill();
    }

    // Layer 1: tiny distant stars (parallax 0.2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 60; i++) {
        const sx = (i * 17.3 + frameCount * 0.2) % GAME_WIDTH;
        const sy = (i * 31.7) % GAME_HEIGHT;
        const ss = 0.5 + (i % 3) * 0.3;
        ctx.fillRect(sx, sy, ss, ss);
    }

    // Layer 2: medium stars (parallax 0.5)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 30; i++) {
        const sx = (i * 53.1 + frameCount * 0.5) % GAME_WIDTH;
        const sy = (i * 71.3) % GAME_HEIGHT;
        // Twinkle
        const tw = 0.5 + 0.5 * Math.sin(frameCount * 0.05 + i);
        ctx.globalAlpha = 0.4 + tw * 0.4;
        ctx.fillRect(sx, sy, 1.2, 1.2);
    }
    ctx.globalAlpha = 1;

    // Layer 3: bright stars (parallax 1.0)
    for (let i = 0; i < 12; i++) {
        const sx = (i * 91.7 + frameCount * 1.0) % GAME_WIDTH;
        const sy = (i * 113.3) % GAME_HEIGHT;
        // 4-point star shape
        const tw = 0.6 + 0.4 * Math.sin(frameCount * 0.08 + i * 1.7);
        ctx.globalAlpha = tw;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(sx, sy, 2, 2);
        // Cross flare
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(sx - 3, sy + 0.5, 8, 1);
        ctx.fillRect(sx + 0.5, sy - 3, 1, 8);
    }
    ctx.globalAlpha = 1;

    // Draw main planet
    drawMainPlanet();

    // Slow drifting cloud wisps (parallax 0.3)
    for (let i = 0; i < 4; i++) {
        const cx = (i * 200 + frameCount * 0.3 + 100) % (GAME_WIDTH + 200) - 100;
        const cy = 80 + i * 180;
        const cloudGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
        cloudGrad.addColorStop(0, 'rgba(80, 80, 100, 0.06)');
        cloudGrad.addColorStop(1, 'rgba(80, 80, 100, 0)');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 80, 25, 0, 0, Math.PI * 2);
        ctx.fill();
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
    // Engine flame (animated, behind ship)
    if (player.visible) {
        const flameLen = 14 + Math.sin(frameCount * 0.6) * 4;
        const flameWobble = Math.sin(frameCount * 0.8) * 2;
        // Outer flame (red/orange)
        ctx.fillStyle = '#FF4400';
        ctx.beginPath();
        ctx.moveTo(px - 6, py + 14);
        ctx.lineTo(px - 3 + flameWobble, py + 14 + flameLen * 0.6);
        ctx.lineTo(px + 3 + flameWobble, py + 14 + flameLen * 0.6);
        ctx.lineTo(px + 6, py + 14);
        ctx.closePath();
        ctx.fill();
        // Middle flame (yellow)
        ctx.fillStyle = '#FFAA00';
        ctx.beginPath();
        ctx.moveTo(px - 4, py + 14);
        ctx.lineTo(px - 1 + flameWobble * 0.7, py + 14 + flameLen * 0.5);
        ctx.lineTo(px + 1 + flameWobble * 0.7, py + 14 + flameLen * 0.5);
        ctx.lineTo(px + 4, py + 14);
        ctx.closePath();
        ctx.fill();
        // Inner flame (white-hot)
        ctx.fillStyle = '#FFFF99';
        ctx.beginPath();
        ctx.moveTo(px - 2, py + 14);
        ctx.lineTo(px + flameWobble * 0.5, py + 14 + flameLen * 0.35);
        ctx.lineTo(px + flameWobble * 0.5, py + 14 + flameLen * 0.35);
        ctx.lineTo(px + 2, py + 14);
        ctx.closePath();
        ctx.fill();
    }

    // Main fuselage (blue P-40)
    ctx.save();
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px + 1, py + 2, 8, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body - main color
    const bodyGrad = ctx.createLinearGradient(px - 8, py - 18, px + 8, py + 18);
    bodyGrad.addColorStop(0, '#4DA6FF');
    bodyGrad.addColorStop(0.5, '#1E70CC');
    bodyGrad.addColorStop(1, '#0D3D7A');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(px, py - 22);            // nose tip
    ctx.lineTo(px + 5, py - 10);        // right side
    ctx.lineTo(px + 8, py + 4);         // right wing root
    ctx.lineTo(px + 6, py + 16);        // right tail base
    ctx.lineTo(px + 2, py + 18);        // tail right
    ctx.lineTo(px - 2, py + 18);        // tail left
    ctx.lineTo(px - 6, py + 16);        // left tail base
    ctx.lineTo(px - 8, py + 4);         // left wing root
    ctx.lineTo(px - 5, py - 10);        // left side
    ctx.closePath();
    ctx.fill();

    // Wing top (horizontal stabilizer - rear)
    ctx.fillStyle = '#2E80D0';
    ctx.beginPath();
    ctx.moveTo(px - 14, py + 8);
    ctx.lineTo(px - 6, py + 6);
    ctx.lineTo(px - 4, py + 16);
    ctx.lineTo(px - 16, py + 14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + 14, py + 8);
    ctx.lineTo(px + 6, py + 6);
    ctx.lineTo(px + 4, py + 16);
    ctx.lineTo(px + 16, py + 14);
    ctx.closePath();
    ctx.fill();

    // Main wings (broad horizontal)
    const wingGrad = ctx.createLinearGradient(px - 22, py, px + 22, py);
    wingGrad.addColorStop(0, '#2266BB');
    wingGrad.addColorStop(0.5, '#3D8AD9');
    wingGrad.addColorStop(1, '#2266BB');
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(px - 8, py + 2);
    ctx.lineTo(px - 22, py + 6);
    ctx.lineTo(px - 24, py + 10);
    ctx.lineTo(px - 14, py + 10);
    ctx.lineTo(px - 8, py + 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 2);
    ctx.lineTo(px + 22, py + 6);
    ctx.lineTo(px + 24, py + 10);
    ctx.lineTo(px + 14, py + 10);
    ctx.lineTo(px + 8, py + 8);
    ctx.closePath();
    ctx.fill();

    // Wing tips - red (roundel/identification)
    ctx.fillStyle = '#FF2200';
    ctx.beginPath();
    ctx.arc(px - 19, py + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + 19, py + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    // White outline on roundels
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px - 19, py + 8, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px + 19, py + 8, 3.5, 0, Math.PI * 2);
    ctx.stroke();

    // Cockpit canopy (glass dome)
    const canopyGrad = ctx.createLinearGradient(px, py - 16, px, py - 4);
    canopyGrad.addColorStop(0, '#88DDFF');
    canopyGrad.addColorStop(0.5, '#4488CC');
    canopyGrad.addColorStop(1, '#113355');
    ctx.fillStyle = canopyGrad;
    ctx.beginPath();
    ctx.moveTo(px, py - 16);
    ctx.lineTo(px + 5, py - 10);
    ctx.lineTo(px + 4, py - 4);
    ctx.lineTo(px - 4, py - 4);
    ctx.lineTo(px - 5, py - 10);
    ctx.closePath();
    ctx.fill();
    // Canopy highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(px - 2, py - 14);
    ctx.lineTo(px - 3, py - 6);
    ctx.lineTo(px - 1, py - 6);
    ctx.lineTo(px, py - 14);
    ctx.closePath();
    ctx.fill();

    // Nose cone highlight
    ctx.fillStyle = '#FFCC00';
    ctx.beginPath();
    ctx.moveTo(px, py - 22);
    ctx.lineTo(px + 1.5, py - 18);
    ctx.lineTo(px - 1.5, py - 18);
    ctx.closePath();
    ctx.fill();

    // Body outline
    ctx.strokeStyle = '#000820';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py - 22);
    ctx.lineTo(px + 5, py - 10);
    ctx.lineTo(px + 8, py + 4);
    ctx.lineTo(px + 6, py + 16);
    ctx.lineTo(px + 2, py + 18);
    ctx.lineTo(px - 2, py + 18);
    ctx.lineTo(px - 6, py + 16);
    ctx.lineTo(px - 8, py + 4);
    ctx.lineTo(px - 5, py - 10);
    ctx.closePath();
    ctx.stroke();

    // Weapon pods under wings
    ctx.fillStyle = '#222222';
    ctx.fillRect(px - 20, py + 6, 4, 3);
    ctx.fillRect(px + 16, py + 6, 4, 3);

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

            if (e.type === 'scout') {
                // Small agile scout (red/green)
                drawScoutEnemy(e);
            } else if (e.type === 'fighter') {
                // Heavier fighter (red body, dark wings)
                drawFighterEnemy(e);
            } else if (e.type === 'bomber') {
                // Large slow bomber (gray, wide wings)
                drawBomberEnemy(e);
            } else if (e.type === 'heart') {
                // Heart mid-boss
                drawHeartBoss(e);
            } else if (e.type === 'octopus') {
                // Octopus mid-boss
                drawOctopusBoss(e);
            } else if (e.type === 'final') {
                // Final boss
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
        // Body (red)
        const bodyGrad = ctx.createLinearGradient(ex - 4, ey - 12, ex + 4, ey + 8);
        bodyGrad.addColorStop(0, '#FF6644');
        bodyGrad.addColorStop(0.5, '#CC2222');
        bodyGrad.addColorStop(1, '#661111');
        ctx.fillStyle = bodyGrad;
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
        // Main wings
        const wingGrad = ctx.createLinearGradient(ex - 20, ey, ex + 20, ey);
        wingGrad.addColorStop(0, '#661111');
        wingGrad.addColorStop(0.5, '#AA2222');
        wingGrad.addColorStop(1, '#661111');
        ctx.fillStyle = wingGrad;
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
        // Body (red)
        const bodyGrad = ctx.createLinearGradient(ex - 5, ey - 16, ex + 5, ey + 12);
        bodyGrad.addColorStop(0, '#FF8866');
        bodyGrad.addColorStop(0.5, '#CC3322');
        bodyGrad.addColorStop(1, '#771111');
        ctx.fillStyle = bodyGrad;
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
        // Big wings
        const wingGrad = ctx.createLinearGradient(ex - 28, ey, ex + 28, ey);
        wingGrad.addColorStop(0, '#444444');
        wingGrad.addColorStop(0.5, '#777777');
        wingGrad.addColorStop(1, '#444444');
        ctx.fillStyle = wingGrad;
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
        // Body (gray)
        const bodyGrad = ctx.createLinearGradient(ex - 7, ey - 20, ex + 7, ey + 14);
        bodyGrad.addColorStop(0, '#AAAAAA');
        bodyGrad.addColorStop(0.5, '#666666');
        bodyGrad.addColorStop(1, '#333333');
        ctx.fillStyle = bodyGrad;
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
    function drawHeartBoss(e) {
        const ex = e.x, ey = e.y;
        // Pulsing aura
        const pulse = 1 + Math.sin(frameCount * 0.1) * 0.05;
        // Outer glow
        const glowGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 50 * pulse);
        glowGrad.addColorStop(0, 'rgba(255, 100, 200, 0.4)');
        glowGrad.addColorStop(1, 'rgba(255, 100, 200, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(ex, ey, 50 * pulse, 0, Math.PI * 2);
        ctx.fill();
        // Heart shape (two circles + triangle bottom)
        const hs = 1.0 * pulse;
        ctx.fillStyle = '#FF4488';
        ctx.beginPath();
        ctx.arc(ex - 12 * hs, ey - 6 * hs, 12 * hs, 0, Math.PI * 2);
        ctx.arc(ex + 12 * hs, ey - 6 * hs, 12 * hs, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex - 23 * hs, ey - 2 * hs);
        ctx.lineTo(ex, ey + 22 * hs);
        ctx.lineTo(ex + 23 * hs, ey - 2 * hs);
        ctx.closePath();
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255, 200, 230, 0.5)';
        ctx.beginPath();
        ctx.ellipse(ex - 8, ey - 10, 5, 7, -0.5, 0, Math.PI * 2);
        ctx.fill();
        // Eyes (angry)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(ex - 7, ey - 2, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ex + 7, ey - 2, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(ex - 7, ey - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + 7, ey - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Angry eyebrows
        ctx.strokeStyle = '#880044';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ex - 10, ey - 6);
        ctx.lineTo(ex - 4, ey - 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex + 10, ey - 6);
        ctx.lineTo(ex + 4, ey - 4);
        ctx.stroke();
        // Mouth
        ctx.fillStyle = '#880033';
        ctx.beginPath();
        ctx.ellipse(ex, ey + 8, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // HP bar
        if (e.hp !== undefined && e.maxHp !== undefined) {
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(ex - 25, ey - 28, 50, 5);
            ctx.fillStyle = hpRatio > 0.5 ? '#00FF44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
            ctx.fillRect(ex - 25, ey - 28, 50 * hpRatio, 5);
        }
    }

    // ===== OCTOPUS BOSS: purple body with tentacles =====
    function drawOctopusBoss(e) {
        const ex = e.x, ey = e.y;
        // Body (rounded dome)
        const bodyGrad = ctx.createRadialGradient(ex - 5, ey - 5, 0, ex, ey, 28);
        bodyGrad.addColorStop(0, '#CC88EE');
        bodyGrad.addColorStop(0.5, '#8844BB');
        bodyGrad.addColorStop(1, '#440066');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(ex, ey, 28, 0, Math.PI * 2);
        ctx.fill();
        // Eye glow
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ex - 8, ey - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + 8, ey - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(ex - 8, ey - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex + 8, ey - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Mouth
        ctx.fillStyle = '#330033';
        ctx.beginPath();
        ctx.ellipse(ex, ey + 8, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        // HP bar
        if (e.hp !== undefined && e.maxHp !== undefined) {
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(ex - 30, ey - 38, 60, 5);
            ctx.fillStyle = hpRatio > 0.5 ? '#00FF44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
            ctx.fillRect(ex - 30, ey - 38, 60 * hpRatio, 5);
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
        // Body (dark red)
        const bodyGrad = ctx.createLinearGradient(ex - 20, ey - 30, ex + 20, ey + 30);
        bodyGrad.addColorStop(0, '#CC4444');
        bodyGrad.addColorStop(0.5, '#882222');
        bodyGrad.addColorStop(1, '#440000');
        ctx.fillStyle = bodyGrad;
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

    // ===== FINAL BOSS: large ship with detail =====
    function drawFinalBoss(e) {
        const ex = e.x, ey = e.y;
        const pulse = 1 + Math.sin(frameCount * 0.05) * 0.03;
        // Outer aura
        const auraGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, 80 * pulse);
        auraGrad.addColorStop(0, 'rgba(255, 50, 50, 0.4)');
        auraGrad.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(ex, ey, 80 * pulse, 0, Math.PI * 2);
        ctx.fill();
        // Main hull
        const hullGrad = ctx.createLinearGradient(ex - 30, ey - 40, ex + 30, ey + 40);
        hullGrad.addColorStop(0, '#AA3344');
        hullGrad.addColorStop(0.5, '#661122');
        hullGrad.addColorStop(1, '#220011');
        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 40);
        ctx.lineTo(ex + 30, ey - 20);
        ctx.lineTo(ex + 35, ey + 20);
        ctx.lineTo(ex + 20, ey + 35);
        ctx.lineTo(ex - 20, ey + 35);
        ctx.lineTo(ex - 35, ey + 20);
        ctx.lineTo(ex - 30, ey - 20);
        ctx.closePath();
        ctx.fill();
        // Big wings
        ctx.fillStyle = '#440011';
        ctx.beginPath();
        ctx.moveTo(ex - 20, ey - 5);
        ctx.lineTo(ex - 50, ey + 5);
        ctx.lineTo(ex - 55, ey + 18);
        ctx.lineTo(ex - 20, ey + 15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ex + 20, ey - 5);
        ctx.lineTo(ex + 50, ey + 5);
        ctx.lineTo(ex + 55, ey + 18);
        ctx.lineTo(ex + 20, ey + 15);
        ctx.closePath();
        ctx.fill();
        // Bridge
        ctx.fillStyle = '#FFCC00';
        ctx.beginPath();
        ctx.ellipse(ex, ey - 8, 6, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Engine lights (pulsing)
        const engPulse = Math.sin(frameCount * 0.2) * 0.4 + 0.6;
        for (let eng = -2; eng <= 2; eng++) {
            ctx.fillStyle = 'rgba(0, 200, 255, ' + engPulse + ')';
            ctx.beginPath();
            ctx.arc(ex + eng * 10, ey + 30, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        // Heavy cannons
        ctx.fillStyle = '#222222';
        ctx.fillRect(ex - 45, ey + 8, 8, 4);
        ctx.fillRect(ex + 37, ey + 8, 8, 4);
        // Outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ex, ey - 40);
        ctx.lineTo(ex + 30, ey - 20);
        ctx.lineTo(ex + 35, ey + 20);
        ctx.lineTo(ex + 20, ey + 35);
        ctx.lineTo(ex - 20, ey + 35);
        ctx.lineTo(ex - 35, ey + 20);
        ctx.lineTo(ex - 30, ey - 20);
        ctx.closePath();
        ctx.stroke();
        // HP bar
        if (e.hp !== undefined && e.maxHp !== undefined) {
            const hpRatio = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(ex - 50, ey - 52, 100, 6);
            ctx.fillStyle = hpRatio > 0.5 ? '#00FF44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
            ctx.fillRect(ex - 50, ey - 52, 100 * hpRatio, 6);
        }
    }
    
    function drawBullet(bullet, isEnemy) {
        if (!bullet) return;
        if (isEnemy) {
            // Enemy bullet - red/orange energy orb
            ctx.save();
            ctx.shadowColor = "#FF4444";
            ctx.shadowBlur = 12;
            // Outer glow
            const eGrad = ctx.createRadialGradient(bullet.x, bullet.y, 0, bullet.x, bullet.y, 8);
            eGrad.addColorStop(0, "#FFFFFF");
            eGrad.addColorStop(0.2, "#FF6666");
            eGrad.addColorStop(0.6, "#FF2222");
            eGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
            ctx.fillStyle = eGrad;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 8, 0, Math.PI * 2);
            ctx.fill();
            // Bright core
            ctx.shadowBlur = 0;
            ctx.fillStyle = "#FFCCCC";
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            // Player bullet - yellow/white energy bolt
            ctx.save();
            // Outer glow
            ctx.shadowColor = "#FFEE00";
            ctx.shadowBlur = 8;
            // Main laser body
            const bulletGrad = ctx.createLinearGradient(bullet.x - 3, bullet.y - 8, bullet.x + 3, bullet.y + 8);
            bulletGrad.addColorStop(0, "#FFFFFF");
            bulletGrad.addColorStop(0.3, "#FFFF66");
            bulletGrad.addColorStop(0.7, "#FFAA00");
            bulletGrad.addColorStop(1, "#FF6600");
            ctx.fillStyle = bulletGrad;
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
            // Outer rotating glow
            const rotAngle = frameCount * 0.05;
            ctx.rotate(rotAngle);
            // Outer ring
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
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
            // Letter
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.fillText(p.type || 'P', 0, 1);
            ctx.shadowBlur = 0;
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
            // Outer glow
            ctx.shadowColor = '#FF69B4';
            ctx.shadowBlur = 8;
            // Body
            const bodyGrad = ctx.createLinearGradient(-12, -10, 12, 10);
            bodyGrad.addColorStop(0, '#FF99CC');
            bodyGrad.addColorStop(0.5, '#FF4488');
            bodyGrad.addColorStop(1, '#882244');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(10, -4);
            ctx.lineTo(12, 8);
            ctx.lineTo(-12, 8);
            ctx.lineTo(-10, -4);
            ctx.closePath();
            ctx.fill();
            // Wings
            ctx.fillStyle = '#CC3366';
            ctx.beginPath();
            ctx.moveTo(-6, -2);
            ctx.lineTo(-18, 0);
            ctx.lineTo(-20, 4);
            ctx.lineTo(-6, 6);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(6, -2);
            ctx.lineTo(18, 0);
            ctx.lineTo(20, 4);
            ctx.lineTo(6, 6);
            ctx.closePath();
            ctx.fill();
            // Eye (glowing center)
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(0, -2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(0, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
            // Outline
            ctx.strokeStyle = '#440022';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(10, -4);
            ctx.lineTo(12, 8);
            ctx.lineTo(-12, 8);
            ctx.lineTo(-10, -4);
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
        // Top bar background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, GAME_WIDTH, 30);
        // Score
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText('1P  ' + score.toString().padStart(8, '0'), 10, 20);
        // High score
        ctx.fillStyle = '#FF8800';
        ctx.fillText('HI  ' + highScore.toString().padStart(8, '0'), 170, 20);
        // Stage
        ctx.fillStyle = '#00FF88';
        ctx.textAlign = 'right';
        ctx.fillText('STAGE ' + currentStage, GAME_WIDTH - 10, 20);
        ctx.shadowBlur = 0;

        // Lives
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        for (let i = 0; i < player.lives; i++) {
            ctx.fillStyle = '#1E90FF';
            ctx.beginPath();
            ctx.moveTo(10 + i * 18, 42);
            ctx.lineTo(16 + i * 18, 50);
            ctx.lineTo(13 + i * 18, 50);
            ctx.lineTo(13 + i * 18, 56);
            ctx.lineTo(7 + i * 18, 56);
            ctx.lineTo(7 + i * 18, 50);
            ctx.lineTo(4 + i * 18, 50);
            ctx.closePath();
            ctx.fill();
        }
        // Bombs
        ctx.fillStyle = '#FF8C00';
        ctx.font = 'bold 12px monospace';
        ctx.fillText('B: ' + player.bombs, 100, 52);

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
        // Max combo
        if (maxCombo > 0) {
            ctx.fillStyle = '#AAAAAA';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('MAX ' + maxCombo + 'x', GAME_WIDTH - 10, 50);
        }

        // Wave indicator
        if (stageTimer < 120 && stageWave) {
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - stageTimer / 120) + ')';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#00FFFF';
            ctx.shadowBlur = 10;
            ctx.fillText('WAVE ' + stageWave, GAME_WIDTH / 2, 150);
            ctx.shadowBlur = 0;
        }

        // Boss HP bar
        const boss = enemies.find(e => e && (e.isFinalBoss || e.isMidBoss || e.isWaveBoss || e.type === 'final' || e.type === 'heart' || e.type === 'octopus' || e.type === 'waveBoss' || e.type === 'wave_boss'));
        if (boss && boss.hp !== undefined && boss.maxHp !== undefined) {
            const hpRatio = Math.max(0, boss.hp / boss.maxHp);
            const barW = 300;
            const barX = (GAME_WIDTH - barW) / 2;
            const barY = 50;
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
            ctx.fillText(Math.ceil(boss.hp) + ' / ' + boss.maxHp, GAME_WIDTH / 2, barY + 8);
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

        // Score popup
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px monospace';
        for (let i = 0; i < scorePopups.length; i++) {
            const sp = scorePopups[i];
            if (!sp) continue;
            ctx.fillStyle = 'rgba(255, 255, 100, ' + (sp.timer / 60) + ')';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 3;
            ctx.fillText('+' + sp.value, sp.x, sp.y - (60 - sp.timer) * 0.5);
            ctx.shadowBlur = 0;
        }
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