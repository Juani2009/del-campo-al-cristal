@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title LLT - Clarificador y votaciones
if not exist "node_modules\vite\bin\vite.js" (
 echo Faltan las librerias. Conectate una sola vez a Internet y ejecuta: npm install
 pause
 exit /b 1
)
if not exist "dist\index.html" (
 echo [1/2] Preparando pagina de presentacion...
 call npm run build
 if errorlevel 1 (echo Error preparando el proyecto. & pause & exit /b 1)
)
echo [2/2] Iniciando red local...
echo.
echo En esta Lenovo: http://localhost:4173/
echo Abrir panel observador en otro celular: http://IP-DE-LA-LENOVO:4173/control
echo El QR aparecera en la pantalla principal.
echo.
start "" "http://localhost:4173/"
call npm run serve
pause
