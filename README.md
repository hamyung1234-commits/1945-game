# 1945 Flying Tigers

<p align="center">
  <a href="https://hamyung1234-commits.github.io/1945-game/">
    <img src="https://img.shields.io/badge/Play-Now-FFD700?style=for-the-badge" alt="Play Now">
  </a>
  <a href="https://hamyung1234-commits.github.io/1945-game/">
    <img src="https://img.shields.io/badge/URL-hamyung1234.github.io/1945--game-4B7BF5?style=for-the-badge" alt="Game URL">
  </a>
</p>

추억의 오락실 게임, 1945 비행기 슈팅 게임입니다! 🛩️

## 🎮 게임 플레이

### 조작법
| 키 | 동작 |
|------|------|
| Arrow Keys / WASD | 이동 |
| Space | 발사 |
| B | 폭탄 사용 |
| P | 일시 정지 |

### 게임 기능
- ✅ **4종류의 적 비행기**: Scout, Fighter, Bomber, Boss
- ✅ **파워업 시스템**: P(무기 강화), B(폭탄), S(쉴드)
- ✅ **Wave 시스템**: 30초마다 웨이브 증가
- ✅ **점수 저장**: localStorage에 최고점수 저장
- ✅ **레트로 스타일**: 1942 스타일의 오리지널 느낌

## 🚀 GitHub Pages로 배포하기

### 방법 1: 프로젝트 설정 (권장)

1. **GitHub에서 새 Repository 생성**
   - Repository 이름: `1945-game`
   - Public으로 설정

2. **로컬에서 Git 초기화**
   ```bash
   cd 1945-game
   git init
   git add .
   git commit -m "Initial commit - 1945 Flying Tigers"
   ```

3. **원격 저장소 연결**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/1945-game.git
   ```

4. **main 브랜치로 푸시**
   ```bash
   git branch -M main
   git push -u origin main
   ```

5. **GitHub Pages 활성화**
   - Repository → Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: `main` / `/(root)`
   - Save 클릭

6. **접속 확인**
   - 잠시 후 `https://YOUR_USERNAME.github.io/1945-game/` 에서 플레이!

### 방법 2: Upload directly (파일만 업로드)

1. 이 레포의 `index.html`과 `game.js` 파일을 다운로드
2. GitHub에서 새 Repository 생성
3. 파일 drag & drop으로 업로드
4. Settings → Pages → Deploy from branch → main
5. 완료!

## 📁 파일 구조

```
├── index.html    # 게임 HTML
├── game.js       # 게임 로직
├── SPEC.md       # 게임 기획서
└── README.md     # 이 파일
```

## 🎯 점수 시스템

| 적 유형 | 점수 |
|--------|------|
| Scout | 100점 |
| Fighter | 200점 |
| Bomber | 300점 |
| Boss | 2000점 |

## 💡 파워업 종류

- **P (Power)**: 무기 레벨 Up
- **B (Bomb)**: 화면의 모든 적 제거
- **S (Shield)**: 3초간 무적 상태

---

Made with ❤️ for retro gaming fans

## 라이선스

MIT License - 자유롭게 수정하고 배포하세요!