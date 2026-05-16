@echo off
title MiniMesh Backend
cd /d "%~dp0backend"
echo Starting MiniMesh backend on http://localhost:8080 ...
C:\Users\jaaye\AppData\Local\Programs\Python\Python313\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8080
pause
