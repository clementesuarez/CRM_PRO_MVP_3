@echo off
title CRM Agencia - Servidor Local

cd /d "%~dp0"

echo ======================================================
echo           INICIANDO CRM AGENCIA VERSION 1.0
echo ======================================================
echo.

REM 1. Verificacion limpia de Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 goto :NO_NODE

REM 2. Verificacion de node_modules precompilados
if exist node_modules goto :START_APP

echo [1/2] Instalando modulos de produccion (Fallback)...
call npm install --omit=dev --no-audit --no-fund
if %ERRORLEVEL% NEQ 0 goto :NPM_ERROR

:START_APP
echo [2/2] Levantando aplicacion...
echo.

start msedge --app=http://localhost:5173 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    start "" http://localhost:5173
)

echo ======================================================
echo   CRM Agencia en ejecucion. Mantenga esta ventana abierta.
echo ======================================================
echo.

if exist server\server.js (
    node server/server.js
) else (
    node server/index.js
)
goto :END

:NO_NODE
echo [ERROR CRITICO] Node.js no esta instalado en este sistema.
echo Por favor descargue e instale Node.js LTS desde https://nodejs.org/
echo.
pause
exit /b 1

:NPM_ERROR
echo [ERROR] Fallo npm install. Verifique la conexion a Internet.
echo.
pause
exit /b 1

:END
pause
