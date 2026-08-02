@echo off
title Control de Salvame las Papas
cd /d "%~dp0"
echo Revisando todas las paginas, enlaces e imagenes...
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: falta Node.js en esta computadora.
  echo No prepares el ZIP hasta realizar el control en una computadora que tenga Node.js.
  echo.
  pause
  exit /b 1
)
node verificar-sitio.js
echo.
pause
