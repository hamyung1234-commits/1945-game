# 1945 Game - GitHub Push Script
# Run this in PowerShell to upload to GitHub

$repoUrl = Read-Host "Enter your GitHub repository URL (e.g., https://github.com/username/1945-game.git)"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ URL을 입력해주세요." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔗 Connecting to repository..." -ForegroundColor Cyan
git remote add origin $repoUrl 2>$null
git branch -M main

Write-Host ""
Write-Host "📤 Uploading to GitHub..." -ForegroundColor Cyan
git push -u origin main --force

Write-Host ""
Write-Host "✅ Done! Enable GitHub Pages in repository Settings > Pages > Source: main/(root)" -ForegroundColor Green
Write-Host "🌐 Your game will be available at: $repoUrl.Replace('https://github.com', 'https://username.github.io').Replace('.git', '')" -ForegroundColor Yellow