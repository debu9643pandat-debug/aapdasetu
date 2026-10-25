@echo off
title AapdaSetu TinyFish Proxy Server
echo ========================================================
echo  Starting Native AapdaSetu TinyFish Proxy on Port 8081...
echo  (Zero Node.js Required)
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-tinyfish-proxy.ps1"
pause
