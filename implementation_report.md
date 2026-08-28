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
