#!/bin/bash

echo "========================================"
echo "  1945 Game - GitHub Upload Script"
echo "========================================"
echo ""

echo "[1/3] Adding files to git..."
git add -A

echo ""
echo "[2/3] Creating commit..."
git commit -m "1945 Flying Tigers Game"

echo ""
echo "[3/3] Pushing to GitHub..."
echo ""
echo "IMPORTANT: Replace the URL below with your GitHub repository URL"
echo "Example: https://github.com/yourusername/1945-game.git"
echo ""
echo "If you haven't created the repository yet:"
echo "   1. Go to https://github.com/new"
echo "   2. Create repository named: 1945-game"
echo "   3. Copy the repository URL below"
echo ""
echo "========================================"
echo ""
read -p "Enter your GitHub repository URL: " REPO_URL

git remote add origin $REPO_URL
git branch -M main
git push -u origin main --force

echo ""
echo "========================================"
echo "Done! Check your GitHub repository."
echo "Then enable GitHub Pages in:"
echo "   Settings > Pages > Source: main/(root)"
echo "========================================"