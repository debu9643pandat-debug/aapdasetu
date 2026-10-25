@echo off
title AapdaSetu Disaster OS Server
echo Starting AapdaSetu Local Web Server on http://localhost:8080 ...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
