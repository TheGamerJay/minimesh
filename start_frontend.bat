@echo off
title MiniMesh Frontend
cd /d "%~dp0frontend"
echo Starting MiniMesh frontend on http://localhost:5174 ...
npm run dev
pause
