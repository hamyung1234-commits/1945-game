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
    
    // Destroy all enemies and bullets (except boss which takes 15% max HP damage)
    // Reverse iteration for safe splice removal
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const enemy = enemies[ei];
        if (enemy.isWaveBoss) {
            // ALL boss types take 15% of max HP damage from bomb - NEVER die from bomb
            const bombDamage = Math.floor(enemy.maxHp * 0.15);
            enemy.hp -= bombDamage;
            // Boss cannot die from bomb - minimum 1 HP
            if (enemy.hp < 1) enemy.hp = 1;
            createExplosion(enemy.x, enemy.y, 20);
        } else {
            createExplosion(enemy.x, enemy.y);
            score += 10;
            enemies.splice(ei, 1);
        }
    }
    
    // Clear all enemy bullets
    enemyBullets = [];
    
    // Screen flash effect
    createExplosion(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50);
    
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
    
    let types = ['scout', 'scout', 'scout', 'fighter', 'fighter', 'bomber', 'rammer'];
    if (wave >= 3) { types.push('fighter', 'bomber', 'rammer'); }
    if (wave >= 17 && wave % 10 !== 0) types.push('boss');
    // At wave 15+, reduce small enemy types by 50% (prevent overwhelming spawns)
    if (currentStage >= 2 && stageWave !== STAGE_WAVES) {
        // Keep small enemy types for balance
        types = ['scout', 'fighter', 'bomber'];
        // Both octopus AND heart mid-boss spawn together (not mutually exclusive)
        types.push('octopus');
        // Heart boss already added above via wave condition
    }
    
    let type = types[Math.floor(Math.random() * types.length)];
    
    // Limit consecutive mid-boss spawns to 5 before forcing a break
    if (type === 'boss' || type === 'octopus') {
        midBossStreak++;
        if (midBossStreak > 5) {
            // Force a non-boss enemy after 5 consecutive mid-bosses
            const fallbackTypes = ['scout', 'fighter', 'bomber', 'rammer'];
            type = fallbackTypes[Math.floor(Math.random() * fallbackTypes.length)];
            midBossStreak = 0;
        }
    } else {
        midBossStreak = 0;
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
            enemy.hp = Math.floor((8 + wave * 2) * 0.7); // Scaled with new mid-boss HP
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
            enemy.hp = 8 + wave * 2; // Reduced to ~40% of original for better balance
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

function createExplosion(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = Math.random() * 4 + 2;
        
        explosions.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 8 + 4,
            life: 1,
            decay: Math.random() * 0.03 + 0.02
        });

    // Spark particles for extra visual punch
    const sparkCount = Math.floor(count * 1.5);
    for (let s = 0; s < sparkCount; s++) {
        const ang = (Math.PI * 2 / sparkCount) * s + Math.random() * 0.5;
        const spd = Math.random() * 5 + 2;
        explosions.push({
            x: x + Math.cos(ang) * 8,
            y: y + Math.sin(ang) * 8,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: Math.random() * 3 + 1,
            life: 0.4 + Math.random() * 0.4,
            decay: 0.03 + Math.random() * 0.05,
            color: Math.random() < 0.5 ? "#FFAA00" : "#FF6600",
            isSpark: true
        });
    }
    }
    playExplosionSound();
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
    if (player.invincible || player.vPowerActive) return;
    if (deathActive) return;
    
    player.lives--;
    deathActive = true;
    deathTimer = 60; // 1 second freeze
    screenShake = 15; // Screen shake on death
    screenShakeIntensity = 6;
    player.invincible = true;
    player.invincibleTimer = 999;
    player.shieldActive = false;
    player.visible = false;
    
    // Laser downgrade is now handled in respawnPlayer() only - no double downgrade
    stopLaserSound();
    
    // Remove one drone when hit
    if (drones.length > 0) {
        const removedDrone = drones.pop();
        createExplosion(removedDrone.x, removedDrone.y, 6);
    }
    
    // === DRAMATIC DEATH EXPLOSION ===
    // Layer 1: Central burst - 50 particles in all directions
    for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 / 50) * i + Math.random() * 0.3;
        const speed = Math.random() * 14 + 6;
        explosions.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 6 + 3,
            life: 1,
            decay: Math.random() * 0.008 + 0.004,
            color: COLORS.explosion[Math.floor(Math.random() * COLORS.explosion.length)]
        });
    }
    
    // Layer 2: Debris flying outward - 40 particles with high speed
    for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 18 + 8;
        explosions.push({
            x: player.x + (Math.random() - 0.5) * 20,
            y: player.y + (Math.random() - 0.5) * 20,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            life: 1,
            decay: Math.random() * 0.01 + 0.005,
            color: ['#FFD700', '#FF6B35', '#FF4444', '#FFFFFF'][Math.floor(Math.random() * 4)]
        });
    }
    
    // Layer 3: Extra large fragments - 15 big chunks
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 16 + 10;
        explosions.push({
            x: player.x + (Math.random() - 0.5) * 30,
            y: player.y + (Math.random() - 0.5) * 30,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 8 + 4,
            life: 1,
            decay: Math.random() * 0.006 + 0.003,
            color: ['#1E90FF', '#FFD700', '#FF6B35', '#AAAAAA'][Math.floor(Math.random() * 4)]
        });
    }
    
    playHitSound();
    playExplosionSound();
    
    // Start death sequence (2 seconds before respawn)
    deathActive = true;
    deathTimer = 150;
    deathFlashAlpha = 1;
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
        // Rapid enemy respawn after bomb/wave
        if (frameCount % 15 === 0) {
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
                            createExplosion(e.x, e.y);
                            if (e.isWaveBoss) {
                                spawnPowerup(e.x, e.y, true);
                                bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
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
                tentacle.length += 1.0;
                if (tentacle.length >= tentacle.maxLength) {
                    tentacle.extending = false;
                    tentacle.retracting = true;
                }
            } else if (tentacle.retracting) {
                tentacle.length -= 2;
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
                        createExplosion(enemy.x, enemy.y);
                        if (enemy.isWaveBoss) {
                            // Boss defeated - spawn V powerup
                            spawnPowerup(enemy.x, enemy.y, true);
                            bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
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
                            speed: 2
                        });
                        enemy.shootCooldown = 130;
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
                            speed: 2
                        });
                        enemy.shootCooldown = Math.max(75, 120 - wave * 4); // wider interval for balance
                    }
                }
                break;
        case 'octopus':
            // Alien octopus - stationary at top, attacks with tentacles only
            // Use independent phase for slower movement (30% of original)
            enemy._movePhase = (enemy._movePhase || 0) + 0.0159;
            // Auto-remove after lifetime (30 sec = ~1800 frames) to prevent accumulation
            enemy._lifetime = (enemy._lifetime || 0) + 1;
            if (enemy._lifetime > 900) {
                createExplosion(enemy.x, enemy.y, 8);
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
                enemy.shootCooldown = 200 + Math.random() * 80; // Even longer interval for balance
            }
            break;
        }
        
        // Keep enemy in bounds
        enemy.x = Math.max(enemy.width / 2, Math.min(GAME_WIDTH - enemy.width / 2, enemy.x));
        
        // Enemy shooting (basic)
        if (enemy.type !== 'bomber' && enemy.type !== 'boss' && enemy.y > 50) {
            enemy.shootCooldown--;
            if (enemy.shootCooldown <= 0 && Math.random() < 0.02 * wave) {
                enemyBullets.push({
                    x: enemy.x,
                    y: enemy.y + enemy.height / 2,
                    width: 8,
                    height: 8,
                    speed: 2 + wave * 0.15
                });
                enemy.shootCooldown = (wave >= 20) ? 100 : 60;
            }
        }
        
        // Remove off-screen enemies
        if (enemy.y > GAME_HEIGHT + 50) {
            if (enemy.isWaveBoss) {
                bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
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
                        const speed = 3;
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
                    speed: 1.5 + wave * 0.1,
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
                    createExplosion(enemy.x, enemy.y);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
                        bossDefeated = true;
                        player.lives = Math.min(5, player.lives + 1);
                        bossClaws = [];
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    enemies.splice(ei, 1);
                } else {
                    hitMarkers.push({ x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y, timer: 12 });
                    createExplosion(enemy.x, enemy.y, 4);
                }
            }
        }
    }
    
    // Update explosions
    // Converted from forEach to for (reverse for safe splice)
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.x += exp.vx;
        exp.y += exp.vy;
        exp.vx *= 0.95;
        exp.vy *= 0.95;
        exp.life -= exp.decay;
        if (exp.life <= 0) {
            explosions.splice(i, 1);
        }
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
                        createExplosion(enemy.x, enemy.y);
                        if (enemy.isWaveBoss) {
                            spawnPowerup(enemy.x, enemy.y, true);
                            bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
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
                        createExplosion(enemy.x, enemy.y);
                        if (enemy.isWaveBoss) {
                            spawnPowerup(enemy.x, enemy.y, true);
                            bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
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
                createExplosion(m.x, m.y, 6);
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
                createExplosion(m.x, m.y, 8);
                
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
                    createExplosion(enemy.x, enemy.y);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
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
                playerBullets.splice(bi, 1);
                
                if (enemy.hp <= 0) {
                    score += enemy.score;
                    comboCount++;
                    comboTimer = 90;
                    if (comboCount >= 5) comboText = comboCount + 'x COMBO!';
                    createExplosion(enemy.x, enemy.y);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
                        bossDefeated = true;
                        bossClaws = [];
                        player.lives = Math.min(5, player.lives + 1);
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    enemies.splice(ei, 1);
                } else {
                    hitMarkers.push({ x: enemy.x + (Math.random() - 0.5) * 20, y: enemy.y, timer: 12 });
                    createExplosion(enemy.x, enemy.y, 4);
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
                    createExplosion(player.x, player.y, 6);
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
                createExplosion(enemy.x, enemy.y);
                if (enemy.isWaveBoss) {
                    bossActive = false;
                            screenShake = Math.max(screenShake, 20); screenShakeIntensity = 8;
                    bossDefeated = true;
                    bossClaws = [];
                }
                enemies.splice(ei, 1);
                if (player.shieldActive && !player.vPowerActive) {
                    // Shield absorbs the hit
                    player.shieldActive = false;
                    player.shieldTimer = 0;
                    createExplosion(player.x, player.y, 6);
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
    if (laserBeams.length === 0) return;
    
    const startX = player.x;
    const startY = player.y - player.height / 2;
    
    // Laser colors based on level
    const laserColors = [
        { outer: 'rgba(100, 200, 255, ', core: '#88CCFF', inner: '#CCEEFF', glow: '0, 200, 255' },  // Lv1: Cyan
        { outer: 'rgba(80, 180, 255, ', core: '#66BBFF', inner: '#BBEEFF', glow: '0, 180, 255' },   // Lv2: Blue
        { outer: 'rgba(150, 130, 255, ', core: '#AA88FF', inner: '#DDCCFF', glow: '130, 100, 255' }, // Lv3: Purple
        { outer: 'rgba(255, 180, 50, ', core: '#FFAA22', inner: '#FFEEAA', glow: '255, 160, 0' },   // Lv4: Gold
        { outer: 'rgba(255, 80, 80, ', core: '#FF4444', inner: '#FFAAAA', glow: '255, 50, 50' },    // Lv5: Red
    ];
    const lc = laserColors[Math.min(laserLevel, laserColors.length - 1)];
    
    for (let beamIdx = laserBeams.length - 1; beamIdx >= 0; beamIdx--) {
        const beam = laserBeams[beamIdx];
        if (!beam.targetEnemy) continue;
        
        const endX = beam.targetX;
        const endY = beam.targetY;
        
        ctx.save();
        
        const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const curveOffset = Math.min(dist * 0.06, 25);
        const perpX = -(endY - startY) / (dist || 1) * curveOffset;
        const perpY = (endX - startX) / (dist || 1) * curveOffset;
        const phase = frameCount * 0.04 + beamIdx * 1.5;
        const ctrlX = midX + perpX * Math.sin(phase);
        const ctrlY = midY + perpY * Math.sin(phase);
        
        // Layer 1: Wide ambient glow
        ctx.shadowColor = 'rgb(' + lc.glow + ')';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = lc.outer + '0.08)';
        ctx.lineWidth = 8 + laserLevel;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
        
        // Layer 2: Outer beam
        ctx.shadowBlur = 12;
        ctx.strokeStyle = lc.outer + '0.18)';
        ctx.lineWidth = 5 + laserLevel * 0.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
        
        // Layer 3: Main beam
        const beamThickness = 2.5 + laserLevel * 0.7;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = lc.core;
        ctx.lineWidth = beamThickness;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
        
        // Layer 4: Bright inner core
        ctx.shadowBlur = 4;
        ctx.strokeStyle = lc.inner;
        ctx.lineWidth = beamThickness * 0.45;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
        
        // Layer 5: White hot center
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = beamThickness * 0.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
        
        // Pulsing energy node at midpoint
        const pulseAlpha = 0.4 + Math.sin(frameCount * 0.15 + beamIdx) * 0.3;
        ctx.fillStyle = lc.outer + pulseAlpha + ')';
        ctx.shadowColor = 'rgb(' + lc.glow + ')';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(ctrlX, ctrlY, 3 + laserLevel, 0, Math.PI * 2);
        ctx.fill();
        
        // Impact point glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 20;
        ctx.shadowColor = lc.core;
        ctx.beginPath();
        ctx.arc(endX, endY, 5 + laserLevel * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Impact white center
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(endX, endY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Generate planet set based on current wave
// ============================================
// HYPERSPACE SYSTEM
// ============================================

function onBossDefeated() {
    // Clear all enemies and enemy bullets when final boss is destroyed
    enemies = [];
    enemyBullets = [];

    // Guard: prevent re-entry during active hyperspace
    if (hyperspaceActive) return;
    playerBullets = [];
    laserBeams = [];
    missiles = [];
    droneBullets = [];
    bossClaws = [];
    octopusTentacles = [];
    bossActive = false;
    bossIsFinalBoss = false;
    
    // Start hyperspace jump
    hyperspaceActive = true;
    hyperspaceTimer = HYPERSPACE_TOTAL;
    hyperspacePhase = 0;
    player.invincible = true;
    
    // Generate hyperspace star data for rain effect (top→bottom)
    hyperspaceStars = [];
    for (let i = 0; i < 250; i++) {
        const starY = -Math.random() * GAME_HEIGHT * 0.5; // Start above screen
        hyperspaceStars.push({
            x: Math.random() * GAME_WIDTH,
            y: starY,
            size: Math.random() * 3 + 0.8,
            baseX: Math.random() * GAME_WIDTH,
            baseY: -Math.random() * GAME_HEIGHT,
            vy: 1.5 + Math.random() * 3, // Downward velocity (starts slow)
            maxVy: 6 + Math.random() * 5, // Max speed during hyperjump
            trailLength: 0,
            hue: Math.random() < 0.7 ? 210 : Math.random() < 0.5 ? 180 : 30  // mostly blue/cyan
        });
    }
    
    // Big explosion at boss location
    screenShake = 30;
    screenShakeIntensity = 12;
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
    ctx.save();
    
    // Pure black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    const progress = 1 - (hyperspaceTimer / HYPERSPACE_TOTAL);
    
    // === TOP→BOTTOM RAIN STARS ===
    for (let i = hyperspaceStars.length - 1; i >= 0; i--) {
        const s = hyperspaceStars[i];
        if (s.trailLength < 0.5) {
            // Draw as tiny dot when barely moving
            ctx.fillStyle = 'rgba(200, 220, 255, ' + (0.3 + s.vy * 0.1) + ')';
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
            continue;
        }
        
        const length = s.trailLength;
        // Trail goes upward from star (star moves down, trail behind = upward)
        const endY = s.y - length;
        
        // Trail color: bright white-blue, fades with distance
        const alpha = Math.min(1, length / 120);
        const hue = s.hue + hyperspacePhase * 10;
        const lightness = 55 + hyperspacePhase * 25 + s.vy * 3;
        
        // Draw the trail line with glow
        ctx.shadowColor = 'hsla(' + hue + ', 100%, 70%, ' + (alpha * 0.7) + ')';
        ctx.shadowBlur = s.size * (2 + hyperspacePhase * 2);
        ctx.strokeStyle = 'hsla(' + hue + ', 80%, ' + lightness + '%, ' + alpha + ')';
        ctx.lineWidth = s.size * (0.8 + hyperspacePhase * 0.4);
        
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, endY);
        ctx.stroke();
        
        // Bright head at current position
        ctx.shadowBlur = s.size * (3 + hyperspacePhase * 3);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.7 + hyperspacePhase * 0.3) + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    
    // === VERTICAL LIGHT STREAK OVERLAY (phase 1) ===
    if (hyperspacePhase >= 1) {
        const overlayAlpha = (hyperspacePhase - 1) * 0.15 + progress * 0.2;
        // Subtle vertical gradient giving depth
        const vertGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        vertGrad.addColorStop(0, 'rgba(0, 10, 30, ' + (overlayAlpha * 0.8) + ')');
        vertGrad.addColorStop(0.3, 'rgba(20, 40, 80, ' + (overlayAlpha * 0.3) + ')');
        vertGrad.addColorStop(0.7, 'rgba(40, 60, 120, ' + (overlayAlpha * 0.15) + ')');
        vertGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = vertGrad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    
    // === PLAYER SHIP WITH THRUST ===
    if (player.y > -80 && player.y < GAME_HEIGHT + 100) {
        ctx.save();
        ctx.translate(player.x, player.y);
        
        // Ship glow aura
        const shipGlow = ctx.createRadialGradient(0, 0, 6, 0, 0, 35 + hyperspacePhase * 15);
        shipGlow.addColorStop(0, 'rgba(255, 255, 255, ' + (0.5 + hyperspacePhase * 0.3) + ')');
        shipGlow.addColorStop(0.5, 'rgba(100, 180, 255, ' + (0.25 + hyperspacePhase * 0.2) + ')');
        shipGlow.addColorStop(1, 'rgba(0, 40, 120, 0)');
        ctx.fillStyle = shipGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 35 + hyperspacePhase * 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Ship silhouette
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(200, 230, 255, 0.9)';
        ctx.shadowBlur = 12 + hyperspacePhase * 3;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-14, 7);
        ctx.lineTo(-5, 4);
        ctx.lineTo(-5, 14);
        ctx.lineTo(0, 18);
        ctx.lineTo(5, 14);
        ctx.lineTo(5, 4);
        ctx.lineTo(14, 7);
        ctx.closePath();
        ctx.fill();
        
        // Engine thrust flames below ship (downward)
        ctx.shadowBlur = 0;
        const thrustAlpha = 0.5 + hyperspacePhase * 0.4;
        for (let f = 0; f < 3; f++) {
            const fx = -6 + f * 6;
            const fy = 16;
            const flameLen = 8 + hyperspacePhase * 28 + Math.sin(frameCount * 0.5 + f) * 8;
            
            // Outer flame (orange)
            const flameGrad = ctx.createLinearGradient(fx, fy, fx, fy + flameLen);
            flameGrad.addColorStop(0, 'rgba(255, 200, 50, ' + thrustAlpha + ')');
            flameGrad.addColorStop(0.4, 'rgba(255, 120, 20, ' + (thrustAlpha * 0.7) + ')');
            flameGrad.addColorStop(1, 'rgba(255, 40, 0, 0)');
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(fx - 3, fy);
            ctx.lineTo(fx + 3, fy);
            ctx.lineTo(fx + 1, fy + flameLen);
            ctx.lineTo(fx - 1, fy + flameLen);
            ctx.closePath();
            ctx.fill();
            
            // Inner core (white-yellow)
            const innerGrad = ctx.createLinearGradient(fx, fy, fx, fy + flameLen * 0.6);
            innerGrad.addColorStop(0, 'rgba(255, 255, 255, ' + (thrustAlpha * 0.8) + ')');
            innerGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.moveTo(fx - 1.5, fy + 2);
            ctx.lineTo(fx + 1.5, fy + 2);
            ctx.lineTo(fx, fy + flameLen * 0.55);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // === STAGE CLEAR TEXT ===
    if (hyperspacePhase < 2 && hyperspaceTimer > 15) {
        const textAlpha = hyperspaceTimer > HYPERSPACE_TOTAL * 0.8 ? 
            (HYPERSPACE_TOTAL - hyperspaceTimer) / (HYPERSPACE_TOTAL * 0.2) : 
            Math.min(1, hyperspaceTimer / 50);
        
        ctx.save();
        ctx.globalAlpha = textAlpha;
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 18;
        ctx.fillText('STAGE ' + (currentStage) + ' CLEAR', GAME_WIDTH / 2, GAME_HEIGHT * 0.72);
        ctx.shadowBlur = 0;
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = '#88CCFF';
        ctx.fillText('WARPING TO ' + PLANET_THEMES[(currentPlanetIndex + 1) % PLANET_THEMES.length].name, GAME_WIDTH / 2, GAME_HEIGHT * 0.72 + 28);
        ctx.textAlign = 'left';
        ctx.restore();
    }
    
    ctx.restore();
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
function drawMainPlanet(planet) {
    const theme = PLANET_THEMES[planet.themeIndex];
    const px = planet.x;
    const py = planet.y;
    const pr = planet.radius;
    const distanceAlpha = 1;
    
    ctx.save();
    
    // Atmospheric glow
    const atmoGrad = ctx.createRadialGradient(px, py - pr * 0.4, pr * 0.2, px, py, pr * 1.6);
    atmoGrad.addColorStop(0, 'rgba(' + theme.glow + ', 0.5)');
    atmoGrad.addColorStop(0.4, 'rgba(' + theme.glow + ', 0.2)');
    atmoGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr * 1.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Planet body with gradient
    const bodyGrad = ctx.createRadialGradient(px - pr * 0.15, py - pr * 0.35, pr * 0.05, px, py, pr * 1.05);
    bodyGrad.addColorStop(0, lightenHex(theme.body, 35));
    bodyGrad.addColorStop(0.3, theme.body);
    bodyGrad.addColorStop(0.7, theme.accent);
    bodyGrad.addColorStop(1, darkenHex(theme.accent, 45));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
    
    // Surface details
    for (let c = 0; c < planet.craters; c++) {
        const cx = px + (Math.sin(planet.phase + c * 1.7) * pr * 0.55);
        const cy = py - pr * 0.25 + (Math.cos(planet.phase + c * 2.1) * pr * 0.28);
        const cr = pr * 0.04 + c * pr * 0.015;
        if (cy < GAME_HEIGHT + pr) {
            ctx.fillStyle = darkenHex(theme.body, 25);
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = lightenHex(theme.body, 12);
            ctx.beginPath();
            ctx.arc(cx - cr * 0.3, cy - cr * 0.3, cr * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Surface bands/lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = pr * 0.06;
    for (let b = 0; b < 3; b++) {
        const by = py - pr * 0.2 + b * pr * 0.2;
        if (by < GAME_HEIGHT + 50) {
            ctx.beginPath();
            ctx.arc(px, by, pr * 0.85 + b * pr * 0.03, 0, Math.PI);
            ctx.stroke();
        }
    }
    
    // Ring
    if (theme.hasRing) {
        const ringY = py - pr * 0.6;
        ctx.strokeStyle = theme.ring;
        ctx.lineWidth = pr * 0.045;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.ellipse(px, ringY, pr * 1.35, pr * 0.18, -0.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = pr * 0.02;
        ctx.strokeStyle = theme.ring.replace(/0\.\d+/, '0.8');
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.ellipse(px, ringY, pr * 1.35, pr * 0.18, -0.22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    // Moon
    if (theme.hasMoon) {
        const moonX = px + pr * 1.2 + Math.sin(frameCount * 0.005) * pr * 0.1;
        const moonY = py - pr * 0.5;
        const moonR = pr * 0.11;
        const moonGrad = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.1, moonX, moonY, moonR);
        moonGrad.addColorStop(0, '#FFFFFF');
        moonGrad.addColorStop(0.4, theme.moonColor || '#CCCCCC');
        moonGrad.addColorStop(1, darkenHex(theme.moonColor || '#888888', 50));
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

function drawBackground() {
    // Deep space gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#0a0a1e');
    gradient.addColorStop(0.3, '#12122a');
    gradient.addColorStop(0.6, '#16163a');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Boss tint overlay (reddish during boss fights)
    if (bossIsFinalBoss && bossActive) {
        if (bossIsFinalBoss) bossHPBarAlpha = Math.min(1, bossHPBarAlpha + 0.02);
        ctx.fillStyle = 'rgba(60, 0, 0, ' + (0.06 + Math.sin(frameCount * 0.03) * 0.03) + ')';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        if (!bossIsFinalBoss || !bossActive) bossHPBarAlpha = Math.max(0, bossHPBarAlpha - 0.03);
    }

    // === NEBULA for current planet ===
    if (planets.length > 0 && planets[0].isMainPlanet) {
        const theme = PLANET_THEMES[planets[0].themeIndex];
        const nebulaGrad = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT * 0.6, 30, GAME_WIDTH / 2, GAME_HEIGHT * 0.6, GAME_HEIGHT);
        nebulaGrad.addColorStop(0, theme.nebula);
        nebulaGrad.addColorStop(0.5, theme.nebula.replace('0.0', '0.03'));
        nebulaGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // Draw main planet (large, at bottom of screen)
        if (planets.length > 0 && planets[0].isMainPlanet) {
            drawMainPlanet(planets[0]);
        }
    }

    // === BACKGROUND PLANETS (small) ===
    for (let pi = 1; pi < planets.length; pi++) {
        const planet = planets[pi];
        // Update planet position
        planet.y += planet.speed;
        planet.phase += planet.speed * 0.01;
        if (planet.y > GAME_HEIGHT + 80) {
            planet.y = -80;
            planet.x = Math.random() * GAME_WIDTH;
            planet.radius = 15 + Math.random() * 35;
            planet.speed = 0.3 + Math.random() * 0.8;
            planet.distance = Math.random();
            planet.waveType = Math.floor(Math.random() * 3);
            planet.themeIndex = Math.floor(Math.random() * PLANET_THEMES.length);
        }

        // Distance-based rendering
        const distanceAlpha = 1 - planet.distance * 0.6;
        const distanceScale = 1 - planet.distance * 0.4;
        const r = planet.radius * distanceScale;
        const px = planet.x;
        const py = planet.y;
        const theme = PLANET_THEMES[planet.themeIndex];

        ctx.save();
        ctx.globalAlpha = distanceAlpha;

        // Atmospheric glow
        const glowGrad = ctx.createRadialGradient(px, py, r * 0.8, px, py, r * 1.8);
        glowGrad.addColorStop(0, 'rgba(' + theme.glow + ', 0.35)');
        glowGrad.addColorStop(1, 'rgba(' + theme.glow + ', 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(px, py, r * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        const bodyGrad = ctx.createRadialGradient(px - r * 0.25, py - r * 0.25, r * 0.1, px, py, r);
        const bc = theme.body;
        bodyGrad.addColorStop(0, lightenHex(bc, 40));
        bodyGrad.addColorStop(0.6, bc);
        bodyGrad.addColorStop(1, darkenHex(bc, 50));
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();

        // Surface details - craters
        for (let c = 0; c < planet.craters; c++) {
            const cx = px + (Math.sin(planet.phase + c * 1.7) * r * 0.5);
            const cy = py + (Math.cos(planet.phase + c * 2.1) * r * 0.4);
            const cr = r * 0.08 + c * r * 0.02;
            ctx.fillStyle = darkenHex(bc, 30);
            ctx.beginPath();
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = lightenHex(bc, 15);
            ctx.beginPath();
            ctx.arc(cx - cr * 0.25, cy - cr * 0.25, cr * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ring
        if (theme.hasRing) {
            ctx.strokeStyle = theme.ring;
            ctx.lineWidth = r * 0.06;
            ctx.globalAlpha = distanceAlpha * 0.5;
            ctx.beginPath();
            ctx.ellipse(px, py, r * 1.5, r * 0.35, -0.35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.lineWidth = r * 0.03;
            ctx.globalAlpha = distanceAlpha * 0.3;
            ctx.beginPath();
            ctx.ellipse(px, py, r * 1.7, r * 0.42, -0.35, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Moon
        if (theme.hasMoon) {
            const moonAngle = planet.phase * 0.8;
            const moonDist = r * 1.35;
            const moonX = px + Math.cos(moonAngle) * moonDist;
            const moonY = py + Math.sin(moonAngle) * moonDist * 0.5;
            const moonR = r * 0.18;
            ctx.fillStyle = theme.moonColor;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
            ctx.fill();
            // Moon crater
            ctx.fillStyle = darkenHex(theme.moonColor, 30);
            ctx.beginPath();
            ctx.arc(moonX + moonR * 0.3, moonY - moonR * 0.2, moonR * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // === BACKGROUND STARS (tiny, slow-scrolling) ===
    for (let si = 0; si < bgStars.length; si++) {
        const s = bgStars[si];
        s.y += s.sp;
        if (s.y > GAME_HEIGHT + 5) { s.y = -5; s.x = Math.random() * GAME_WIDTH; }
        s.tw += 0.03;
        ctx.fillStyle = "rgba(200, 210, 255, " + (0.3 + 0.3 * Math.sin(s.tw)) + ")";
        ctx.fillRect(s.x, s.y, s.sz, s.sz);
    }

    // === CLOUD LAYER (slow-moving nebula wisps) ===
    for (let ci = 0; ci < cloudLayer.length; ci++) {
        const cl = cloudLayer[ci];
        cl.y += cl.sp;
        if (cl.y > GAME_HEIGHT + 60) { cl.y = -60; cl.x = Math.random() * GAME_WIDTH; cl.w = Math.random() * 120 + 80; }
        ctx.fillStyle = "rgba(40, 30, 80, " + cl.al + ")";
        ctx.beginPath();
        ctx.ellipse(cl.x, cl.y, cl.w, 15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // === STARS (twinkling) ===
    for (let si = 0; si < stars.length; si++) {
        const star = stars[si];
        star.y += star.sp;
        if (star.y > GAME_HEIGHT + 5) { star.y = -5; star.x = Math.random() * GAME_WIDTH; }
        star.tw += 0.05;
        const twinkle = 0.3 + Math.sin(frameCount * 0.05 + si) * 0.25 + Math.random() * 0.1;
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = '#FFFFFF';
        if (star.size > 1.5) {
            // Bigger stars get a subtle cross shape
            ctx.fillStyle = '#E8E8FF';
            ctx.fillRect(star.x - star.size * 0.8, star.y - star.size * 0.2, star.size * 1.6, star.size * 0.4);
            ctx.fillRect(star.x - star.size * 0.2, star.y - star.size * 0.8, star.size * 0.4, star.size * 1.6);
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Subtle nebula clouds at very top
    ctx.globalAlpha = 0.04;
    for (let n = 0; n < 3; n++) {
        const nx = (frameCount * 0.1 + n * 160) % (GAME_WIDTH + 200) - 100;
        const ny = 20 + n * 40;
        ctx.fillStyle = n === 0 ? '#8844AA' : n === 1 ? '#4466AA' : '#AA4488';
        ctx.beginPath();
        ctx.ellipse(nx, ny, 120, 25, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
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
    if (!player.visible) return;
    
    ctx.save();
    
    
    // P Ultimate Shield - yellow glowing bubble
    if (pUltimateActive && pUltimateAlpha > 0 && player.activeWeapon === 'P') {
        const shieldAlpha = pUltimateAlpha * 0.6;
        const pulse = 1 + Math.sin(frameCount * 0.3) * 0.15;
        const shieldRadius = 55 * pulse;
        
        // Outer glow ring
        ctx.globalAlpha = shieldAlpha * 0.4;
        ctx.beginPath();
        ctx.arc(player.x, player.y, shieldRadius + 15, 0, Math.PI * 2);
        const outerGlow = ctx.createRadialGradient(player.x, player.y, shieldRadius, player.x, player.y, shieldRadius + 15);
        outerGlow.addColorStop(0, '#FFD700');
        outerGlow.addColorStop(0.5, '#FFA500');
        outerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGlow;
        ctx.fill();
        
        // Main shield ring
        ctx.globalAlpha = shieldAlpha * 0.7;
        ctx.beginPath();
        ctx.arc(player.x, player.y, shieldRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4 * pulse;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.stroke();
        
        // Inner bright ring
        ctx.globalAlpha = shieldAlpha * 0.5;
        ctx.beginPath();
        ctx.arc(player.x, player.y, shieldRadius - 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFFF88';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.stroke();
        
        // Sparkle particles on shield
        ctx.globalAlpha = shieldAlpha * 0.8;
        const sparkleCount = 8;
        for (let s = 0; s < sparkleCount; s++) {
            const angle = (frameCount * 0.04 + s * Math.PI * 2 / sparkleCount) % (Math.PI * 2);
            const sx = player.x + Math.cos(angle) * shieldRadius;
            const sy = player.y + Math.sin(angle) * shieldRadius;
            const sparkleSize = 3 + Math.sin(frameCount * 0.2 + s) * 2;
            ctx.beginPath();
            ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFAA';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 8;
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
    ctx.translate(player.x, player.y);
    
    // V power effect - EAGLE TRANSFORMATION
    if (player.vPowerActive) {
        ctx.globalAlpha = 0.8 + Math.sin(frameCount * 0.3) * 0.2;
        ctx.scale(1.8, 1.8); // Much bigger eagle
        
        // Eagle body - dark brown
        ctx.fillStyle = '#4A3728';
        ctx.strokeStyle = '#2A1F14';
        ctx.lineWidth = 2;
        
        // Wing flap animation
        const wingPhase = Math.sin(frameCount * 0.25);
        const wingSpread = 18 + wingPhase * 8; // wings go up and down
        
        // Left wing (flapping)
        ctx.save();
        ctx.translate(-8, -2);
        ctx.rotate(-0.4 + wingPhase * 0.3);
        ctx.fillStyle = '#5C4033';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-wingSpread, -8);
        ctx.lineTo(-wingSpread - 4, 2);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3A2718';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        
        // Right wing (flapping - opposite phase)
        ctx.save();
        ctx.translate(8, -2);
        ctx.rotate(0.4 - wingPhase * 0.3);
        ctx.fillStyle = '#5C4033';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(wingSpread, -8);
        ctx.lineTo(wingSpread + 4, 2);
        ctx.lineTo(4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3A2718';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
        
        // Eagle head
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, -6, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3A2718';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Golden beak
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#CC9900';
        ctx.beginPath();
        ctx.moveTo(5, -10);
        ctx.lineTo(12, -6);
        ctx.lineTo(5, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(2, -10, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(2, -10, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Eagle body
        ctx.fillStyle = '#5C4033';
        ctx.beginPath();
        ctx.ellipse(0, 3, 7, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3A2718';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Chest feathers (lighter)
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(0, 5, 4, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail feathers
        ctx.fillStyle = '#3A2718';
        ctx.beginPath();
        ctx.moveTo(-4, 13);
        ctx.lineTo(-8, 20);
        ctx.lineTo(0, 16);
        ctx.lineTo(8, 20);
        ctx.lineTo(4, 13);
        ctx.closePath();
        ctx.fill();
        
        // Talons
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-4, 12);
        ctx.lineTo(-7, 16);
        ctx.moveTo(-4, 12);
        ctx.lineTo(-3, 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(4, 12);
        ctx.lineTo(7, 16);
        ctx.moveTo(4, 12);
        ctx.lineTo(3, 18);
        ctx.stroke();
        
        ctx.lineWidth = 1;
    }
    
    // Shield bubble
    if (player.shieldActive) {
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = 0.6 + Math.sin(frameCount * 0.1) * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner shield ring
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    
    // Glow effect
    if (!player.vPowerActive) {
        ctx.shadowColor = COLORS.player;
        ctx.shadowBlur = 15;
    }
    
    // Main body - Advanced futuristic fighter jet
    if (!player.vPowerActive) {
        // === ENGINE GLOW (behind body) ===
        const engineGlow = ctx.createRadialGradient(0, 18, 2, 0, 28, 14);
        engineGlow.addColorStop(0, "rgba(100, 200, 255, 0.9)");
        engineGlow.addColorStop(0.4, "rgba(30, 144, 255, 0.5)");
        engineGlow.addColorStop(1, "rgba(0, 0, 50, 0)");
        ctx.fillStyle = engineGlow;
        ctx.beginPath();
        ctx.arc(0, 22, 16, 0, Math.PI * 2);
        ctx.fill();
    
        // === MAIN FUSELAGE - sleek arrowhead shape ===
        const bodyGrad = ctx.createLinearGradient(0, -22, 0, 20);
        bodyGrad.addColorStop(0, "#E8E8F0");
        bodyGrad.addColorStop(0.3, "#C0C8D8");
        bodyGrad.addColorStop(0.6, "#6078A0");
        bodyGrad.addColorStop(1, "#304878");
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.bezierCurveTo(-8, -18, -14, -4, -12, 10);
        ctx.lineTo(-6, 16);
        ctx.lineTo(0, 22);
        ctx.lineTo(6, 16);
        ctx.lineTo(12, 10);
        ctx.bezierCurveTo(14, -4, 8, -18, 0, -24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#8898C0";
        ctx.lineWidth = 1;
        ctx.stroke();
    
        // === ARMOR PANEL LINES ===
        ctx.strokeStyle = "rgba(180, 200, 230, 0.5)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-5, -16);
        ctx.lineTo(-8, 8);
        ctx.moveTo(5, -16);
        ctx.lineTo(8, 8);
        ctx.moveTo(-3, -8);
        ctx.lineTo(3, -8);
        ctx.stroke();
    
        // === SWEPT WINGS - angular futuristic ===
        ctx.fillStyle = "#405878";
        ctx.strokeStyle = "#6888B0";
        ctx.lineWidth = 1;
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(-28, -10);
        ctx.lineTo(-26, -4);
        ctx.lineTo(-22, 2);
        ctx.lineTo(-8, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Right wing
        ctx.beginPath();
        ctx.moveTo(6, -2);
        ctx.lineTo(28, -10);
        ctx.lineTo(26, -4);
        ctx.lineTo(22, 2);
        ctx.lineTo(8, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    
        // === WING EDGE HIGHLIGHTS ===
        ctx.strokeStyle = "rgba(180, 210, 255, 0.6)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(-6, -2);
        ctx.lineTo(-28, -10);
        ctx.moveTo(6, -2);
        ctx.lineTo(28, -10);
        ctx.stroke();
    
        // === CANARDS (small front wings) ===
        ctx.fillStyle = "#506888";
        ctx.beginPath();
        ctx.moveTo(-4, -16);
        ctx.lineTo(-16, -20);
        ctx.lineTo(-12, -14);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(4, -16);
        ctx.lineTo(16, -20);
        ctx.lineTo(12, -14);
        ctx.closePath();
        ctx.fill();
    
        // === COCKPIT - glowing blue canopy ===
        const cockpitGrad = ctx.createLinearGradient(0, -14, 0, -2);
        cockpitGrad.addColorStop(0, "#88CCFF");
        cockpitGrad.addColorStop(0.5, "#44AADD");
        cockpitGrad.addColorStop(1, "#2266AA");
        ctx.fillStyle = cockpitGrad;
        ctx.beginPath();
        ctx.ellipse(0, -8, 5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#AADDFF";
        ctx.lineWidth = 0.8;
        ctx.stroke();
    
        // Cockpit reflection
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.ellipse(-1, -10, 2, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
    
        // === ENGINE NOZZLES ===
        ctx.fillStyle = "#203050";
        ctx.fillRect(-4, 18, 3, 5);
        ctx.fillRect(1, 18, 3, 5);
    
        // === ENGINE FLAME (animated) ===
        const flameLen = 8 + Math.random() * 6;
        const flameGrad = ctx.createLinearGradient(0, 20, 0, 20 + flameLen);
        flameGrad.addColorStop(0, "rgba(100, 180, 255, 0.9)");
        flameGrad.addColorStop(0.3, "rgba(60, 140, 255, 0.7)");
        flameGrad.addColorStop(0.7, "rgba(20, 80, 255, 0.3)");
        flameGrad.addColorStop(1, "rgba(0, 20, 100, 0)");
        ctx.fillStyle = flameGrad;
        ctx.beginPath();
        ctx.moveTo(-3, 20);
        ctx.lineTo(3, 20);
        ctx.lineTo(1, 20 + flameLen);
        ctx.lineTo(-1, 20 + flameLen);
        ctx.closePath();
        ctx.fill();
    
        // === SECONDARY FLAME (blue-white core) ===
        const coreLen = 5 + Math.random() * 3;
        ctx.fillStyle = "rgba(200, 230, 255, 0.8)";
        ctx.beginPath();
        ctx.moveTo(-1.5, 20);
        ctx.lineTo(1.5, 20);
        ctx.lineTo(0, 20 + coreLen);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
    }
    
    function drawOctopusTentacles() {
        for (let ti = 0; ti < octopusTentacles.length; ti++) {
            const tentacle = octopusTentacles[ti];
            if (!tentacle.active || tentacle.length <= 0) continue;
            
            const startX = tentacle.x;
            const startY = tentacle.y;
            const endY = startY + tentacle.length;
            
            ctx.save();
            
            // Tentacle body - green/purple alien colors
            ctx.strokeStyle = '#4A7A3B';
            ctx.lineWidth = 5;
            ctx.shadowColor = '#88FF44';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            // Wavy tentacle
            const waveAmp = 12 * (tentacle.length / tentacle.maxLength);
            for (let seg = 0; seg <= 8; seg++) {
                const t = seg / 8;
                const segY = startY + t * tentacle.length;
                const segX = startX + Math.sin(t * Math.PI * 3 + frameCount * 0.1) * waveAmp;
                ctx.lineTo(segX, segY);
            }
            ctx.stroke();
            
            // Outer glow layer
            ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
            ctx.lineWidth = 9;
            ctx.stroke();
            
            // Tentacle tip - spiky sucker
            const tipX = startX + Math.sin(Math.PI * 3 + frameCount * 0.1) * waveAmp;
            const tipY = endY;
            
            ctx.fillStyle = '#CC00CC';
            ctx.shadowColor = '#FF00FF';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(tipX, tipY, 7, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner tip
            ctx.fillStyle = '#FF66FF';
            ctx.beginPath();
            ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    function drawBossClaw() {
        for (let ci = 0; ci < bossClaws.length; ci++) {
            const claw = bossClaws[ci];
            if (!claw.active || claw.length <= 0) continue;
            
            const startY = 0;
            const endY = claw.length;
            const x = claw.x;
            
            ctx.save();
            
            // Main claw arm - metallic gray
            ctx.strokeStyle = '#AAAAAA';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#888888';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
            
            // Claw tip - pincer
            const tipSize = 12;
            ctx.fillStyle = '#CC0000';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 6;
            
            // Left pincer
            ctx.beginPath();
            ctx.moveTo(x, endY);
            ctx.lineTo(x - tipSize, endY + tipSize * 1.5);
            ctx.lineTo(x - 3, endY + 3);
            ctx.closePath();
            ctx.fill();
            
            // Right pincer
            ctx.beginPath();
            ctx.moveTo(x, endY);
            ctx.lineTo(x + tipSize, endY + tipSize * 1.5);
            ctx.lineTo(x + 3, endY + 3);
            ctx.closePath();
            ctx.fill();
            
            // Glowing red tip
            ctx.beginPath();
            ctx.arc(x, endY, 7, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fill();
            
            ctx.restore();
        }
    }
    
    function drawEnemy(enemy) {
    ctx.save();
        ctx.translate(enemy.x, enemy.y);
        
        ctx.shadowColor = enemy.type === 'boss' ? '#FF0000' : COLORS.enemy;
        ctx.shadowBlur = 10;
        
        switch (enemy.type) {
            case 'scout':
                // Alien scout - small UFO disc shape
                // Outer ring
                ctx.fillStyle = '#8866AA';
                ctx.beginPath();
                ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#AA88CC';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // Dome top
                const domeGrad = ctx.createLinearGradient(0, -8, 0, 0);
                domeGrad.addColorStop(0, '#CCAAEE');
                domeGrad.addColorStop(1, '#664488');
                ctx.fillStyle = domeGrad;
                ctx.beginPath();
                ctx.ellipse(0, -3, 8, 7, 0, Math.PI, 0);
                ctx.fill();
                // Glowing core
                ctx.fillStyle = '#FF66FF';
                ctx.shadowColor = '#FF00FF';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(0, 1, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Bottom lights
                ctx.fillStyle = '#FFAAFF';
                for (let bl = 0; bl < 4; bl++) {
                    const ba = (Math.PI * 2 / 4) * bl + frameCount * 0.05;
                    ctx.beginPath();
                    ctx.arc(Math.cos(ba) * 12, 3, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'fighter':
                // Alien fighter - aggressive angular interceptor
                // Main hull - dark metallic
                const fGrad = ctx.createLinearGradient(0, -18, 0, 18);
                fGrad.addColorStop(0, '#4A4A5A');
                fGrad.addColorStop(0.5, '#2A2A3A');
                fGrad.addColorStop(1, '#1A1A2A');
                ctx.fillStyle = fGrad;
                ctx.beginPath();
                ctx.moveTo(0, -20);
                ctx.lineTo(-8, -8);
                ctx.lineTo(-10, 8);
                ctx.lineTo(-4, 16);
                ctx.lineTo(0, 18);
                ctx.lineTo(4, 16);
                ctx.lineTo(10, 8);
                ctx.lineTo(8, -8);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#666688';
                ctx.lineWidth = 1;
                ctx.stroke();
                // Angular wings
                ctx.fillStyle = '#3A3A4A';
                ctx.beginPath();
                ctx.moveTo(-8, -4);
                ctx.lineTo(-24, -12);
                ctx.lineTo(-20, -2);
                ctx.lineTo(-8, 4);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(8, -4);
                ctx.lineTo(24, -12);
                ctx.lineTo(20, -2);
                ctx.lineTo(8, 4);
                ctx.closePath();
                ctx.fill();
                // Glowing engine
                ctx.fillStyle = '#FF4444';
                ctx.shadowColor = '#FF0000';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(0, 16, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Cockpit slit
                ctx.fillStyle = '#FF6644';
                ctx.beginPath();
                ctx.ellipse(0, -6, 3, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'bomber':
                // Alien heavy bomber - bulky organic-mechanical hybrid
                // Main body - bulbous
                const bGrad = ctx.createRadialGradient(0, -2, 4, 0, 0, 22);
                bGrad.addColorStop(0, '#5A4A3A');
                bGrad.addColorStop(0.6, '#3A2A1A');
                bGrad.addColorStop(1, '#1A0A00');
                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.ellipse(0, 0, 20, 22, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#7A6A5A';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // Armor plates
                ctx.strokeStyle = 'rgba(150, 130, 100, 0.4)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(-16, -8);
                ctx.lineTo(16, -8);
                ctx.moveTo(-18, 2);
                ctx.lineTo(18, 2);
                ctx.moveTo(-14, 10);
                ctx.lineTo(14, 10);
                ctx.stroke();
                // Side pods (bomb bays)
                ctx.fillStyle = '#2A1A0A';
                ctx.beginPath();
                ctx.ellipse(-18, 4, 7, 10, -0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(18, 4, 7, 10, 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Glowing vents on pods
                ctx.fillStyle = '#FF6600';
                ctx.shadowColor = '#FF4400';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(-18, 10, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(18, 10, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Central eye/cockpit
                ctx.fillStyle = '#FF3300';
                ctx.beginPath();
                ctx.arc(0, -4, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FFAA00';
                ctx.beginPath();
                ctx.arc(0, -4, 3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'octopus':
                // Alien octopus mid-boss - spiky shape with tentacles
                const octoSize = enemy.width / 2;
                
                // Body - dark green spiky octopus shape
                ctx.fillStyle = '#2D5A1E';
                ctx.beginPath();
                const spikes = 8;
                for (let s = 0; s < spikes; s++) {
                    const angle = (Math.PI * 2 / spikes) * s + enemy.phase * 0.5;
                    const r1 = octoSize * 0.7;
                    const r2 = octoSize * 1.1;
                    ctx.lineTo(Math.cos(angle - 0.2) * r1, Math.sin(angle - 0.2) * r1);
                    ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#1A3A0A';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Inner body
                ctx.fillStyle = '#3D8B2E';
                ctx.beginPath();
                ctx.arc(0, 0, octoSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                // Glowing eyes
                ctx.fillStyle = '#FF0000';
                ctx.shadowColor = '#FF0000';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(-octoSize * 0.25, -octoSize * 0.15, 5, 0, Math.PI * 2);
                ctx.arc(octoSize * 0.25, -octoSize * 0.15, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Pupils
                ctx.fillStyle = '#000000';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(-octoSize * 0.25, -octoSize * 0.15, 2, 0, Math.PI * 2);
                ctx.arc(octoSize * 0.25, -octoSize * 0.15, 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Small tentacles around body
                ctx.strokeStyle = '#3D8B2E';
                ctx.lineWidth = 2;
                for (let t = 0; t < 6; t++) {
                    const tAngle = (Math.PI * 2 / 6) * t + Math.sin(frameCount * 0.08 + t) * 0.4;
                    const tx = Math.cos(tAngle) * octoSize * 0.8;
                    const ty = Math.sin(tAngle) * octoSize * 0.8;
                    ctx.beginPath();
                    ctx.moveTo(tx, ty);
                    ctx.lineTo(tx * 1.5, ty * 1.5);
                    ctx.stroke();
                }
                ctx.lineWidth = 1;
                break;
                
            case 'boss':
                // Alien mothership - imposing geometric design
                const isWaveBoss = enemy.isWaveBoss || false;
                const sizeMult = isWaveBoss ? 1.4 : 1;
                const bs = 35 * sizeMult;
                
                // Outer hull - dark geometric
                const bossGrad = ctx.createLinearGradient(0, -bs, 0, bs);
                bossGrad.addColorStop(0, '#3A1A2A');
                bossGrad.addColorStop(0.3, '#5A2A3A');
                bossGrad.addColorStop(0.6, '#2A0A1A');
                bossGrad.addColorStop(1, '#1A000A');
                ctx.fillStyle = bossGrad;
                ctx.beginPath();
                // Hexagonal shape
                const hexSides = 6;
                for (let hs = 0; hs < hexSides; hs++) {
                    const ha = (Math.PI * 2 / hexSides) * hs - Math.PI / 2;
                    const hr = bs * (hs % 2 === 0 ? 1 : 0.85);
                    if (hs === 0) ctx.moveTo(Math.cos(ha) * hr, Math.sin(ha) * hr);
                    else ctx.lineTo(Math.cos(ha) * hr, Math.sin(ha) * hr);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#8A4A5A';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Inner geometric rings
                ctx.strokeStyle = 'rgba(180, 80, 100, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, bs * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(0, 0, bs * 0.45, 0, Math.PI * 2);
                ctx.stroke();
                
                // Core - pulsating energy
                const corePulse = 1 + Math.sin(frameCount * 0.08) * 0.2;
                const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 16 * sizeMult * corePulse);
                coreGrad.addColorStop(0, '#FF4444');
                coreGrad.addColorStop(0.4, '#CC2222');
                coreGrad.addColorStop(0.8, '#660000');
                coreGrad.addColorStop(1, 'rgba(50, 0, 0, 0)');
                ctx.fillStyle = coreGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 16 * sizeMult * corePulse, 0, Math.PI * 2);
                ctx.fill();
                
                // Central eye
                ctx.fillStyle = '#FF0000';
                ctx.shadowColor = '#FF0000';
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(0, 0, 8 * sizeMult, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FF8888';
                ctx.beginPath();
                ctx.arc(0, 0, 3 * sizeMult, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                
                // Side turrets
                for (let st = 0; st < 4; st++) {
                    const ta = (Math.PI * 2 / 4) * st + Math.PI / 4;
                    const tx = Math.cos(ta) * bs * 0.65;
                    const ty = Math.sin(ta) * bs * 0.65;
                    ctx.fillStyle = '#4A2A3A';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 6 * sizeMult, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#FF4444';
                    ctx.beginPath();
                    ctx.arc(tx, ty, 3 * sizeMult, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Eyes for wave boss
                if (isWaveBoss) {
                    ctx.fillStyle = '#FFAA00';
                    ctx.shadowColor = '#FFAA00';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(-10 * sizeMult, -8 * sizeMult, 5, 0, Math.PI * 2);
                    ctx.arc(10 * sizeMult, -8 * sizeMult, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000';
                    ctx.shadowBlur = 0;
                    ctx.beginPath();
                    ctx.arc(-10 * sizeMult, -8 * sizeMult, 2, 0, Math.PI * 2);
                    ctx.arc(10 * sizeMult, -8 * sizeMult, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // HP bar
                const hpBarW = isWaveBoss ? 80 : 60;
                const hpBarX = -hpBarW / 2;
                ctx.fillStyle = '#333';
                ctx.fillRect(hpBarX, -bs - 15, hpBarW, 8);
                const hpRatio = enemy.hp / enemy.maxHp;
                ctx.fillStyle = hpRatio > 0.5 ? '#FF0000' : hpRatio > 0.25 ? '#FF6600' : '#FF0000';
                ctx.fillRect(hpBarX, -bs - 15, hpBarW * hpRatio, 8);
                
                // Boss name for wave boss
                if (isWaveBoss) {
                    ctx.fillStyle = '#FFD700';
                    ctx.font = '8px "Press Start 2P", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('BOSS', 0, -bs - 22);
                }
                break;
                
            case 'rammer':
                // Alien rammer - aggressive spiky interceptor drone
                // Main body - sharp angular
                const rGrad = ctx.createLinearGradient(0, -16, 0, 16);
                rGrad.addColorStop(0, '#884444');
                rGrad.addColorStop(0.5, '#662222');
                rGrad.addColorStop(1, '#440000');
                ctx.fillStyle = rGrad;
                ctx.beginPath();
                ctx.moveTo(0, -18);
                ctx.lineTo(-10, -6);
                ctx.lineTo(-14, 6);
                ctx.lineTo(-6, 16);
                ctx.lineTo(0, 18);
                ctx.lineTo(6, 16);
                ctx.lineTo(14, 6);
                ctx.lineTo(10, -6);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#AA6666';
                ctx.lineWidth = 1;
                ctx.stroke();
                // Spiky protrusions
                ctx.fillStyle = '#993333';
                const spikeAngles = [-0.6, -0.2, 0.2, 0.6];
                for (let sa = 0; sa < spikeAngles.length; sa++) {
                    const sa2 = spikeAngles[sa];
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(sa2) * 12, Math.sin(sa2) * 12);
                    ctx.lineTo(Math.cos(sa2) * 22, Math.sin(sa2) * 22);
                    ctx.lineTo(Math.cos(sa2 + 0.15) * 14, Math.sin(sa2 + 0.15) * 14);
                    ctx.closePath();
                    ctx.fill();
                }
                // Glowing red eye
                ctx.fillStyle = '#FF0000';
                ctx.shadowColor = '#FF0000';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, -4, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FF6666';
                ctx.beginPath();
                ctx.arc(0, -4, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                // Engine trail glow
                const rTrail = ctx.createRadialGradient(0, 16, 2, 0, 22, 8);
                rTrail.addColorStop(0, 'rgba(255, 100, 50, 0.8)');
                rTrail.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = rTrail;
                ctx.beginPath();
                ctx.arc(0, 18, 10, 0, Math.PI * 2);
                ctx.fill();
                // HP bar
                ctx.fillStyle = '#333';
                ctx.fillRect(-24, -28, 48, 4);
                const rammerHpPct = enemy.hp / enemy.maxHp;
                ctx.fillStyle = rammerHpPct > 0.5 ? '#00FF00' : rammerHpPct > 0.25 ? '#FFD700' : '#FF4444';
                ctx.fillRect(-24, -28, 48 * rammerHpPct, 4);
                break;
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    function drawBullet(bullet, isEnemy) {
        ctx.save();
        
        if (isEnemy) {
            // Enemy bullet - fluorescent pink circle with glow
            ctx.fillStyle = COLORS.enemyBullet;
            ctx.shadowColor = COLORS.enemyBullet;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width / 2 + 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.width / 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Player bullet - glowing energy bolt (modern mobile shooter style)
            const bx = bullet.x;
            const by = bullet.y;
            const bw = bullet.width || 4;
            const bh = bullet.height || 16;
            const power = bullet.power || 1;
            
            // Determine color based on power level for visual variety
            let boltColor, boltCore, boltGlow;
            if (power >= 2.0) {
                boltColor = '#FFD700'; boltCore = '#FFFFFF'; boltGlow = 'rgba(255, 215, 0, ';
            } else if (power >= 1.5) {
                boltColor = '#FFAA00'; boltCore = '#FFEE88'; boltGlow = 'rgba(255, 170, 0, ';
            } else {
                boltColor = '#FF8800'; boltCore = '#FFDD66'; boltGlow = 'rgba(255, 136, 0, ';
            }
            
            // Outer glow halo
            ctx.shadowColor = boltColor;
            ctx.shadowBlur = 10 + power * 2;
            ctx.fillStyle = boltGlow + (0.25 + power * 0.08) + ')';
            ctx.fillRect(bx - bw - 3, by - bh/2 - 3, (bw + 3) * 2, bh + 6);
            
            // Mid glow layer
            ctx.shadowBlur = 6 + power;
            ctx.fillStyle = boltGlow + '0.55)';
            ctx.fillRect(bx - bw - 1, by - bh/2 - 1, (bw + 1) * 2, bh + 2);
            
            // Main bolt body with gradient
            const boltGrad = ctx.createLinearGradient(bx, by - bh/2, bx, by + bh/2);
            boltGrad.addColorStop(0, boltCore);
            boltGrad.addColorStop(0.3, boltColor);
            boltGrad.addColorStop(0.7, boltColor);
            boltGrad.addColorStop(1, boltCore);
            ctx.fillStyle = boltGrad;
            ctx.shadowBlur = 3;
            ctx.fillRect(bx - bw, by - bh/2, bw * 2, bh);
            
            // White-hot core line
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bx - bw * 0.35, by - bh * 0.4, bw * 0.7, bh * 0.8);
            
            // Sparkle tip (leading edge)
            ctx.fillStyle = boltCore;
            ctx.shadowColor = boltColor;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(bx, by - bh/2, bw * 0.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }
    
    function drawPowerup(pu) {
        ctx.save();
        ctx.translate(pu.x, pu.y);
        
        // Blinking effect
        ctx.globalAlpha = 0.5 + Math.sin(frameCount * 0.2) * 0.5;
        
        // Different colors per type
        let color, letter;
        switch (pu.type) {
            case 'power':
                color = COLORS.powerupP;
                letter = 'P';
                break;
            case 'powerW':
                color = COLORS.powerupW;
                letter = 'W';
                break;
            case 'bomb':
                color = COLORS.powerupB;
                letter = 'B';
                break;
            case 'shield':
                color = COLORS.powerupS;
                letter = 'S';
                break;
            case 'drone':
                color = COLORS.powerupD;
                letter = 'D';
                break;
            case 'droneR':
                color = COLORS.powerupDR;
                letter = 'D';
                break;
            case 'powerV':
                color = COLORS.powerupV;
                letter = 'V';
                break;
            case 'powerM':
                color = COLORS.powerupM;
                letter = 'M';
                break;
            default:
                color = COLORS.powerup;
                letter = '?';
        }
        
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, 0, 1);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    }
    
    function drawDrone(drone) {
        ctx.save();
        ctx.translate(drone.x, drone.y);
        
        const isHoming = drone.droneType === 'homing';
        const droneColor = isHoming ? '#FF4444' : '#CC66FF';
        const innerColor = isHoming ? '#FF8888' : '#EEAAFF';
        const wingColor = isHoming ? '#CC0000' : '#9944CC';
        
        // Alien drone - organic-mechanical hybrid orb
        ctx.shadowColor = droneColor;
        ctx.shadowBlur = 8;
        
        // Outer shell
        const dGrad = ctx.createRadialGradient(-1, -1, 1, 0, 0, 10);
        dGrad.addColorStop(0, innerColor);
        dGrad.addColorStop(0.6, droneColor);
        dGrad.addColorStop(1, wingColor);
        ctx.fillStyle = dGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = innerColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Mechanical ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Glowing core
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = innerColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Small antenna/spikes
        ctx.strokeStyle = droneColor;
        ctx.lineWidth = 1.5;
        for (let da = 0; da < 4; da++) {
            const dAngle = (Math.PI * 2 / 4) * da + Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(dAngle) * 8, Math.sin(dAngle) * 8);
            ctx.lineTo(Math.cos(dAngle) * 13, Math.sin(dAngle) * 13);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
    
    function drawDroneBullet(bullet) {
        if (bullet.isHoming) {
            // Homing missile - red, larger, with trail
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            
            // Trail
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#4488FF';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Missile body
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#4488FF';
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.lineTo(-4, 3);
            ctx.lineTo(0, 5);
            ctx.lineTo(4, 3);
            ctx.closePath();
            ctx.fill();
            
            // Inner glow
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.restore();
        } else {
            // Blue glow for drone bullets
            ctx.shadowColor = COLORS.droneBullet;
            ctx.shadowBlur = 16;
            ctx.fillStyle = COLORS.droneBullet;
            // Outer glow
            ctx.fillRect(bullet.x - bullet.width / 2 - 2, bullet.y - bullet.height / 2 - 2, bullet.width + 4, bullet.height + 4);
            // Core
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#66AAFF';
            ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
            // White hot center
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(bullet.x - bullet.width / 4, bullet.y - bullet.height / 4, bullet.width / 2, bullet.height / 2);
            ctx.shadowBlur = 0;
        }
    }
    
    function drawExplosion(exp) {
        ctx.globalAlpha = exp.life;
        
        // Support custom color or default to explosion palette
        const clr = exp.color || COLORS.explosion[Math.floor((1 - exp.life) * COLORS.explosion.length)];
        ctx.fillStyle = clr;
        
        // Outer glow for larger particles
        if (exp.size > 5) {
            ctx.shadowColor = clr;
            ctx.shadowBlur = 8 * exp.life;
        }
        
        if (exp.isSpark) {
            ctx.fillStyle = exp.color;
            ctx.globalAlpha = exp.life;
            ctx.fillRect(exp.x - exp.size / 2, exp.y - exp.size / 2, exp.size, exp.size);
        } else {
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.size * exp.life, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
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
        for (let mi = 0; mi < missiles.length; mi++) {
            const m = missiles[mi];
            ctx.save();
            ctx.translate(m.x, m.y);
            
            const angle = Math.atan2(m.vy, m.vx) + Math.PI / 2;
            ctx.rotate(angle);
            
            const scale = m.w / 12;
            const hw = 6.75 * scale;
            const hh = 15 * scale;
            
            // Energy trail (behind missile)
            const trailGrad = ctx.createLinearGradient(0, hh * 0.5, 0, hh * 2.2);
            trailGrad.addColorStop(0, 'rgba(255, 180, 50, 0.6)');
            trailGrad.addColorStop(0.4, 'rgba(255, 100, 20, 0.3)');
            trailGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
            ctx.fillStyle = trailGrad;
            ctx.beginPath();
            ctx.moveTo(-hw * 1.2, hh * 0.6);
            ctx.lineTo(0, hh * 2.5 + Math.random() * hh * 0.3);
            ctx.lineTo(hw * 1.2, hh * 0.6);
            ctx.closePath();
            ctx.fill();
            
            // Outer glow aura
            ctx.shadowColor = '#FFAA00';
            ctx.shadowBlur = hh * 1.2;
            ctx.fillStyle = 'rgba(255, 170, 0, 0.15)';
            ctx.fillRect(-hw * 1.3, -hh * 1.1, hw * 2.6, hh * 2.2);
            
            // Missile body - gradient
            const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
            bodyGrad.addColorStop(0, '#CC3300');
            bodyGrad.addColorStop(0.3, '#FF5500');
            bodyGrad.addColorStop(0.5, '#FF7722');
            bodyGrad.addColorStop(0.7, '#FF5500');
            bodyGrad.addColorStop(1, '#CC3300');
            ctx.fillStyle = bodyGrad;
            ctx.shadowBlur = 6;
            ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
            
            // Body highlight stripe
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(-hw * 0.3, -hh * 0.8, hw * 0.6, hh * 1.6);
            
            // Nose cone with gradient
            const noseGrad = ctx.createLinearGradient(0, -hh * 1.35, 0, -hh * 0.5);
            noseGrad.addColorStop(0, '#FFEE88');
            noseGrad.addColorStop(0.5, '#FF6600');
            noseGrad.addColorStop(1, '#CC3300');
            ctx.fillStyle = noseGrad;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.moveTo(0, -hh * 1.4);
            ctx.lineTo(-hw, -hh * 0.6);
            ctx.lineTo(hw, -hh * 0.6);
            ctx.closePath();
            ctx.fill();
            
            // Fins (swept-back style)
            ctx.fillStyle = '#AA2200';
            ctx.shadowBlur = 3;
            ctx.shadowColor = '#FF4400';
            ctx.beginPath();
            ctx.moveTo(-hw, hh * 0.5);
            ctx.lineTo(-hw * 2.2, hh * 1.3);
            ctx.lineTo(-hw * 0.5, hh * 1.0);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(hw, hh * 0.5);
            ctx.lineTo(hw * 2.2, hh * 1.3);
            ctx.lineTo(hw * 0.5, hh * 1.0);
            ctx.closePath();
            ctx.fill();
            
            // Engine exhaust flame
            const flameH = hh * 1.3 + Math.random() * hh * 0.5;
            const flameGrad = ctx.createLinearGradient(0, hh, 0, hh + flameH);
            flameGrad.addColorStop(0, '#FFFFFF');
            flameGrad.addColorStop(0.2, '#88CCFF');
            flameGrad.addColorStop(0.5, '#3366FF');
            flameGrad.addColorStop(1, 'rgba(50, 100, 255, 0)');
            ctx.fillStyle = flameGrad;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(-hw * 0.7, hh);
            ctx.lineTo(0, hh + flameH);
            ctx.lineTo(hw * 0.7, hh);
            ctx.closePath();
            ctx.fill();
            
            // Inner flame core
            const innerFlameH = flameH * 0.5;
            const ifGrad = ctx.createLinearGradient(0, hh, 0, hh + innerFlameH);
            ifGrad.addColorStop(0, '#FFFFFF');
            ifGrad.addColorStop(1, 'rgba(200, 220, 255, 0)');
            ctx.fillStyle = ifGrad;
            ctx.beginPath();
            ctx.moveTo(-hw * 0.3, hh);
            ctx.lineTo(0, hh + innerFlameH);
            ctx.lineTo(hw * 0.3, hh);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
        // M Ultimate: special missile visual
        if (mUltimateActive && mUltimateMissile && !mUltimateMissile.exploded && player.activeWeapon === 'M') {
            const um = mUltimateMissile;
            ctx.save();
            ctx.translate(um.x, um.y);
            
            // Massive energy aura
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 30;
            
            // Outer pulse ring
            const pulse = Math.sin(frameCount * 0.3) * 0.3 + 0.7;
            ctx.strokeStyle = "rgba(255, 200, 50, " + (pulse * 0.6) + ")";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, um.w * 2.0, 0, Math.PI * 2);
            ctx.stroke();
            
            // Mid pulse ring
            ctx.strokeStyle = "rgba(255, 255, 100, " + (pulse * 0.4) + ")";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, um.w * 1.3, 0, Math.PI * 2);
            ctx.stroke();
            
            // Missile body - golden gradient
            const ugGrad = ctx.createLinearGradient(-um.w/2, 0, um.w/2, 0);
            ugGrad.addColorStop(0, '#CC8800');
            ugGrad.addColorStop(0.3, '#FFAA00');
            ugGrad.addColorStop(0.5, '#FFD700');
            ugGrad.addColorStop(0.7, '#FFAA00');
            ugGrad.addColorStop(1, '#CC8800');
            ctx.fillStyle = ugGrad;
            ctx.fillRect(-um.w/2, -um.h/2, um.w, um.h);
            
            // Body stripe
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(-um.w * 0.15, -um.h * 0.4, um.w * 0.3, um.h * 0.8);
            
            // Gold nose cone
            const unGrad = ctx.createLinearGradient(0, -um.h/2 - 6, 0, -um.h/2);
            unGrad.addColorStop(0, '#FFFFFF');
            unGrad.addColorStop(0.4, '#FFEE66');
            unGrad.addColorStop(1, '#FFAA00');
            ctx.fillStyle = unGrad;
            ctx.beginPath();
            ctx.moveTo(0, -um.h/2 - 6);
            ctx.lineTo(-um.w/2, -um.h/2 + 2);
            ctx.lineTo(um.w/2, -um.h/2 + 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.restore();
        }
        
    }
    
    function drawUI() {
        ctx.save();
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
        // Death flash overlay removed - explosion particles are the visual effect
        
        // Wave flash display
        if (waveFlash && waveFlash.active) {
            const flashAlpha = waveFlash.timer > 60 ? 1 : (waveFlash.timer / 60);
            const flashScale = 1 + (1 - flashAlpha) * 0.5;
            
            ctx.save();
            ctx.globalAlpha = flashAlpha;
            ctx.fillStyle = '#FFD700';
            ctx.font = (48 * flashScale) + 'px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 20;
            ctx.fillText(waveFlash.text, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
            ctx.shadowBlur = 0;
            ctx.restore();
            
            waveFlash.timer--;
            if (waveFlash.timer <= 0) {
                waveFlash.active = false;
            }
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px "Press Start 2P", monospace';
        
    
        // Boss HP Bar (top center, when boss is active)
        if (bossIsFinalBoss && bossActive && bossHPBarAlpha > 0.01) {
            // Find the boss
            let bossEnemy = null;
            for (let ei = enemies.length - 1; ei >= 0; ei--) {
                if (enemies[ei].isWaveBoss && enemies[ei].type === 'boss') {
                    bossEnemy = enemies[ei];
                    break;
                }
            }
            if (bossEnemy) {
                const barW = 300;
                const barH = 14;
                const barX = GAME_WIDTH / 2 - barW / 2;
                const barY = 48;
                const hpRatio = bossEnemy.hp / bossEnemy.maxHp;
                
                ctx.save();
                ctx.globalAlpha = bossHPBarAlpha;
                
                // Bar background
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
                
                // Bar border
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 2;
                ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);
                
                // HP fill with gradient
                const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
                if (hpRatio > 0.5) {
                    hpGrad.addColorStop(0, '#FF4444');
                    hpGrad.addColorStop(1, '#FF8888');
                } else if (hpRatio > 0.25) {
                    hpGrad.addColorStop(0, '#FF8800');
                    hpGrad.addColorStop(1, '#FFAA44');
                } else {
                    hpGrad.addColorStop(0, '#FF0000');
                    hpGrad.addColorStop(1, '#FF4444');
                }
                ctx.fillStyle = hpGrad;
                ctx.fillRect(barX, barY, barW * hpRatio, barH);
                
                // Boss name
                ctx.fillStyle = '#FFD700';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 8;
                ctx.fillText(bossEnemy.type === 'octopus' ? 'OCTOPUS' : 'BOSS', GAME_WIDTH / 2, barY - 8);
                ctx.shadowBlur = 0;
                
                // HP text
                ctx.font = '7px "Press Start 2P", monospace';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(Math.ceil(bossEnemy.hp) + ' / ' + bossEnemy.maxHp, GAME_WIDTH / 2, barY + barH + 14);
                
                ctx.textAlign = 'left';
                ctx.restore();
            }
        }
        
        // Combo display
        if (comboCount >= 2 && comboTimer > 0) {
            const comboAlpha = Math.min(1, comboTimer / 20);
            const comboScale = 1 + (comboCount >= 10 ? 0.3 : comboCount >= 5 ? 0.15 : 0) + Math.sin(frameCount * 0.15) * 0.05;
            ctx.save();
            ctx.globalAlpha = comboAlpha;
            ctx.font = (24 * comboScale) + 'px "Press Start 2P", monospace';
            ctx.textAlign = 'right';
            ctx.shadowColor = comboCount >= 10 ? '#FFD700' : comboCount >= 5 ? '#FF8800' : '#FFFFFF';
            ctx.shadowBlur = 15;
            ctx.fillStyle = comboCount >= 10 ? '#FFD700' : comboCount >= 5 ? '#FF8800' : '#FFFFFF';
            ctx.fillText(comboCount + 'x COMBO!', GAME_WIDTH - 80, 110);
            ctx.shadowBlur = 0;
            ctx.textAlign = 'left';
            ctx.restore();
        }
    
        // Score
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE ${score.toString().padStart(6, '0')}`, 15, 30);
        
        // High Score
        ctx.textAlign = 'right';
        ctx.fillText(`HI ${highScore.toString().padStart(6, '0')}`, GAME_WIDTH - 15, 30);
        
        // Stage indicator (waveFlash shows BOSS / STAGE announcements)
        
        // V Power - very faint, small pulsing countdown number
        if (player.vPowerActive) {
            const vSecLeft = Math.ceil(player.vPowerTimer / 60);
            const alpha = 0.04 + Math.abs(Math.sin(frameCount * 0.05)) * 0.06;
            const scale = 1.2 + Math.sin(frameCount * 0.08) * 0.15;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${Math.floor(40 * scale)}px "Press Start 2P", monospace`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 8;
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(vSecLeft, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 15);
            ctx.shadowBlur = 0;
            ctx.textAlign = "start";
            ctx.textBaseline = "alphabetic";
            ctx.globalAlpha = 1;
            ctx.restore();
        }
        
        // Lives
        ctx.textAlign = 'left';
        for (let i = 0; i < player.lives; i++) {
            ctx.fillStyle = COLORS.player;
            ctx.beginPath();
            ctx.moveTo(20 + i * 25, GAME_HEIGHT - 20);
            ctx.lineTo(15 + i * 25, GAME_HEIGHT - 35);
            ctx.lineTo(25 + i * 25, GAME_HEIGHT - 35);
            ctx.closePath();
            ctx.fill();
        }
        
        // Bombs
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`BOMB x${player.bombs}`, 110, GAME_HEIGHT - 25);
        
        // Weapon level display (numbers with sparkle effect)
        const levelFont = 'bold 11px "Press Start 2P", monospace';
        const ultFont = 'bold 7px "Press Start 2P", monospace';
        
        // Sparkle helper - creates a twinkling alpha based on time
        const sparkleAlpha = (phase) => { const base = 0.5 + 0.5 * Math.sin(frameCount * 0.15 + phase); return sparkleFlashTimer > 0 ? base + (sparkleFlashTimer / 30) * 1.5 : base; };
        
        // Show active weapon level
        if (player.activeWeapon === 'P') {
            // P Weapon - power level
            const plv = player.powerLevel;
            const pLevel = plv + 1; // Display as 1-7
            ctx.font = levelFont;
            ctx.textAlign = 'right';
            // Sparkle effect on upgrade (pulse brightness)
            const pGlow = sparkleAlpha(0);
            ctx.shadowColor = `rgba(255, 215, 0, ${0.3 + pGlow * 0.7})`;
            ctx.shadowBlur = 8 + pGlow * 6;
            ctx.fillStyle = plv >= 6 ? '#FFD700' : '#FFFFFF';
            if (sparkleFlashActive && player.activeWeapon === 'P') {
                ctx.save(); ctx.shadowColor = '#FFFFFF'; ctx.shadowBlur = 15;
            }
            ctx.fillText(`P ${pLevel}/7`, GAME_WIDTH - 15, GAME_HEIGHT - 25);
            if (sparkleFlashActive && player.activeWeapon === 'P') ctx.restore();
            ctx.shadowBlur = 0;
            // ULT badge
            if (plv >= 6) {
                ctx.font = ultFont;
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 6;
                ctx.fillText('⭐ULT', GAME_WIDTH - 15, GAME_HEIGHT - 40);
                ctx.shadowBlur = 0;
            }
        } else if (player.activeWeapon === 'W') {
            // W Weapon - laser level
            const lv = laserLevel;
            const wLevel = lv + 1; // Display as 1-7
            ctx.font = levelFont;
            ctx.textAlign = 'right';
            const wGlow = sparkleAlpha(1);
            ctx.shadowColor = `rgba(255, 100, 100, ${0.3 + wGlow * 0.7})`;
            ctx.shadowBlur = 8 + wGlow * 6;
            ctx.fillStyle = lv >= 6 ? '#FF6666' : '#FFFFFF';
            ctx.fillText(`W ${wLevel}/7`, GAME_WIDTH - 15, GAME_HEIGHT - 25);
            ctx.shadowBlur = 0;
            if (lv >= 6) {
                ctx.font = ultFont;
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 6;
                ctx.fillText('⭐ULT', GAME_WIDTH - 15, GAME_HEIGHT - 40);
                ctx.shadowBlur = 0;
            }
        } else if (player.activeWeapon === 'M') {
            // M Weapon - missile level
            const mv = playerMissileLevel;
            const mLevel = mv; // Already 1-7 (or 0 means no missile)
            ctx.font = levelFont;
            ctx.textAlign = 'right';
            const mGlow = sparkleAlpha(2);
            ctx.shadowColor = `rgba(255, 102, 0, ${0.3 + mGlow * 0.7})`;
            ctx.shadowBlur = 8 + mGlow * 6;
            ctx.fillStyle = mv >= 6 ? '#FF6600' : '#FFFFFF';
            ctx.fillText(`M ${mLevel}/7`, GAME_WIDTH - 15, GAME_HEIGHT - 25);
            ctx.shadowBlur = 0;
            if (mv >= 6) {
                ctx.font = ultFont;
                ctx.fillStyle = '#FFD700';
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 6;
                ctx.fillText('⭐ULT', GAME_WIDTH - 15, GAME_HEIGHT - 40);
                ctx.shadowBlur = 0;
            }
        }
        // Update bomb indicator for mobile
        if (bombIndicator) {
            if (isTouchDevice()) {
                bombIndicator.style.display = 'flex';
                bombIndicator.innerHTML = `B<span style="font-size:9px;margin-left:2px">×${player.bombs}</span>`;
            }
        }
    
        // Max combo display
        if (maxCombo > 1) {
            ctx.font = '7px "Press Start 2P", monospace';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'left';
            ctx.fillText('MAX COMBO: ' + maxCombo, 10, GAME_HEIGHT - 50);
        }
        ctx.restore();
    }
    
    function drawTitleScreen() {
        drawBackground();
        
        // Title
        ctx.fillStyle = '#FFD700';
        ctx.font = '48px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 20;
        ctx.fillText('1945', GAME_WIDTH / 2, 250);
        
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0;
        ctx.fillText('FLYING TIGERS', GAME_WIDTH / 2, 290);
        
        // Animated plane
        ctx.save();
        ctx.translate(GAME_WIDTH / 2, 380);
        const bobY = Math.sin(frameCount * 0.05) * 10;
        ctx.translate(0, bobY);
        
        ctx.fillStyle = COLORS.playerBody;
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(-20, 20);
        ctx.lineTo(-8, 15);
        ctx.lineTo(0, 30);
        ctx.lineTo(8, 15);
        ctx.lineTo(20, 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // Flashing text
        if (Math.floor(frameCount / 30) % 2 === 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '12px "Press Start 2P", monospace';
            if (isTouchDevice()) {
                ctx.fillText('TAP TO START', GAME_WIDTH / 2, 500);
            } else {
                ctx.fillText('PRESS SPACE TO START', GAME_WIDTH / 2, 500);
            }
        }
        
        // High score
        ctx.fillStyle = '#888';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(`HIGH SCORE: ${highScore}`, GAME_WIDTH / 2, 600);
    }
    
    function drawPauseScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('Press P to Resume', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);
    }
    
    function drawGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#4488FF';
        ctx.font = '32px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.fillText(`FINAL SCORE: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        
        if (score >= highScore) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText('NEW HIGH SCORE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        }
        
        if (Math.floor(frameCount / 30) % 2 === 0) {
            ctx.fillStyle = '#888';
            ctx.font = '12px "Press Start 2P", monospace';
            ctx.fillText('PRESS SPACE TO RESTART', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
        }
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

            // Explosions
            for (let i = explosions.length - 1; i >= 0; i--) {
                try { drawExplosion(explosions[i]); } catch(e) {}
            }

            // Hit markers
            for (let i = hitMarkers.length - 1; i >= 0; i--) {
                try {
                    const hm = hitMarkers[i];
                    const alpha = hm.timer / 12;
                    ctx.save();
                    ctx.globalAlpha = alpha;
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    const size = 6 + (1 - alpha) * 4;
                    ctx.beginPath();
                    ctx.moveTo(hm.x - size, hm.y - size);
                    ctx.lineTo(hm.x + size, hm.y + size);
                    ctx.moveTo(hm.x + size, hm.y - size);
                    ctx.lineTo(hm.x - size, hm.y + size);
                    ctx.stroke();
                    ctx.restore();
                } catch(e) {}
            }

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
            for (let i = explosions.length - 1; i >= 0; i--) {
                try { drawExplosion(explosions[i]); } catch(e) {}
            }
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