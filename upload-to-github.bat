@echo off
chcp 65001 >nul
echo ========================================
echo   1945 GAME - GitHub 배포 스크립트
echo ========================================
echo.
echo GitHub에 업로드하려면 먼저 repository를 생성해야 합니다.
echo 1. https://github.com/new 접속
echo 2. Repository 이름: 1945-game (Public)
echo 3. Create repository 클릭
echo.
echo 생성 완료 후, 아래 URL을 준비하세요:
echo https://github.com/사용자명/1945-game.git
echo.
echo ========================================
echo.
set /p REPO_URL="GitHub Repository URL 입력: "

echo.
echo Git 연결 중...
git remote add origin %REPO_URL%
git branch -M main

echo.
echo GitHub에 업로드 중...
git push -u origin main --force

echo.
echo ========================================
echo ✅ 업로드 완료!
echo.
echo GitHub Pages 활성화:
echo 1. https://github.com/사용자명/1945-game/settings/pages 접속
echo 2. Source: main / (root) 선택
echo 3. Save 클릭
echo 4. 잠시 후 https://사용자명.github.io/1945-game/ 접속
echo ========================================
pause