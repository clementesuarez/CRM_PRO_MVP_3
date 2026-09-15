@echo off
title AutoCRM PRO MVP 2 - Servidor Local
color 0A
echo ===================================================
echo    AutoCRM PRO MVP 2 - Iniciando Servidor Local
echo ===================================================
echo.
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;%PATH%
echo [+] Verificando Node.js...
node -v
echo [+] Iniciando Vite Dev Server en http://localhost:5173/ ...
echo.
npm run dev
pause
