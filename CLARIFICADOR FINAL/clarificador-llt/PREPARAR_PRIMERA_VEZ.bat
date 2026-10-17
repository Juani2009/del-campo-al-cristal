@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title LLT - Preparar instalacion
call npm install
if errorlevel 1 (echo Hubo un error al instalar. & pause & exit /b 1)
call npm run build
if errorlevel 1 (echo Hubo un error al preparar. & pause & exit /b 1)
echo.
echo LISTO. Ahora podes usar INICIAR_CLARIFICADOR.bat sin abrir VS Code.
pause
