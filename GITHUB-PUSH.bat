@echo off
chcp 65001 >nul
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║          1945 GAME GITHUB 배포 도우미                ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  📋 먼저 GitHub에서 Repository를 생성하세요:
echo     → https://github.com/new
echo     → 이름: 1945-game (Public)
echo     → Create repository
echo.
echo  📝 생성 후 화면에 표시되는 URL을 복사하세요
echo     (https://github.com/사용자명/1945-game.git)
echo.
echo  ========================================================================
echo.
set /p GIT_URL="GitHub Repository URL을 여기에 붙여넣기 (우클릭 - 붙여넣기): "

if "%GIT_URL%"=="" (
    echo ❌ URL이 입력되지 않았습니다.
    pause
    exit /b
)

echo.
echo  🔗 Git 원격 저장소 연결 중...
git remote add origin "%GIT_URL%" 2>nul
git branch -M main

echo.
echo  📤 GitHub에 업로드 중...
git push -u origin main --force

echo.
echo  ========================================================================
echo  ✅ 업로드 완료!
echo.
echo  📌 다음 단계 - GitHub Pages 활성화:
echo     1. GitHub Repository → Settings (설정)
echo     2. Pages 메뉴 클릭
echo     3. Source: main / (root) 선택
echo     4. Save 클릭
echo     5. 1-2분 후 접속 가능
echo.
echo  ========================================================================
pause