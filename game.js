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

// Space-themed BGM - ambient synth pad
function startBGM() {
    if (bgmPlaying || !audioContext) return;
    bgmPlaying = true;
    
    const now = audioContext.currentTime;
    
    // Create ambient pad layers
    const frequencies = [55, 82.5, 110, 165]; // A1, E2, A2, E3 - spacey chord
    
    frequencies.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // Slight detune for richness
        osc.detune.value = (Math.random() - 0.5) * 10;
        
        // Low pass filter for warmth
        filter.type = 'lowpass';
        filter.frequency.value = 400 + i * 100;
        filter.Q.value = 1;
        
        // Slow fade in
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.08 - i * 0.015, now + 3);
        
        // Subtle LFO modulation
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        lfo.frequency.value = 0.1 + Math.random() * 0.1;
        lfo.type = 'sine';
        lfoGain.gain.value = 2;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.detune);
        lfo.start(now + i * 0.5);
        bgmOscillators.push(lfo);
        
        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(bgmGain);
        osc.start(now + i * 0.3);
        bgmOscillators.push(osc);
    });
    
    // Add higher ethereal tones
    const highFreqs = [440, 554.37, 659.25]; // A4, C#5, E5
    highFreqs.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const oscGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 20;
        
        filter.type = 'bandpass';
        filter.frequency.value = 800 + i * 200;
        filter.Q.value = 2;
        
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.02, now + 5);
        
        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(bgmGain);
        osc.start(now + 2 + i * 0.8);
        bgmOscillators.push(osc);
    });
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
let frameCount = 0;

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
    shootCooldown: 0,
    visible: true
};

// Input
const keys = {};

// Arrays
let playerBullets = [];
let enemyBullets = [];
let enemies = [];
let powerups = [];
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
    enemyBullet: '#FF4444',
    powerup: '#00FF00',
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
let leftBtn = null;
let rightBtn = null;
let upBtn = null;
let downBtn = null;
let touchDirPressed = { left: false, right: false, up: false, down: false };

function setupMobileControls() {
    // Get button elements
    fireBtn = document.getElementById('fireBtn');
    bombBtn = document.getElementById('bombBtn');
    leftBtn = document.getElementById('leftBtn');
    rightBtn = document.getElementById('rightBtn');
    upBtn = document.getElementById('upBtn');
    downBtn = document.getElementById('downBtn');
    
    // Direction button handlers
    function setupDirButton(btn, dir) {
        if (!btn) return;
        
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            touchDirPressed[dir] = true;
            btn.classList.add('pressed');
        }, { passive: false });
        
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchDirPressed[dir] = false;
            btn.classList.remove('pressed');
        }, { passive: false });
        
        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            touchDirPressed[dir] = false;
            btn.classList.remove('pressed');
        }, { passive: false });
        
        // Mouse support
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            touchDirPressed[dir] = true;
            btn.classList.add('pressed');
        });
        
        btn.addEventListener('mouseup', () => {
            touchDirPressed[dir] = false;
            btn.classList.remove('pressed');
        });
        
        btn.addEventListener('mouseleave', () => {
            touchDirPressed[dir] = false;
            btn.classList.remove('pressed');
        });
    }
    
    setupDirButton(leftBtn, 'left');
    setupDirButton(rightBtn, 'right');
    setupDirButton(upBtn, 'up');
    setupDirButton(downBtn, 'down');
    
    // Canvas touch for movement
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
                }, 100);
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
                }, 100);
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
        
        fireBtn.addEventListener('mouseleave', () => {
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
        
        // Mouse support for testing on desktop
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
    
    isTouching = true;
    updateTouchTarget(e.touches[0]);
}

function handleCanvasTouchMove(e) {
    e.preventDefault();
    if (gameState !== GameState.PLAYING || !isTouching) return;
    updateTouchTarget(e.touches[0]);
}

function handleCanvasTouchEnd(e) {
    e.preventDefault();
    isTouching = false;
    touchTarget.x = null;
    touchTarget.y = null;
}

function updateTouchTarget(touch) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    
    touchTarget.x = (touch.clientX - rect.left) * scaleX;
    touchTarget.y = (touch.clientY - rect.top) * scaleY;
}

// Initialize mobile controls
setupMobileControls();

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
    
    playerBullets = [];
    enemyBullets = [];
    enemies = [];
    powerups = [];
    explosions = [];
    
    startBGM();
}

function useBomb() {
    if (player.bombs > 0) {
        player.bombs--;
        
        // Clear all enemies
        enemies.forEach(enemy => {
            createExplosion(enemy.x, enemy.y);
            score += 10;
        });
        enemies = [];
        
        // Clear enemy bullets
        enemyBullets = [];
        
        // Screen flash effect
        createExplosion(GAME_WIDTH / 2, GAME_HEIGHT / 2, 50);
    }
}

function playerShoot() {
    if (player.shootCooldown > 0) return;
    
    player.shootCooldown = 8;
    playShootSound();
    
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
    const types = ['scout', 'scout', 'fighter', 'bomber'];
    if (wave >= 3) types.push('fighter', 'bomber');
    if (wave >= 5) types.push('boss');
    
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
            enemy.shootCooldown = 40;
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
    }
    
    enemies.push(enemy);
}

function spawnPowerup(x, y) {
    if (Math.random() > 0.15) return;
    
    const types = ['power', 'bomb', 'shield'];
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
    if (player.invincible) return;
    
    player.lives--;
    player.invincible = true;
    player.invincibleTimer = 120;
    player.powerLevel = Math.max(0, player.powerLevel - 1);
    
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
    
    // Wave progression
    if (waveTimer > 1800) {
        wave++;
        waveTimer = 0;
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
    
    // Player movement (mobile direction buttons)
    if (touchDirPressed.left) {
        player.x -= player.speed;
    }
    if (touchDirPressed.right) {
        player.x += player.speed;
    }
    if (touchDirPressed.up) {
        player.y -= player.speed;
    }
    if (touchDirPressed.down) {
        player.y += player.speed;
    }
    
    // Player movement (touch)
    if (isTouching && touchTarget.x !== null && touchTarget.y !== null) {
        const dx = touchTarget.x - player.x;
        const dy = touchTarget.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
            const moveSpeed = Math.min(player.speed, dist);
            player.x += (dx / dist) * moveSpeed;
            player.y += (dy / dist) * moveSpeed;
        }
        
        // Auto-fire while touching
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
    
    // Invincibility
    if (player.invincible) {
        player.invincibleTimer--;
        player.visible = Math.floor(player.invincibleTimer / 5) % 2 === 0;
        if (player.invincibleTimer <= 0) {
            player.invincible = false;
            player.visible = true;
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
                            speed: 5
                        });
                        enemy.shootCooldown = 60;
                    }
                }
                break;
            case 'boss':
                if (enemy.y < 100) {
                    enemy.y += enemy.speed;
                } else {
                    enemy.x += Math.sin(enemy.phase * 0.5) * 2;
                    enemy.shootCooldown--;
                    if (enemy.shootCooldown <= 0) {
                        // Spread shot
                        for (let i = -2; i <= 2; i++) {
                            enemyBullets.push({
                                x: enemy.x + i * 15,
                                y: enemy.y + enemy.height / 2,
                                width: 12,
                                height: 12,
                                speed: 4 + Math.abs(i) * 0.5
                            });
                        }
                        enemy.shootCooldown = Math.max(30, 60 - wave * 3);
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
                    speed: 4 + wave * 0.3
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
    
    // Collision: Player bullets vs Enemies
    playerBullets.forEach((bullet, bi) => {
        enemies.forEach((enemy, ei) => {
            if (checkCollision(bullet, enemy)) {
                enemy.hp--;
                playerBullets.splice(bi, 1);
                
                if (enemy.hp <= 0) {
                    score += enemy.score;
                    createExplosion(enemy.x, enemy.y);
                    spawnPowerup(enemy.x, enemy.y);
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
                playerHit();
            }
        });
    }
    
    // Collision: Enemies vs Player
    if (!player.invincible) {
        enemies.forEach((enemy, ei) => {
            if (checkCollision(enemy, player)) {
                createExplosion(enemy.x, enemy.y);
                enemies.splice(ei, 1);
                playerHit();
            }
        });
    }
    
    // Collision: Powerups vs Player
    powerups.forEach((pu, i) => {
        if (checkCollision(pu, player)) {
            playPowerupSound();
            switch (pu.type) {
                case 'power':
                    player.powerLevel = Math.min(3, player.powerLevel + 1);
                    break;
                case 'bomb':
                    player.bombs = Math.min(5, player.bombs + 1);
                    break;
                case 'shield':
                    player.invincible = true;
                    player.invincibleTimer = 180;
                    break;
            }
            powerups.splice(i, 1);
        }
    });
}

// ============================================
// DRAWING FUNCTIONS
// ============================================

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
    
    // Glow effect
    ctx.shadowColor = COLORS.player;
    ctx.shadowBlur = 15;
    
    // Main body
    ctx.fillStyle = COLORS.playerBody;
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
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(-25, 0, 15, 8);
    ctx.fillRect(10, 0, 15, 8);
    
    // Cockpit
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.ellipse(0, -5, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(-5, 20);
    ctx.lineTo(0, 30 + Math.random() * 5);
    ctx.lineTo(5, 20);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
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
            ctx.fillStyle = '#FF4444';
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
            // Large boss
            ctx.fillStyle = '#660000';
            ctx.beginPath();
            ctx.moveTo(0, 40);
            ctx.lineTo(-35, 0);
            ctx.lineTo(-40, -20);
            ctx.lineTo(-20, -35);
            ctx.lineTo(0, -25);
            ctx.lineTo(20, -35);
            ctx.lineTo(40, -20);
            ctx.lineTo(35, 0);
            ctx.closePath();
            ctx.fill();
            
            // Core
            ctx.fillStyle = '#FF3333';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // HP bar
            ctx.fillStyle = '#333';
            ctx.fillRect(-30, -45, 60, 8);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(-30, -45, 60 * (enemy.hp / enemy.maxHp), 8);
            break;
    }
    
    ctx.shadowBlur = 0;
    ctx.restore();
}

function drawBullet(bullet, isEnemy) {
    ctx.fillStyle = isEnemy ? COLORS.enemyBullet : COLORS.bullet;
    
    if (isEnemy) {
        // Enemy bullet - circle
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.width / 2, 0, Math.PI * 2);
        ctx.fill();
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
    
    ctx.shadowColor = COLORS.powerup;
    ctx.shadowBlur = 10;
    
    ctx.fillStyle = COLORS.powerup;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    switch (pu.type) {
        case 'power':
            ctx.fillText('P', 0, 1);
            break;
        case 'bomb':
            ctx.fillText('B', 0, 1);
            break;
        case 'shield':
            ctx.fillText('S', 0, 1);
            break;
    }
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawExplosion(exp) {
    ctx.globalAlpha = exp.life;
    ctx.fillStyle = COLORS.explosion[Math.floor((1 - exp.life) * COLORS.explosion.length)];
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.size * exp.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function isTouchDevice() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

function drawUI() {
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
    
    // Power level
    ctx.fillText(`PWR ${'★'.repeat(player.powerLevel + 1)}`, GAME_WIDTH - 100, GAME_HEIGHT - 25);
    
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
    
    ctx.fillStyle = '#FF4444';
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
    update();
    
    // Clear
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    if (gameState === GameState.TITLE) {
        frameCount++;
        drawTitleScreen();
    } else if (gameState === GameState.PLAYING) {
        drawBackground();
        
        // Draw game objects
        powerups.forEach(pu => drawPowerup(pu));
        playerBullets.forEach(b => drawBullet(b, false));
        enemyBullets.forEach(b => drawBullet(b, true));
        enemies.forEach(enemy => drawEnemy(enemy));
        explosions.forEach(exp => drawExplosion(exp));
        
        if (player.visible) drawPlayer();
        
        drawUI();
    } else if (gameState === GameState.PAUSED) {
        drawBackground();
        powerups.forEach(pu => drawPowerup(pu));
        playerBullets.forEach(b => drawBullet(b, false));
        enemyBullets.forEach(b => drawBullet(b, true));
        enemies.forEach(enemy => drawEnemy(enemy));
        if (player.visible) drawPlayer();
        drawUI();
        drawPauseScreen();
    } else if (gameState === GameState.GAMEOVER) {
        frameCount++;
        drawBackground();
        explosions.forEach(exp => drawExplosion(exp));
        drawGameOverScreen();
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
