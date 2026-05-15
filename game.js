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
    bgmPlaying = true;
    
    const now = audioContext.currentTime;
    
    // === BASS LINE - driving rhythm ===
    const bassNotes = [55, 55, 65.41, 55, 73.42, 65.41, 55, 49]; // A1 pattern
    const bassDuration = 0.5; // 120 BPM
    
    bassNotes.forEach((freq, i) => {
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
    });
    
    // === PAD LAYER - tension chords ===
    const padFreqs = [110, 138.59, 164.81]; // A2, C#3, E3 - A major
    padFreqs.forEach((freq, i) => {
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
    });
    
    // === ARPEGGIO - fast high notes for urgency ===
    const arpNotes = [440, 554.37, 659.25, 880, 659.25, 554.37]; // A4, C#5, E5, A5
    const arpSpeed = 0.15;
    
    function playArpeggioLoop(startOffset) {
        arpNotes.forEach((freq, i) => {
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
        });
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
    bgmOscillators.forEach(osc => {
        try {
            osc.stop(now + 0.5);
        } catch (e) {}
    });
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
    
    notes.forEach((freq, i) => {
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
    });
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
    
    notes.forEach((freq, i) => {
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
    });
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
    laserOscillators.forEach(osc => {
        try {
            const gain = osc.context ? null : null;
            osc.stop(now + 0.05);
        } catch (e) {}
    });
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
let bossBaseHP = 0;
let frameCount = 0;
let bossClawTimer = 0;
let bossClawActive = false;
let bossClawX = 0;
let bossClawLength = 0;
let bossClawMaxLength = 0;
let bossClawRetracting = false;

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
    vPowerTimer: 0
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
    droneBullet: '#FF1493',
    droneBulletR: '#FF1493',
    powerupDR: '#FF0000',
    powerupW: '#FFFFFF',
    powerupV: '#888888',
    powerupM: '#FF6600',
    laser: '#FFFFFF',
    explosion: ['#FF6B35', '#F7931E', '#FFD700', '#FFFFFF']
};

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
let touchFirePressed = false;
let fireBtn = null;
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
    // Get button elements
    fireBtn = document.getElementById('fireBtn');
    bombBtn = document.getElementById('bombBtn');
    
    // Create on-screen buttons inside game area
    createMobileButtons();
    
    // Canvas touch for direct plane control AND joystick
    canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    canvas.addEventListener('touchmove', handleCanvasTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleCanvasTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleCanvasTouchEnd, { passive: false });
    
    // Fire button - auto-fire when held
    if (fireBtn) {
        let fireInterval = null;
        
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
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
            
            if (gameState === GameState.PLAYING) {
                touchFirePressed = true;
                fireBtn.classList.add('pressed');
                playerShoot();
                
                // Start auto-fire
                fireInterval = setInterval(() => {
                    if (gameState === GameState.PLAYING) {
                        playerShoot();
                    }
                }, 150);
            }
        }, { passive: false });
        
        fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchFirePressed = false;
            if (fireBtn) fireBtn.classList.remove('pressed');
            if (fireInterval) {
                clearInterval(fireInterval);
                fireInterval = null;
            }
        }, { passive: false });
        
        fireBtn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            touchFirePressed = false;
            if (fireBtn) fireBtn.classList.remove('pressed');
            if (fireInterval) {
                clearInterval(fireInterval);
                fireInterval = null;
            }
        }, { passive: false });
        
        // Mouse support for testing on desktop
        fireBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            if (gameState === GameState.TITLE || gameState === GameState.GAMEOVER) {
                initAudio();
                startGame();
                return;
            }
            
            if (gameState === GameState.PLAYING) {
                touchFirePressed = true;
                fireBtn.classList.add('pressed');
                playerShoot();
                
                fireInterval = setInterval(() => {
                    if (gameState === GameState.PLAYING) {
                        playerShoot();
                    }
                }, 150);
            }
        });
        
        fireBtn.addEventListener('mouseup', () => {
            touchFirePressed = false;
            fireBtn.classList.remove('pressed');
            if (fireInterval) {
                clearInterval(fireInterval);
                fireInterval = null;
            }
        });
    }
    
    // Bomb button
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
    // Buttons are in HTML, just position them
    if (fireBtn && bombBtn) {
        controlsVisible = true;
        bombIndicator = document.getElementById('bombIndicator');
        if (!bombIndicator) {
            bombIndicator = document.createElement('div');
            bombIndicator.id = 'bombIndicator';
            bombIndicator.style.cssText = 'position:absolute;bottom:25px;right:10px;color:#FF8C00;font-family:"Press Start 2P",monospace;font-size:10px;z-index:10;pointer-events:none;display:none';
            document.getElementById('gameContainer').appendChild(bombIndicator);
        }
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

function updateTouchTarget(touch) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    
    touchTarget.x = (touch.clientX - rect.left) * scaleX;
    touchTarget.y = (touch.clientY - rect.top) * scaleY;
}

// Initialize mobile controls after DOM is ready
// Initialize mobile controls - handle both async and sync loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupMobileControls);
} else {
    // DOM already loaded (script at end of body)
    setupMobileControls();
}

// ============================================
// GAME FUNCTIONS
// ============================================

function startGame() {
    gameState = GameState.PLAYING;
    score = 0;
    wave = 1;
    waveTimer = 0;
    frameCount = 0;
    
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT - 80;
    player.powerLevel = 0;
    player.bombs = 3;
    player.lives = 3;
    player.invincible = false;
    player.shieldActive = false;
    player.shieldTimer = 0;
    player.vPowerActive = false;
    player.vPowerTimer = 0;
    
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
    bossClawTimer = 0;
    bossClawActive = false;
    bossClawRetracting = false;
    
    startBGM();
}

function useBomb() {
    if (player.bombs > 0) {
        player.bombs--;
        
        // Damage all enemies - boss takes 15% of max HP damage, others die
        const enemiesToRemove = [];
        enemies.forEach((enemy, ei) => {
            if (enemy.isWaveBoss) {
                // Boss takes 15% of max HP damage from bomb
                const bombDamage = Math.floor(enemy.maxHp * 0.15);
                enemy.hp -= bombDamage;
                createExplosion(enemy.x, enemy.y, 20);
                if (enemy.hp <= 0) {
                    enemy.hp = 0;
                    enemiesToRemove.push(ei);
                }
            } else {
                createExplosion(enemy.x, enemy.y);
                score += 10;
                enemiesToRemove.push(ei);
            }
        });
        
        // Remove dead enemies (reverse order to preserve indices)
        for (let i = enemiesToRemove.length - 1; i >= 0; i--) {
            const idx = enemiesToRemove[i];
            const enemy = enemies[idx];
            if (enemy.hp <= 0 && enemy.isWaveBoss) {
                score += enemy.score;
                spawnPowerup(enemy.x, enemy.y);
                bossActive = false;
                bossDefeated = true;
                player.lives = Math.min(5, player.lives + 1);
                bossClawActive = false;
                bossClawLength = 0;
                bossClawTimer = 0;
            }
            enemies.splice(idx, 1);
        }
        
        // Clear enemy bullets
        enemyBullets = [];
        
        // Screen flash effect
        createExplosion(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50);
    }
}

function playerShoot() {
    if (player.shootCooldown > 0) return;
    // Block P bullets when lasers or missiles active
    if (laserBeams.length > 0 || playerMissileLevel > 0) return;
    
    player.shootCooldown = 8;
    playShootSound();
    
    // // M missile weapon active - skip P bullets
    if (playerMissileLevel > 0) return;
    
    switch (player.powerLevel) {
        case 0:
            playerBullets.push({
                x: player.x,
                y: player.y - 20,
                width: 4,
                height: 16,
                speed: BULLET_SPEED
            });
            break;
        case 1:
            playerBullets.push({
                x: player.x - 10,
                y: player.y - 15,
                width: 4,
                height: 16,
                speed: BULLET_SPEED
            });
            playerBullets.push({
                x: player.x + 10,
                y: player.y - 15,
                width: 4,
                height: 16,
                speed: BULLET_SPEED
            });
            break;
        case 2:
            playerBullets.push({
                x: player.x,
                y: player.y - 20,
                width: 6,
                height: 20,
                speed: BULLET_SPEED + 2
            });
            playerBullets.push({
                x: player.x - 15,
                y: player.y - 10,
                width: 4,
                height: 14,
                speed: BULLET_SPEED,
                angle: -0.15
            });
            playerBullets.push({
                x: player.x + 15,
                y: player.y - 10,
                width: 4,
                height: 14,
                speed: BULLET_SPEED,
                angle: 0.15
            });
            break;
        default:
            for (let i = -2; i <= 2; i++) {
                playerBullets.push({
                    x: player.x + i * 12,
                    y: player.y - 20,
                    width: 5,
                    height: 18,
                    speed: BULLET_SPEED + 2,
                    angle: i * 0.1
                });
            }
    }
}

function spawnEnemy() {
    // Boss wave check: every 10th wave (10, 20, 30... 100)
    if (wave % 10 === 0 && !bossActive && !bossDefeated) {
        bossActive = true;
        bossWaveNumber = wave;
        
        // Boss HP: first boss = mid-boss * 3 (20+10*5=70, so 210)
        // Each subsequent boss +30% from previous boss
        const bossNumber = Math.floor(wave / 10); // 1st boss at wave 10, 2nd at 20...
        const baseMidBossHP = 20 + 10 * 5; // mid-boss HP at wave 10 = 70
        let bossHP = baseMidBossHP * 3; // 210 for first boss
        for (let b = 1; b < bossNumber; b++) {
            bossHP = Math.floor(bossHP * 1.3);
        }
        bossBaseHP = bossHP;
        
        const bossEnemy = {
            x: GAME_WIDTH / 2,
            y: -120,
            width: 100,
            height: 100,
            type: 'boss',
            hp: bossHP,
            maxHp: bossHP,
            speed: ENEMY_BASE_SPEED * 0.25,
            score: 5000 + wave * 500,
            shootCooldown: 15,
            angle: 0,
            phase: Math.random() * Math.PI * 2,
            isWaveBoss: true
        };
        enemies.push(bossEnemy);
        
        // Show boss warning flash
        waveFlash = { active: true, timer: 120, text: 'BOSS WAVE ' + wave };
        return;
    }
    
    // Spawn enemies slower during boss fight
    if (bossActive && frameCount % 3 !== 0) return;
    
    const types = ['scout', 'scout', 'fighter', 'bomber', 'rammer'];
    if (wave >= 3) types.push('fighter', 'bomber', 'rammer');
    if (wave >= 5 && wave % 10 !== 0) types.push('boss');
    
    const type = types[Math.floor(Math.random() * types.length)];
    
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
            enemy.hp = 20 + wave * 5;
            enemy.maxHp = enemy.hp;
            enemy.speed = ENEMY_BASE_SPEED * 0.3;
            enemy.score = 2000;
            enemy.width = 80;
            enemy.height = 80;
            enemy.y = -100;
            enemy.shootCooldown = 20;
            break;
        case 'rammer':
            enemy.hp = 4 + wave;
            enemy.maxHp = enemy.hp;
            enemy.speed = ENEMY_BASE_SPEED * 0.864;
            enemy.score = 400;
            enemy.width = 48;
            enemy.height = 48;
            enemy.shootCooldown = 9999;
            break;
    }
    
    enemies.push(enemy);
}

function spawnPowerup(x, y, isBossKill) {
    if (Math.random() > 0.125 && !isBossKill) return;
    
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
    
    player.lives--;
    player.invincible = true;
    player.invincibleTimer = 120;
    player.shieldActive = false;
    
    // Lose one laser beam when hit
    if (laserBeams.length > 0) {
        laserBeams.pop();
        if (laserBeams.length === 0) {
            stopLaserSound();
        }
    }
    player.powerLevel = Math.max(0, player.powerLevel - 1);
    
    // Remove one drone when hit
    if (drones.length > 0) {
        const removedDrone = drones.pop();
        createExplosion(removedDrone.x, removedDrone.y, 6);
    }
    
    createExplosion(player.x, player.y, 8);
    playHitSound();
    
    if (player.lives <= 0) {
        gameOver();
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

// ============================================
// UPDATE FUNCTIONS
// ============================================

function update() {
    if (gameState !== GameState.PLAYING) return;
    
    frameCount++;
    waveTimer++;
    
    // Wave progression - instant transition with flash
    if (waveTimer > 1800) {
        wave++;
        waveTimer = 0;
        bossDefeated = false;
        // Show wave number flash
        waveFlash = { active: true, timer: 90, text: 'WAVE ' + wave };
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
    
    // Player movement (touch - direct control)
    if (isTouching && touchTarget.x !== null && touchTarget.y !== null) {
        const dx = touchTarget.x - player.x;
        const dy = touchTarget.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
            // Smooth movement toward touch point
            player.x += dx * 0.15;
            player.y += dy * 0.15;
        }
    }
    
    // Auto-fire while touching
    if (isTouching) {
        playerShoot();
    }
    
    // Clamp player position
    player.x = Math.max(player.width / 2, Math.min(GAME_WIDTH - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(GAME_HEIGHT - player.height / 2, player.y));
    
    // Shooting (keyboard)
    if (keys['Space']) {
        playerShoot();
    }
    // Shooting (mobile fire button)
    if (touchFirePressed) {
        playerShoot();
    }
    if (player.shootCooldown > 0) player.shootCooldown--;
    
    // Invincibility (after hit)
    if (player.invincible) {
        player.invincibleTimer--;
        player.visible = Math.floor(player.invincibleTimer / 5) % 2 === 0;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
            player.visible = true;
        }
    }
    
    // Shield timer
    if (player.shieldActive) {
        player.shieldTimer--;
        if (player.shieldTimer <= 0) {
            player.shieldActive = false;
        }
    }
    
    // V power timer
    if (player.vPowerActive) {
        player.vPowerTimer--;
        if (player.vPowerTimer <= 0) {
            player.vPowerActive = false;
            player.invincible = false;
            player.invincibleTimer = 0;
        }
    }
    
    // Boss claw attack - 7 second interval
    if (bossActive) {
        if (!bossClawActive) {
            bossClawTimer++;
            if (bossClawTimer >= 420) { // 7 seconds at 60fps
                const bossEnemy = enemies.find(e => e.isWaveBoss);
                if (bossEnemy) {
                    bossClawActive = true;
                    bossClawTimer = 0;
                    bossClawX = bossEnemy.x;
                    bossClawLength = 0;
                    bossClawMaxLength = GAME_HEIGHT * 0.66;
                    bossClawRetracting = false;
                }
            }
        }
        if (bossClawActive) {
            const clawSpeed = 12;
            if (!bossClawRetracting) {
                bossClawLength += clawSpeed;
                if (bossClawLength >= bossClawMaxLength) {
                    bossClawRetracting = true;
                }
            } else {
                bossClawLength -= clawSpeed * 1.5;
                if (bossClawLength <= 0) {
                    bossClawLength = 0;
                    bossClawActive = false;
                    bossClawTimer = 0;
                }
            }
            // Claw follows boss x position loosely
            const bossEnemy = enemies.find(e => e.isWaveBoss);
            if (bossEnemy) {
                bossClawX += (bossEnemy.x - bossClawX) * 0.1;
            }
            // Check collision with player
            const clawTipY = bossClawLength;
            if (!player.invincible && !player.shieldActive) {
                const dx = player.x - bossClawX;
                const dy = player.y - clawTipY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 30) {
                    playerHit();
                }
            }
        }
    }

    // Spawn enemies
    const spawnRate = Math.max(30, 90 - wave * 5);
    if (frameCount % spawnRate === 0) {
        spawnEnemy();
    }
    
    // Update stars
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > GAME_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * GAME_WIDTH;
        }
    });
    
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
        
        laserBeams.forEach((beam, beamIdx) => {
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
                    
                    if (enemy.hp <= 0) {
                        score += enemy.score;
                        createExplosion(enemy.x, enemy.y);
                        if (enemy.isWaveBoss) {
                            // Boss defeated - spawn V powerup
                            spawnPowerup(enemy.x, enemy.y, true);
                            bossActive = false;
                            bossDefeated = true;
                            player.lives = Math.min(5, player.lives + 1);
                            bossClawActive = false;
                            bossClawLength = 0;
                            bossClawTimer = 0;
                        } else {
                            spawnPowerup(enemy.x, enemy.y);
                        }
                        const idx = enemies.indexOf(enemy);
                        if (idx >= 0) enemies.splice(idx, 1);
                        beam.targetEnemy = null;
                    }
                }
            }
        });
        
        // Play laser hum sound while active
        playLaserSound();
    } else {
        stopLaserSound();
    }

    // Update player bullets
    playerBullets.forEach((bullet, i) => {
        bullet.y -= bullet.speed;
        if (bullet.angle) {
            bullet.x += Math.sin(bullet.angle) * bullet.speed;
        }
        if (bullet.y < -20) {
            playerBullets.splice(i, 1);
        }
    });
    
    // Update enemy bullets
    enemyBullets.forEach((bullet, i) => {
        bullet.y += bullet.speed;
        if (bullet.y > GAME_HEIGHT + 20) {
            enemyBullets.splice(i, 1);
        }
    });
    
    // Update enemies
    enemies.forEach((enemy, ei) => {
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
                    enemy.x += Math.sin(enemy.phase * 0.5) * 2;
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
                        enemy.shootCooldown = Math.max(60, 110 - wave * 4); // slower fire rate
                    }
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
                enemy.shootCooldown = 60;
            }
        }
        
        // Remove off-screen enemies
        if (enemy.y > GAME_HEIGHT + 50) {
            enemies.splice(ei, 1);
        }
    });
    
    // Update powerups
    powerups.forEach((pu, i) => {
        pu.y += pu.speed;
        if (pu.y > GAME_HEIGHT + 20) {
            powerups.splice(i, 1);
        }
    });
    
    // Update drones
    drones.forEach((drone, di) => {
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
                    enemies.forEach(enemy => {
                        const dx = enemy.x - drone.x;
                        const dy = enemy.y - drone.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestEnemy = enemy;
                        }
                    });
                    
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
    });
    
    // Update drone bullets
    droneBullets.forEach((bullet, i) => {
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
                enemies.forEach(enemy => {
                    const dx = enemy.x - bullet.x;
                    const dy = enemy.y - bullet.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestEnemy = enemy;
                    }
                });
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
    });
    
    // Collision: Drone bullets vs Enemies
    droneBullets.forEach((bullet, bi) => {
        if (bullet._hit) return;
        enemies.forEach((enemy, ei) => {
            if (bullet._hit) return;
            if (checkCollision(bullet, enemy)) {
                const dmg = (bullet.damage || 1) * (player.vPowerActive ? 1.5 : 1);
                enemy.hp -= dmg;
                bullet._hit = true;
                droneBullets.splice(bi, 1);
                
                if (enemy.hp <= 0) {
                    score += enemy.score;
                    createExplosion(enemy.x, enemy.y);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                        bossDefeated = true;
                        player.lives = Math.min(5, player.lives + 1);
                        bossClawActive = false;
                        bossClawLength = 0;
                        bossClawTimer = 0;
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    enemies.splice(ei, 1);
                } else {
                    createExplosion(enemy.x, enemy.y, 4);
                }
            }
        });
    });
    
    // Update explosions
    explosions.forEach((exp, i) => {
        exp.x += exp.vx;
        exp.y += exp.vy;
        exp.vx *= 0.95;
        exp.vy *= 0.95;
        exp.life -= exp.decay;
        if (exp.life <= 0) {
            explosions.splice(i, 1);
        }
    });
    
    // Missile cooldowns (decrement every frame)
    if (playerMissileLevel > 0) {
        missileCooldown--;
        if (playerMissileLevel >= 5) missileDefenseCooldown--;
    }
    
    // === M MISSILE SHOOTING (fires every frame based on cooldown) ===
    if (playerMissileLevel >= 1 && missileCooldown <= 0) {
        missileCooldown = 90; // 1.5 seconds at 60fps
        
        // Level 1: 1 forward missile
        missiles.push({ x: player.x, y: player.y - 10, vy: -4.5, vx: 0, homing: false, defensive: false, w: 12, h: 27 });
        
        if (playerMissileLevel >= 2) {
            // Level 2: +2 side missiles
            missiles.push({ x: player.x - 15, y: player.y - 5, vy: -4.5, vx: -0.3, homing: false, defensive: false, w: 12, h: 27 });
            missiles.push({ x: player.x + 15, y: player.y - 5, vy: -4.5, vx: 0.3, homing: false, defensive: false, w: 12, h: 27 });
        }
        
        if (playerMissileLevel >= 3) {
            // Level 3: +1 left homing missile
            missiles.push({ x: player.x - 22, y: player.y, vy: -3, vx: -1, homing: true, defensive: false, w: 12, h: 27 });
        }
        
        if (playerMissileLevel >= 4) {
            // Level 4: +1 right homing missile
            missiles.push({ x: player.x + 22, y: player.y, vy: -3, vx: 1, homing: true, defensive: false, w: 12, h: 27 });
        }
    }
    
    // Defensive rear missile (level 5)
    if (playerMissileLevel >= 5 && missileDefenseCooldown <= 0) {
        missileDefenseCooldown = 120; // 2 seconds
        missiles.push({ x: player.x, y: player.y + 15, vy: 3, vx: 0, homing: false, defensive: true, w: 12, h: 27 });
    }
    
    // Missile update
    for (let i = missiles.length - 1; i >= 0; i--) {
        const m = missiles[i];
        
        if (m.homing && !m.defensive) {
            // Homing: track nearest enemy
            let closest = null, closestDist = Infinity;
            enemies.forEach(e => {
                const dx = e.x - m.x, dy = e.y - m.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < closestDist) { closestDist = d; closest = e; }
            });
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
                enemyBullets.forEach(b => {
                    const d = Math.hypot(b.x - m.x, b.y - m.y);
                    if (d < cbDist) { cbDist = d; closestBullet = b; }
                });
                const tdx = closestBullet.x - m.x, tdy = closestBullet.y - m.y;
                const td = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
                m.vx = tdx / td * 2.5;
                m.vy = tdy / td * 2.5;
            }
        }
        
        m.x += m.vx;
        m.y += m.vy;
        
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
                    createExplosion(enemy.x, enemy.y);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                        bossDefeated = true;
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    enemies.splice(ei, 1);
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
    playerBullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
            if (checkCollision(bullet, enemy)) {
                enemy.hp -= player.vPowerActive ? 1.5 : 1;
                playerBullets.splice(bi, 1);
                
                if (enemy.hp <= 0) {
                    score += enemy.score;
                    createExplosion(enemy.x, enemy.y);
                    if (enemy.isWaveBoss) {
                        spawnPowerup(enemy.x, enemy.y, true);
                        bossActive = false;
                        bossDefeated = true;
                    } else {
                        spawnPowerup(enemy.x, enemy.y);
                    }
                    enemies.splice(ei, 1);
                } else {
                    createExplosion(enemy.x, enemy.y, 4);
                }
            }
        });
    });
    
    // Collision: Enemy bullets vs Player
    if (!player.invincible) {
        enemyBullets.forEach((bullet, bi) => {
            if (checkCollision(bullet, player)) {
                enemyBullets.splice(bi, 1);
                if (player.shieldActive) {
                    // Shield absorbs the hit
                    player.shieldActive = false;
                    player.shieldTimer = 0;
                    createExplosion(player.x, player.y, 6);
                } else {
                    playerHit();
                }
            }
        });
    }
    
    // Collision: Enemies vs Player
    if (!player.invincible) {
        enemies.forEach((enemy, ei) => {
            if (checkCollision(enemy, player)) {
                createExplosion(enemy.x, enemy.y);
                enemies.splice(ei, 1);
                if (player.shieldActive) {
                    // Shield absorbs the hit
                    player.shieldActive = false;
                    player.shieldTimer = 0;
                    createExplosion(player.x, player.y, 6);
                } else {
                    playerHit();
                }
            }
        });
    }
    
    // Collision: Powerups vs Player
    powerups.forEach((pu, i) => {
        if (checkCollision(pu, player)) {
            playPowerupSound();
            switch (pu.type) {
                case 'power':
                    player.powerLevel = Math.min(5, player.powerLevel + 1);
                    laserBeams = [];
                    stopLaserSound();
                    // Clear missiles when switching to P bullets
                    missiles = [];
                    playerMissileLevel = 0;
                    break;
                case 'powerW':
                    // White W - Laser weapon (up to 5 beams)
                    player.powerLevel = 0;
                    // Clear missiles when switching to W laser
                    missiles = [];
                    playerMissileLevel = 0;
                    if (laserBeams.length < 5) {
                        laserBeams.push({ tickTimer: 0 });
                        playPowerupSound();
                    }
                    break;
                case 'bomb':
                    player.bombs = Math.min(5, player.bombs + 1);
                    break;
                case 'shield':
                    player.shieldActive = true;
                    player.shieldTimer = 600;
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
                    // Orange M - Missile weapon (up to 5 levels)
                    playerMissileLevel = Math.min(5, playerMissileLevel + 1);
                    // Clear other weapons - M replaces P bullets and W lasers
                    laserBeams = [];
                    stopLaserSound();
                    player.powerLevel = 0;
                    missiles = missiles; // keep missiles
                    playPowerupSound();
                    break;
                case 'powerV':
                    // Gray V - 5 seconds of +50% weapon power
                    player.vPowerActive = true;
                    player.vPowerTimer = 300; // 5 seconds at 60fps
                    player.invincible = true;
                    player.invincibleTimer = 300; // 5s invincibility
                    player.shieldActive = false; // no separate shield during V-power
                    playPowerupSound();
                    break;
            }
            powerups.splice(i, 1);
        }
    });
}

// ============================================
// DRAWING FUNCTIONS
// ============================================

function drawLaserBeam() {
    if (laserBeams.length === 0) return;
    
    const startX = player.x;
    const startY = player.y - player.height / 2;
    
    laserBeams.forEach((beam, beamIdx) => {
        if (!beam.targetEnemy) return;
        
        const endX = beam.targetX;
        const endY = beam.targetY;
        
        ctx.save();
        
        // Slight rubber band curve (each beam has slightly different phase)
        const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const curveOffset = Math.min(dist * 0.08, 30);
        const perpX = -(endY - startY) / (dist || 1) * curveOffset;
        const perpY = (endX - startX) / (dist || 1) * curveOffset;
        const phase = frameCount * 0.03 + beamIdx * 1.5;
        const ctrlX = midX + perpX * Math.sin(phase);
        const ctrlY = midY + perpY * Math.sin(phase);
        
        // Outer subtle glow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
        
        // Core beam
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
        
        // Bright center line
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
        ctx.stroke();
        
        // Small glow at impact point
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}
function drawBackground() {
    // Gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Stars
    ctx.fillStyle = '#FFFFFF';
    stars.forEach(star => {
        ctx.globalAlpha = 0.3 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function drawPlayer() {
    if (!player.visible) return;
    
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // V power effect - gray tint + color change
    if (player.vPowerActive) {
        // Blinking effect
        ctx.globalAlpha = 0.5 + Math.sin(frameCount * 0.3) * 0.5;
        // Override player colors to gray/silver
        ctx.fillStyle = '#AAAAAA';
        ctx.strokeStyle = '#888888';
        // Bigger plane during V-power
        ctx.scale(1.3, 1.3);
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
    ctx.shadowColor = COLORS.player;
    ctx.shadowBlur = 15;
    
    // Main body
    if (!player.vPowerActive) ctx.fillStyle = COLORS.playerBody;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 15);
    ctx.lineTo(-5, 10);
    ctx.lineTo(0, 20);
    ctx.lineTo(5, 10);
    ctx.lineTo(15, 15);
    ctx.closePath();
    ctx.fill();
    
    // Wings
    if (!player.vPowerActive) ctx.fillStyle = '#4169E1';
    ctx.fillRect(-25, 0, 15, 8);
    ctx.fillRect(10, 0, 15, 8);
    
    // Cockpit
    if (!player.vPowerActive) ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(0, -5, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Engine glow
    if (!player.vPowerActive) ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(-5, 20);
    ctx.lineTo(0, 30 + Math.random() * 5);
    ctx.lineTo(5, 20);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawBossClaw() {
    if (!bossClawActive || bossClawLength <= 0) return;
    
    const startY = 0;
    const endY = bossClawLength;
    const x = bossClawX;
    
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

function drawEnemy(enemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    
    ctx.shadowColor = enemy.type === 'boss' ? '#FF0000' : COLORS.enemy;
    ctx.shadowBlur = 10;
    
    switch (enemy.type) {
        case 'scout':
            // Simple red triangle
            ctx.fillStyle = '#CC3333';
            ctx.beginPath();
            ctx.moveTo(0, 18);
            ctx.lineTo(-15, -15);
            ctx.lineTo(15, -15);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#4488FF';
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'fighter':
            // Fighter plane
            ctx.fillStyle = '#AA2222';
            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.lineTo(-10, 0);
            ctx.lineTo(-20, 5);
            ctx.lineTo(-15, -10);
            ctx.lineTo(15, -10);
            ctx.lineTo(20, 5);
            ctx.lineTo(10, 0);
            ctx.closePath();
            ctx.fill();
            
            // Wings
            ctx.fillStyle = '#882222';
            ctx.fillRect(-22, -5, 12, 20);
            ctx.fillRect(10, -5, 12, 20);
            
            // Cockpit
            ctx.fillStyle = '#FF6666';
            ctx.beginPath();
            ctx.ellipse(0, 5, 5, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'bomber':
            // Larger bomber
            ctx.fillStyle = '#882222';
            ctx.beginPath();
            ctx.moveTo(0, 25);
            ctx.lineTo(-8, 10);
            ctx.lineTo(-25, 15);
            ctx.lineTo(-20, -5);
            ctx.lineTo(20, -5);
            ctx.lineTo(25, 15);
            ctx.lineTo(8, 10);
            ctx.closePath();
            ctx.fill();
            
            // Bombs
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 15, 5, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'boss':
            // Large boss (wave boss is extra large)
            const isWaveBoss = enemy.isWaveBoss || false;
            const sizeMult = isWaveBoss ? 1.4 : 1;
            
            ctx.fillStyle = isWaveBoss ? '#880000' : '#660000';
            ctx.beginPath();
            ctx.moveTo(0, 40 * sizeMult);
            ctx.lineTo(-35 * sizeMult, 0);
            ctx.lineTo(-40 * sizeMult, -20 * sizeMult);
            ctx.lineTo(-20 * sizeMult, -35 * sizeMult);
            ctx.lineTo(0, -25 * sizeMult);
            ctx.lineTo(20 * sizeMult, -35 * sizeMult);
            ctx.lineTo(40 * sizeMult, -20 * sizeMult);
            ctx.lineTo(35 * sizeMult, 0);
            ctx.closePath();
            ctx.fill();
            
            // Core
            ctx.fillStyle = isWaveBoss ? '#FF6666' : '#FF3333';
            ctx.beginPath();
            ctx.arc(0, 0, 15 * sizeMult, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes for wave boss
            if (isWaveBoss) {
                ctx.fillStyle = '#4488FF';
                ctx.beginPath();
                ctx.arc(-8 * sizeMult, -5 * sizeMult, 5, 0, Math.PI * 2);
                ctx.arc(8 * sizeMult, -5 * sizeMult, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(-8 * sizeMult, -5 * sizeMult, 2, 0, Math.PI * 2);
                ctx.arc(8 * sizeMult, -5 * sizeMult, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // HP bar (wider for wave boss)
            const hpBarW = isWaveBoss ? 80 : 60;
            const hpBarX = -hpBarW / 2;
            ctx.fillStyle = '#333';
            ctx.fillRect(hpBarX, -55 * sizeMult, hpBarW, 8);
            const hpRatio = enemy.hp / enemy.maxHp;
            ctx.fillStyle = hpRatio > 0.5 ? '#FF0000' : hpRatio > 0.25 ? '#FF6600' : '#FF0000';
            ctx.fillRect(hpBarX, -55 * sizeMult, hpBarW * hpRatio, 8);
            
            // Boss name for wave boss
            if (isWaveBoss) {
                ctx.fillStyle = '#FFD700';
                ctx.font = '8px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.fillText('BOSS', 0, -62 * sizeMult);
            }
            break;
            
        case 'rammer':
            // Propeller plane - chases player
            // Fuselage
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-8, -14, 16, 28);
            
            // Wings
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.moveTo(-22, -2);
            ctx.lineTo(22, -2);
            ctx.lineTo(16, 6);
            ctx.lineTo(-16, 6);
            ctx.closePath();
            ctx.fill();
            
            // Tail
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.moveTo(-14, 10);
            ctx.lineTo(14, 10);
            ctx.lineTo(6, 18);
            ctx.lineTo(-6, 18);
            ctx.closePath();
            ctx.fill();
            
            // Propeller (spinning)
            ctx.save();
            ctx.rotate(frameCount * 0.5);
            ctx.fillStyle = '#444';
            ctx.fillRect(-2, -12, 4, 24);
            ctx.fillStyle = '#888';
            ctx.fillRect(-12, -2, 24, 4);
            ctx.restore();
            
            // Cockpit
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(0, -6, 6, 0, Math.PI * 2);
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
    ctx.fillStyle = isEnemy ? COLORS.enemyBullet : COLORS.bullet;
    
    if (isEnemy) {
        // Enemy bullet - fluorescent pink circle with glow
        ctx.shadowColor = COLORS.enemyBullet;
        ctx.shadowBlur = 14;
        // Outer glow ring
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.width / 2 + 3, 0, Math.PI * 2);
        ctx.fill();
        // Core bright spot
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
        // White hot center
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.width / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.enemyBullet;
    } else {
        // Player bullet - rectangle with glow
        ctx.shadowColor = COLORS.bullet;
        ctx.shadowBlur = 8;
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y - bullet.height / 2, bullet.width, bullet.height);
        ctx.shadowBlur = 0;
    }
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
    const droneColor = isHoming ? COLORS.droneR : COLORS.drone;
    const innerColor = isHoming ? '#FF6666' : '#FFB6C1';
    const wingColor = isHoming ? '#CC0000' : '#FF1493';
    
    // Drone body - small diamond shape
    ctx.shadowColor = droneColor;
    ctx.shadowBlur = 8;
    
    ctx.fillStyle = droneColor;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-6, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    
    // Inner glow
    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Small wings
    ctx.fillStyle = wingColor;
    ctx.fillRect(-10, -2, 4, 4);
    ctx.fillRect(6, -2, 4, 4);
    
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
        // Fluorescent pink glow for drone bullets
        ctx.shadowColor = COLORS.droneBullet;
        ctx.shadowBlur = 16;
        ctx.fillStyle = COLORS.droneBullet;
        // Outer glow
        ctx.fillRect(bullet.x - bullet.width / 2 - 2, bullet.y - bullet.height / 2 - 2, bullet.width + 4, bullet.height + 4);
        // Core
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FF69B4';
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
    ctx.fillStyle = COLORS.explosion[Math.floor((1 - exp.life) * COLORS.explosion.length)];
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.size * exp.life, 0, Math.PI * 2);
    ctx.fill();
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
    missiles.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        
        // Rotate based on velocity direction
        const angle = Math.atan2(m.vy, m.vx) + Math.PI / 2;
        ctx.rotate(angle);
        
        // Missile body (100% smaller = half of previous)
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(-6.75, -15, 13.5, 30);
        
        // Missile nose cone (100% smaller = half of previous)
        ctx.fillStyle = '#FF3300';
        ctx.beginPath();
        ctx.moveTo(0, -20.25);
        ctx.lineTo(-6.75, -10);
        ctx.lineTo(6.75, -10);
        ctx.closePath();
        ctx.fill();
        
        // Fins (100% smaller = half of previous)
        ctx.fillStyle = '#CC4400';
        ctx.beginPath();
        ctx.moveTo(-6.75, 10);
        ctx.lineTo(-13.5, 15);
        ctx.lineTo(-6.75, 15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(6.75, 10);
        ctx.lineTo(13.5, 15);
        ctx.lineTo(6.75, 15);
        ctx.closePath();
        ctx.fill();
        
        // Flame (100% smaller = half of previous)
        ctx.fillStyle = '#4488FF';
        ctx.beginPath();
        ctx.moveTo(-5.25, 15);
        ctx.lineTo(0, 24 + Math.random() * 6.75);
        ctx.lineTo(5.25, 15);
        ctx.closePath();
        ctx.fill();
        
        // Glow (100% smaller = half of previous)
        ctx.shadowColor = '#FF6600';
        ctx.shadowBlur = 13.5;
        ctx.fillStyle = 'rgba(255, 102, 0, 0.3)';
        ctx.fillRect(-6.75, -15, 13.5, 30);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    });
}

function drawUI() {
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
    
    // Score
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${score.toString().padStart(6, '0')}`, 15, 30);
    
    // High Score
    ctx.textAlign = 'right';
    ctx.fillText(`HI ${highScore.toString().padStart(6, '0')}`, GAME_WIDTH - 15, 30);
    
    // Wave
    ctx.textAlign = 'center';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(`WAVE ${wave}`, GAME_WIDTH / 2, 30);
    
    // V Power indicator
    if (player.vPowerActive) {
        const vSecLeft = Math.ceil(player.vPowerTimer / 60);
        ctx.fillStyle = '#888888';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`V-POWER ${vSecLeft}s`, GAME_WIDTH / 2, 48);
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
    
    // Power level / Laser level
    if (laserBeams.length > 0) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`LSR ${'▌'.repeat(laserBeams.length)}`, GAME_WIDTH - 100, GAME_HEIGHT - 25);
    } else {
        ctx.fillText(`PWR ${'★'.repeat(player.powerLevel + 1)}`, GAME_WIDTH - 100, GAME_HEIGHT - 25);
    }
    
    // Missile level indicator
    if (playerMissileLevel > 0) {
        ctx.fillStyle = '#FF6600';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText(`MSL ${'▶'.repeat(playerMissileLevel)}`, GAME_WIDTH - 100, GAME_HEIGHT - 40);
    }
    
    // Update bomb indicator for mobile
    if (bombIndicator) {
        if (isTouchDevice()) {
            bombIndicator.style.display = 'flex';
            bombIndicator.innerHTML = `B<span style="font-size:9px;margin-left:2px">×${player.bombs}</span>`;
        }
    }
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
    // Always increment frameCount for animations
    frameCount++;
    
    if (gameState === GameState.PLAYING) {
        update();
    }
    
    // Clear
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    if (gameState === GameState.TITLE) {
        drawTitleScreen();
        if (isTouchDevice()) { drawJoystick(); }
    } else if (gameState === GameState.PLAYING) {
        drawBackground();
        
        // Draw game objects
        powerups.forEach(pu => drawPowerup(pu));
        playerBullets.forEach(b => drawBullet(b, false));
        enemyBullets.forEach(b => drawBullet(b, true));
        // Draw boss claw before enemies
        drawBossClaw();
        
        enemies.forEach(enemy => drawEnemy(enemy));
        explosions.forEach(exp => drawExplosion(exp));
        
        if (player.visible) drawPlayer();
        if (laserBeams.length > 0) drawLaserBeam();
        drawMissiles();
        
        // Draw drones
        drones.forEach(d => drawDrone(d));
        droneBullets.forEach(b => drawDroneBullet(b));
        
        // Draw joystick on touch devices (always show base)
        if (isTouchDevice()) {
            drawJoystick();
        }
        
        drawUI();
    } else if (gameState === GameState.PAUSED) {
        drawBackground();
        powerups.forEach(pu => drawPowerup(pu));
        playerBullets.forEach(b => drawBullet(b, false));
        enemyBullets.forEach(b => drawBullet(b, true));
        drawBossClaw();
        enemies.forEach(enemy => drawEnemy(enemy));
        if (player.visible) drawPlayer();
        drones.forEach(d => drawDrone(d));
        droneBullets.forEach(b => drawDroneBullet(b));
        if (isTouchDevice()) { drawJoystick(); }
        drawUI();
        drawPauseScreen();
    } else if (gameState === GameState.GAMEOVER) {
        drawBackground();
        explosions.forEach(exp => drawExplosion(exp));
        if (isTouchDevice()) { drawJoystick(); }
        drawGameOverScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
