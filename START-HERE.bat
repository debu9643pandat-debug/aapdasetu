@echo off
title AapdaSetu Disaster OS - All Servers
echo ========================================================
echo  AapdaSetu Disaster OS - Combined Server Launcher
echo  Website : http://localhost:8080/
echo  TinyFish: http://localhost:8081/
echo  Press Ctrl+C to stop everything.
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"
pause
