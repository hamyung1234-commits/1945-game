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
