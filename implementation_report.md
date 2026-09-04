# Implementation Report - 중간보스 등장 밸런스 + 총알 속도 감소

## Date
2025-01-22

## Summary
스테이지 2+에서 중간보스(하트/문어)가 웨이브 1부터 대량 등장하는 문제를 수정하고,
적기 총알 속도가 높은 스테이지에서 너무 빨라지는 문제를 해결했습니다.

## Changes Applied

### 1. 스테이지 2+ 중간보스 스폰 로직 수정 (Lines 1165-1174)
- **문제:** currentStage >= 2 일 때 모든 웨이브에서 boss(2x) + octopus(1x)가 types 배열에 무조건 추가됨
- **Before:** 웨이브 1부터 하트/문어 중간보스 대량 등장
- **After:** wave >= 17 조건 충족 시에만 중간보스 추가 (스테이지 1과 동일한 규칙)

### 2. 일반 적기 총알 속도 감소 (Line 2086)
- **Before:** `speed: 1.5 + currentStage * 0.2` (Stage3=2.1, Stage4=2.3 — 너무 빠름)
- **After:** `speed: 0.9 + currentStage * 0.12` (Stage1=1.02, Stage3=1.26, Stage4=1.38 — 약 40% 감소)

### 3. 하트 중간보스 총알 속도 감소 (Line 2030)
- **Before:** `speed: 0.5`
- **After:** `speed: 0.35`

## Verification Results
- **Syntax:** OK (5575 lines)
- **Generic bullet speed:** 0.9 + currentStage * 0.12 ✓
- **Heart boss bullet speed:** 0.35 ✓
- **Stage 2+ wave gate:** wave >= 17 && wave % 10 !== 0 ✓

## Current Complete Balance State
| Feature | Value |
|---------|-------|
| 일반 적기 총알 속도 | 0.9 + currentStage * 0.12 |
| 적기 발사 확률 | 0.02 * wave |
| 하트 중간보스 총알 속도 | 0.35 |
| 폭격기(bomber) 총알 속도 | 0.5 |
| 하트 중간보스 HP | 3 + currentStage * 3 |
| 문어 중간보스 HP | (3 + currentStage * 3) * 0.7 |
| 중간보스 등장 시점 | wave >= 17 (모든 스테이지 동일) |
| 하트 중간보스 발사 간격 | max(90, 150 - currentStage * 5) |
| 문어 촉수 공격 간격 | 400 + Math.random() * 150 |
| 문어 수명 | 300 프레임 (5초) |
| 동시 중간보스 최대 | 3마리 |
| 동시 문어 최대 | 2마리 |

---

# Implementation Report - 최종보스 3단계 등장 시퀀스 + 보스 HP +100% + 날개 라운드화

## Date
2026-09-01

## Summary
최종보스 등장 시퀀스를 사이렌 → 호위체 → 보스 스폰의 3단계 시네마틱으로 전환하고,
호위체는 총알을 발사하지 않는 순수 비주얼 호위만 수행하도록 구현했습니다.
보스 HP를 +100% 상향하고, 보스 날개를 폭격기 스타일의 둥근 끝 라운드 윙으로 변경했습니다.

## Changes Applied

### 1. 최종보스 HP +100% (Line 1474)
- **Before:** `bossHP = baseMidBossHP * 3 * 1.3^(stage-1)` (Stage1=210, Stage2=273, ...)
- **After:** `bossHP *= 2` 한 줄 추가 (Stage1=420, Stage2=546, Stage3=710, ...)
- 즉, Stage 1 보스는 420 HP로 2배 강화됨.

### 2. 최종보스 3단계 인트로 (Lines 484-502, 1431-1497, 1713-1921)
신규 글로벌 상태 머신:
- `bossIntroPhase` ('siren' | 'escort' | 'spawn' | null)
- `bossSirenTimer`, `bossSirenDuration=90` (1.5s 사이렌)
- `bossEscortMax=28`, `bossEscortSpawnedCount`, `bossEscortActiveCount`
- `bossEscortStartTimer`, `bossEscortWindowFrames=240` (4s 호위 윈도우)
- `bossPendingPayload` (보스 entity는 escort 종료 후 push)

신규 함수:
- `spawnBossEscort()` — 좌/우/중앙(컬럼 4-6) 패턴 중 랜덤으로 escort spawn
- `pushBossEscortEnemy()` — `isBossEscort=true`로 마킹, `shootCooldown=99999`, 사인파 스웨이 파라미터 부여
- `updateBossIntro()` — 페이즈 머신. 사이렌 카운트다운 → escort spawn + sway + descent → 모두 클리어되거나 4초 경과 시 `spawnFinalBoss()` 호출
- `spawnFinalBoss()` — `bossPendingPayload`를 enemies에 push, 페이즈 전환
- `drawBossSirenOverlay()` — 풀스크린 빨간 사이렌 (3펄스 envelope) + vignette + "!! WARNING !!" / "INCOMING HOSTILES" 텍스트
- `drawBossEscortLabel()` — 상단 작은 안내 "BOSS ESCORT — CLEAR THEM (n)"

### 3. escort 격리 (Line 2882)
일반 적기 업데이트 switch 진입 직전에 `if (enemy.isBossEscort) continue;` 추가하여
escort는 `updateBossIntro()`의 스웨이/하강 로직만 따르고 일반 AI·총알 로직은 모두 건너뜀.

### 4. 호위체는 총알 발사 안 함
escort의 `shootCooldown=99999`이 일반 적기 발사 분기(라인 2880~)에서 절대 0 이하가 되지 않도록
continue로 격리. → escort는 비주얼 호위만 수행 (사용자 요구사항 정확히 일치).

### 5. 사이렌/호위 페이즈 중 일반 적기 스폰 차단 (Line 1524-1526)
spawnEnemy 함수에 `if (bossActive && bossIntroPhase && bossIntroPhase !== 'spawn') return;` 가드 추가.

### 6. drawFinalBoss 날개 라운드화 (Lines 6745-6776)
- **Before:** 직선 4점 폴리곤 (각진 끝) — `(ex±30, ey-6) → (ex±160, ey-22) → (ex±158, ey+8) → (ex±30, ey+12)`
- **After:** `quadraticCurveTo` 3연결로 둥근 wingtip 마감 (폭격기 long-bombing wing)
  - upper edge sweep: `(ex±30, ey-6) → (ex±120, ey-28) → (ex±160, ey-18)`
  - rounded tip arc: `(ex±160, ey-18) → (ex±175, ey-8) → (ex±160, ey+4)`
  - lower edge sweep: `(ex±160, ey+4) → (ex±120, ey+18) → (ex±30, ey+12)`
- Wing leading edge highlight도 새 실루엣을 따라 quadraticCurveTo로 갱신.

### 7. 날개 데미지 무효 (기존 구조 유지)
`hitboxBody` (몸통, halfW=55) + `hitboxTail` (꼬리, halfW=25) 외 위치 충돌은 wing-only로 판정하여
데미지 무효 — 기존 4곳(laser tick, 일반 bullet, bomb trail 등) 그대로 유지.

## Verification Results
- **Syntax:** OK (8106 lines, `new Function(src)` 통과)
- **상태 머신 전이:** siren (90f) → escort (≤240f) → spawn 검증
- **escort 격리:** 일반 적기 switch 직전 `continue` 확인
- **정적 매핑:** 신규 식별자 12개 + 신규 함수 6개 모두 코드에 매핑
- **dev 서버:** http://localhost:4001 200 OK
- **렌더:** 타이틀 화면 정상 (RENDER CHECK: OK, MOBILE CHECK: 통과)

## Final State
| 항목 | 값 |
|------|---|
| 최종보스 HP (Stage 1) | 420 (×2) |
| 사이렌 페이즈 | 90프레임 (1.5s) |
| 호위체 페이즈 | 240프레임 (4s) 또는 클리어 시 즉시 |
| 호위체 최대 | 28마리 |
| 호위체 총알 발사 | ❌ 비활성 (shootCooldown=99999) |
| 호위체 스폰 패턴 | 좌/우/중앙 컬럼 (4-6기) |
| 호위체 이동 | 사인파 스웨이 + 하강 |
| 보스 날개 끝 | 둥근 long-bombing 윙 (quadraticCurveTo) |
| 보스 데미지 영역 | hitboxBody(몸통) + hitboxTail(꼬리)만 |

---

# Implementation Report - SVG 스프라이트 오버레이 시스템 (덧씌우기)

## Date
2026-09-02

## Summary
게임 로직(스폰·충돌·히트박스·점수·보스 패턴)은 한 줄도 바꾸지 않고,
그리기만 SVG 스프라이트로 교체하는 오버레이 시스템을 구축했습니다.
방식은 "덧씌우기" — 새 파일 `sprites.js`를 game.js보다 먼저 로드하고,
기존 그리기 함수 11곳 앞머리에 `if (SPR.ready) { 새 그리기; return; }`
분기만 넣었습니다. 스프라이트 로드 전/실패 시에는 기존 벡터 그리기가 그대로
나오므로 안전합니다.

## Changes Applied

### 1. `sprites.js` 신규 파일 (프로젝트 루트, 384줄)
SVG 인라인 데이터 → data URL로 즉시 로드하는 17개 스프라이트:

| 이름 | 크기 | 용도 |
|------|------|------|
| `player_p38` | 64×64 | 플레이어 |
| `enemy_zero` | 48×48 | 스카우트 (A6M 제로) |
| `enemy_ki61` | 52×52 | 파이터 (Ki-61) |
| `enemy_g4m` | 96×72 | 폭격기 + 하트 중간보스 비주얼 |
| `boss_heavy` | 200×130 | 최종 보스 (2엔진 인터셉터) |
| `boss_body` | 200×130 | 최종 보스 (다이잉 — 날개 부재) |
| `bullet_player` | 10×24 | 플레이어 탄환 |
| `bullet_enemy` | 16×16 | 적 탄환 (빨강) |
| `bullet_enemy_pink` | 16×16 | 호밍 / 드론 탄환 (분홍) |
| `explosion_1`..`explosion_4` | 48×48 | 폭발 플립북 4프레임 |
| `powerup_P` | 28×28 | P 파워업 아이콘 |
| `powerup_B` | 28×28 | B 파워업 아이콘 |
| `bomb_icon` | 14×18 | 폭탄 아이콘 |
| `life_icon` | 18×16 | 목숨 아이콘 |

내부 로더:
- `window.SPR = { ready, img, flash, shadow, load }` (game.js에 default 폴백도 있음)
- 모든 스프라이트의 **흰색 실루엣**(`flash`)과 **검은 실루엣**(`shadow`)을
  2× 해상도 오프스크린 캔버스에 미리 합성 → hit feedback·drop shadow 즉시 사용
- 헬퍼 `drawSprite(ctx, name, cx, cy, w, angle, alpha, flash)`:
  - 자동 비율 유지 (높이 = w × 원본비)
  - `flash` 값으로 흰 실루엣 블렌드
- 헬퍼 `drawSpriteShadow(ctx, name, cx, cy, w, angle, alpha)`: 그림자

### 2. `index.html` 로드 순서 (Lines 122-123)
```html
<script src="sprites.js"></script>
<script src="game.js"></script>
```
스프라이트가 먼저 로드되어 `window.SPR`이 정의된 채로 game.js가 실행됨.

### 3. `game.js` 상단 SPR 가드 (Lines 7-9)
```js
// === Sprite set (sprites.js). Guarded so the game still runs without it. ===
if (typeof SPR === 'undefined') { window.SPR = { ready: false, img: {}, flash: {}, shadow: {}, load: function () {} }; }
SPR.load();
```
`sprites.js`가 누락되어도 게임이 죽지 않고 즉시 legacy로 폴백.

### 4. SPRITE VISUAL LAYER (Lines 5817-6215) — 신규 드로잉 블록
오버레이 헬퍼 함수들 (모두 top-level, 모두 SPR.ready 체크):
- `VIS` 객체: horizon/cloud/wave/boom 컨테이너 (game.js line 5819)
- `visInit()`: cumulus 스탬프 + 3-layer 패럴랙스 + 바다 wave 70개 + 7개 그라디언트
  1회만 빌드 (game.js line 5846)
- `visTimeScale()`: 슬로우모션 시 배경도 느리게 (line 5888)
- `drawBackgroundSprite()`: 하늘 → sun glow → 바다 → wave → 3-layer 구름
  (line 5890)
- `drawPlayerSprite(px, py)`: 좌우 이동량으로 뱅킹 각도 자동 보간, ground shadow
  옵션 (line 5904)
- `drawEnemySprite(e)`: type별 라우팅 (scout/fighter/bomber/heavyBomber/rammer/
  final/waveBoss) + 엔진 화재·실드 링 부가 (line 5949)
- `drawBossEngineFire(e, w)`: HP 50% 이하에서 엔진 화염·연기 (line 6029)
- `drawFinalBossShield(e)`: entryInvuln 동안 8각 시안 링 + "SHIELD" 라벨
  (line 6052)
- `drawBulletSprite(b, isEnemy)`: 호밍/색상으로 pink vs red 분기 (line 6078)
- `drawPowerupSprite(p)`: 부유 애니메이션 + 컬러 (line 6089)
- `drawBooms()`: 4프레임 폭발 플립북, scale·회전 (line 6119)
- `drawDroneSprite(d)` (신규, line 6109): player_p38을 22px로 + 핑크 틴트
- `drawDroneBulletSprite(b)` (신규, line 6117): 호밍 여부로 bullet_enemy_pink
  vs bullet_enemy
- `drawMissileSprite(m)` (신규, line 6124): bullet_player를 missile 크기로
- `drawLaserBeamSprite()` (신규, line 6131): 레이저는 전용 스프라이트 부적합,
  placeholder (legacy fallback과 동일 효과)
- `drawUISprite()`: 1P/HI/ST + 라이프(p38 아이콘) + 폭탄(bomb_icon) + WAVE 배너 +
  보스 HP바 + 콤보 + 힛마커 (line 6133)

### 5. 그리기 함수 11곳에 `if (SPR.ready)` 가드 추가 (체크리스트)

| # | 함수 | game.js 줄 | 분기 패턴 |
|---|------|-----------|----------|
| 1 | `drawLaserBeam` | **5152** | `if (SPR.ready) { drawLaserBeamSprite(); /* fall through */ }` |
| 2 | `drawBackground` | **6338** | `if (SPR.ready) { drawBackgroundSprite(); return; }` |
| 3 | `drawPlayer` | **6497** | `if (SPR.ready) { drawPlayerSprite(px, py); } else { ... legacy ... }` |
| 4 | `drawEnemy` | **6984** | `if (SPR.ready && drawEnemySprite(e)) { /* sprite drew */ } else if (...)` |
| 5 | `drawBullet` | **8377** | `if (SPR.ready && !bullet.isBomb) { drawBulletSprite(bullet, isEnemy); return; }` |
| 6 | `drawPowerup` | **8473** | `if (SPR.ready) { drawPowerupSprite(p); continue; }` |
| 7 | `drawDrone` | **8523** | `if (SPR.ready) { drawDroneSprite(d); continue; }` |
| 8 | `drawDroneBullet` | **8638** | `if (SPR.ready) { drawDroneBulletSprite(b); continue; }` |
| 9 | `drawExplosion` | **8680** | `if (SPR.ready) drawBooms();` (legacy 파티클 위에 sprite boom 추가) |
| 10 | `drawMissiles` | **8877** | `if (SPR.ready) { drawMissileSprite(m); continue; }` |
| 11 | `drawUI` | **8974** | `if (SPR.ready) { drawUISprite(); return; }` |

(보조 가드)
- `drawEnemySprite` (line 5975): `if (!SPR.ready) return false;` — sprite 미준비 시 false 반환하여 drawEnemy()의 `else if` 분기로 자연스럽게 fallback
- `drawPlayerSprite` (line 6164): `if (!SPR.ready) return;`
- `spawnBoom` (line 6135): `if (!SPR.ready) return;` (legacy 입자만)

## Verification Results
- **Syntax:** OK (9521 lines, `new Function(src)` 통과, 400770 chars)
- **SPR.ready 카운트:** 14 (그리기 분기 11 + 헬퍼 가드 3)
- **sprites.js:** 200 OK from http://localhost:4001/sprites.js
- **Render check:** 타이틀 화면 OK (스카이+구름+바다 배경, FLYING TIGERS 타이틀, PRESS SPACE TO START, 컨트롤 안내 모두 정상)
- **Mobile check (375px):** 가로 오버플로 없음
- **Runtime errors:** favicon 404만 (게임과 무관)
- **로직 무변경:** 스폰·충돌·히트박스·점수·보스 패턴 코드 0줄 변경 — `if (SPR.ready)` 가드는 순수하게 그리기 분기만 추가

## Final State
| 항목 | 값 |
|------|---|
| `sprites.js` 로드 순서 | `index.html`에서 `game.js` 직전 |
| SPR 폴백 | `typeof SPR === 'undefined'` 시 default stub 자동 생성 |
| 그리기 함수 11곳 | 모두 `if (SPR.ready)` 가드 적용 |
| 로직 변경 | 0줄 (스폰·충돌·히트박스·점수·보스 패턴 모두 그대로) |
| 충돌/히트박스 | 비주얼만 교체, 판정은 기존 코드 그대로 |
| 비주얼 일관성 | P-38 vs Zero vs Ki-61 vs G4M 즉시 식별 가능한 캠프 + 무장국 |
| Hit feedback | `e.hitFlash > 0` 시 흰 실루엣 0..1 블렌드 (모든 sprite 공통) |
| Drop shadow | 비행체가 지면 근처일 때만 검은 실루엣 (drawPlayerSprite) |
