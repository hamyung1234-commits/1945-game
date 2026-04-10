# 1945 슈팅 게임 - SPEC.md

## 1. Concept & Vision

추억의 오락실 게임, 사이쿄(CAPCOM)의 1942를 오마주하는 세로 스크롤 비행기 슈팅 게임. 레트로 픽셀 아트 스타일로 2차 세계대전时期的 비행기들이 등장하며, 탄막과 폭탄으로 적기를 격추하는 짜릿한 액션을 제공합니다.

## 2. Design Language

### Aesthetic Direction
- 8-bit 레트로 아케이드 스타일
- 픽셀 아트 비행기와 폭발 이펙트
- 그라데이션 배경 (하늘색 → 주황색 노을)

### Color Palette
- Primary (Player): `#FFD700` (골드)
- Secondary (Enemy): `#FF4444` (레드)
- Accent (Powerup): `#00FF00` (그린)
- Background Sky: `#1a1a2e` → `#16213e` → `#0f3460`
- UI Text: `#FFFFFF`
- Explosion: `#FF6B35`, `#F7931E`, `#FFD700`

### Typography
- Pixel/Monospace 스타일 (arcade-font)
- Score, Life, Bomb 표시

### Motion Philosophy
- 부드러운 세로 스크롤 배경
- 탄환: 빠른 직선 이동
- 폭발: 파티클 확산 애니메이션
- 파워업: 깜빡임 효과

## 3. Layout & Structure

### Game Screen (Canvas 480x720)
```
┌────────────────────────┐
│ SCORE: 00000  HI:00000 │ ← HUD (상단)
│ ★★★  💣x3              │ ← 생명/폭탄
├────────────────────────┤
│                        │
│    [적 비행기 등장]     │ ← 적 기区域
│         ↓ ↓ ↓         │
│                        │
│    [전투区域]          │ ← 탄환/폭발
│                        │
│         ▲              │ ← 플레이어
│        ╱█╲             │
└────────────────────────┘
```

### States
1. **Title Screen**: "1945" 타이틀 + "PRESS SPACE TO START"
2. **Playing**: 실제 게임플레이
3. **Paused**: 일시정지 overlay
4. **Game Over**: 최종 점수 + 리스타트 옵션

## 4. Features & Interactions

### Core Mechanics
- **이동**: Arrow Keys 또는 WASD (8방향)
- **발사**: Space (연속 발사, 약 5发/초)
- **폭탄**: B키 (화면의 적 전체 제거, 3개 제한)
- **일시정지**: P 또는 ESC

### Player Ship
- 기본: 1발 연사
- Power-up Level 1: 2발 확산
- Power-up Level 2: 3발 확산
- Power-up Level 3: 5발 + 로켓

### Enemy Types
1. **Scout**: 직선 하강, 1 HP, 100점
2. **Fighter**: 지그재그 이동, 2 HP, 200점
3. **Bomber**: 느리게 하강, 폭탄 투하, 3 HP, 300점
4. **Boss**:阶段性 등장, 50+ HP, 2000점

### Power-ups
- **P**: Power-up (무기 강화)
- **B**: Bomb (+1 폭탄)
- **S**: Shield (잠시 무적)

### Wave System
- 30초마다 wave 증가
- Wave 높을수록 적 HP↑, 등장 빈도↑

## 5. Component Inventory

### Player Ship
- States: Normal, Invincible (blink), Destroyed
- Size: 48x48 pixels

### Bullets
- Player: 노란색 직사각형 4x12
- Enemy: 빨간색 원형 6x6

### Explosions
- 파티클 시스템 (8-16개)
- 스케일: 0.5s → 0

### UI Elements
- Score display (좌상단)
- High score (우상단)
- Life icons (아래)
- Bomb count (아이콘)

## 6. Technical Approach

### Stack
- Pure JavaScript + HTML5 Canvas
- Single file architecture (game.js)
- 60 FPS game loop (requestAnimationFrame)

### Architecture
```
GameEngine
├── State (title/playing/paused/gameover)
├── Player
├── Bullets[]
├── Enemies[]
├── Powerups[]
├── Explosions[]
├── Background
└── UI
```

### Collision Detection
- AABB (Axis-Aligned Bounding Box)
- Player hitbox: 중앙 50%만 유효 (회피 요소)

### Audio (Optional)
- 배경음: 없음 (순수 효과음)
- SE: Shooting, Explosion, Powerup, GameOver
