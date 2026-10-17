@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
title Del campo al cristal - servidor local
echo.
echo  ===============================================
echo    DEL CAMPO AL CRISTAL - Quimica industrial
echo  ===============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [!] No se encontro Node.js en esta computadora.
  echo      1. Con internet, entra a https://nodejs.org
  echo      2. Descarga la version "LTS" e instalala con las opciones por defecto.
  echo      3. Volve a hacer doble clic en INICIAR_PAGINA.bat
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo  [1/3] Primera vez: instalando los componentes del proyecto.
  echo        Esto necesita internet UNA sola vez y tarda unos minutos...
  call npm install
  if errorlevel 1 (
    echo.
    echo  [!] No se pudo completar la instalacion. Conectate a internet y volve a intentar.
    pause
    exit /b 1
  )
) else (
  echo  [1/3] Componentes ya instalados. No hace falta internet.
)

echo  [2/3] Preparando la pagina...
call npm run build >nul
if errorlevel 1 (
  echo  [!] Hubo un error al preparar la pagina. Volve a intentar o avisa al equipo.
  pause
  exit /b 1
)

echo  [3/3] Iniciando el servidor local...
echo.
echo  - En esta computadora se abre sola:  http://localhost:4173/
echo  - Modo grupal: los celulares se conectan al MISMO Wi-Fi y escanean el QR
echo    que aparece en la sala del clarificador (o entran a http://IP:4173/votar).
echo  - El PIN de presentadora aparece mas abajo.
echo.
echo  NO CIERRES ESTA VENTANA mientras uses la pagina. Para terminar, cerrala.
echo.
start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:4173/"
call npm run serve
pause
